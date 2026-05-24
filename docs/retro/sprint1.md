# Retro Note — Sprint 1: 백엔드 구현 (2026-05-24)

## 구현 완료
- Spring Boot 초기 설정 (공통 응답, 예외 처리, Security, CORS)
- 전체 엔티티 (Group, Member, Expense, ExpenseShare, Settlement, SettlementTransfer + BaseEntity)
- 그룹 CRUD API + PIN 인증 + 세션 기반 방장 권한
- 멤버 추가/제거/계좌 등록 API
- 지출 등록/수정/삭제/목록 조회 API (FR-22 히스토리 커버)
- 정산 확정 + 결과 조회 API (SettlementCalculator 그리디 알고리즘)
- 각 도메인 단위 테스트 (GroupService, AuthService, MemberService, ExpenseService, SettlementCalculator)

---

## 배운 점 / 잘한 것

- **문서 먼저, 코드 나중**: SRS → 유스케이스 → ERD → API 명세 → 아키텍처 순으로 설계를 완성하고 구현에 진입하니 구현 중 결정해야 할 사항이 거의 없었음
- **기능 단위 브랜치**: feat/group, feat/auth, feat/member, feat/expense, feat/settlement로 나누니 형상관리 이력이 자연스럽게 쌓임
- **CLAUDE.md 최소화**: docs/ 참조 포인터만 두고 상세 내용은 문서에 위임 → 매 대화마다 전체 문서를 읽지 않아도 되어 컨텍스트 낭비 감소
- **SettlementCalculator 분리**: 핵심 알고리즘을 별도 클래스로 분리해 단위 테스트 집중 가능

---

## 대화 중 고친 점 (주요 결정)

| 결정 | 변경 전 | 변경 후 | 이유 |
|------|---------|---------|------|
| 연관관계 방향 | 양방향 (@OneToMany 양쪽) | 단방향 (@ManyToOne만) | N+1 예방, 명시적 쿼리 구조, 성능 고려 |
| CLAUDE.md 내용 | 비즈니스 규칙 전체 포함 | 포인터 + 기술 스택만 | 토큰 절약, docs 중복 제거 |
| GlobalExceptionHandler | 3개 핸들러만 | Spring 예외 전체 커버 (JSON 파싱, 타입 불일치 등) | 실제 발생하는 400/405 케이스 누락 방지 |
| 브랜치 전략 | 레이어 단위 (feat/create-entity) | 기능 단위 (feat/group, feat/member ...) | 프로세스에 맞는 형상관리 |
| 테스트 케이스 | 기본 케이스만 작성 | 엣지 케이스 직접 검토 후 추가 (일부 멤버만 분담, 2명 최소 케이스, 순잔액 0인 멤버, 10원 나머지 처리) | AI가 놓친 케이스를 사람이 직접 발견 → 총 10개로 보강 |

---

## 실수 / 주의할 것

- `groups`는 MySQL 예약어 → `@Table(name = "\`groups\`")` 백틱 처리 필요
- `SettlementTransfer.java` 파일 생성 시 내용 오류 → AI 생성 파일은 바로 확인할 것
- main 브랜치에서 작업 시작 → **항상 브랜치 먼저 만들고 작업 시작할 것**
- `MEMBER_NOT_FOUND`, `EXPENSE_NOT_FOUND` 에러 코드를 구현 중에 추가 → 설계 시 미리 정의했으면 더 좋았을 것

---

## Sprint 2에서 더 잘하려면

- **브랜치를 먼저 만들고 작업 시작**: 이번에 main에서 작업하다가 뒤늦게 브랜치로 옮기는 일이 있었음. 다음엔 작업 전 브랜치 생성을 습관화할 것
- **AI 생성 파일은 즉시 확인**: 파일이 잘못 생성되는 경우가 있었음. 생성 직후 내용을 눈으로 확인하는 습관 필요
- **에러 코드는 설계 단계에서 완성**: 구현 중 에러 코드를 추가하면 ErrorCode 파일을 계속 수정해야 함. API 명세서에 에러 코드가 이미 있으니 설계 시점에 전부 정의할 것
- **테스트 케이스는 AI 초안 후 직접 검토**: AI가 기본 케이스는 잘 작성하지만 엣지 케이스는 놓치는 경우가 있음. 작성 후 "더 없어?" 검토를 습관화할 것
- **컴포넌트 단위로 바로바로 확인**: 백엔드에서 포스트맨 테스트를 하면서 진행했듯, 프론트도 기능 단위로 즉시 확인하면서 진행할 것

---

## 앞으로의 계획

### Sprint 2 — 프론트엔드 구현
- `feat/frontend-setup`: React + TypeScript + Vite 초기 설정, axios 인스턴스, 라우터
- `feat/frontend-group`: 온보딩 페이지, 그룹 생성, 그룹 조회 페이지
- `feat/frontend-member`: 멤버 추가/제거, 계좌 등록
- `feat/frontend-expense`: 지출 등록/수정/삭제, 목록 조회
- `feat/frontend-settlement`: 정산 확정, 결과 조회, 계좌 복사 (FR-09)

### Sprint 3 — 품질 관리 & 배포
- 통합 테스트 작성 (MockMvc, 프론트 연동 후)
- GitHub Actions CI 구성 (PR 시 자동 테스트)
- Docker Compose 구성 (backend + mysql + caddy)
- EC2 배포

### Sprint 4 — 보고서
- lessons learned 정리
- SW 산출물 캡처 (API, UI, 테스트 결과)
- PDF 보고서 작성
