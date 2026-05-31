# 시퀀스 다이어그램 (Sequence Diagram)

## 그룹 정산 관리 시스템 (GroupPay)

| 항목          | 내용                                                        |
| ------------- | ----------------------------------------------------------- |
| 문서 버전     | v1.0                                                        |
| 작성일        | 2026-05-19                                                  |
| 작성자        | -                                                           |
| 프로세스 단계 | 설계 (상세 설계)                                            |
| 참조 문서     | requirements.md v1.0, usecase.md v1.0, architecture.md v1.0 |
| 상태          | 초안 (Draft)                                                |

---

## 목차

1. 목적 및 범위
2. 표기 규약
3. 참여 객체 (Lifeline)
4. SD-01 방장 PIN 인증 (FR-05)
5. SD-02 지출 등록 — 1/N 균등 분담 (UC-05 / FR-10, 11, 14)
6. SD-03 정산 확정 (UC-06 / FR-18, 19, 20)
7. SD-04 정산 결과 조회 (UC-07 / FR-21, 09)
8. 시퀀스-유스케이스-계층 추적표

---

## 1. 목적 및 범위

본 문서는 GroupPay의 핵심 유스케이스를 3계층 아키텍처(Presentation → Business → Data Access)
위에서 객체 간 메시지 흐름으로 구체화하여, 유스케이스 명세(usecase.md)와 구현 코드 사이의
설계 공백을 메운다.

대상은 흐름이 복잡하거나 트랜잭션·정합성 검증이 얽힌 핵심 유스케이스로 한정한다.
단순 CRUD(그룹명 수정, 멤버 추가 등)는 동일 패턴의 반복이므로 본 문서에서 생략한다.

각 다이어그램은 architecture.md 4.2절의 계층 구분 및 5.5절 처리 흐름과 일관되도록 작성되었다.

---

## 2. 표기 규약

- `Controller`는 Presentation 계층, `Service` / `SettlementCalculator`는 Business 계층,
  `Repository` / DB는 Data Access 계층에 속한다.
- `alt` / `opt`는 분기, `loop`는 반복, 빨간 `Note`는 예외·롤백 경로를 나타낸다.
- 정산 확정처럼 원자성이 요구되는 구간은 `rect`(트랜잭션 경계)로 묶어 표현한다.
- 메시지의 괄호 안 식별자(FR-xx)는 대응 요구사항을 가리킨다.

---

## 3. 참여 객체 (Lifeline)

| 객체                   | 계층         | 역할                                          |
| ---------------------- | ------------ | --------------------------------------------- |
| 일반 참여자 / 방장     | Actor        | 브라우저를 통한 사용자                        |
| React SPA              | Client       | 화면 렌더링, API 호출                         |
| `*Controller`          | Presentation | 요청 수신, DTO 변환, CommonResponse 래핑      |
| `*Service`             | Business     | 비즈니스 로직, 상태 전이, 권한 확인           |
| `SettlementCalculator` | Business     | 순잔액·최소 송금 계산 (단위 테스트 핵심 대상) |
| `*Repository`          | Data Access  | JPA 기반 영속성 처리                          |
| MySQL                  | Data Access  | 데이터 저장, 트랜잭션 보장                    |
| HttpSession            | Infra        | 방장 권한 플래그 보관                         |

---

## 4. SD-01 방장 PIN 인증 (FR-05)

방장 전용 유스케이스(UC-03/04/06)의 선행조건. 세션에 권한 플래그를 심는 것이 핵심이다.

```mermaid
sequenceDiagram
    autonumber
    actor U as 일반 참여자
    participant FE as React SPA
    participant AC as AuthController
    participant AS as AuthService
    participant GR as GroupRepository
    participant SE as HttpSession

    U->>FE: "방장으로 전환" + PIN 4자리 입력
    FE->>AC: POST /groups/{uuid}/auth { pin }
    AC->>AS: authenticate(uuid, pin)
    AS->>GR: findByUuid(uuid)
    GR-->>AS: Group(pinHash)

    alt 그룹 없음
        AS-->>AC: throw GroupNotFound
        AC-->>FE: 404 CommonResponse(success=false)
    else 그룹 존재
        AS->>AS: BCrypt.matches(pin, pinHash)
        alt PIN 일치
            AS->>SE: setAttribute("isHost:"+uuid, true)
            AS-->>AC: 인증 성공
            AC-->>FE: 200 CommonResponse(success=true)
            FE-->>U: 방장 전용 기능 노출
        else PIN 불일치
            AS-->>AC: throw AuthFailed
            AC-->>FE: 401 CommonResponse(success=false)
            Note over FE,U: 권한 미부여, 재입력 유도
        end
    end
```

