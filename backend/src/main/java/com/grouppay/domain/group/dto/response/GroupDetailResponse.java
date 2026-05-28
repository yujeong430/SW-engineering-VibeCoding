package com.grouppay.domain.group.dto.response;

import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.entity.GroupStatus;
import com.grouppay.domain.member.entity.Member;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.List;

@Getter
public class GroupDetailResponse {

    private final String uuid;
    private final String name;
    private final GroupStatus status;

    @JsonProperty("isHost")
    private final boolean isHost;
    private final List<MemberSummary> members;
    private final List<ExpenseSummary> expenses;

    public GroupDetailResponse(Group group, List<Member> members, List<Expense> expenses, boolean isHost) {
        this.uuid = group.getUuid();
        this.name = group.getName();
        this.status = group.getStatus();
        this.isHost = isHost;
        this.members = members.stream().map(MemberSummary::new).toList();
        this.expenses = expenses.stream().map(ExpenseSummary::new).toList();
    }

    @Getter
    public static class MemberSummary {
        private final Long id;
        private final String name;
        private final String bankName;
        private final String accountNo;

        public MemberSummary(Member member) {
            this.id = member.getId();
            this.name = member.getName();
            this.bankName = member.getBankName();
            this.accountNo = member.getAccountNo();
        }
    }

    @Getter
    public static class ExpenseSummary {
        private final Long id;
        private final String title;
        private final int amount;
        private final Long payerId;

        public ExpenseSummary(Expense expense) {
            this.id = expense.getId();
            this.title = expense.getTitle();
            this.amount = expense.getAmount();
            this.payerId = expense.getPayer().getId();
        }
    }
}
