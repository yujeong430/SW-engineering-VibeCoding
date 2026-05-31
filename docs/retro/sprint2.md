# Retro Note — Sprint 2: 프론트엔드 구현 (2026-06-05)

## 구현 완료

- React + TypeScript + Vite 초기 설정 (Axios 인스턴스, 디자인 토큰, React Router v6)
- 온보딩 → 그룹 생성(CreateGroupPage) → 멤버 설정(MemberSetupPage) → 완료(GroupCreatedPage) 플로우
- GroupPage — 그룹 메인 (지출 목록, 멤버 관리, 방장 전환, ConfirmModal 그룹 삭제)
- ExpenseCreatePage — 지출 등록·수정 공용화 (`expenseId` param 분기, 수정 시 그룹 조회 응답으로 프리필)
- AccountRegisterPage — 계좌 등록·수정 (`from` state: expense / group / settlement 진입 경로 분기)
- SettlementPage — 정산 결과 (송금 목록, 클립보드 계좌 복사, 멤버별 순잔액)
- ExpenseHistoryPage — 지출 내역 읽기 전용 (SETTLED 전용)
- 공용 컴포넌트: Button, Avatar, AppHeader, Select(커스텀), PinAuthSheet, ConfirmModal, SettleConfirmSheet
- 백엔드 버그 3건 수정 (isHost 직렬화, FK CASCADE, ExpenseShare UK 중복)
- 그룹 생성 API 스펙 변경: members[] 포함 원자적 생성 + 생성자 세션 자동 부여
- 멤버 단건 조회 API 추가 (`GET /groups/{uuid}/members/{memberId}`, 계좌 프리필 전용)
- docs 업데이트 (api.md, architecture.md, sequence_diagram.md, usecase.md)

---

## 배운 점 / 잘한 것

- **계획 모드 도입**: 스프린트 중반부터 구현 전에 파일 목록·결정 사항·플로우를 문서화하고 승인 후 구현하는 방식으로 전환. 불필요한 재작업이 줄어들었음
- **`from` state 패턴**: 계좌 등록 화면이 지출 등록 후·그룹 화면·정산 결과 세 경로에서 진입되는 상황을 navigation state로 분기 처리. 단일 페이지로 여러 컨텍스트 대응
- **ExpenseCreatePage 공용화**: 생성·수정 모드를 `expenseId` param 하나로 분기해 코드 중복 없이 처리. 수정 시 별도 GET 없이 그룹 조회 응답 재사용
- **도메인별 타입 분리**: `types/group.ts`, `types/expense.ts`, `types/settlement.ts` 등으로 분리해 의존성이 명확해짐

---

## 대화 중 고친 점 (주요 결정)

| 결정               | 변경 전                                       | 변경 후                                                     | 이유                                                                 |
| ------------------ | --------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| 그룹 생성 플로우   | 그룹 생성 후 멤버 개별 추가                   | MemberSetupPage 추가 + 단일 POST로 그룹·멤버 원자적 생성    | 서비스 특성상 방장이 초기 멤버를 직접 등록하는 것이 자연스러움       |
| 멤버 관리 UI       | 항상 ＋ 추가 버튼 노출                        | 멤버 관리 모드 진입 후에만 노출                             | 일반 뷰에서는 멤버 탭이 계좌 진입점이므로 편집 버튼과 역할 충돌 방지 |
| 은행 선택 컴포넌트 | native `<select>` 태그                        | Custom Select 컴포넌트 (ChevronDown, 외부 클릭 닫기)        | 디자인 토큰 적용 불가, 플랫폼별 스타일 불일치                        |
| 계좌 등록 진입점   | 지출 등록 후 단일 경로                        | 정산 결과 화면에서도 미등록 수취자에게 "계좌 등록하기" 제공 | 정산 완료 후 계좌 추가가 필요한 실사용 시나리오 반영                 |
| 온보딩 액션        | "새 그룹 만들기" + "초대 링크로 참여하기" 2개 | "새 그룹 만들기" 1개                                        | 참여는 링크 클릭만으로 이루어지므로 별도 버튼이 불필요               |
| 타입 파일 구조     | `types.ts` 단일 파일                          | 도메인별 분리                                               | 파일이 커질수록 의존 관계가 불분명해지며 실무 관행과 불일치          |
| isHost 직렬화      | Lombok 기본 동작 (`isHost()` → `"host"`)      | `@JsonProperty("isHost")` 명시                              | Jackson이 boolean getter `isXxx()`를 `xxx`로 직렬화하는 사양         |
| 그룹 삭제 CASCADE  | JPA 레벨 cascade 미설정                       | `@OnDelete(action = CASCADE)` + `ddl-auto: create`          | DB 레벨 CASCADE DDL 반영을 위해 스키마 재생성 필요                   |
| 지출 수정 UK 오류  | 기존 분담 삭제 후 즉시 INSERT                 | `deleteByExpense` 후 `flush()` 호출                         | JPA write-behind로 DELETE가 INSERT보다 늦게 실행되어 UK 제약 위반    |

---

## 실수 / 주의할 것

- **브랜치를 사전에 만들지 않음**: `dev`에서 작업하다 뒤늦게 feature 브랜치로 이동하려다 stash conflict 발생. `git stash drop`으로 수정 파일 3개 유실, 수동 복구 필요. Sprint 1에서도 같은 지적이 있었으나 반복됨
- **디자인 파일 없이 UI 구현 시작**: AI는 "그럴싸한" UI를 생성하지만 실제 디자인 의도와 다를 수 있음. 화면 캡처 없이 시작하면 대규모 재작업으로 이어짐
- **플로우 미정의 상태에서 구현 시작**: 화면 전환 경로, navigation state 구조, 버튼 배치 등이 구현 도중 바뀌면서 중간 수정이 반복됨. 채팅 토큰 낭비의 주요 원인
- **계획 모드 도입이 늦었음**: 스프린트 초반부터 적용했다면 재작업 대부분을 예방할 수 있었음
- **docs와 실제 구현 간 누락 추적**: 구현 변경사항에 대한 문서 동기화를 별도 체크리스트로 관리할 필요가 있음

---

## Sprint 3에서 더 잘하려면

- **브랜치 먼저, 코드 나중**: `git checkout -b feat/xxx`를 첫 번째 행동으로 고정. 이번 스프린트에서만 두 차례 같은 실수
- **디자인 캡처 먼저 공유**: 화면 구현 요청 시 디자인 파일을 채팅 첫 메시지에 첨부하고 시작. 구현 후 "이거 달라"는 피드백은 토큰·시간 모두 낭비
- **전체 화면 플로우를 표로 정리 후 승인**: route 경로, navigation state, 진입·복귀 경로를 한 장의 표로 정리하고 승인 후 구현. 중간에 "이 버튼 어디로 가야 해?" 류의 수정이 사라짐
- **계획 모드를 기본값으로**: 2개 이상 파일에 걸치는 작업은 무조건 계획 모드로 시작하고, 계획 검토 후 승인 받아 구현
- **문서 동기화 체크리스트 도입**: 구현 완료 후 docs/ 파일과 실제 코드 사이의 차이를 확인하는 단계를 스프린트 마무리에 고정

---

## 앞으로의 계획

### Sprint 3 — 품질 관리 & 배포

- MockMvc 통합 테스트 (세션 흐름, 정산 API)
- GitHub Actions CI (PR 시 자동 빌드·테스트)
- Docker Compose (backend + mysql + caddy)
- EC2 배포

### Sprint 4 — 보고서

- lessons learned 정리
- SW 산출물 캡처 (API, UI, 테스트 결과)
- PDF 보고서 작성
