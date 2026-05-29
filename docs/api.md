# API 명세서 (API Specification)

## 그룹 정산 관리 시스템 (GroupPay)

| 항목          | 내용                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| 문서 버전     | v1.0                                                                     |
| 작성일        | 2026-05-20                                                               |
| 작성자        | -                                                                        |
| 프로세스 단계 | 설계 (상세 설계)                                                         |
| 참조 문서     | requirements.md v1.0, usecase.md v1.0, architecture.md v1.0, erd.md v1.0 |
| 상태          | 초안 (Draft)                                                             |

---

## 목차

1. 목적 및 범위
2. 공통 규약
3. 공통 응답 형식
4. 에러 코드 체계
5. 그룹 API
6. 멤버 API
7. 지출 API
8. 정산 API
9. API-요구사항 추적표

---

## 1. 목적 및 범위

본 문서는 architecture.md 9장에서 정의 원칙만 제시하고 상세를 미룬 REST API의
요청/응답 스키마와 에러 코드를 구체화한다.
엔드포인트 목록·권한·CommonResponse 형식은 architecture.md를 기준으로 하며,
본 문서는 각 엔드포인트의 입출력 계약을 확정하여 프론트엔드-백엔드 간 인터페이스 기준선으로 사용한다.

---

## 2. 공통 규약

- Base URL: `/api/v1`
- 요청/응답 Content-Type: `application/json`
- 그룹 식별: 경로 파라미터 `{uuid}` (UUID v4)
- 인증: 방장 전용 기능은 PIN 인증으로 세션에 부여된 권한을 확인한다.
  클라이언트는 `withCredentials: true`로 세션 쿠키를 전송한다(architecture.md 6.4).
- 모든 응답은 `CommonResponse<T>`로 래핑한다.
- 금액 단위는 원화(KRW) 정수, 10원 단위(CON-02).

---

