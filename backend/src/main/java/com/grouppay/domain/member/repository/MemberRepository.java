package com.grouppay.domain.member.repository;

import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MemberRepository extends JpaRepository<Member, Long> {

    List<Member> findByGroup(Group group);

    boolean existsByGroupAndName(Group group, String name);
}
