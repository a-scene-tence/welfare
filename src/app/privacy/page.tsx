export const metadata = { title: "개인정보 처리방침 — 복지매칭" };

export default function PrivacyPage() {
  return (
    <article className="prose-welfare space-y-3 text-sm leading-7">
      <h1 className="text-xl font-bold">개인정보 처리방침</h1>
      <p>
        본 서비스는 정부 공식 채널이 아닌, 일반 대중을 위한 복지 안내 도구입니다. 사용자의
        개인정보를 최소한으로 처리하기 위해 다음과 같이 수집·이용합니다.
      </p>

      <h2>1. 처리 항목</h2>
      <ul>
        <li>
          <strong>입력값(거주지·나이·가구소득·결혼/배우자 정보·자녀·자유 텍스트)</strong>: 응답
          생성을 위해 메모리에서만 처리되며 응답 전송 후 폐기됩니다. 서버 디스크·DB 에
          저장되지 않습니다.
        </li>
        <li>
          <strong>운영 메트릭(필수)</strong>: 세션 ID(임의 UUID), 시·도 코드, 응답 소요 시간,
          토큰 수, 에러 유형. 개인을 식별할 수 없는 정보만 익명 메트릭 테이블
          (welfare_metric) 에 저장합니다.
        </li>
        <li>
          <strong>비식별 대화 이력(선택)</strong>: 사용자가 명시적으로 동의한 경우에 한해,
          마스킹된 프로필 + 응답 본문이 welfare_consent_log 테이블에 저장됩니다.
          <ul>
            <li>소득은 100만원 단위 버킷으로 축약</li>
            <li>시·군·구는 시·도 단위로 축약</li>
            <li>자유 텍스트의 전화·이메일·주민번호·계좌·카드·이름 후보 패턴은 자동 마스킹</li>
            <li>응답 본문도 동일 패턴으로 마스킹 후 저장</li>
            <li>30일 후 자동 삭제 (pg_cron 활성 시)</li>
          </ul>
        </li>
      </ul>

      <h2>2. 보유 및 파기</h2>
      <ul>
        <li>운영 메트릭: 운영 정책상 90일 후 수동 정리.</li>
        <li>비식별 대화 이력(동의자만): 30일 후 자동 삭제.</li>
        <li>
          저장 인프라: Supabase (PostgreSQL). 행 단위 보안(RLS) 활성으로 anon/authenticated
          키로는 접근 불가. 서비스의 server-only role 키만 RLS 를 우회합니다.
        </li>
      </ul>

      <h2>3. 이용 목적</h2>
      <ul>
        <li>맞춤 복지 안내 응답 생성</li>
        <li>서비스 품질 모니터링·오류 진단·정책 변경 반영</li>
        <li>회귀 가능성 사전 탐지 (응답 길이 분포·tier 검증 통과율 등)</li>
      </ul>

      <h2>4. 제3자 제공·국외 이전</h2>
      <p>
        응답 생성을 위해 사용자가 입력한 프로필 요약과 질문은 LLM 공급자
        (설정에 따라 Anthropic·OpenAI·Google·Upstage) 와 외부 검색 공급자 (Tavily) 서버로
        전송됩니다. 식별 가능한 개인정보(이름·전화·주민번호·계좌 등)를 자유 텍스트에 입력하지
        않도록 권고합니다.
      </p>
      <ul>
        <li>
          <strong>Upstage Solar (한국 기업)</strong>: 한국 내 서버에서 처리. 기본 공급자.
        </li>
        <li>
          <strong>Anthropic / OpenAI / Google</strong>: 환경 변수 설정 시. 데이터 학습 미사용
          정책 가입 권장.
        </li>
        <li>
          <strong>Tavily (외부 웹 검색)</strong>: 사용자 입력에서 추출된 한국어 검색 쿼리만
          전송 (개인정보 미포함).
        </li>
      </ul>

      <h2>5. 사용자 권리</h2>
      <p>다음 권리를 행사할 수 있습니다:</p>
      <ul>
        <li>
          <strong>사용 거부</strong>: 면책 사항 동의 체크 없이는 응답 생성 자체가 거부됩니다.
        </li>
        <li>
          <strong>비식별 로그 동의 철회</strong>: 입력 폼의 「비식별 로그에 동의」 체크박스를
          해제하면 다음 요청부터 welfare_consent_log 저장 중단. 이미 저장된 행은 30일 자동
          삭제 또는 아래 절차로 즉시 삭제 요청 가능.
        </li>
        <li>
          <strong>즉시 삭제 요청</strong>: 응답 페이지의 session ID (UUID) 와 함께 GitHub
          이슈로 삭제 요청. 운영자가 24시간 이내 처리.
        </li>
        <li>
          <strong>세션 종료</strong>: 브라우저 닫기 시 sessionStorage 의 입력값은 자동
          삭제됩니다.
        </li>
      </ul>

      <h2>6. 문의 및 신고</h2>
      <ul>
        <li>
          서비스 운영 / 정책 관련: GitHub 저장소{" "}
          <a
            href="https://github.com/a-scene-tence/welfare/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            issues
          </a>
          .
        </li>
        <li>
          복지 정보 신뢰성·신청 절차: <strong>보건복지상담센터 (국번없이 129)</strong> 또는
          거주지 행정복지센터.
        </li>
      </ul>
    </article>
  );
}
