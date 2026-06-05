# 소프트웨어 아키텍처 설계서 (SAD)

## 그룹 정산 관리 시스템 (GroupPay)

| 항목          | 내용                    |
| ------------- | ----------------------- |
| 문서 버전     | v1.0                    |
| 작성일        | 2025-05-19              |
| 작성자        | -                       |
| 프로세스 단계 | 설계 (Sprint 0)         |
| 참조 문서     | SRS\_정산기.md v1.0     |
| 상태          | 기준선 확정 (Baselined) |

---

## 목차

1. 목적 및 범위
2. 아키텍처 목표 및 제약
3. 기술 스택 선정
4. 시스템 아키텍처 개요
5. 백엔드 상세 설계
6. 프론트엔드 상세 설계
7. 배포 아키텍처
8. CI/CD 파이프라인
9. 보안 설정
10. API 설계 원칙

---

## 1. 목적 및 범위

본 문서는 GroupPay의 기술적 아키텍처를 정의한다.
SRS에서 정의한 기능/비기능 요구사항을 만족하기 위한 기술 스택 선정 근거,
시스템 구조, 배포 방식, API 설계 원칙을 포함한다.
API 상세 명세(요청/응답 형식, 에러 코드)와 ERD는 별도 문서에서 정의한다.

---

## 2. 아키텍처 목표 및 제약

SRS의 비기능 요구사항을 아키텍처 관점에서 매핑한다.

| SRS 요구사항            | 아키텍처 목표                                                                 |
| ----------------------- | ----------------------------------------------------------------------------- |
| NFR-03 정산 금액 정확성 | 정산 계산을 서버 사이드에서만 수행, 결과를 settlements 테이블에 저장하여 고정 |
| NFR-04 데이터 정합성    | 정산 확정 시 DB 트랜잭션으로 원자성 보장                                      |
| NFR-07 링크 추측 방지   | UUID v4 사용 (128비트 무작위)                                                 |
| NFR-08 방장 인증        | PIN BCrypt 해시 저장, 인증 성공 시 세션에 방장 권한 부여, IP별 Rate Limiting(분당 5회)으로 브루트포스 방어 |
| NFR-09 관심사 분리      | 3계층 아키텍처 (Presentation - Business - Data) 적용                          |
| NFR-10 테스트 커버리지  | 비즈니스 로직을 Service 계층에 집중, 단위 테스트 용이하게 구성                |
| NFR-11 컨테이너화       | Docker Compose로 전체 스택 단일 명령 실행                                     |
| CON-01 로그인 없음      | UUID 링크로 그룹 접근. 방장 권한은 PIN 인증 후 세션으로 유지                  |

---

## 3. 기술 스택 선정

### 3.1 선정 결과

| 구분           | 기술                        | 버전          |
| -------------- | --------------------------- | ------------- |
| 프론트엔드     | React + TypeScript          | 18.x / 5.x    |
| 백엔드         | Spring Boot                 | 3.x (Java 17) |
| 데이터베이스   | MySQL                       | 8.x           |
| 웹 서버        | Caddy                       | 2.x           |
| 컨테이너       | Docker + Docker Compose     | -             |
| CI/CD          | GitHub Actions              | -             |
| 빌드 도구 (BE) | Gradle                      | -             |
| 빌드 도구 (FE) | Vite                        | -             |
| ORM            | Spring Data JPA + Hibernate | -             |

### 3.2 선정 근거

**React + TypeScript (프론트엔드)**
컴포넌트 기반 구조로 화면을 독립적으로 개발·관리 가능하다.
TypeScript를 통해 API 응답 타입을 명시적으로 정의하여 런타임 오류를 사전에 방지하고,
OPEN/SETTLED 상태 전이 등 도메인 상태를 타입으로 표현할 수 있다.

**Spring Boot (백엔드)**
정산 계산, 상태 전이, 트랜잭션 처리 등 비즈니스 로직 구현에 적합하며,
JPA를 통한 엔티티 관리로 도메인 모델을 코드로 명확히 표현할 수 있다.

