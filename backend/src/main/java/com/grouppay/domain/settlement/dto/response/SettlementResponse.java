package com.grouppay.domain.settlement.dto.response;

import com.grouppay.domain.member.entity.Member;
import com.grouppay.domain.settlement.entity.Settlement;
import com.grouppay.domain.settlement.entity.SettlementTransfer;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
public class SettlementResponse {

    private final LocalDateTime settledAt;
    private final List<BalanceDetail> balances;
    private final List<TransferDetail> transfers;

    public SettlementResponse(Settlement settlement, Map<Long, Integer> netBalances,
                              List<SettlementTransfer> transfers, Map<Long, Member> memberMap) {
        this.settledAt = settlement.getSettledAt();
        this.balances = netBalances.entrySet().stream()
                .map(e -> new BalanceDetail(e.getKey(), e.getValue()))
                .toList();
        this.transfers = transfers.stream()
                .map(t -> new TransferDetail(t, memberMap))
                .toList();
    }

    @Getter
    public static class BalanceDetail {
        private final Long memberId;
        private final int netBalance;

        public BalanceDetail(Long memberId, int netBalance) {
            this.memberId = memberId;
            this.netBalance = netBalance;
        }
    }

    @Getter
    public static class TransferDetail {
        private final Long fromMemberId;
        private final String fromName;
        private final Long toMemberId;
        private final String toName;
        private final int amount;
        private final AccountInfo toAccount;

        public TransferDetail(SettlementTransfer transfer, Map<Long, Member> memberMap) {
            Member from = memberMap.get(transfer.getFromMember().getId());
            Member to = memberMap.get(transfer.getToMember().getId());
            this.fromMemberId = from.getId();
            this.fromName = from.getName();
            this.toMemberId = to.getId();
            this.toName = to.getName();
            this.amount = transfer.getAmount();
            this.toAccount = (to.getAccountNo() != null)
                    ? new AccountInfo(to.getBankName(), to.getAccountNo())
                    : null;
        }
    }

    @Getter
    public static class AccountInfo {
        private final String bankName;
        private final String accountNo;

        public AccountInfo(String bankName, String accountNo) {
            this.bankName = bankName;
            this.accountNo = accountNo;
        }
    }
}
