package com.grouppay.domain.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class AddMemberRequest {

    @NotBlank
    @Size(min = 1, max = 20)
    private String name;
}