**MySQL (데이터베이스)**
트랜잭션 지원으로 정산 확정 시 원자적 처리를 보장하며 (NFR-04),
관계형 모델이 Group-Member-Expense-Settlement 도메인 구조에 자연스럽게 대응한다.

**Caddy (웹 서버)**
Caddyfile 문법이 직관적이고 설정량이 적으며,
HTTPS 인증서를 Let's Encrypt에서 자동 발급·갱신하여 별도 설정이 불필요하다.

**Docker + Docker Compose (인프라)**
프론트엔드, 백엔드, DB를 단일 Compose 파일로 관리하며 환경 일관성을 확보한다.

**GitHub Actions (CI/CD)**
코드 푸시 시 자동 빌드·테스트·배포 파이프라인을 구성하며,
별도 CI 서버 없이 GitHub 저장소와 통합된다.

---

## 4. 시스템 아키텍처 개요

### 4.1 전체 구조

```
┌─────────────────────────────────────────────────┐
│                   사용자 브라우저                   │
│            React SPA (TypeScript)                │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────┐
│                    Caddy                         │
│        (리버스 프록시 + HTTPS 자동 발급)            │
└──────────┬───────────────────────┬──────────────┘
           │ /api/*                │ /*
┌──────────▼──────────┐  ┌────────▼──────────────┐
│  Spring Boot :8080   │  │  React 정적 파일 서빙   │
│  (REST API)         │  │                       │
└──────────┬──────────┘  └───────────────────────┘
           │ JDBC
┌──────────▼──────────┐
│     MySQL :3306      │
│   (내부 네트워크)     │
└─────────────────────┘
```

### 4.2 3계층 아키텍처

| 계층         | 역할                                          | 주요 구성                                |
| ------------ | --------------------------------------------- | ---------------------------------------- |
| Presentation | HTTP 요청/응답 처리, DTO 변환, 공통 응답 래핑 | `*Controller`, `*Request`, `*Response`   |
| Business     | 비즈니스 로직, 상태 전이, 정산 계산, PIN 인증 | `*Service`, `SettlementCalculator`       |
| Data Access  | DB 접근, 쿼리 실행                            | `*Repository` (JPA Interface), `*Entity` |

> 계층 간 의존 방향은 단방향: Presentation → Business → Data Access

### 4.3 권한 구조

| 기능                | 방장 (PIN 인증) | 일반 참여자 |
| ------------------- | --------------- | ----------- |
| 멤버 추가/제거      | ✅              | ❌          |
| 그룹명 수정/삭제    | ✅              | ❌          |
| 정산 확정           | ✅              | ❌          |
| 지출 등록/수정/삭제 | ✅              | ✅          |
| 정산 결과 조회      | ✅              | ✅          |
| 히스토리 조회       | ✅              | ✅          |

---

## 5. 백엔드 상세 설계

### 5.1 패키지 구조

도메인 중심 패키지 구조를 적용한다.
각 도메인 내부에 controller, dto, entity, repository, service 패키지를 둔다.

```
src/main/java/com/grouppay
├── domain
│   ├── group
│   │   ├── controller
│   │   ├── dto
│   │   │   ├── request
│   │   │   └── response
│   │   ├── entity
│   │   ├── repository
│   │   └── service
│   ├── member
│   │   └── ...
│   ├── expense
│   │   └── ...
│   └── settlement
│       └── service
│           └── SettlementCalculator.java  // 핵심 정산 알고리즘 (단위 테스트 대상)
└── global
    ├── api
    │   ├── CommonResponse.java     // 공통 응답 형식
    │   └── code
    │       ├── SuccessCode.java
    │       └── ErrorCode.java
    ├── exception
    └── config
        └── WebConfig.java          // CORS 설정
```

### 5.2 공통 응답 형식

모든 API 응답은 `CommonResponse<T>`로 래핑하여 일관된 형식을 유지한다.

