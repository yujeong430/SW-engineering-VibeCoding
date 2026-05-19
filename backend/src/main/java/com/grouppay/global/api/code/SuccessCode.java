package com.grouppay.global.api.code;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum SuccessCode {

    OK(HttpStatus.OK, "COMMON_200", "요청이 성공했습니다."),
    CREATED(HttpStatus.CREATED, "COMMON_201", "생성되었습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
