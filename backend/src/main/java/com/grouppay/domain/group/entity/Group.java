package com.grouppay.domain.group.entity;

import com.grouppay.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "groups")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Group extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 60)
    private String pinHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupStatus status;

    @Builder
    public Group(String uuid, String name, String pinHash) {
        this.uuid = uuid;
        this.name = name;
        this.pinHash = pinHash;
        this.status = GroupStatus.OPEN;
    }

    public void updateName(String name) {
        this.name = name;
    }

    public void settle() {
        this.status = GroupStatus.SETTLED;
    }

    public boolean isSettled() {
        return this.status == GroupStatus.SETTLED;
    }
}
