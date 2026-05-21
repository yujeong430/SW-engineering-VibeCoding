package com.grouppay.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

@Getter
public class AuthRequest {

    @NotBlank
    @Pattern(regexp = "\\d{4}", message = "PIN은 숫자 4자리여야 합니다.")
    private String pin;
}
