package com.grouppay.domain.group.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class CreateGroupRequest {

    @NotBlank
    @Size(min = 1, max = 50)
    private String name;

    @NotBlank
    @Pattern(regexp = "\\d{4}", message = "PIN은 숫자 4자리여야 합니다.")
    private String pin;

    // 그룹 생성 시 함께 등록할 멤버 이름 목록 (생략 시 빈 목록, 이후 방장이 개별 추가 가능)
    private List<@NotBlank @Size(min = 1, max = 20) String> members = new ArrayList<>();
}
