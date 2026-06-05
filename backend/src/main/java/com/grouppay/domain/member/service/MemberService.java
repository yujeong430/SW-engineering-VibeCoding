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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final ExpenseRepository expenseRepository;
    private final GroupService groupService;

    @Transactional
    public MemberResponse addMember(String uuid, AddMemberRequest request) {
        Group group = groupService.findGroupByUuid(uuid);

        if (group.isSettled()) {
            throw new BusinessException(ErrorCode.GROUP_ALREADY_SETTLED);
        }
        if (memberRepository.existsByGroupAndName(group, request.getName())) {
            throw new BusinessException(ErrorCode.MEMBER_NAME_DUPLICATE);
        }

        Member member = Member.builder()
                .group(group)
                .name(request.getName())
                .build();
        return new MemberResponse(memberRepository.save(member));
    }

    public MemberResponse getMember(String uuid, Long memberId) {
        groupService.findGroupByUuid(uuid);
        Member member = findMemberById(memberId);
        if (!member.getGroup().getUuid().equals(uuid)) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }
        return new MemberResponse(member);
    }

    @Transactional
    public MemberResponse updateAccount(String uuid, Long memberId, UpdateAccountRequest request) {
        Group group = groupService.findGroupByUuid(uuid);
        Member member = findMemberById(memberId);

        if (!member.getGroup().getUuid().equals(uuid)) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        if (!expenseRepository.existsByGroupAndPayer_Id(group, memberId)) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_EXPENSE_PAYER);
        }

        member.updateAccount(request.getBankName(), request.getAccountNo());
        return new MemberResponse(member);
    }

    @Transactional
    public void removeMember(String uuid, Long memberId) {
        Group group = groupService.findGroupByUuid(uuid);

        if (group.isSettled()) {
            throw new BusinessException(ErrorCode.GROUP_ALREADY_SETTLED);
        }

        Member member = findMemberById(memberId);
        memberRepository.delete(member);
    }

    private Member findMemberById(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }
}
