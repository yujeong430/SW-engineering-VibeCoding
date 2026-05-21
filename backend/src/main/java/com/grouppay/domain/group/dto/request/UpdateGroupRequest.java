package com.grouppay.domain.group.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class UpdateGroupRequest {

    @NotBlank
    @Size(min = 1, max = 50)
    private String name;
}
