package com.grouppay.domain.expense.service;

import com.grouppay.domain.expense.dto.request.CreateExpenseRequest;
import com.grouppay.domain.expense.dto.request.UpdateExpenseRequest;
import com.grouppay.domain.expense.dto.response.ExpenseListResponse;
import com.grouppay.domain.expense.dto.response.ExpenseResponse;
import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.expense.entity.ExpenseShare;
import com.grouppay.domain.expense.repository.ExpenseRepository;
import com.grouppay.domain.expense.repository.ExpenseShareRepository;
import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.service.GroupService;
import com.grouppay.domain.member.entity.Member;
import com.grouppay.domain.member.repository.MemberRepository;
import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @InjectMocks
    private ExpenseService expenseService;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseShareRepository expenseShareRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private GroupService groupService;

    private Group openGroup;
    private Group settledGroup;
    private Member payer;
    private Member member2;

    @BeforeEach
    void setUp() {
        openGroup = Group.builder().uuid("test-uuid").name("제주도 여행").pinHash("$hashed$").build();
        settledGroup = Group.builder().uuid("settled-uuid").name("정산완료").pinHash("$hashed$").build();
        settledGroup.settle();
        payer = Member.builder().group(openGroup).name("민수").build();
        member2 = Member.builder().group(openGroup).name("지영").build();
    }

    @Test
    @DisplayName("지출 등록 성공 - 1/N 분담 계산")
    void createExpense_success() {
        // given
        CreateExpenseRequest request = mockCreateRequest("저녁 식사", 90000, 1L, List.of(1L, 2L));
        given(groupService.findGroupByUuid("test-uuid")).willReturn(openGroup);
        given(memberRepository.findById(1L)).willReturn(Optional.of(payer));
        given(memberRepository.findById(2L)).willReturn(Optional.of(member2));
        Expense savedExpense = Expense.builder().group(openGroup).payer(payer).title("저녁 식사").amount(90000).build();
        given(expenseRepository.save(any(Expense.class))).willReturn(savedExpense);
        given(expenseShareRepository.saveAll(anyList())).willAnswer(inv -> inv.getArgument(0));

        // when
        ExpenseResponse response = expenseService.createExpense("test-uuid", request);

        // then
        assertThat(response.getTitle()).isEqualTo("저녁 식사");
        assertThat(response.getAmount()).isEqualTo(90000);
        assertThat(response.getShares()).hasSize(2);
        // 합계가 총액과 일치해야 함
        int totalShare = response.getShares().stream().mapToInt(ExpenseResponse.ShareDetail::getShareAmount).sum();
        assertThat(totalShare).isEqualTo(90000);
    }

    @Test
    @DisplayName("지출 등록 실패 - SETTLED 상태")
    void createExpense_groupSettled() {
        // given
        given(groupService.findGroupByUuid("settled-uuid")).willReturn(settledGroup);
        CreateExpenseRequest request = mockCreateRequest("저녁 식사", 90000, 1L, List.of(1L));

        // when & then
        assertThatThrownBy(() -> expenseService.createExpense("settled-uuid", request))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.GROUP_ALREADY_SETTLED));
    }

    @Test
    @DisplayName("지출 목록 조회 성공")
    void getExpenses_success() {
        // given
        Expense expense = Expense.builder().group(openGroup).payer(payer).title("숙소").amount(120000).build();
        given(groupService.findGroupByUuid("test-uuid")).willReturn(openGroup);
        given(expenseRepository.findByGroup(openGroup)).willReturn(List.of(expense));
        given(expenseShareRepository.findByExpense(expense)).willReturn(List.of());

        // when
        ExpenseListResponse response = expenseService.getExpenses("test-uuid");

        // then
        assertThat(response.getExpenses()).hasSize(1);
        assertThat(response.getExpenses().get(0).getTitle()).isEqualTo("숙소");
    }

    @Test
    @DisplayName("지출 수정 실패 - SETTLED 상태")
    void updateExpense_groupSettled() {
        // given
        given(groupService.findGroupByUuid("settled-uuid")).willReturn(settledGroup);
        UpdateExpenseRequest request = mockUpdateRequest("수정된 제목", 50000, 1L, List.of(1L));

        // when & then
        assertThatThrownBy(() -> expenseService.updateExpense("settled-uuid", 1L, request))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.GROUP_ALREADY_SETTLED));
    }

    @Test
    @DisplayName("지출 삭제 성공")
    void deleteExpense_success() {
        // given
        Expense expense = Expense.builder().group(openGroup).payer(payer).title("숙소").amount(120000).build();
        given(groupService.findGroupByUuid("test-uuid")).willReturn(openGroup);
        given(expenseRepository.findById(1L)).willReturn(Optional.of(expense));

        // when
        expenseService.deleteExpense("test-uuid", 1L);

        // then
        verify(expenseRepository).delete(expense);
    }

    @Test
    @DisplayName("지출 삭제 실패 - SETTLED 상태")
    void deleteExpense_groupSettled() {
        // given
        given(groupService.findGroupByUuid("settled-uuid")).willReturn(settledGroup);

        // when & then
        assertThatThrownBy(() -> expenseService.deleteExpense("settled-uuid", 1L))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.GROUP_ALREADY_SETTLED));
    }

    private CreateExpenseRequest mockCreateRequest(String title, int amount, Long payerId, List<Long> shareIds) {
        try {
            CreateExpenseRequest req = new CreateExpenseRequest();
            setField(req, "title", title);
            setField(req, "amount", amount);
            setField(req, "payerId", payerId);
            setField(req, "shareMemberIds", shareIds);
            return req;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private UpdateExpenseRequest mockUpdateRequest(String title, int amount, Long payerId, List<Long> shareIds) {
        try {
            UpdateExpenseRequest req = new UpdateExpenseRequest();
            setField(req, "title", title);
            setField(req, "amount", amount);
            setField(req, "payerId", payerId);
            setField(req, "shareMemberIds", shareIds);
            return req;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        var field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
