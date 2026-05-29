package com.grouppay.domain.settlement.entity;

import com.grouppay.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "settlement_transfers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SettlementTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Settlement settlement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_member_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Member fromMember;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_member_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Member toMember;

    @Column(nullable = false)
    private int amount;

    @Builder
    public SettlementTransfer(Settlement settlement, Member fromMember, Member toMember, int amount) {
        this.settlement = settlement;
        this.fromMember = fromMember;
        this.toMember = toMember;
        this.amount = amount;
    }
}
