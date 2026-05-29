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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final MemberRepository memberRepository;
    private final GroupService groupService;

    @Transactional
    public ExpenseResponse createExpense(String uuid, CreateExpenseRequest request) {
        Group group = groupService.findGroupByUuid(uuid);
        validateOpen(group);

        Member payer = findMemberById(request.getPayerId());
        List<Member> shareMembers = findShareMembers(request.getShareMemberIds());

        Expense expense = Expense.builder()
                .group(group)
                .payer(payer)
                .title(request.getTitle())
                .amount(request.getAmount())
                .build();
        expenseRepository.save(expense);

        List<ExpenseShare> shares = createShares(expense, shareMembers, request.getAmount());
        expenseShareRepository.saveAll(shares);

        return new ExpenseResponse(expense, shares);
    }

    public ExpenseListResponse getExpenses(String uuid) {
        Group group = groupService.findGroupByUuid(uuid);
        List<Expense> expenses = expenseRepository.findByGroup(group);

        List<ExpenseListResponse.ExpenseItem> items = expenses.stream()
                .map(expense -> {
                    List<ExpenseShare> shares = expenseShareRepository.findByExpense(expense);
                    return new ExpenseListResponse.ExpenseItem(expense, shares);
                })
                .toList();

        return new ExpenseListResponse(items);
    }

    @Transactional
    public ExpenseResponse updateExpense(String uuid, Long expenseId, UpdateExpenseRequest request) {
        Group group = groupService.findGroupByUuid(uuid);
        validateOpen(group);

        Expense expense = findExpenseById(expenseId);
        Member payer = findMemberById(request.getPayerId());
        List<Member> shareMembers = findShareMembers(request.getShareMemberIds());

        expense.update(payer, request.getTitle(), request.getAmount());
        expenseShareRepository.deleteByExpense(expense);
        expenseShareRepository.flush(); // DELETE를 즉시 DB에 반영 후 INSERT (UK 중복 방지)

        List<ExpenseShare> shares = createShares(expense, shareMembers, request.getAmount());
        expenseShareRepository.saveAll(shares);

        return new ExpenseResponse(expense, shares);
    }

    @Transactional
    public void deleteExpense(String uuid, Long expenseId) {
        Group group = groupService.findGroupByUuid(uuid);
        validateOpen(group);

        Expense expense = findExpenseById(expenseId);
        expenseRepository.delete(expense);
    }

    private List<ExpenseShare> createShares(Expense expense, List<Member> members, int totalAmount) {
        if (members.isEmpty()) {
            throw new BusinessException(ErrorCode.EXPENSE_SHARE_EMPTY);
        }

        int count = members.size();
        int base = (totalAmount / count / 10) * 10;
        int remainder = totalAmount - base * count;

        int randomIndex = new Random().nextInt(count);
        List<ExpenseShare> shares = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            int shareAmount = (i == randomIndex) ? base + remainder : base;
            shares.add(ExpenseShare.builder()
                    .expense(expense)
                    .member(members.get(i))
                    .shareAmount(shareAmount)
                    .build());
        }
        return shares;
    }

    private void validateOpen(Group group) {
        if (group.isSettled()) {
            throw new BusinessException(ErrorCode.GROUP_ALREADY_SETTLED);
        }
    }

    private Member findMemberById(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }

    private List<Member> findShareMembers(List<Long> memberIds) {
        return memberIds.stream()
                .map(this::findMemberById)
                .toList();
    }

    private Expense findExpenseById(Long expenseId) {
        return expenseRepository.findById(expenseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXPENSE_NOT_FOUND));
    }
}
