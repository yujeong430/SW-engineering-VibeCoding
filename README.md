# GroupPay — 그룹 지출 정산 서비스

> 여행, 모임 등 그룹 활동의 지출을 등록하고 최소 송금 횟수로 정산하는 웹 서비스

🔗 **[grouppay.p-e.kr](https://grouppay.p-e.kr)**

---

## 주요 기능

- 그룹 생성 및 UUID 링크 공유
- 지출 등록 / 수정 / 삭제 (결제자 + 분담 멤버 지정)
- 10원 단위 균등 분담 자동 계산
- 그리디 알고리즘 기반 최소 송금 횟수 정산
- 계좌번호 등록 및 클립보드 복사
- PIN 기반 방장 인증 (BCrypt 해시 + IP별 Rate Limiting)

---

## 기술 스택

| 구분       | 기술                         |
| ---------- | ---------------------------- |
| Frontend   | React 18 + TypeScript + Vite |
| Backend    | Spring Boot 3.x (Java 17)    |
| Database   | MySQL 8.0                    |
| Web Server | Caddy 2 (HTTPS 자동 발급)    |
| Infra      | Docker Compose + AWS EC2     |
| CI/CD      | GitHub Actions               |

---

## 프로젝트 구조

```
├── backend/        # Spring Boot REST API
├── frontend/       # React SPA
├── docs/           # 설계 문서 (SRS, SAD, API 명세 등)
├── docker-compose.yml
└── .github/workflows/
    ├── ci.yml      # PR 시 테스트 + 빌드 검증
    └── cd.yml      # main 머지 시 EC2 자동 배포
```

---

## 로컬 실행

**백엔드**

```bash
cd backend
./gradlew bootRun
```

**프론트엔드**

```bash
cd frontend
npm install
npm run dev
```

---

## CI/CD

| 트리거    | 동작                                           |
| --------- | ---------------------------------------------- |
| PR 생성   | 백엔드 테스트 + 프론트엔드 빌드 검증 자동 실행 |
| main 머지 | EC2 자동 배포 (`docker compose up -d --build`) |

환경변수는 `.env.example` 참고.

---

## 문서

| 문서                                    | 설명                           |
| --------------------------------------- | ------------------------------ |
| [requirements.md](docs/requirements.md) | 소프트웨어 요구사항 명세 (SRS) |
| [architecture.md](docs/architecture.md) | 아키텍처 설계서 (SAD)          |
| [api.md](docs/api.md)                   | API 명세서                     |
| [usecase.md](docs/usecase.md)           | 유스케이스 명세                |
| [erd.md](docs/erd.md)                   | ERD                            |
