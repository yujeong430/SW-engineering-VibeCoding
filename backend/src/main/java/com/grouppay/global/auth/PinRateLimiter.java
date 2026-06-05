package com.grouppay.global.auth;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * IP별 PIN 인증 시도 횟수를 제한하는 인메모리 Rate Limiter.
 * 1분 슬라이딩 윈도우 내 최대 5회 허용.
 */
@Component
public class PinRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60_000L; // 1분

    private final ConcurrentHashMap<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    public boolean isAllowed(String ip) {
        long now = System.currentTimeMillis();
        Deque<Long> times = attempts.computeIfAbsent(ip, k -> new ArrayDeque<>());

        synchronized (times) {
            // 윈도우 밖의 오래된 시도 제거
            while (!times.isEmpty() && now - times.peekFirst() > WINDOW_MS) {
                times.pollFirst();
            }
            if (times.size() >= MAX_ATTEMPTS) {
                return false;
            }
            times.addLast(now);
            return true;
        }
    }
}
