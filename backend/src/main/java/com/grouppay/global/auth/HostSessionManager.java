package com.grouppay.global.auth;

import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.exception.BusinessException;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class HostSessionManager {

    private static final String HOST_KEY_PREFIX = "HOST_";

    public static void grant(HttpSession session, String uuid) {
        session.setAttribute(HOST_KEY_PREFIX + uuid, true);
    }

    public static boolean isHost(HttpSession session, String uuid) {
        return Boolean.TRUE.equals(session.getAttribute(HOST_KEY_PREFIX + uuid));
    }

    public static void validateHost(HttpSession session, String uuid) {
        if (!isHost(session, uuid)) {
            log.warn("[SECURITY] 미인증 방장 기능 접근 시도 - groupUuid={}", uuid);
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
    }
}