## 3. 공통 응답 형식

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "요청이 성공했습니다.",
  "data": {}
}
```

| 필드    | 타입    | 설명                       |
| ------- | ------- | -------------------------- |
| success | boolean | 성공 여부                  |
| code    | string  | 성공/에러 코드             |
| message | string  | 사람이 읽을 수 있는 메시지 |
| data    | T\|null | 응답 데이터 (없으면 null)  |

**성공 코드**

| 코드       | HTTP | 용도           |
| ---------- | ---- | -------------- |
| COMMON_200 | 200  | 조회/처리 성공 |
| COMMON_201 | 201  | 생성 성공      |

---

## 4. 에러 코드 체계

**코드 부여 원칙**

- **한 에러에는 한 코드만 대응한다.** 발생 조건이 다르면 코드를 분리한다.
- **공통(COMMON)** 에러는 특정 도메인에 종속되지 않으므로 HTTP 번호를 그대로 사용한다(`COMMON_400`, `COMMON_401`).
- **도메인 에러**는 도메인 접두어 + 3자리 순번(`GROUP_001`, `EXPENSE_002` …)으로 부여하고, 각 코드에 HTTP 상태를 1:1로 매핑한다.

**공통 에러**

| 코드       | HTTP | 발생 조건                                    |
| ---------- | ---- | -------------------------------------------- |
| COMMON_400 | 400  | 요청 형식·필수값 위반 (Bean Validation 실패) |
| COMMON_401 | 401  | 방장 권한 없음 또는 세션 만료 (미인증 접근)  |

**도메인 에러**

| 코드        | HTTP | 발생 조건                                 | 관련 FR/UC      |
| ----------- | ---- | ----------------------------------------- | --------------- |
| GROUP_001   | 404  | UUID에 해당하는 그룹 없음                 | FR-04, UC-02 2a |
| GROUP_002   | 409  | 그룹이 SETTLED 상태에서 수정성 요청       | FR-02,12,13     |
| AUTH_001    | 401  | PIN 불일치                                | FR-05, UC-03 1a |
| MEMBER_001  | 409  | 그룹 내 멤버 이름 중복                    | FR-06           |
| MEMBER_002  | 400  | 계좌 등록 대상이 지출 미등록 멤버         | FR-07           |
| EXPENSE_001 | 400  | 금액·항목명 형식 위반                     | FR-10           |
| EXPENSE_002 | 400  | 분담 대상 0명 (1명 이상 필요)             | FR-11,14        |
| SETTLE_001  | 409  | 이미 SETTLED인 그룹에 정산 재요청         | FR-18, UC-06 3a |
| SETTLE_002  | 422  | 지출 0건 상태에서 정산 요청 (처리 불가)   | FR-18, UC-06 3b |
| SETTLE_003  | 409  | 정산 미확정(OPEN) 상태에서 결과 조회      | FR-21, UC-07 1a |
| SETTLE_004  | 500  | 순잔액 합계 ≠ 0 정합성 위반, 저장 중 롤백 | FR-19, NFR-04   |

> COMMON_401(권한 없음)과 AUTH_001(PIN 불일치)은 둘 다 HTTP 401이지만 발생 원인이 달라 코드를 분리한다.
> 전자는 "방장 전용 기능에 미인증 접근", 후자는 "인증 시도 중 PIN 불일치"이다.

---

## 5. 그룹 API

### 5.1 그룹 생성 — `POST /api/v1/groups` (FR-01, UC-01)

권한: 누구나

**Request**

```json
{
  "name": "제주도 여행",
  "pin": "1234",
  "members": ["지수", "민호", "서연"]
}
```

| 필드    | 타입     | 제약                                             |
| ------- | -------- | ------------------------------------------------ |
| name    | string   | 1~50자, 필수                                     |
| pin     | string   | 숫자 4자리, 필수                                 |
| members | string[] | 선택. 각 이름 1~20자, 목록 내 중복 불가, 생략 시 빈 목록 |

> 그룹과 멤버를 단일 트랜잭션으로 원자적으로 생성한다. 멤버는 생략 가능하며(0명 허용),
> 이후 방장이 `POST /groups/{uuid}/members`로 개별 추가할 수 있다.
> 생성자는 PIN 설정 당사자이므로 응답 시 세션에 방장 권한이 부여된다.

**Response 201**

```json
{
  "success": true,
  "code": "COMMON_201",
  "message": "그룹이 생성되었습니다.",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "제주도 여행",
    "status": "OPEN"
  }
}
```

**에러**: COMMON_400 (형식 위반), MEMBER_001 (멤버 이름 중복)

---

### 5.2 그룹 조회 — `GET /api/v1/groups/{uuid}` (FR-04, UC-02)

권한: 누구나

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "요청이 성공했습니다.",
  "data": {
    "uuid": "550e8400-...",
    "name": "제주도 여행",
    "status": "OPEN",
    "isHost": true,
    "members": [
      {
        "id": 1,
        "name": "민수"
      }
    ],
    "expenses": [
      {
        "id": 10,
        "title": "숙소",
        "amount": 90000,
        "payerId": 1,
        "payerName": "민수",
        "createdAt": "2025-06-04T13:00:00",
        "shareMemberIds": [1, 2, 3]
      }
    ]
  }
}
```

| 필드      | 설명                                                               |
| --------- | ------------------------------------------------------------------ |
| isHost    | 현재 세션의 방장 여부 (그룹 화면의 방장/참여자 뷰 분기용)           |
| members   | id·name만 포함. 계좌번호는 프라이버시상 제외 (FR-09 정산 결과에서만 노출) |
| expenses  | 그룹 메인 화면용 지출 목록 (결제자명·분담 멤버 포함)                |

**에러**: GROUP_001

---

### 5.3 그룹명 수정 — `PATCH /api/v1/groups/{uuid}` (FR-02, UC-03)

권한: 방장

**Request**

