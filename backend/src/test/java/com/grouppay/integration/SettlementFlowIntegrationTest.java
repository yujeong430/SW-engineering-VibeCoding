package com.grouppay.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("정산 플로우 통합 테스트")
class SettlementFlowIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private static final String BASE = "/api/v1/groups";

    // ───────── 헬퍼 ─────────

    private String toJson(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }

    private record GroupContext(String uuid, MockHttpSession session, List<Integer> memberIds) {}

    /** 그룹 생성 + 멤버 ID 목록 반환 */
    private GroupContext setupGroup(String name, List<String> memberNames) throws Exception {
        MvcResult createResult = mockMvc.perform(post(BASE)
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of("name", name, "pin", "1234", "members", memberNames))))
                .andExpect(status().isCreated())
                .andReturn();

        String uuid = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("uuid").asText();
        MockHttpSession session = (MockHttpSession) createResult.getRequest().getSession(false);

        // 멤버 ID 조회
        String groupJson = mockMvc.perform(get(BASE + "/{uuid}", uuid).session(session))
                .andReturn().getResponse().getContentAsString();
        JsonNode members = objectMapper.readTree(groupJson).path("data").path("members");
        List<Integer> ids = new java.util.ArrayList<>();
        members.forEach(m -> ids.add(m.path("id").asInt()));

        return new GroupContext(uuid, session, ids);
    }

    /** 지출 등록 */
    private void addExpense(String uuid, MockHttpSession session,
                            String title, int amount, int payerId, List<Integer> shareIds) throws Exception {
        mockMvc.perform(post(BASE + "/{uuid}/expenses", uuid)
                        .session(session)
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of(
                                "title", title,
                                "amount", amount,
                                "payerId", payerId,
                                "shareMemberIds", shareIds))))
                .andExpect(status().isCreated());
    }

    // ───────── 테스트 ─────────

    @Test
    @DisplayName("정산 확정 후 멤버별 순잔액 합계는 반드시 0이다 (정합성 검증)")
    void 정산_확정_순잔액_합계_0_검증() throws Exception {
        // 멤버 3명, 지출 3건 (다양한 분담 패턴)
        GroupContext ctx = setupGroup("제주여행", List.of("유정", "윤서", "재인"));
        int m1 = ctx.memberIds().get(0); // 유정
        int m2 = ctx.memberIds().get(1); // 윤서
        int m3 = ctx.memberIds().get(2); // 재인

        addExpense(ctx.uuid(), ctx.session(), "흑돼지 저녁", 100_000, m1, List.of(m1, m2));  // 2명 분담
        addExpense(ctx.uuid(), ctx.session(), "택시비", 50_000, m1, List.of(m1, m2, m3));   // 3명 분담
        addExpense(ctx.uuid(), ctx.session(), "편의점", 10_000, m3, List.of(m1, m2, m3));   // 3명 분담

        // 정산 확정
        MvcResult settleResult = mockMvc.perform(post(BASE + "/{uuid}/settle", ctx.uuid())
                        .session(ctx.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.balances").isArray())
                .andExpect(jsonPath("$.data.transfers").isArray())
                .andReturn();

        // 순잔액 합계 = 0 검증
        JsonNode balances = objectMapper.readTree(settleResult.getResponse().getContentAsString())
                .path("data").path("balances");

        int totalBalance = 0;
        for (JsonNode b : balances) {
            totalBalance += b.path("netBalance").asInt();
        }
        assertThat(totalBalance).isZero();
    }

    @Test
    @DisplayName("정산 확정 후 그룹 상태는 SETTLED로 변경된다")
    void 정산_확정_후_그룹_상태_SETTLED() throws Exception {
        GroupContext ctx = setupGroup("캠핑", List.of("A", "B"));
        int m1 = ctx.memberIds().get(0);
        int m2 = ctx.memberIds().get(1);

        addExpense(ctx.uuid(), ctx.session(), "장작", 20_000, m1, List.of(m1, m2));

        mockMvc.perform(post(BASE + "/{uuid}/settle", ctx.uuid()).session(ctx.session()))
                .andExpect(status().isOk());

        mockMvc.perform(get(BASE + "/{uuid}", ctx.uuid()).session(ctx.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SETTLED"));
    }

    @Test
    @DisplayName("지출이 없는 그룹을 정산 시도하면 422를 반환한다")
    void 지출_없는_그룹_정산시_422() throws Exception {
        GroupContext ctx = setupGroup("빈그룹", List.of("A", "B"));

        mockMvc.perform(post(BASE + "/{uuid}/settle", ctx.uuid()).session(ctx.session()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("SETTLE_002"));
    }

    @Test
    @DisplayName("SETTLED 그룹에 지출 추가 시도 시 409를 반환한다")
    void SETTLED_그룹에_지출_추가_시도시_409() throws Exception {
        GroupContext ctx = setupGroup("여행", List.of("A", "B"));
        int m1 = ctx.memberIds().get(0);
        int m2 = ctx.memberIds().get(1);

        addExpense(ctx.uuid(), ctx.session(), "밥", 20_000, m1, List.of(m1, m2));
        mockMvc.perform(post(BASE + "/{uuid}/settle", ctx.uuid()).session(ctx.session()))
                .andExpect(status().isOk());

        // 정산 후 지출 추가 시도
        mockMvc.perform(post(BASE + "/{uuid}/expenses", ctx.uuid())
                        .session(ctx.session())
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of(
                                "title", "추가지출",
                                "amount", 10_000,
                                "payerId", m1,
                                "shareMemberIds", List.of(m1)))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("GROUP_002"));
    }

    @Test
    @DisplayName("이미 SETTLED된 그룹을 재정산 시도하면 409를 반환한다")
    void SETTLED_그룹_재정산_시도시_409() throws Exception {
        GroupContext ctx = setupGroup("재정산테스트", List.of("A", "B"));
        int m1 = ctx.memberIds().get(0);
        int m2 = ctx.memberIds().get(1);

        addExpense(ctx.uuid(), ctx.session(), "커피", 10_000, m1, List.of(m1, m2));
        mockMvc.perform(post(BASE + "/{uuid}/settle", ctx.uuid()).session(ctx.session()))
                .andExpect(status().isOk());

        // 재정산 시도
        mockMvc.perform(post(BASE + "/{uuid}/settle", ctx.uuid()).session(ctx.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SETTLE_001"));
    }

    @Test
    @DisplayName("정산 결과 조회 시 송금 목록이 반환되며 수취자 계좌는 null일 수 있다")
    void 정산_결과_조회_송금_목록_반환() throws Exception {
        GroupContext ctx = setupGroup("정산조회", List.of("Alice", "Bob", "Carol"));
        int m1 = ctx.memberIds().get(0); // Alice
        int m2 = ctx.memberIds().get(1); // Bob
        int m3 = ctx.memberIds().get(2); // Carol

        // Alice가 전액 결제, 3명 분담
        addExpense(ctx.uuid(), ctx.session(), "숙소", 90_000, m1, List.of(m1, m2, m3));

        mockMvc.perform(post(BASE + "/{uuid}/settle", ctx.uuid()).session(ctx.session()))
                .andExpect(status().isOk());

        // 정산 결과 조회
        mockMvc.perform(get(BASE + "/{uuid}/settlement", ctx.uuid()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.transfers").isArray())
                .andExpect(jsonPath("$.data.transfers.length()").value(2))    // Bob→Alice, Carol→Alice
                .andExpect(jsonPath("$.data.transfers[0].amount").value(30_000))
                .andExpect(jsonPath("$.data.transfers[0].toAccount").isEmpty()); // 계좌 미등록
    }

    @Test
    @DisplayName("OPEN 상태 그룹에서 정산 결과 조회 시 409를 반환한다")
    void OPEN_그룹_정산_결과_조회시_409() throws Exception {
        GroupContext ctx = setupGroup("미정산그룹", List.of("A"));

        mockMvc.perform(get(BASE + "/{uuid}/settlement", ctx.uuid()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SETTLE_003"));
    }

    @Test
    @DisplayName("1인이 전액 지불한 경우 나머지 멤버가 균등 분담하는 송금 결과가 계산된다")
    void 단일_결제자_전액_지불_균등_분담_계산() throws Exception {
        GroupContext ctx = setupGroup("4인여행", List.of("A", "B", "C", "D"));
        int m1 = ctx.memberIds().get(0);
        List<Integer> all = ctx.memberIds();

        // A가 80,000원 전액 결제, 4명 균등 분담 → 각 20,000원
        addExpense(ctx.uuid(), ctx.session(), "저녁", 80_000, m1, all);

        MvcResult result = mockMvc.perform(post(BASE + "/{uuid}/settle", ctx.uuid())
                        .session(ctx.session()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode transfers = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("transfers");

        // B, C, D 각각 A에게 20,000원 송금
        assertThat(transfers.size()).isEqualTo(3);
        transfers.forEach(t -> assertThat(t.path("amount").asInt()).isEqualTo(20_000));
    }
}
