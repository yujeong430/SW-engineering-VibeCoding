package com.grouppay.domain.expense.entity;

import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.member.entity.Member;
import com.grouppay.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "expenses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Expense extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id", nullable = false)
    private Member payer;

    @Column(nullable = false, length = 50)
    private String title;

    @Column(nullable = false)
    private int amount;

    @Builder
    public Expense(Group group, Member payer, String title, int amount) {
        this.group = group;
        this.payer = payer;
        this.title = title;
        this.amount = amount;
    }

    public void update(Member payer, String title, int amount) {
        this.payer = payer;
        this.title = title;
        this.amount = amount;
    }
}