**예외·대안 흐름**

- 세션 만료 후 방장 기능 접근 시: 권한 플래그 부재 → 재인증 요구(UC-03 1b).

---

## 5. SD-02 지출 등록 — 1/N 균등 분담 (UC-05 / FR-10, 11, 14)

분담 금액 계산과 10원 단위 나머지 처리가 핵심. 그룹 상태(OPEN) 가드가 선행된다.

```mermaid
sequenceDiagram
    autonumber
    actor U as 일반 참여자
    participant FE as React SPA
    participant EC as ExpenseController
    participant ES as ExpenseService
    participant GR as GroupRepository
    participant ER as ExpenseRepository

    U->>FE: 항목명, 금액, 낸 사람, 분담 대상 입력
    FE->>EC: POST /groups/{uuid}/expenses { dto }
    EC->>EC: 요청 DTO 형식 검증 (금액 10원 단위, 항목명 1~50자)

    alt 형식 위반
        EC-->>FE: 400 CommonResponse (형식 오류)
    else 형식 정상
        EC->>ES: register(uuid, dto)
        ES->>GR: findByUuid(uuid)
        GR-->>ES: Group(status)

        alt status == SETTLED
            ES-->>EC: throw GroupSettled
            EC-->>FE: 409 수정 불가 안내
        else status == OPEN
            ES->>ES: 분담 대상 수 N 확인 (1명 이상)
            ES->>ES: 몫 = (금액 / N) 10원 단위 내림
            ES->>ES: 나머지 = 금액 - (몫 × N)
            ES->>ES: 분담 대상 중 랜덤 1명에게 나머지 부과
            loop 분담 대상 멤버마다
                ES->>ES: ExpenseShare 생성 (멤버별 부담액)
            end
            ES->>ER: save(Expense + ExpenseShares)
            ER-->>ES: 저장 완료
            ES-->>EC: 등록 결과
            EC-->>FE: 201 CommonResponse(success=true)
            FE-->>U: 계좌 등록 안내 (FR-07, 패스 가능)
        end
    end
```

**예외·대안 흐름**

- 분담 대상 0명 → 오류(1명 이상 필요), 3단계 복귀.
- 낸 사람이 분담 대상에 포함 → 본인 몫은 순잔액 계산 시 자동 차감(정산 단계에서 반영).

---

## 6. SD-03 정산 확정 (UC-06 / FR-18, 19, 20)

본 시스템에서 가장 복잡한 흐름. 권한·상태·건수 가드 → 계산 → 정합성 검증 → **트랜잭션 내 원자적 저장/상태 전이**가 핵심이다.

```mermaid
sequenceDiagram
    autonumber
    actor H as 방장
    participant FE as React SPA
    participant GC as GroupController
    participant SE as HttpSession
    participant SS as SettlementService
    participant GR as GroupRepository
    participant ER as ExpenseRepository
    participant SC as SettlementCalculator
    participant SR as SettlementRepository
    participant DB as MySQL

    H->>FE: "정산하기" 실행
    FE->>GC: POST /groups/{uuid}/settle
    GC->>SE: getAttribute("isHost:"+uuid)

    alt 방장 권한 없음
        SE-->>GC: null
        GC-->>FE: 401 재인증 요구
    else 방장 권한 있음
        GC->>SS: settle(uuid)
        SS->>GR: findByUuid(uuid)
        GR-->>SS: Group(status)

        alt status == SETTLED
            SS-->>GC: throw AlreadySettled
            GC-->>FE: 409 중복 확정 거부
        else status == OPEN
            SS->>ER: findAllByGroup(uuid)
            ER-->>SS: List<Expense>

            alt 지출 0건
                SS-->>GC: throw NoExpense
                GC-->>FE: 422 정산 불가 안내
            else 지출 1건 이상
                SS->>SC: calculate(expenses, members)
                SC->>SC: 멤버별 순잔액 = Σ낸지출 - Σ부담액
                SC->>SC: 정합성 검증 Σ순잔액 == 0

                alt 합계 != 0
                    SC-->>SS: throw IntegrityError
                    Note over SS,DB: 트랜잭션 미시작, 상태 변경 없음
                    SS-->>GC: 정합성 예외
                    GC-->>FE: 500 정산 실패
                else 합계 == 0
                    SC->>SC: 받는멤버(>0 내림차순)/하는멤버(<0 오름차순) 분리
                    loop 잔액 소진까지 그리디 매칭
                        SC->>SC: 최대 수취자 ↔ 최대 지급자 매칭, 송금액 확정
                    end
                    SC-->>SS: 최소 송금 목록 + 순잔액 목록

                    rect rgb(235, 245, 255)
                        Note over SS,DB: 트랜잭션 시작 (원자적 처리 · NFR-04)
                        SS->>SR: save(Settlement, 송금목록)
                        SS->>GR: updateStatus(uuid, SETTLED)
                        SR->>DB: INSERT settlements
                        GR->>DB: UPDATE groups SET status='SETTLED'
                        alt 저장 중 오류
                            DB-->>SS: SQLException
                            Note over SS,DB: ROLLBACK · OPEN 상태 유지
                            SS-->>GC: throw PersistError
                            GC-->>FE: 500 정산 실패 (상태 불변)
                        else 정상 커밋
                            DB-->>SS: COMMIT 완료
                            SS-->>GC: 정산 결과
                            GC-->>FE: 200 CommonResponse(success=true)
                            FE-->>H: 정산 결과 화면 전환
                        end
                    end
                end
            end
        end
    end
```

