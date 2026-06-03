package com.grouppay.integration;

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

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("그룹 플로우 통합 테스트")
class GroupFlowIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private static final String BASE = "/api/v1/groups";

    // ───────── 헬퍼 ─────────

    private String toJson(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }

    /** 그룹 생성 후 uuid와 세션(방장 권한 포함)을 반환 */
    private record GroupContext(String uuid, MockHttpSession session) {}

    private GroupContext createGroup(String name, String pin, List<String> members) throws Exception {
        MvcResult result = mockMvc.perform(post(BASE)
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of("name", name, "pin", pin, "members", members))))
                .andExpect(status().isCreated())
                .andReturn();

        String uuid = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("uuid").asText();
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        return new GroupContext(uuid, session);
    }

    // ───────── 테스트 ─────────

    @Test
    @DisplayName("그룹 생성 시 멤버가 원자적으로 함께 저장된다")
    void 그룹_생성_시_멤버_포함_원자적_저장() throws Exception {
        GroupContext ctx = createGroup("제주여행", "1234", List.of("지수", "민호", "서연"));

        mockMvc.perform(get(BASE + "/{uuid}", ctx.uuid())
                        .session(ctx.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.members.length()").value(3))
                .andExpect(jsonPath("$.data.members[0].name").value("지수"))
                .andExpect(jsonPath("$.data.members[1].name").value("민호"))
                .andExpect(jsonPath("$.data.members[2].name").value("서연"));
    }

    @Test
    @DisplayName("그룹 생성자는 별도 PIN 인증 없이 방장 권한을 획득한다")
    void 그룹_생성자는_방장_권한_자동_부여() throws Exception {
        GroupContext ctx = createGroup("테스트그룹", "0000", List.of("멤버A"));

        mockMvc.perform(get(BASE + "/{uuid}", ctx.uuid())
                        .session(ctx.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isHost").value(true));
    }

    @Test
    @DisplayName("PIN 인증 성공 후 발급된 세션으로 방장 전용 기능에 접근할 수 있다")
    void PIN_인증_성공_후_방장_기능_접근_가능() throws Exception {
        GroupContext ctx = createGroup("그룹A", "1234", List.of());

        // 새 세션으로 PIN 인증
        MvcResult authResult = mockMvc.perform(post(BASE + "/{uuid}/auth", ctx.uuid())
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of("pin", "1234"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isHost").value(true))
                .andReturn();

        MockHttpSession hostSession = (MockHttpSession) authResult.getRequest().getSession(false);

        // 방장 전용 기능(그룹명 수정) 접근
        mockMvc.perform(patch(BASE + "/{uuid}", ctx.uuid())
                        .session(hostSession)
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of("name", "수정된그룹명"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("수정된그룹명"));
    }

    @Test
    @DisplayName("방장 권한 없는 세션으로 방장 전용 기능 접근 시 401을 반환한다")
    void 방장_권한_없이_방장_기능_접근시_401() throws Exception {
        GroupContext ctx = createGroup("그룹B", "5678", List.of());

        mockMvc.perform(patch(BASE + "/{uuid}", ctx.uuid())
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of("name", "수정시도"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PIN 불일치 시 401을 반환하고 방장 권한이 부여되지 않는다")
    void PIN_불일치시_401() throws Exception {
        GroupContext ctx = createGroup("그룹C", "1234", List.of());

        mockMvc.perform(post(BASE + "/{uuid}/auth", ctx.uuid())
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of("pin", "9999"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("그룹 내 멤버 이름 중복 추가 시 409를 반환한다")
    void 멤버_이름_중복시_409() throws Exception {
        GroupContext ctx = createGroup("그룹D", "1234", List.of("지수"));

        mockMvc.perform(post(BASE + "/{uuid}/members", ctx.uuid())
                        .session(ctx.session())
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of("name", "지수"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MEMBER_001"));
    }

    @Test
    @DisplayName("그룹 삭제 시 하위 멤버·지출 데이터가 CASCADE 삭제된다")
    void 그룹_삭제시_하위_데이터_CASCADE() throws Exception {
        GroupContext ctx = createGroup("삭제될그룹", "1234", List.of("멤버1", "멤버2"));

        // 지출 추가
        String membersJson = mockMvc.perform(get(BASE + "/{uuid}", ctx.uuid())
                        .session(ctx.session()))
                .andReturn().getResponse().getContentAsString();
        int memberId = objectMapper.readTree(membersJson)
                .path("data").path("members").get(0).path("id").asInt();

        mockMvc.perform(post(BASE + "/{uuid}/expenses", ctx.uuid())
                        .session(ctx.session())
                        .contentType(APPLICATION_JSON)
                        .content(toJson(Map.of(
                                "title", "저녁",
                                "amount", 30000,
                                "payerId", memberId,
                                "shareMemberIds", List.of(memberId)))))
                .andExpect(status().isCreated());

        // 그룹 삭제
        mockMvc.perform(delete(BASE + "/{uuid}", ctx.uuid())
                        .session(ctx.session()))
                .andExpect(status().isOk());

        // 삭제 후 조회 시 404
        mockMvc.perform(get(BASE + "/{uuid}", ctx.uuid()))
                .andExpect(status().isNotFound());
    }
}
