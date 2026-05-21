package com.grouppay.domain.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class UpdateAccountRequest {

    @NotBlank
    @Size(max = 30)
    private String bankName;

    @NotBlank
    @Size(max = 40)
    private String accountNo;
}
