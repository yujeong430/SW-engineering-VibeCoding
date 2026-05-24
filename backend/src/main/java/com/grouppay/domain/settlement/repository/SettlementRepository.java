package com.grouppay.domain.settlement.repository;

import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.settlement.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    Optional<Settlement> findByGroup(Group group);
}