```
{
  success : Boolean   // 성공 여부
  code    : String    // COMMON_200 / COMMON_201 / 에러 코드
  message : String    // 사람이 읽을 수 있는 메시지
  data    : T         // 응답 데이터 (없으면 null)
}
```

성공 코드는 `COMMON_200`(조회/처리), `COMMON_201`(생성)을 사용하며,
에러 코드는 도메인 접두어 + 번호 형식(예: `AUTH_001`, `GROUP_001`)으로 정의한다.
에러 코드 상세는 API 명세서에서 관리한다.

### 5.3 테스트 전략

NFR-10(테스트 커버리지 80% 이상)을 달성하기 위해 계층별 테스트를 작성한다.

| 테스트 종류 | 대상                   | 도구                           |
| ----------- | ---------------------- | ------------------------------ |
| 단위 테스트 | `SettlementCalculator` | JUnit 5 + AssertJ              |
| 단위 테스트 | `*Service`             | JUnit 5 + Mockito              |
| 통합 테스트 | 그룹 플로우 (7개)      | MockMvc + H2 + @SpringBootTest |
| 통합 테스트 | 정산 플로우 (8개)      | MockMvc + H2 + @SpringBootTest |

`SettlementCalculator`는 핵심 비즈니스 로직으로 아래 케이스를 집중 검증한다.

| 테스트 케이스       | 설명                                     |
| ------------------- | ---------------------------------------- |
| 정상 정산           | 다양한 지출 조합에서 최소 송금 결과 검증 |
| 정합성 검증         | 전체 순잔액 합계 = 0 보장                |
| 10원 단위 나머지    | 나머지 발생 시 랜덤 멤버에게 부과 검증   |
| 본인 몫 차감        | 낸 사람이 분담 대상에 포함된 경우        |
| 정산 대상 일부 지정 | 특정 멤버만 분담 대상인 경우             |

### 5.4 핵심 알고리즘 — 정산 계산

```
1. 멤버별 순잔액 계산
   순잔액 = Σ(본인이 낸 지출액) - Σ(expense_shares의 본인 부담액)

2. 정합성 검증
   Σ(전체 순잔액) = 0  →  불일치 시 예외 발생

3. 최소 송금 산출 (그리디 알고리즘)
   - 순잔액 > 0 : 정산 받는 멤버 (내림차순 정렬)
   - 순잔액 < 0 : 정산 하는 멤버 (오름차순 정렬)
   - 가장 많이 받을 사람 ↔ 가장 많이 줄 사람부터 매칭
   - 잔액 소진 시 다음 멤버로 이동

4. 10원 단위 처리 (균등 분담)
   금액 / 인원수 = 몫(10원 단위 내림) + 나머지
   나머지는 분담 대상 멤버 중 랜덤하게 선정된 한 명에게 부과
```

### 5.5 주요 처리 흐름

**정산 확정**

```
1. 방장 권한 확인 → 없으면 거부
2. 그룹 상태 OPEN 확인
3. 지출 1건 이상 확인
4. SettlementCalculator.calculate() 호출
5. Settlement 엔티티 저장 + 그룹 상태 SETTLED 변경
   (4~5 트랜잭션으로 원자적 처리)
```

**그룹 생성**

```
1. 그룹명·PIN·멤버 이름 목록(0개 이상) 형식 검증
2. 멤버 이름 목록 내 중복 검증
3. UUID v4 생성, PIN을 BCrypt 해시
4. 그룹 + 멤버를 단일 트랜잭션으로 원자적 저장 (실패 시 전체 롤백)
5. 생성자 세션에 방장 권한 부여 (PIN 설정 당사자이므로 별도 인증 불필요)
```

> 방장 권한은 두 경로로 획득한다: ① 그룹 생성(생성자) ② PIN 인증(이후 접속자/세션 만료 후 재인증).

**PIN 인증**

```
1. 그룹 조회 (UUID)
2. BCrypt.matches(입력 PIN, 저장된 해시) 검증
3. 일치 → 세션에 방장 권한 플래그 저장
4. 불일치 → 인증 실패 반환
```

---