```json
{ "name": "제주도 2박3일" }
```

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "그룹명이 수정되었습니다.",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "제주도 2박3일",
    "status": "OPEN"
  }
}
```

**에러**: COMMON_401, AUTH_001, GROUP_001, GROUP_002, COMMON_400

---

### 5.4 그룹 삭제 — `DELETE /api/v1/groups/{uuid}` (FR-03, UC-03)

권한: 방장. 하위 멤버·지출·정산 데이터 CASCADE 삭제.

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "그룹이 삭제되었습니다.",
  "data": null
}
```

**에러**: COMMON_401, GROUP_001

> SETTLED 상태에서도 삭제는 허용된다(usecase.md UC-03 공통 예외).

---

### 5.5 방장 PIN 인증 — `POST /api/v1/groups/{uuid}/auth` (FR-05, UC-03 선행)

권한: 누구나. 성공 시 세션에 방장 권한 부여.

**Request**

```json
{ "pin": "1234" }
```

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "방장 인증 성공",
  "data": { "isHost": true }
}
```

**에러**: AUTH_001(PIN 불일치), GROUP_001, COMMON_400(형식 위반)

---

### 5.6 정산 확정 — `POST /api/v1/groups/{uuid}/settle` (FR-18, UC-06)

권한: 방장. 본문 없음. 정산 결과를 산출·저장하고 그룹을 SETTLED로 전이한다.

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "정산이 확정되었습니다.",
  "data": {
    "settledAt": "2025-06-04T14:30:00",
    "balances": [
      { "memberId": 1, "netBalance": 60000 },
      { "memberId": 2, "netBalance": -30000 },
      { "memberId": 3, "netBalance": -30000 }
    ],
    "transfers": [
      {
        "fromMemberId": 2,
        "fromName": "지영",
        "toMemberId": 1,
        "toName": "민수",
        "amount": 30000,
        "toAccount": {
          "bankName": "카카오뱅크",
          "accountNo": "3333-01-1234567"
        }
      },
      {
        "fromMemberId": 3,
        "fromName": "현우",
        "toMemberId": 1,
        "toName": "민수",
        "amount": 30000,
        "toAccount": {
          "bankName": "카카오뱅크",
          "accountNo": "3333-01-1234567"
        }
      }
    ]
  }
}
```

> 응답 구조는 8.1 정산 결과 조회와 동일하다.

**에러**: COMMON_401, AUTH_001, GROUP_001, SETTLE_001(중복 확정), SETTLE_002(지출 0건), SETTLE_004(정합성 위반)

---

## 6. 멤버 API

### 6.1 멤버 추가 — `POST /api/v1/groups/{uuid}/members` (FR-06, UC-04)

권한: 방장. 선행조건: 그룹 OPEN.

**Request**

```json
{ "name": "지영" }
```

| 필드 | 타입   | 제약                            |
| ---- | ------ | ------------------------------- |
| name | string | 1~20자, 그룹 내 중복 불가, 필수 |

**Response 201**

```json
{
  "success": true,
  "code": "COMMON_201",
  "message": "멤버가 추가되었습니다.",
  "data": {
    "id": 2,
    "name": "지영",
    "bankName": null,
    "accountNo": null
  }
}
```

**에러**: COMMON_401, MEMBER_001(이름 중복), GROUP_001, GROUP_002(SETTLED), COMMON_400

---

### 6.2 멤버 단건 조회 — `GET /api/v1/groups/{uuid}/members/{memberId}` (FR-07)

권한: 누구나. 계좌 수정 화면의 프리필 용도로 단일 멤버의 계좌 정보를 반환한다.

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "요청이 성공했습니다.",
  "data": {
    "id": 1,
    "name": "민수",
    "bankName": "카카오뱅크",
    "accountNo": "3333-01-1234567"
  }
}
```

> 그룹 조회(5.2)는 프라이버시상 계좌번호를 제외하므로, 계좌 수정 프리필이 필요할 때만 본 단건 조회로 노출한다.

**에러**: GROUP_001, MEMBER_NOT_FOUND(다른 그룹/없는 멤버)

---

### 6.3 계좌 등록/수정 — `PATCH /api/v1/groups/{uuid}/members/{memberId}` (FR-07, UC-04)

권한: 누구나 (단, 지출 등록 멤버에 한함)

**Request**

```json
{ "bankName": "토스뱅크", "accountNo": "100012345678" }
```

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "계좌 정보가 저장되었습니다.",
  "data": {
    "id": 1,
    "name": "민수",
    "bankName": "토스뱅크",
    "accountNo": "100012345678"
  }
}
```

