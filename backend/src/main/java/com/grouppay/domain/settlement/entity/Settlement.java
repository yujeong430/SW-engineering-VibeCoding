package com.grouppay.domain.settlement.entity;

import com.grouppay.domain.group.entity.Group;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "settlements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Group group;

    @Column(nullable = false)
    private LocalDateTime settledAt;

    @Builder
    public Settlement(Group group, LocalDateTime settledAt) {
        this.group = group;
        this.settledAt = settledAt;
    }
}