## 6. 프론트엔드 상세 설계

### 6.1 폴더 구조

역할 중심 구조를 적용한다.
규모가 작은 프로젝트에 적합하며, 같은 역할끼리 모아 파악이 쉽다.

```
src
├── components                    // 재사용 가능한 공통 컴포넌트
│   ├── Button.tsx
│   ├── Avatar.tsx
│   ├── AppHeader.tsx
│   ├── PinAuthSheet.tsx          // 방장 PIN 인증 바텀 시트
│   ├── ConfirmModal.tsx          // 공용 확인 모달
│   ├── SettleConfirmSheet.tsx    // 정산 확정 바텀 시트
│   └── ...
├── pages                         // 라우트 단위 페이지
│   ├── OnboardingPage.tsx        // 서비스 소개
│   ├── CreateGroupPage.tsx       // 그룹명·PIN 입력
│   ├── MemberSetupPage.tsx       // 초기 멤버 등록
│   ├── GroupPage.tsx             // 그룹 메인 (지출 목록, 방장 전환)
│   ├── ExpenseCreatePage.tsx     // 지출 등록·수정 (공용)
│   ├── AccountRegisterPage.tsx   // 계좌 등록·수정
│   ├── SettlementPage.tsx        // 정산 결과 (송금 목록, 계좌 복사)
│   ├── ExpenseHistoryPage.tsx    // 지출 내역 (읽기 전용, SETTLED)
│   └── ...
├── types                         // TypeScript 타입 정의 (도메인별 분리)
│   ├── group.ts
│   ├── expense.ts
│   ├── member.ts
│   ├── settlement.ts
│   └── common.ts
├── constants
│   └── banks.ts                  // 은행 프리셋 목록
├── lib
│   ├── axios.ts                  // Axios 인스턴스 (withCredentials: true)
│   └── format.ts                 // 금액 포맷 유틸
├── styles
│   └── tokens.ts                 // 디자인 토큰 (colors, typography, spacing …)
└── App.tsx                       // 라우팅 정의 (React Router v6)
```

### 6.2 타입 정의 원칙

API 응답 타입을 `types/`에서 명시적으로 정의하여 런타임 오류를 방지한다.
도메인 상태(`GroupStatus` 등)는 union type으로 표현한다.

```typescript
// 예시
type GroupStatus = "OPEN" | "SETTLED";

interface CommonResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
}
```

### 6.3 라우팅 구조

| 경로                                        | 페이지               | 설명                                        |
| ------------------------------------------- | -------------------- | ------------------------------------------- |
| `/`                                         | OnboardingPage       | 서비스 소개 + 그룹 생성하기 버튼            |
| `/groups/new`                               | CreateGroupPage      | 그룹명·PIN 입력                             |
| `/groups/new/members`                       | MemberSetupPage      | 초기 멤버 등록                              |
| `/groups/new/done`                          | GroupCreatedPage     | 그룹 생성 완료 + 링크 공유                  |
| `/groups/:uuid`                             | GroupPage            | 그룹 메인 (지출 목록, 멤버 목록, 방장 전환) |
| `/groups/:uuid/expenses/new`                | ExpenseCreatePage    | 지출 등록                                   |
| `/groups/:uuid/expenses/:expenseId/edit`    | ExpenseCreatePage    | 지출 수정 (생성·수정 공용)                  |
| `/groups/:uuid/expenses`                    | ExpenseHistoryPage   | 지출 내역 읽기 전용 (SETTLED 전용)          |
| `/groups/:uuid/settlement`                  | SettlementPage       | 정산 결과 (송금 목록, 계좌 복사)            |
| `/groups/:uuid/members/:memberId/account`   | AccountRegisterPage  | 계좌 등록·수정                              |

### 6.4 API 통신

Axios 인스턴스를 공통으로 설정하고 `api/` 모듈에서 호출한다.
`withCredentials: true`로 세션 쿠키를 포함하여 방장 인증 상태를 유지한다.

---

## 7. 배포 아키텍처