**에러**: GROUP_001, MEMBER_002(지출 미등록 멤버), COMMON_400

---

### 6.4 멤버 제거 — `DELETE /api/v1/groups/{uuid}/members/{memberId}` (FR-08, UC-04)

권한: 방장. 지출 내역이 있으면 관련 지출 함께 삭제.

**Query**: `?force=true` (지출 보유 멤버 삭제 확인 시)

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "멤버가 제거되었습니다.",
  "data": null
}
```

**에러**: COMMON_401, GROUP_001, GROUP_002(SETTLED)

---

## 7. 지출 API

### 7.1 지출 등록 — `POST /api/v1/groups/{uuid}/expenses` (FR-10,11,14, UC-05)

권한: 누구나. 선행조건: 그룹 OPEN.

**Request**

```json
{
  "title": "저녁 식사",
  "amount": 90000,
  "payerId": 1,
  "shareMemberIds": [1, 2, 3]
}
```

| 필드           | 타입   | 제약                      |
| -------------- | ------ | ------------------------- |
| title          | string | 1~50자, 필수              |
| amount         | int    | 10 이상, 10원 단위, 필수  |
| payerId        | int    | 낸 사람 멤버 ID, 필수     |
| shareMemberIds | int[]  | 분담 대상, 1명 이상, 필수 |

**Response 201**

```json
{
  "success": true,
  "code": "COMMON_201",
  "message": "지출이 등록되었습니다.",
  "data": {
    "id": 10,
    "title": "저녁 식사",
    "amount": 90000,
    "payerId": 1,
    "shares": [
      { "memberId": 1, "shareAmount": 30000 },
      { "memberId": 2, "shareAmount": 30000 },
      { "memberId": 3, "shareAmount": 30000 }
    ]
  }
}
```

> 10원 단위 나머지는 분담 대상 중 랜덤 1명에게 부과되어 shareAmount에 반영된다(FR-11).

**에러**: EXPENSE_001(금액·항목명 형식 위반), EXPENSE_002(분담 대상 0명), GROUP_001, GROUP_002(SETTLED)

---

### 7.2 지출 목록 조회 — `GET /api/v1/groups/{uuid}/expenses` (FR-22, UC-07)

권한: 누구나

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "요청이 성공했습니다.",
  "data": {
    "expenses": [
      {
        "id": 10,
        "title": "저녁 식사",
        "amount": 90000,
        "payerId": 1,
        "payerName": "민수",
        "createdAt": "2025-06-04T13:00:00",
        "shareMemberIds": [1, 2, 3]
      }
    ]
  }
}
```

**에러**: GROUP_001

---

### 7.3 지출 수정 — `PATCH /api/v1/groups/{uuid}/expenses/{expenseId}` (FR-12, UC-05)

권한: 누구나. 선행조건: 그룹 OPEN. 수정 시 분담 재계산.

**Request**: 7.1과 동일 필드(부분 수정 허용)

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "지출이 수정되었습니다.",
  "data": {
    "id": 10,
    "title": "저녁 식사",
    "amount": 60000,
    "payerId": 1,
    "shares": [
      { "memberId": 1, "shareAmount": 30000 },
      { "memberId": 2, "shareAmount": 30000 }
    ]
  }
}
```

**에러**: EXPENSE_001(형식 위반), EXPENSE_002(분담 0명), GROUP_001, GROUP_002(SETTLED)

---

### 7.4 지출 삭제 — `DELETE /api/v1/groups/{uuid}/expenses/{expenseId}` (FR-13, UC-05)

권한: 누구나. 선행조건: 그룹 OPEN. 관련 분담 데이터 CASCADE 삭제.

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "지출이 삭제되었습니다.",
  "data": null
}
```

