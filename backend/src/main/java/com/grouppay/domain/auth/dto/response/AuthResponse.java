package com.grouppay.domain.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class AuthResponse {

    @JsonProperty("isHost")
    private final boolean isHost;

    public AuthResponse(boolean isHost) {
        this.isHost = isHost;
    }
}
