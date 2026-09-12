# 작애의 방 · Jakae’s Room

Next.js + React Three Fiber로 구현한 3D 방과 2.5D 캐릭터입니다.

## 실행

Node.js 22 사용. `web` 폴더에서 `npm ci`, `npm run dev`를 실행합니다.
프로덕션 빌드: `npm run build`.

## Vercel

GitHub 저장소를 연결하고 **Root Directory를 `web`**, Framework를 **Next.js**로 설정합니다.
별도 환경 변수는 필요하지 않습니다. 시간대는 KST로 자동 전환됩니다.
BGM은 화면의 BGM 버튼을 눌러 켭니다.

PNG 원본은 `jakae_sprite/png`, 웹용 자산은 `web/public`에 포함합니다.
Blender 작업 파일과 개발 캐시는 이 저장소에서 제외합니다.