**에러**: GROUP_001, GROUP_002(SETTLED)

---

## 8. 정산 API

### 8.1 정산 결과 조회 — `GET /api/v1/groups/{uuid}/settlement` (FR-21,09, UC-07)

권한: 누구나. 선행조건: 그룹 SETTLED.

**Response 200**

```json
{
  "success": true,
  "code": "COMMON_200",
  "message": "요청이 성공했습니다.",
  "data": {
    "settledAt": "2025-06-04T14:30:00",
    "balances": [
      { "memberId": 1, "netBalance": 60000 },
      { "memberId": 2, "netBalance": -30000 },
      { "memberId": 3, "netBalance": -30000 }
    ],
    "transfers": [
      {
        "fromMemberId": 2,
        "fromName": "지영",
        "toMemberId": 1,
        "toName": "민수",
        "amount": 30000,
        "toAccount": {
          "bankName": "카카오뱅크",
          "accountNo": "3333-01-1234567"
        }
      },
      {
        "fromMemberId": 3,
        "fromName": "현우",
        "toMemberId": 1,
        "toName": "민수",
        "amount": 30000,
        "toAccount": {
          "bankName": "카카오뱅크",
          "accountNo": "3333-01-1234567"
        }
      }
    ]
  }
}
```

| 필드                  | 설명                                          |
| --------------------- | --------------------------------------------- |
| balances              | 멤버별 순잔액 (양수=받을 돈, 음수=줄 돈)      |
| transfers             | 최소 송금 목록 (FR-20)                        |
| transfers[].toAccount | 받는 멤버 계좌(미등록 시 null) — FR-09 복사용 |

**에러**: GROUP_001, SETTLE_003(그룹이 OPEN, 정산 미확정 → 조회 불가)

> 계좌번호 복사(FR-09)는 toAccount 데이터를 클라이언트가 클립보드에 복사하여 처리한다.

---

## 9. API-요구사항 추적표

| 엔드포인트                          | FR          | UC    | 권한   |
| ----------------------------------- | ----------- | ----- | ------ |
| POST /groups                        | FR-01, FR-06 | UC-01 | 누구나 |
| GET /groups/{uuid}                  | FR-04        | UC-02 | 누구나 |
| PATCH /groups/{uuid}                | FR-02        | UC-03 | 방장   |
| DELETE /groups/{uuid}               | FR-03        | UC-03 | 방장   |
| POST /groups/{uuid}/auth            | FR-05        | UC-03 | 누구나 |
| POST /groups/{uuid}/settle          | FR-18,19,20  | UC-06 | 방장   |
| POST /groups/{uuid}/members         | FR-06        | UC-04 | 방장   |
| GET /groups/{uuid}/members/{id}     | FR-07        | UC-04 | 누구나 |
| PATCH /groups/{uuid}/members/{id}   | FR-07        | UC-04 | 누구나 |
| DELETE /groups/{uuid}/members/{id}  | FR-08        | UC-04 | 방장   |
| POST /groups/{uuid}/expenses        | FR-10,11,14 | UC-05 | 누구나 |
| GET /groups/{uuid}/expenses         | FR-22       | UC-07 | 누구나 |
| PATCH /groups/{uuid}/expenses/{id}  | FR-12       | UC-05 | 누구나 |
| DELETE /groups/{uuid}/expenses/{id} | FR-13       | UC-05 | 누구나 |
| GET /groups/{uuid}/settlement       | FR-21,09    | UC-07 | 누구나 |

---

_본 문서는 상세 설계 단계의 산출물이며, API 변경 시 변경 이력을 기록하여 SRS·아키텍처·ERD와의 추적성을 유지한다._