### 7.1 인프라 구성

AWS EC2 단일 인스턴스에 Docker Compose로 전체 스택을 배포한다.

```
┌─────────────────────────────────────────────┐
│                 AWS EC2                      │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │          Docker Compose              │   │
│  │                                      │   │
│  │  ┌──────────┐    ┌───────────────┐   │   │
│  │  │  Caddy   │    │  spring-app   │   │   │
│  │  │ :80/:443 │───▶│  :8080        │   │   │
│  │  └──────────┘    └───────┬───────┘   │   │
│  │                          │           │   │
│  │                  ┌───────▼───────┐   │   │
│  │                  │    mysql      │   │   │
│  │                  │    :3306      │   │   │
│  │                  └───────────────┘   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

| 컨테이너   | 역할                                                          | 포트           |
| ---------- | ------------------------------------------------------------- | -------------- |
| Caddy      | React 정적 파일 서빙, `/api/*` 리버스 프록시, HTTPS 자동 발급 | 80, 443 (외부) |
| spring-app | REST API 서버                                                 | 8080 (내부)    |
| mysql      | 데이터 저장                                                   | 3306 (내부)    |

> mysql, spring-app 포트는 외부에 노출하지 않고 Docker 내부 네트워크로만 통신

### 7.2 EC2 보안 그룹 설정

| 포트 | 허용 대상 | 용도                            |
| ---- | --------- | ------------------------------- |
| 80   | 0.0.0.0/0 | HTTP (Caddy → HTTPS 리다이렉트) |
| 443  | 0.0.0.0/0 | HTTPS                           |
| 22   | 개발자 IP | SSH 접속                        |

---

## 8. CI/CD 파이프라인

### 8.1 파이프라인 흐름

**PR 생성 시 (ci.yml)**
```
PR (feat/* 또는 fix/* → dev 또는 main)
       │
       ▼
[GitHub Actions — CI]
       │
       ├── 백엔드 테스트 (./gradlew test, H2 인메모리)
       │       └── 실패 시 머지 차단
       │
       └── 프론트엔드 빌드 검증 (tsc && vite build)
               └── 실패 시 머지 차단
```

**main 머지 시 (cd.yml)**
```
main 브랜치 push
       │
       ▼
[GitHub Actions — CD]
       │
       ├── EC2 SSH 접속
       ├── git pull origin main
       ├── .env 생성 (GitHub Secrets 주입)
       └── docker compose up -d --build
```

### 8.2 브랜치 전략

| 브랜치   | 용도             | CI/CD 트리거            |
| -------- | ---------------- | ----------------------- |
| `main`   | 배포 기준 브랜치 | CD (EC2 자동 배포)      |
| `dev`    | 개발 통합 브랜치 | CI (테스트 + 빌드 검증) |
| `feat/*` | 기능 개발 브랜치 | CI (PR 생성 시)         |
| `fix/*`  | 버그/보안 수정   | CI (PR 생성 시)         |

---

## 9. 보안 설정

### 9.1 CORS

허용 출처를 서비스 도메인과 로컬 개발 환경으로 제한한다.

| 환경      | 허용 Origin               |
| --------- | ------------------------- |
| 운영      | `https://grouppay.p-e.kr` |
| 로컬 개발 | `http://localhost:*`      |

`allowCredentials: true`로 세션 쿠키를 포함한 요청을 허용하므로, 와일드카드(`*`) 사용 시 CSRF 위험이 있어 명시적 도메인만 허용한다.

### 9.2 PIN Rate Limiting

`POST /api/v1/groups/{uuid}/auth` 엔드포인트에 IP별 슬라이딩 윈도우 방식의 Rate Limiting을 적용한다.

| 항목      | 값            |
| --------- | ------------- |
| 윈도우    | 1분           |
| 최대 시도 | 5회           |
| 초과 시   | HTTP 429 반환 |

4자리 숫자 PIN의 브루트포스(최대 10,000가지) 공격을 방어한다.

### 9.3 세션

- 타임아웃: 1시간 (`server.servlet.session.timeout=3600`)
- 저장 방식: 서버 인메모리 (`spring.session.store-type=none`)
- 방장 권한 키: `HOST_{uuid}` 형식으로 세션에 저장

### 9.4 로깅

| 레벨  | 대상                                                        |
| ----- | ----------------------------------------------------------- |
| INFO  | 그룹 생성/삭제, 정산 확정, PIN 인증 성공                    |
| WARN  | PIN 인증 실패, 횟수 초과, 미인증 접근, 타 그룹 멤버 접근 시도 |
| ERROR | 순잔액 정합성 오류, 미처리 예외                             |

---

## 10. API 설계 원칙

상세 명세(요청/응답 형식, 파라미터, 에러 코드)는 별도 API 명세서에서 정의한다.

### 10.1 설계 원칙

- Base URL: `/api/v1`
- 요청/응답 형식: `application/json`
- 그룹 식별: UUID (경로 파라미터)
- 모든 응답은 `CommonResponse<T>` 형식으로 래핑
- 성공 코드: `COMMON_200`(조회/처리), `COMMON_201`(생성)
- 에러 코드: 도메인 접두어 + 번호 형식
- 방장 전용 기능: 세션에 방장 권한 없으면 인증 에러 반환

### 10.2 엔드포인트 목록

**그룹**

| 메서드 | URL                            | 설명          | 권한   | FR    |
| ------ | ------------------------------ | ------------- | ------ | ----- |
| POST   | `/api/v1/groups`               | 그룹 생성(멤버 동반) | 누구나 | FR-01, FR-06 |
| GET    | `/api/v1/groups/{uuid}`        | 그룹 조회     | 누구나 | FR-04 |
| PATCH  | `/api/v1/groups/{uuid}`        | 그룹명 수정   | 방장   | FR-02 |
| DELETE | `/api/v1/groups/{uuid}`        | 그룹 삭제     | 방장   | FR-03 |
| POST   | `/api/v1/groups/{uuid}/auth`   | 방장 PIN 인증 | 누구나 | FR-05 |
| POST   | `/api/v1/groups/{uuid}/settle` | 정산 확정     | 방장   | FR-18 |

**멤버**

| 메서드 | URL                                        | 설명           | 권한   | FR    |
| ------ | ------------------------------------------ | -------------- | ------ | ----- |
| POST   | `/api/v1/groups/{uuid}/members`            | 멤버 추가            | 방장   | FR-06 |
| GET    | `/api/v1/groups/{uuid}/members/{memberId}` | 멤버 단건 조회(계좌) | 누구나 | FR-07 |
| PATCH  | `/api/v1/groups/{uuid}/members/{memberId}` | 계좌 등록/수정       | 누구나 | FR-07 |
| DELETE | `/api/v1/groups/{uuid}/members/{memberId}` | 멤버 제거            | 방장   | FR-08 |

**지출**

| 메서드 | URL                                          | 설명           | 권한   | FR    |
| ------ | -------------------------------------------- | -------------- | ------ | ----- |
| POST   | `/api/v1/groups/{uuid}/expenses`             | 지출 등록      | 누구나 | FR-10 |
| GET    | `/api/v1/groups/{uuid}/expenses`             | 지출 목록 조회 | 누구나 | FR-22 |
| PATCH  | `/api/v1/groups/{uuid}/expenses/{expenseId}` | 지출 수정      | 누구나 | FR-12 |
| DELETE | `/api/v1/groups/{uuid}/expenses/{expenseId}` | 지출 삭제      | 누구나 | FR-13 |

**정산**

| 메서드 | URL                                | 설명           | 권한   | FR    |
| ------ | ---------------------------------- | -------------- | ------ | ----- |
| GET    | `/api/v1/groups/{uuid}/settlement` | 정산 결과 조회 | 누구나 | FR-21 |

---

_본 문서는 설계 단계의 산출물이며, 구현 중 설계 변경 발생 시 변경 이력을 기록하여 SRS와의 추적성을 유지한다._
