package com.grouppay.global.api.code;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "COMMON_400", "잘못된 요청입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "COMMON_401", "방장 권한이 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "COMMON_405", "지원하지 않는 HTTP 메서드입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_500", "서버 내부 오류가 발생했습니다."),

    // 그룹
    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "GROUP_001", "존재하지 않는 그룹입니다."),
    GROUP_ALREADY_SETTLED(HttpStatus.CONFLICT, "GROUP_002", "이미 정산이 완료된 그룹입니다."),

    // 인증
    AUTH_PIN_MISMATCH(HttpStatus.UNAUTHORIZED, "AUTH_001", "PIN이 일치하지 않습니다."),

    // 멤버
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "MEMBER_000", "존재하지 않는 멤버입니다."),
    MEMBER_NAME_DUPLICATE(HttpStatus.CONFLICT, "MEMBER_001", "이미 존재하는 멤버 이름입니다."),
    MEMBER_NOT_EXPENSE_PAYER(HttpStatus.BAD_REQUEST, "MEMBER_002", "지출을 등록한 멤버만 계좌를 등록할 수 있습니다."),

    // 지출
    EXPENSE_INVALID_FORMAT(HttpStatus.BAD_REQUEST, "EXPENSE_001", "금액 또는 항목명 형식이 올바르지 않습니다."),
    EXPENSE_SHARE_EMPTY(HttpStatus.BAD_REQUEST, "EXPENSE_002", "분담 대상이 1명 이상이어야 합니다."),

    // 정산
    SETTLE_ALREADY_SETTLED(HttpStatus.CONFLICT, "SETTLE_001", "이미 정산이 확정된 그룹입니다."),
    SETTLE_NO_EXPENSE(HttpStatus.UNPROCESSABLE_ENTITY, "SETTLE_002", "지출이 없어 정산할 수 없습니다."),
    SETTLE_NOT_SETTLED(HttpStatus.CONFLICT, "SETTLE_003", "아직 정산이 확정되지 않은 그룹입니다."),
    SETTLE_INTEGRITY_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SETTLE_004", "정산 금액 정합성 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
