package com.grouppay.domain.settlement.service;

import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.expense.entity.ExpenseShare;
import com.grouppay.domain.expense.repository.ExpenseRepository;
import com.grouppay.domain.expense.repository.ExpenseShareRepository;
import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.service.GroupService;
import com.grouppay.domain.member.entity.Member;
import com.grouppay.domain.member.repository.MemberRepository;
import com.grouppay.domain.settlement.dto.response.SettlementResponse;
import com.grouppay.domain.settlement.entity.Settlement;
import com.grouppay.domain.settlement.entity.SettlementTransfer;
import com.grouppay.domain.settlement.repository.SettlementRepository;
import com.grouppay.domain.settlement.repository.SettlementTransferRepository;
import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementService {

    private final GroupService groupService;
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final MemberRepository memberRepository;
    private final SettlementRepository settlementRepository;
    private final SettlementTransferRepository settlementTransferRepository;

    @Transactional
    public SettlementResponse settle(String uuid) {
        Group group = groupService.findGroupByUuid(uuid);

        if (group.isSettled()) {
            throw new BusinessException(ErrorCode.SETTLE_ALREADY_SETTLED);
        }

        List<Expense> expenses = expenseRepository.findByGroup(group);
        if (expenses.isEmpty()) {
            throw new BusinessException(ErrorCode.SETTLE_NO_EXPENSE);
        }

        // 순잔액 계산
        Map<Long, Integer> netBalances = calculateNetBalances(group, expenses);

        // 최소 송금 산출
        List<SettlementCalculator.Transfer> calculatedTransfers = SettlementCalculator.calculate(netBalances);

        // 정산 저장 + 그룹 상태 변경 (원자적)
        Settlement settlement = Settlement.builder()
                .group(group)
                .settledAt(LocalDateTime.now())
                .build();
        settlementRepository.save(settlement);

        Map<Long, Member> memberMap = buildMemberMap(group);

        List<SettlementTransfer> transfers = calculatedTransfers.stream()
                .map(t -> SettlementTransfer.builder()
                        .settlement(settlement)
                        .fromMember(memberMap.get(t.fromMemberId()))
                        .toMember(memberMap.get(t.toMemberId()))
                        .amount(t.amount())
                        .build())
                .toList();
        settlementTransferRepository.saveAll(transfers);

        group.settle();

        log.info("[SETTLEMENT] 정산 확정 - groupUuid={}, transferCount={}, totalExpenses={}",
                uuid, transfers.size(), expenses.size());
        return new SettlementResponse(settlement, netBalances, transfers, memberMap);
    }

    public SettlementResponse getSettlement(String uuid) {
        Group group = groupService.findGroupByUuid(uuid);

        if (!group.isSettled()) {
            throw new BusinessException(ErrorCode.SETTLE_NOT_SETTLED);
        }

        Settlement settlement = settlementRepository.findByGroup(group)
                .orElseThrow(() -> new BusinessException(ErrorCode.SETTLE_NOT_SETTLED));

        List<SettlementTransfer> transfers = settlementTransferRepository.findBySettlement(settlement);
        Map<Long, Member> memberMap = buildMemberMap(group);

        List<Expense> expenses = expenseRepository.findByGroup(group);
        Map<Long, Integer> netBalances = calculateNetBalances(group, expenses);

        return new SettlementResponse(settlement, netBalances, transfers, memberMap);
    }

    private Map<Long, Integer> calculateNetBalances(Group group, List<Expense> expenses) {
        Map<Long, Integer> netBalances = new HashMap<>();

        for (Expense expense : expenses) {
            Long payerId = expense.getPayer().getId();
            netBalances.merge(payerId, expense.getAmount(), Integer::sum);

            List<ExpenseShare> shares = expenseShareRepository.findByExpense(expense);
            for (ExpenseShare share : shares) {
                Long memberId = share.getMember().getId();
                netBalances.merge(memberId, -share.getShareAmount(), Integer::sum);
            }
        }
        return netBalances;
    }

    private Map<Long, Member> buildMemberMap(Group group) {
        return memberRepository.findByGroup(group).stream()
                .collect(Collectors.toMap(Member::getId, m -> m));
    }
}
