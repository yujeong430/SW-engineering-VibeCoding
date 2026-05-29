package com.grouppay.domain.member.entity;

import com.grouppay.domain.group.entity.Group;
import com.grouppay.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(
    name = "members",
    uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "name"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Group group;

    @Column(nullable = false, length = 20)
    private String name;

    @Column(length = 30)
    private String bankName;

    @Column(length = 40)
    private String accountNo;

    @Builder
    public Member(Group group, String name) {
        this.group = group;
        this.name = name;
    }

    public void updateAccount(String bankName, String accountNo) {
        this.bankName = bankName;
        this.accountNo = accountNo;
    }
}
