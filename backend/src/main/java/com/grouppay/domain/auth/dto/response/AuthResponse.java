package com.grouppay.domain.auth.dto.response;

import lombok.Getter;

@Getter
public class AuthResponse {

    private final boolean isHost;

    public AuthResponse(boolean isHost) {
        this.isHost = isHost;
    }
}
