package com.grouppay.global.api;

import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.api.code.SuccessCode;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class CommonResponse<T> {

    private final boolean success;
    private final String code;
    private final String message;
    private final T data;

    public static <T> CommonResponse<T> success(SuccessCode successCode, T data) {
        return new CommonResponse<>(true, successCode.getCode(), successCode.getMessage(), data);
    }

    public static <T> CommonResponse<T> success(SuccessCode successCode) {
        return new CommonResponse<>(true, successCode.getCode(), successCode.getMessage(), null);
    }

    public static <T> CommonResponse<T> fail(ErrorCode errorCode) {
        return new CommonResponse<>(false, errorCode.getCode(), errorCode.getMessage(), null);
    }
}
