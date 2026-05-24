package com.grouppay.domain.settlement.service;

import com.grouppay.global.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SettlementCalculatorTest {

    @Test
    @DisplayName("정상 정산 - 최소 송금 횟수 산출")
    void calculate_normal() {
        // A: +60000, B: -30000, C: -30000
        Map<Long, Integer> netBalances = Map.of(
                1L, 60000,
                2L, -30000,
                3L, -30000
        );

        List<SettlementCalculator.Transfer> transfers = SettlementCalculator.calculate(netBalances);

        assertThat(transfers).hasSize(2);
        assertThat(transfers).allMatch(t -> t.toMemberId() == 1L);
        assertThat(transfers).allMatch(t -> t.amount() == 30000);
    }

    @Test
    @DisplayName("정산 대상 전체 합계 = 0 보장")
    void calculate_sumIsZero() {
        Map<Long, Integer> netBalances = Map.of(
                1L, 50000,
                2L, -20000,
                3L, -30000
        );

        List<SettlementCalculator.Transfer> transfers = SettlementCalculator.calculate(netBalances);

        int totalSent = transfers.stream().mapToInt(SettlementCalculator.Transfer::amount).sum();
        int totalReceived = transfers.stream().mapToInt(SettlementCalculator.Transfer::amount).sum();
        assertThat(totalSent).isEqualTo(totalReceived);
    }

    @Test
    @DisplayName("정합성 위반 - 순잔액 합계 ≠ 0이면 예외")
    void calculate_integrityError() {
        Map<Long, Integer> netBalances = Map.of(
                1L, 60000,
                2L, -30000
                // 합계 30000 ≠ 0
        );

        assertThatThrownBy(() -> SettlementCalculator.calculate(netBalances))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("송금 없는 경우 - 모두 순잔액 0")
    void calculate_noTransfer() {
        Map<Long, Integer> netBalances = Map.of(
                1L, 0,
                2L, 0
        );

        List<SettlementCalculator.Transfer> transfers = SettlementCalculator.calculate(netBalances);

        assertThat(transfers).isEmpty();
    }

    @Test
    @DisplayName("3명 이상 복잡한 정산 - 최소 송금 검증")
    void calculate_complex() {
        // A: +50000, B: +10000, C: -40000, D: -20000
        Map<Long, Integer> netBalances = Map.of(
                1L, 50000,
                2L, 10000,
                3L, -40000,
                4L, -20000
        );

        List<SettlementCalculator.Transfer> transfers = SettlementCalculator.calculate(netBalances);

        // 송금 합계 = 받는 합계 = 60000
        int totalAmount = transfers.stream().mapToInt(SettlementCalculator.Transfer::amount).sum();
        assertThat(totalAmount).isEqualTo(60000);
        // 최소 송금 횟수 검증 (3회 이하)
        assertThat(transfers.size()).isLessThanOrEqualTo(3);
    }

    @Test
    @DisplayName("본인 몫 차감 - 낸 사람이 분담 대상에 포함된 경우")
    void calculate_payerIncludedInShare() {
        // A가 90000 냈고 A,B,C 균등 분담 → A 순잔액: 90000-30000=+60000
        Map<Long, Integer> netBalances = Map.of(
                1L, 60000,  // A
                2L, -30000, // B
                3L, -30000  // C
        );

        List<SettlementCalculator.Transfer> transfers = SettlementCalculator.calculate(netBalances);

        assertThat(transfers).hasSize(2);
        transfers.forEach(t -> assertThat(t.fromMemberId()).isNotEqualTo(1L));
    }

    @Test
    @DisplayName("일부 멤버만 분담 대상 - 특정 멤버만 참여한 지출")
    void calculate_partialShareMembers() {
        // A가 60000 냈고 B,C만 분담 (A 제외) → A: +60000, B: -30000, C: -30000
        Map<Long, Integer> netBalances = Map.of(
                1L, 60000,  // A (냈지만 분담 안 함)
                2L, -30000, // B
                3L, -30000  // C
        );

        List<SettlementCalculator.Transfer> transfers = SettlementCalculator.calculate(netBalances);

        assertThat(transfers).hasSize(2);
        int totalAmount = transfers.stream().mapToInt(SettlementCalculator.Transfer::amount).sum();
        assertThat(totalAmount).isEqualTo(60000);
        transfers.forEach(t -> assertThat(t.toMemberId()).isEqualTo(1L));
    }

    @Test
    @DisplayName("최소 케이스 - 2명, 1명이 전액 부담")
    void calculate_twoMembers() {
        // A: +50000, B: -50000
        Map<Long, Integer> netBalances = Map.of(
                1L, 50000,
                2L, -50000
        );

        List<SettlementCalculator.Transfer> transfers = SettlementCalculator.calculate(netBalances);

        assertThat(transfers).hasSize(1);
        assertThat(transfers.get(0).fromMemberId()).isEqualTo(2L);
        assertThat(transfers.get(0).toMemberId()).isEqualTo(1L);
        assertThat(transfers.get(0).amount()).isEqualTo(50000);
    }

    @Test
    @DisplayName("순잔액 0인 멤버 포함 - 송금 목록에 포함되지 않아야 함")
    void calculate_zeroBalanceMemberExcluded() {
        // A: +30000, B: 0 (자기 몫만 냄), C: -30000
        Map<Long, Integer> netBalances = Map.of(
                1L, 30000,
                2L, 0,
                3L, -30000
        );

        List<SettlementCalculator.Transfer> transfers = SettlementCalculator.calculate(netBalances);

        assertThat(transfers).hasSize(1);
        transfers.forEach(t -> {
            assertThat(t.fromMemberId()).isNotEqualTo(2L);
            assertThat(t.toMemberId()).isNotEqualTo(2L);
        });
    }

    @Test
    @DisplayName("10원 나머지 발생 - 송금 총액이 정확해야 함")
    void calculate_remainderHandled() {
        // 10000원을 3명이 균등 분담 → 3340 + 3330 + 3330 = 10000
        // A가 냄: A 순잔액 = 10000 - 3340 = +6660 (나머지 부과된 경우)
        // B 순잔액 = -3330, C 순잔액 = -3330
        Map<Long, Integer> netBalances = Map.of(
                1L, 6660,
                2L, -3330,
                3L, -3330
        );

        List<SettlementCalculator.Transfer> transfers = SettlementCalculator.calculate(netBalances);

        int totalAmount = transfers.stream().mapToInt(SettlementCalculator.Transfer::amount).sum();
        assertThat(totalAmount).isEqualTo(6660);
        int sum = netBalances.values().stream().mapToInt(Integer::intValue).sum();
        assertThat(sum).isEqualTo(0);
    }
}
