package com.grouppay.domain.auth.controller;

import com.grouppay.domain.auth.dto.request.AuthRequest;
import com.grouppay.domain.auth.dto.response.AuthResponse;
import com.grouppay.domain.auth.service.AuthService;
import com.grouppay.global.api.CommonResponse;
import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.api.code.SuccessCode;
import com.grouppay.global.auth.PinRateLimiter;
import com.grouppay.global.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PinRateLimiter pinRateLimiter;

    @PostMapping("/{uuid}/auth")
    public ResponseEntity<CommonResponse<AuthResponse>> authenticate(
            @PathVariable String uuid,
            @RequestBody @Valid AuthRequest request,
            HttpSession session,
            HttpServletRequest httpRequest) {

        String clientIp = getClientIp(httpRequest);
        if (!pinRateLimiter.isAllowed(clientIp)) {
            log.warn("[SECURITY] PIN 인증 횟수 초과 - ip={}, groupUuid={}", clientIp, uuid);
            throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS);
        }

        AuthResponse response = authService.authenticate(uuid, request, session);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
