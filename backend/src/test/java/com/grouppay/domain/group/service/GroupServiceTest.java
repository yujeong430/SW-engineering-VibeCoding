package com.grouppay.domain.group.service;

import com.grouppay.domain.expense.repository.ExpenseRepository;
import com.grouppay.domain.group.dto.request.CreateGroupRequest;
import com.grouppay.domain.group.dto.request.UpdateGroupRequest;
import com.grouppay.domain.group.dto.response.GroupDetailResponse;
import com.grouppay.domain.group.dto.response.GroupResponse;
import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.entity.GroupStatus;
import com.grouppay.domain.group.repository.GroupRepository;
import com.grouppay.domain.member.repository.MemberRepository;
import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @InjectMocks
    private GroupService groupService;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Test
    @DisplayName("그룹 생성 성공")
    void createGroup_success() {
        // given
        CreateGroupRequest request = mockCreateRequest("제주도 여행", "1234");
        given(passwordEncoder.encode("1234")).willReturn("$hashed$");
        Group savedGroup = Group.builder().uuid("test-uuid").name("제주도 여행").pinHash("$hashed$").build();
        given(groupRepository.save(any(Group.class))).willReturn(savedGroup);

        // when
        GroupResponse response = groupService.createGroup(request);

        // then
        assertThat(response.getName()).isEqualTo("제주도 여행");
        assertThat(response.getStatus()).isEqualTo(GroupStatus.OPEN);
        verify(groupRepository).save(any(Group.class));
    }

    @Test
    @DisplayName("그룹 생성 성공 - 멤버 동반 등록")
    void createGroup_withMembers_success() {
        // given
        CreateGroupRequest request = mockCreateRequest("제주도 여행", "1234");
        setMembers(request, List.of("지수", "민호", "서연"));
        given(passwordEncoder.encode("1234")).willReturn("$hashed$");
        given(groupRepository.save(any(Group.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        GroupResponse response = groupService.createGroup(request);

        // then
        assertThat(response.getName()).isEqualTo("제주도 여행");
        verify(groupRepository).save(any(Group.class));
        verify(memberRepository).saveAll(any());
    }

    @Test
    @DisplayName("그룹 생성 실패 - 멤버 이름 중복")
    void createGroup_duplicateMemberNames() {
        // given
        CreateGroupRequest request = mockCreateRequest("제주도 여행", "1234");
        setMembers(request, List.of("지수", "지수"));

        // when & then
        assertThatThrownBy(() -> groupService.createGroup(request))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.MEMBER_NAME_DUPLICATE));
    }

    @Test
    @DisplayName("그룹 조회 성공")
    void getGroup_success() {
        // given
        Group group = Group.builder().uuid("test-uuid").name("제주도 여행").pinHash("$hashed$").build();
        given(groupRepository.findByUuid("test-uuid")).willReturn(Optional.of(group));
        given(memberRepository.findByGroup(group)).willReturn(List.of());
        given(expenseRepository.findByGroup(group)).willReturn(List.of());

        // when
        GroupDetailResponse response = groupService.getGroup("test-uuid", true);

        // then
        assertThat(response.getName()).isEqualTo("제주도 여행");
        assertThat(response.isHost()).isTrue();
        assertThat(response.getMembers()).isEmpty();
        assertThat(response.getExpenses()).isEmpty();
    }

    @Test
    @DisplayName("그룹 조회 실패 - 존재하지 않는 UUID")
    void getGroup_notFound() {
        // given
        given(groupRepository.findByUuid("invalid-uuid")).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> groupService.getGroup("invalid-uuid", false))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.GROUP_NOT_FOUND));
    }

    @Test
    @DisplayName("그룹명 수정 성공")
    void updateGroup_success() {
        // given
        Group group = Group.builder().uuid("test-uuid").name("제주도 여행").pinHash("$hashed$").build();
        given(groupRepository.findByUuid("test-uuid")).willReturn(Optional.of(group));
        UpdateGroupRequest request = mockUpdateRequest("제주도 2박3일");

        // when
        GroupResponse response = groupService.updateGroup("test-uuid", request);

        // then
        assertThat(response.getName()).isEqualTo("제주도 2박3일");
    }

    @Test
    @DisplayName("그룹명 수정 실패 - SETTLED 상태")
    void updateGroup_alreadySettled() {
        // given
        Group group = Group.builder().uuid("test-uuid").name("제주도 여행").pinHash("$hashed$").build();
        group.settle();
        given(groupRepository.findByUuid("test-uuid")).willReturn(Optional.of(group));
        UpdateGroupRequest request = mockUpdateRequest("새 이름");

        // when & then
        assertThatThrownBy(() -> groupService.updateGroup("test-uuid", request))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.GROUP_ALREADY_SETTLED));
    }

    @Test
    @DisplayName("그룹 삭제 성공")
    void deleteGroup_success() {
        // given
        Group group = Group.builder().uuid("test-uuid").name("제주도 여행").pinHash("$hashed$").build();
        given(groupRepository.findByUuid("test-uuid")).willReturn(Optional.of(group));

        // when
        groupService.deleteGroup("test-uuid");

        // then
        verify(groupRepository).delete(group);
    }

    private CreateGroupRequest mockCreateRequest(String name, String pin) {
        try {
            CreateGroupRequest request = new CreateGroupRequest();
            setField(request, "name", name);
            setField(request, "pin", pin);
            return request;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void setMembers(CreateGroupRequest request, List<String> members) {
        try {
            setField(request, "members", members);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private UpdateGroupRequest mockUpdateRequest(String name) {
        try {
            UpdateGroupRequest request = new UpdateGroupRequest();
            setField(request, "name", name);
            return request;
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
