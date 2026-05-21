package com.grouppay.domain.member.service;

import com.grouppay.domain.expense.repository.ExpenseRepository;
import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.service.GroupService;
import com.grouppay.domain.member.dto.request.AddMemberRequest;
import com.grouppay.domain.member.dto.request.UpdateAccountRequest;
import com.grouppay.domain.member.dto.response.MemberResponse;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @InjectMocks
    private MemberService memberService;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private GroupService groupService;

    private Group openGroup;
    private Group settledGroup;

    @BeforeEach
    void setUp() {
        openGroup = Group.builder().uuid("test-uuid").name("제주도 여행").pinHash("$hashed$").build();
        settledGroup = Group.builder().uuid("settled-uuid").name("정산완료").pinHash("$hashed$").build();
        settledGroup.settle();
    }

    @Test
    @DisplayName("멤버 추가 성공")
    void addMember_success() {
        // given
        AddMemberRequest request = mockAddMemberRequest("민수");
        given(groupService.findGroupByUuid("test-uuid")).willReturn(openGroup);
        given(memberRepository.existsByGroupAndName(openGroup, "민수")).willReturn(false);
        Member savedMember = Member.builder().group(openGroup).name("민수").build();
        given(memberRepository.save(any(Member.class))).willReturn(savedMember);

        // when
        MemberResponse response = memberService.addMember("test-uuid", request);

        // then
        assertThat(response.getName()).isEqualTo("민수");
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    @DisplayName("멤버 추가 실패 - SETTLED 상태")
    void addMember_groupSettled() {
        // given
        given(groupService.findGroupByUuid("settled-uuid")).willReturn(settledGroup);
        AddMemberRequest request = mockAddMemberRequest("민수");

        // when & then
        assertThatThrownBy(() -> memberService.addMember("settled-uuid", request))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.GROUP_ALREADY_SETTLED));
    }

    @Test
    @DisplayName("멤버 추가 실패 - 이름 중복")
    void addMember_nameDuplicate() {
        // given
        given(groupService.findGroupByUuid("test-uuid")).willReturn(openGroup);
        given(memberRepository.existsByGroupAndName(openGroup, "민수")).willReturn(true);
        AddMemberRequest request = mockAddMemberRequest("민수");

        // when & then
        assertThatThrownBy(() -> memberService.addMember("test-uuid", request))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.MEMBER_NAME_DUPLICATE));
    }

    @Test
    @DisplayName("계좌 등록 성공")
    void updateAccount_success() {
        // given
        Member member = Member.builder().group(openGroup).name("민수").build();
        given(groupService.findGroupByUuid("test-uuid")).willReturn(openGroup);
        given(memberRepository.findById(1L)).willReturn(Optional.of(member));
        given(expenseRepository.existsByGroupAndPayer_Id(openGroup, 1L)).willReturn(true);
        UpdateAccountRequest request = mockUpdateAccountRequest("카카오뱅크", "3333-01-1234567");

        // when
        MemberResponse response = memberService.updateAccount("test-uuid", 1L, request);

        // then
        assertThat(response.getBankName()).isEqualTo("카카오뱅크");
        assertThat(response.getAccountNo()).isEqualTo("3333-01-1234567");
    }

    @Test
    @DisplayName("계좌 등록 실패 - 지출 미등록 멤버")
    void updateAccount_notExpensePayer() {
        // given
        Member member = Member.builder().group(openGroup).name("민수").build();
        given(groupService.findGroupByUuid("test-uuid")).willReturn(openGroup);
        given(memberRepository.findById(1L)).willReturn(Optional.of(member));
        given(expenseRepository.existsByGroupAndPayer_Id(openGroup, 1L)).willReturn(false);
        UpdateAccountRequest request = mockUpdateAccountRequest("카카오뱅크", "3333-01-1234567");

        // when & then
        assertThatThrownBy(() -> memberService.updateAccount("test-uuid", 1L, request))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.MEMBER_NOT_EXPENSE_PAYER));
    }

    @Test
    @DisplayName("멤버 제거 성공")
    void removeMember_success() {
        // given
        Member member = Member.builder().group(openGroup).name("민수").build();
        given(groupService.findGroupByUuid("test-uuid")).willReturn(openGroup);
        given(memberRepository.findById(1L)).willReturn(Optional.of(member));

        // when
        memberService.removeMember("test-uuid", 1L);

        // then
        verify(memberRepository).delete(member);
    }

    @Test
    @DisplayName("멤버 제거 실패 - SETTLED 상태")
    void removeMember_groupSettled() {
        // given
        given(groupService.findGroupByUuid("settled-uuid")).willReturn(settledGroup);

        // when & then
        assertThatThrownBy(() -> memberService.removeMember("settled-uuid", 1L))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.GROUP_ALREADY_SETTLED));
    }

    private AddMemberRequest mockAddMemberRequest(String name) {
        try {
            AddMemberRequest request = new AddMemberRequest();
            var field = AddMemberRequest.class.getDeclaredField("name");
            field.setAccessible(true);
            field.set(request, name);
            return request;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private UpdateAccountRequest mockUpdateAccountRequest(String bankName, String accountNo) {
        try {
            UpdateAccountRequest request = new UpdateAccountRequest();
            var bankField = UpdateAccountRequest.class.getDeclaredField("bankName");
            bankField.setAccessible(true);
            bankField.set(request, bankName);
            var accountField = UpdateAccountRequest.class.getDeclaredField("accountNo");
            accountField.setAccessible(true);
            accountField.set(request, accountNo);
            return request;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