**설계 메모**

- 4~7단계(계산·저장·상태 전이)는 단일 트랜잭션 경계 안에서 처리하여 부분 반영을 차단한다(NFR-04).
- `SettlementCalculator`는 외부 의존성 없는 순수 계산 객체로 분리하여 단위 테스트 커버리지 80%(NFR-10)를 확보한다.
- 정합성 검증(Σ=0)은 저장 이전에 수행해 불필요한 트랜잭션 시작을 막는다.

---

## 7. SD-04 정산 결과 조회 (UC-07 / FR-21, 09)

SETTLED 상태에서만 노출되는 조회 전용 흐름. 계좌번호 복사는 클라이언트 측에서 처리된다.

```mermaid
sequenceDiagram
    autonumber
    actor U as 일반 참여자
    participant FE as React SPA
    participant SC as SettlementController
    participant SS as SettlementService
    participant GR as GroupRepository
    participant SR as SettlementRepository

    U->>FE: 정산 결과 화면 접근
    FE->>SC: GET /groups/{uuid}/settlement
    SC->>SS: getResult(uuid)
    SS->>GR: findByUuid(uuid)
    GR-->>SS: Group(status)

    alt status == OPEN
        SS-->>SC: throw NotSettled
        SC-->>FE: 409 조회 불가 (기능 미노출)
    else status == SETTLED
        SS->>SR: findByGroup(uuid)
        SR-->>SS: 순잔액 목록 + 송금 목록 (+계좌번호)
        SS-->>SC: 정산 결과
        SC-->>FE: 200 CommonResponse(data)
        FE-->>U: 순잔액·송금 목록 표시

        opt 받는 멤버 계좌 등록됨
            U->>FE: 계좌번호 복사 버튼 (FR-09)
            FE->>FE: navigator.clipboard.writeText()
            alt 복사 성공
                FE-->>U: 완료 피드백 표시
            else 클립보드 권한 거부
                FE-->>U: 복사 실패 안내
            end
        end
    end
```

---

## 8. 시퀀스-유스케이스-계층 추적표

| SD ID | 다이어그램명   | 대응 UC            | 대응 FR       | 주요 계층 흐름                                           |
| ----- | -------------- | ------------------ | ------------- | -------------------------------------------------------- |
| SD-01 | 방장 PIN 인증  | UC-03/04/06 (선행) | FR-05         | Controller → Service → Repository → Session              |
| SD-02 | 지출 등록(1/N) | UC-05              | FR-10, 11, 14 | Controller → Service(계산) → Repository                  |
| SD-03 | 정산 확정      | UC-06              | FR-18, 19, 20 | Controller → Service → Calculator → Repository(트랜잭션) |
| SD-04 | 정산 결과 조회 | UC-07              | FR-21, 09     | Controller → Service → Repository (+클라이언트 복사)     |

> 생략된 단순 흐름: 그룹 생성(UC-01), 그룹 접근(UC-02), 그룹명 수정/삭제(UC-03), 멤버 추가/제거(UC-04),
> 지출 수정/삭제(UC-05). 모두 `Controller → Service → Repository` 단방향 CRUD 패턴을 따른다.

---

_본 문서는 상세 설계 단계의 산출물이며, 구현 중 흐름 변경 시 변경 이력을 기록하여 SRS·유스케이스 명세와의 추적성을 유지한다._
