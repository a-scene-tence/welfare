# Codespaces 개발 환경

iPad·브라우저에서 바로 로컬 개발이 가능한 GitHub Codespaces 설정.

## 빠른 시작 (5분)

### 1. Codespaces 시크릿 등록 (한 번만)

GitHub에서 다음 경로로 이동:

```
https://github.com/settings/codespaces
```

**Codespaces secrets** 섹션에서 **New secret** 클릭. 다음 5개를 차례로 등록 (Repository access는 모두 `a-scene-tence/welfare` 선택):

| Name | Value |
|---|---|
| `UPSTAGE_API_KEY` | 회전된 새 Upstage 키 |
| `UPSTAGE_MODEL` | `solar-pro2` |
| `TAVILY_API_KEY` | 회전된 새 Tavily 키 |
| `SUPABASE_URL` | `https://ugecduimijpujnbjukuk.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | 회전된 새 Supabase secret 키 |

> 시크릿은 GitHub가 암호화해 보관하며, Codespace에서 환경변수로 자동 주입됩니다.
> 코드/git history 어디에도 노출되지 않습니다.

### 2. Codespace 생성·실행

저장소 페이지 → **Code** 버튼 → **Codespaces** 탭 → **Create codespace on claude/welfare-benefits-agent-RyIee**.

처음 생성 시 약 1~2분 소요 (의존성 자동 설치). 이후 재실행 시 빠릅니다.

### 3. 개발 서버 실행

Codespace 내 터미널(View → Terminal 또는 `Ctrl+\``)에서:

```bash
pnpm dev
```

VS Code가 자동으로 포트 3000 안내 알림을 띄움 → **Open in Browser** 클릭 → iPad 브라우저에서 바로 확인.

또는 우측 하단 PORTS 탭 → 3000번 행의 지구본 아이콘 클릭.

### 4. Supabase 스키마 적용 (한 번만)

브라우저 다른 탭에서:

1. https://supabase.com → welfare 프로젝트 → SQL Editor → New query
2. 좌측 파일 탐색기에서 `db/schema.sql` 열기 → 전체 복사
3. SQL Editor에 붙여넣기 → **Run**
4. Table Editor에서 `welfare_metric`, `welfare_consent_log` 두 테이블 확인

## 자주 쓰는 명령

```bash
pnpm dev        # 개발 서버 (http://localhost:3000)
pnpm typecheck  # TypeScript 타입 검사
pnpm build      # 프로덕션 빌드
pnpm lint       # ESLint
```

## 시크릿 변경

키 회전 후:
1. https://github.com/settings/codespaces → 해당 시크릿 우측 **Update**
2. 실행 중인 Codespace는 **Rebuild Container** (Cmd/Ctrl+Shift+P → "Rebuild Container") 또는 재시작

## 비용·요금

- 개인 계정: 월 **120 core-hour 무료** (Codespaces 4-core 기준 약 30시간)
- 미사용 시 자동 정지 (기본 30분)
- 30일 미사용 시 자동 삭제 (코드는 GitHub에 안전, 환경만 삭제)

## Vercel 배포 시 (선택)

Codespaces에서 검증 완료 후 Vercel로 배포하려면:

1. https://vercel.com → New Project → Import `a-scene-tence/welfare`
2. Settings → Environment Variables → 위 5개 동일하게 추가
3. Settings → Functions → Region `Singapore (sin1)` 또는 `Seoul (icn1)`
4. Deploy
