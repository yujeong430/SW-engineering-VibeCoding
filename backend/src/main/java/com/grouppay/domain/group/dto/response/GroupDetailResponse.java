package com.grouppay.domain.group.dto.response;

import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.expense.entity.ExpenseShare;
import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.entity.GroupStatus;
import com.grouppay.domain.member.entity.Member;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;
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

    public GroupDetailResponse(Group group, List<Member> members, List<ExpenseSummary> expenses, boolean isHost) {
        this.uuid = group.getUuid();
        this.name = group.getName();
        this.status = group.getStatus();
        this.isHost = isHost;
        this.members = members.stream().map(MemberSummary::new).toList();
        this.expenses = expenses;
    }

    @Getter
    public static class MemberSummary {
        private final Long id;
        private final String name;

        // 계좌번호는 정산 결과의 '받는 사람'에게만 노출한다(FR-07, FR-09). 그룹 조회에는 포함하지 않는다.
        public MemberSummary(Member member) {
            this.id = member.getId();
            this.name = member.getName();
        }
    }

    @Getter
    public static class ExpenseSummary {
        private final Long id;
        private final String title;
        private final int amount;
        private final Long payerId;
        private final String payerName;
        private final LocalDateTime createdAt;
        private final List<Long> shareMemberIds;

        public ExpenseSummary(Expense expense, List<ExpenseShare> shares) {
            this.id = expense.getId();
            this.title = expense.getTitle();
            this.amount = expense.getAmount();
            this.payerId = expense.getPayer().getId();
            this.payerName = expense.getPayer().getName();
            this.createdAt = expense.getCreatedAt();
            this.shareMemberIds = shares.stream().map(s -> s.getMember().getId()).toList();
        }
    }
}
