package com.grouppay.domain.group.service;

import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.expense.repository.ExpenseRepository;
import com.grouppay.domain.expense.repository.ExpenseShareRepository;
import com.grouppay.domain.group.dto.request.CreateGroupRequest;
import com.grouppay.domain.group.dto.request.UpdateGroupRequest;
import com.grouppay.domain.group.dto.response.GroupDetailResponse;
import com.grouppay.domain.group.dto.response.GroupResponse;
import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.repository.GroupRepository;
import com.grouppay.domain.member.entity.Member;
import com.grouppay.domain.member.repository.MemberRepository;
import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupService {

    private final GroupRepository groupRepository;
    private final MemberRepository memberRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request) {
        List<String> memberNames = request.getMembers() == null ? List.of() : request.getMembers();
        validateNoDuplicateNames(memberNames);

        Group group = Group.builder()
                .uuid(UUID.randomUUID().toString())
                .name(request.getName())
                .pinHash(passwordEncoder.encode(request.getPin()))
                .build();
        groupRepository.save(group);

        if (!memberNames.isEmpty()) {
            List<Member> members = memberNames.stream()
                    .map(name -> Member.builder().group(group).name(name).build())
                    .toList();
            memberRepository.saveAll(members);
        }
        return new GroupResponse(group);
    }

    private void validateNoDuplicateNames(List<String> names) {
        if (names != null && new HashSet<>(names).size() != names.size()) {
            throw new BusinessException(ErrorCode.MEMBER_NAME_DUPLICATE);
        }
    }

    public GroupDetailResponse getGroup(String uuid, boolean isHost) {
        Group group = findGroupByUuid(uuid);
        List<Member> members = memberRepository.findByGroup(group);
        List<Expense> expenses = expenseRepository.findByGroup(group);

        List<GroupDetailResponse.ExpenseSummary> expenseSummaries = expenses.stream()
                .map(expense -> new GroupDetailResponse.ExpenseSummary(
                        expense, expenseShareRepository.findByExpense(expense)))
                .toList();

        return new GroupDetailResponse(group, members, expenseSummaries, isHost);
    }

    @Transactional
    public GroupResponse updateGroup(String uuid, UpdateGroupRequest request) {
        Group group = findGroupByUuid(uuid);
        if (group.isSettled()) {
            throw new BusinessException(ErrorCode.GROUP_ALREADY_SETTLED);
        }
        group.updateName(request.getName());
        return new GroupResponse(group);
    }

    @Transactional
    public void deleteGroup(String uuid) {
        Group group = findGroupByUuid(uuid);
        groupRepository.delete(group);
    }

    public Group findGroupByUuid(String uuid) {
        return groupRepository.findByUuid(uuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.GROUP_NOT_FOUND));
    }
}
