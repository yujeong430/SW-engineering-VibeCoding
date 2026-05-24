package com.grouppay.domain.settlement.service;

import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.exception.BusinessException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public class SettlementCalculator {

    public record Transfer(Long fromMemberId, Long toMemberId, int amount) {}

    public static List<Transfer> calculate(Map<Long, Integer> netBalances) {
        int total = netBalances.values().stream().mapToInt(Integer::intValue).sum();
        if (total != 0) {
            throw new BusinessException(ErrorCode.SETTLE_INTEGRITY_ERROR);
        }

        // 양수(받을 사람) 내림차순, 음수(줄 사람) 오름차순
        List<long[]> creditors = new ArrayList<>(); // [memberId, amount]
        List<long[]> debtors = new ArrayList<>();

        for (Map.Entry<Long, Integer> entry : netBalances.entrySet()) {
            if (entry.getValue() > 0) {
                creditors.add(new long[]{entry.getKey(), entry.getValue()});
            } else if (entry.getValue() < 0) {
                debtors.add(new long[]{entry.getKey(), -entry.getValue()});
            }
        }

        creditors.sort(Comparator.comparingLong(a -> -a[1]));
        debtors.sort(Comparator.comparingLong(a -> -a[1]));

        List<Transfer> transfers = new ArrayList<>();
        int i = 0, j = 0;

        while (i < creditors.size() && j < debtors.size()) {
            long creditorId = creditors.get(i)[0];
            long debtorId = debtors.get(j)[0];
            long credit = creditors.get(i)[1];
            long debt = debtors.get(j)[1];

            long amount = Math.min(credit, debt);
            transfers.add(new Transfer(debtorId, creditorId, (int) amount));

            creditors.get(i)[1] -= amount;
            debtors.get(j)[1] -= amount;

            if (creditors.get(i)[1] == 0) i++;
            if (debtors.get(j)[1] == 0) j++;
        }

        return transfers;
    }
}
