package com.grouppay.domain.expense.dto.response;

import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.expense.entity.ExpenseShare;
import lombok.Getter;

import java.util.List;

@Getter
public class ExpenseResponse {

    private final Long id;
    private final String title;
    private final int amount;
    private final Long payerId;
    private final List<ShareDetail> shares;

    public ExpenseResponse(Expense expense, List<ExpenseShare> shares) {
        this.id = expense.getId();
        this.title = expense.getTitle();
        this.amount = expense.getAmount();
        this.payerId = expense.getPayer().getId();
        this.shares = shares.stream().map(ShareDetail::new).toList();
    }

    @Getter
    public static class ShareDetail {
        private final Long memberId;
        private final int shareAmount;

        public ShareDetail(ExpenseShare share) {
            this.memberId = share.getMember().getId();
            this.shareAmount = share.getShareAmount();
        }
    }
}
