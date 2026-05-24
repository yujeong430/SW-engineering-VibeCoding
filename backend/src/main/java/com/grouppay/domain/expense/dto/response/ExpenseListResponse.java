package com.grouppay.domain.expense.dto.response;

import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.expense.entity.ExpenseShare;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class ExpenseListResponse {

    private final List<ExpenseItem> expenses;

    public ExpenseListResponse(List<ExpenseItem> expenses) {
        this.expenses = expenses;
    }

    @Getter
    public static class ExpenseItem {
        private final Long id;
        private final String title;
        private final int amount;
        private final Long payerId;
        private final String payerName;
        private final LocalDateTime createdAt;
        private final List<Long> shareMemberIds;

        public ExpenseItem(Expense expense, List<ExpenseShare> shares) {
            this.id = expense.getId();
            this.title = expense.getTitle();
            this.amount = expense.getAmount();
            this.payerId = expense.getPayer().getId();
            this.payerName = expense.getPayer().getName();
            this.createdAt = expense.getCreatedAt();
            this.shareMemberIds = shares.stream()
                    .map(s -> s.getMember().getId())
                    .toList();
        }
    }
}
