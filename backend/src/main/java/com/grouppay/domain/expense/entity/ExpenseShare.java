package com.grouppay.domain.expense.entity;

import com.grouppay.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "expense_shares",
    uniqueConstraints = @UniqueConstraint(columnNames = {"expense_id", "member_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExpenseShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private int shareAmount;

    @Builder
    public ExpenseShare(Expense expense, Member member, int shareAmount) {
        this.expense = expense;
        this.member = member;
        this.shareAmount = shareAmount;
    }
}
