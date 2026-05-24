package com.grouppay.domain.settlement.controller;

import com.grouppay.domain.settlement.dto.response.SettlementResponse;
import com.grouppay.domain.settlement.service.SettlementService;
import com.grouppay.global.api.CommonResponse;
import com.grouppay.global.api.code.SuccessCode;
import com.grouppay.global.auth.HostSessionManager;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/groups/{uuid}")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping("/settle")
    public ResponseEntity<CommonResponse<SettlementResponse>> settle(
            @PathVariable String uuid,
            HttpSession session) {
        HostSessionManager.validateHost(session, uuid);
        SettlementResponse response = settlementService.settle(uuid);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }

    @GetMapping("/settlement")
    public ResponseEntity<CommonResponse<SettlementResponse>> getSettlement(
            @PathVariable String uuid) {
        SettlementResponse response = settlementService.getSettlement(uuid);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }
}
