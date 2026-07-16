# 스마트전장개발팀 주간업무 보고 사이트

## 포함 기능

- 팀원 8명 주간업무 작성
- 임시저장 / 최종 제출
- 개인 비밀번호 확인
- 팀장님 주차별 제출 현황 조회
- 전체 내용 복사
- CSV 다운로드
- 매주 수요일 17:00 미제출자 이메일 알림
- 팀장님에게 미제출자 명단 이메일 발송

## 팀원

김동욱, 서민진, 정유석, 장동호, 이다연, 장래홍, 조예은, 김형섭

## 1. Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `schema.sql` 전체를 실행합니다.
3. `schema.sql` 마지막의 아래 명령을 실제 관리자 비밀번호로 바꿔 실행합니다.

```sql
alter database postgres set app.admin_password = '실제관리자비밀번호';
```

4. `team_members` 테이블에서 각 팀원의 `email`을 입력합니다.
5. 기본 개인 비밀번호는 아래와 같습니다. 반드시 변경을 권장합니다.

- 김동욱: 1001
- 서민진: 1002
- 정유석: 1003
- 장동호: 1004
- 이다연: 1005
- 장래홍: 1006
- 조예은: 1007
- 김형섭: 1008

개인 비밀번호 변경 예시:

```sql
update public.team_members
set pin_hash = crypt('새비밀번호', gen_salt('bf'))
where employee_name = '서민진';
```

## 2. 프런트엔드 설정

`config.js`에서 아래 항목을 수정합니다.

```javascript
window.APP_CONFIG = {
  SUPABASE_URL: "https://프로젝트주소.supabase.co",
  SUPABASE_ANON_KEY: "anon key",
  ADMIN_PASSWORD: "관리자비밀번호"
};
```

주의: 정적 사이트 특성상 `config.js`의 관리자 비밀번호는 브라우저에서 확인될 수 있습니다.
실제 보안은 Supabase 함수 내부의 `app.admin_password` 검증이 담당하지만,
사내에서만 사용할 경우에도 관리자 조회는 VPN/사내망 또는 Supabase Auth 방식으로 확장하는 것이 더 안전합니다.

## 3. GitHub Pages 배포

1. 새 GitHub Repository를 생성합니다.
2. 이 폴더의 파일을 모두 업로드합니다.
3. GitHub Repository의 `Settings → Pages`로 이동합니다.
4. `Deploy from a branch`를 선택합니다.
5. `main / root`를 선택해 저장합니다.

## 4. 이메일 알림 설정

알림은 Resend를 이용합니다.

GitHub Repository의 `Settings → Secrets and variables → Actions`에 아래 Secret을 등록합니다.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TEAM_LEADER_EMAIL`

`RESEND_FROM_EMAIL` 예시:

```text
Weekly Report <report@인증한도메인.com>
```

GitHub Actions는 매주 수요일 17:00 KST에 실행됩니다.

수동 테스트는 `Actions → Weekly report reminder → Run workflow`에서 가능합니다.

## 5. 주의사항

- `SUPABASE_SERVICE_ROLE_KEY`는 절대 `config.js`에 넣으면 안 됩니다.
- 팀원 이메일이 비어 있으면 해당 팀원에게는 메일이 발송되지 않습니다.
- GitHub Pages 주소를 사내 구성원에게 공유해 사용합니다.
