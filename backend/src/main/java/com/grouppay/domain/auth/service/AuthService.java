package com.grouppay.domain.auth.service;

import com.grouppay.domain.auth.dto.request.AuthRequest;
import com.grouppay.domain.auth.dto.response.AuthResponse;
import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.service.GroupService;
import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.auth.HostSessionManager;
import com.grouppay.global.exception.BusinessException;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final GroupService groupService;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthResponse authenticate(String uuid, AuthRequest request, HttpSession session) {
        Group group = groupService.findGroupByUuid(uuid);

        if (!passwordEncoder.matches(request.getPin(), group.getPinHash())) {
            log.warn("[AUTH] PIN 인증 실패 - groupUuid={}", uuid);
            throw new BusinessException(ErrorCode.AUTH_PIN_MISMATCH);
        }

        HostSessionManager.grant(session, uuid);
        log.info("[AUTH] PIN 인증 성공 - groupUuid={}", uuid);
        return new AuthResponse(true);
    }
}
