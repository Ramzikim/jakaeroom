# Google 로그인 / 프로필 설정

Supabase Auth (Google OAuth, PKCE) + Supabase Postgres를 사용합니다. 방은 인증 없이 열립니다.
브라우저 SDK가 세션을 복구·갱신하고, 서버는 매 프로필 요청에서 `auth.getUser(accessToken)`으로 검증합니다.

## 환경 변수

`web/.env.local`과 Vercel 프로젝트 환경 변수에 설정합니다. 비밀 값을 Git에 커밋하지 마세요.

| 이름 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개 publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 service role key. 클라이언트에 전달 금지 |
| `VIP_DAD_USER_ID` | 아빠 계정의 Supabase Auth UUID |
| `VIP_OWNER_USER_ID` | 규원 계정의 Supabase Auth UUID |
| `VIP_JANGMI_USER_ID` | 장미 계정의 Supabase Auth UUID |

VIP 세 값은 선택 사항이며 서로 다른 사용자 UUID 하나씩만 지정합니다. 미설정 사용자는 일반 등급입니다.
클라이언트가 보내는 userId, vocative, relationshipTier는 저장 입력에서 무시됩니다.

## 설정 순서

1. Supabase 프로젝트 SQL Editor에서 `supabase/profile.sql`을 실행합니다. 프로필 테이블은 RLS를 켜고 anon/authenticated 직접 접근을 차단합니다.
2. Google Cloud에서 웹 애플리케이션 OAuth Client를 만듭니다. Redirect URI는 Supabase Google Provider 화면의 `https://<project-ref>.supabase.co/auth/v1/callback`을 등록합니다.
3. Supabase Authentication → Providers → Google에 Google Client ID/Secret을 입력합니다. 이 두 값은 Supabase에만 저장하며 웹 환경 변수로 넣지 않습니다. 테스트 모드에서는 허용한 테스트 계정으로 로그인합니다.
4. Supabase URL Configuration에 배포 주소를 Site URL로, `http://127.0.0.1:3000/`, `http://localhost:3000/`, 실제 배포 주소 `/`를 Redirect URLs로 등록합니다. 불필요한 wildcard는 추가하지 않습니다.
5. 위 환경 변수 세 개를 설정하고 앱을 재시작/재배포합니다. VIP는 해당 계정의 첫 로그인 후 Supabase Users에서 UUID를 확인해 설정합니다.

## 저장과 검증

- 로그인 사용자: `public.profiles`, 기본키 `userId`는 `auth.users.id`를 참조합니다. 다른 계정의 프로필을 지정해 읽거나 수정할 수 없습니다.
- 게스트: 브라우저 localStorage의 `jakae-guest-profile-v1`. 로그인 시 계정 프로필이 없는 경우에만 복사합니다. 기존 계정 프로필은 덮어쓰지 않습니다.
- 호칭은 KST 연도로 계산하고 서버 조회/저장 시 갱신합니다. VIP는 서버 환경 설정이 항상 우선합니다.
- 미설정 상태에서도 게스트 입장·저장·편집·대사 치환이 됩니다. Google 버튼은 설정 안내를 표시합니다.
- 테스트: `node tests/profile.test.ts` 및 기존 `npm test`. 인증 설정 후 Google 로그인 → 새로고침 → 프로필 편집 → 로그아웃 → 재로그인 및 세 VIP 계정 분류를 실제 계정으로 확인합니다.
- 미래 데이터는 `profiles.userId`를 참조하는 별도 테이블로 확장합니다. 컬렉션·선물 등은 구현하지 않았습니다.

공식 설정 문서: [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google).
