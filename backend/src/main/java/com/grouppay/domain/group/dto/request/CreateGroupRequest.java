package com.grouppay.domain.group.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class CreateGroupRequest {

    @NotBlank
    @Size(min = 1, max = 50)
    private String name;

    @NotBlank
    @Pattern(regexp = "\\d{4}", message = "PIN은 숫자 4자리여야 합니다.")
    private String pin;
}
