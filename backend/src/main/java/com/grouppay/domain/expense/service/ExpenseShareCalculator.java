package com.grouppay.domain.expense.service;

import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.expense.entity.ExpenseShare;
import com.grouppay.domain.member.entity.Member;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

/**
 * 지출 분담 금액 계산 책임을 단독으로 담당하는 컴포넌트.
 * 10원 단위 균등 분담 후 나머지를 랜덤 1인에게 부과한다.
 */
@Component
public class ExpenseShareCalculator {

    private final SecureRandom random = new SecureRandom();

    public List<ExpenseShare> calculate(Expense expense, List<Member> members, int totalAmount) {
        int count = members.size();
        int base = (totalAmount / count / 10) * 10;
        int remainder = totalAmount - base * count;

        int randomIndex = random.nextInt(count);
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
}
