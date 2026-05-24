package com.grouppay.domain.settlement.repository;

import com.grouppay.domain.settlement.entity.Settlement;
import com.grouppay.domain.settlement.entity.SettlementTransfer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SettlementTransferRepository extends JpaRepository<SettlementTransfer, Long> {

    List<SettlementTransfer> findBySettlement(Settlement settlement);
}
