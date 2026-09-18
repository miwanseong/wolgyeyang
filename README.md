# 월계향 · 심야 AI 방송국

검은 머리와 공허한 하얀 눈을 가진 여성 AI VTuber. 차분한 심야 진행자 페르소나로 채팅에 반응하고, 조용할 때 짧은 창작 괴담·음색·일상 이야기를 꺼내는 로컬 방송 프로그램입니다.

기존 Node.js MVP를 확장했습니다. 구조도의 Django 역할은 현재 Express 서버가 담당합니다. 루트의 기존 웹사이트/Firebase 파일은 그대로 두고, 방송 운영 화면은 `public/`에서 제공합니다.

## Windows에서 먼저 실행

Node.js **22 이상**을 설치한 뒤 저장소 폴더의 `start-windows.cmd`를 실행하세요. 또는 PowerShell:

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

기존 `.env`가 있으면 덮어쓰지 말고 `.env.example`의 새 항목을 추가하세요.
브라우저에서 **http://localhost:3000** → **① 이 창에서 음성 활성화** → **② 진행 시작** → 테스트 채팅.

기본 `APP_MODE=demo`는 API 키와 결제 없이 실행됩니다. 정해진 예시 대사와 설치된 브라우저 한국어 음성을 사용하며, 실제 AI 답변/확정 캐릭터 음성이 아닙니다. 한국어 음성이 없는 PC에서는 브라우저/OS 음성을 설치하거나 실제 TTS로 전환하세요. 음성 권한 오류는 자동 진행을 정지합니다.

**조용할 때 자동 진행**을 켜면 기본 45초 간격으로 대기 중일 때만 화제를 꺼냅니다. 음성 화면이 없으면 AI를 호출하지 않습니다. 서버를 다시 켤 때는 항상 정지 상태입니다.

## 지금 구현된 것

- 월계향 페르소나, 최근 8회 발화 맥락(메모리 내, 재시작 시 초기화)
- bounded queue, 중복/도배 제한, 오래된 채팅 만료, 후원·구독 우선 처리와 일반 채팅 기회 보장
- 단일 재생기와 재생 완료 확인: 음성 겹침 방지, 창 종료/재생 실패 시 자동 정지
- OpenAI Responses 구조화 답변, 입력·출력 moderation, 호출 제한 및 타임아웃
- 네이버 CLOVA Voice 기본 TTS / 기존 OpenAI TTS 선택 가능
- 치지직 공식 OAuth, 토큰 갱신, 세션 연결·재연결, 채팅/후원/구독 수신
- VTube Studio 인증, 모델 확인, 실제 오디오 진폭 기반 `MouthOpen`, 표정 핫키 연결
- 캐릭터 디자인 미리보기, 운영 화면, OBS 투명 자막

## 실제 AI·음성 켜기

`.env`를 편집하고 서버를 재시작합니다. 키는 채팅이나 GitHub에 붙이지 마세요.

```dotenv
APP_MODE=live
OPENAI_API_KEY=본인의_키
TTS_PROVIDER=naver
NAVER_TTS_CLIENT_ID=본인의_Client_ID
NAVER_TTS_CLIENT_SECRET=본인의_Client_Secret
```

`OPENAI_MODEL`은 기존 프로젝트 값을 유지했습니다. 본인의 API 프로젝트에서 이용 가능한 Responses/JSON Schema 모델로 설정하세요. 지원하지 않는 모델은 응답 오류로 표시됩니다.
네이버 콘솔에서 CLOVA Voice 사용이 활성화된 Application의 키가 필요합니다. 일반 네이버 로그인 키와 다릅니다. 기본 여성 목소리는 `nara`이며 최종 음색은 별도 조율이 필요합니다.
기존 OpenAI 음성을 쓰려면 `TTS_PROVIDER=openai`. 음성 없이 자막만 시험하려면 `TTS_ENABLED=false`.

`DAILY_TURN_LIMIT`은 **UTC 날짜별 AI 턴 시도 수**입니다. 실패한 요청도 차감하며 `.runtime/budget.json`에 보존합니다. 금액 한도가 아니고 한 턴에 moderation·대사·TTS API 요청이 여러 번 나갑니다. 공급자 콘솔의 예산도 설정하세요. 음성은 메모리에 최근 5개만 보관합니다.

## 치지직 연결

1. [치지직 개발자 센터](https://developers.chzzk.naver.com/)에서 애플리케이션을 등록하고 **채팅 메시지 조회 / 후원 조회 / 구독 조회** 권한을 설정합니다.
2. 로그인 리디렉션 URL을 `http://localhost:3000/auth/chzzk/callback`으로 등록합니다. `.env`의 `CHZZK_REDIRECT_URI`와 일치해야 합니다.
3. `.env`에 `CHZZK_CLIENT_ID`, `CHZZK_CLIENT_SECRET`을 입력합니다. `CHZZK_CHANNEL_ID`는 기존 월계향 채널 ID이며 다른 채널이면 변경하세요.
4. 서버를 다시 실행하고 운영 화면의 **치지직 인증**으로 해당 채널 계정을 연결한 다음 **채팅 연결**을 누릅니다. 공식 유저 세션은 인증한 유저의 이벤트만 구독합니다.
5. 토큰은 `.runtime/chzzk-tokens.json`에 저장됩니다. 이 폴더는 Git에서 제외됩니다. 인증 철회/refresh token 만료 시 다시 인증하세요.

브라우저는 `localhost`로 여세요. `127.0.0.1`에서 인증을 시작하면 등록된 localhost callback과 쿠키 호스트가 달라져 인증 검증이 실패할 수 있습니다. PORT 변경 시 리디렉션 URL과 개발자 콘솔 설정도 함께 바꾸세요.

치지직 공식 문서가 지정한 구형 Socket.IO 2.0.3 클라이언트를 사용합니다. 이 의존성의 보안 경고와 프로토콜 호환성을 검토해야 하므로 이 서버를 인터넷에 공개하지 마세요. 네이버 로그인 쿠키를 직접 가져오는 기존 비공식 연동은 제거했습니다. 투네이션/트윕 등 외부 후원 서비스는 아직 연결하지 않았습니다.

## VTube Studio와 캐릭터

**동봉된 PNG는 디자인 시트입니다. 파츠 분리 PSD, Live2D 모델, 리깅 파일이 아닙니다.** 화면 미리보기는 정지 일러스트입니다. 모델 제작은 별도 단계입니다. 이 코드는 기존 VTS 모델로 먼저 동작을 검증할 수 있습니다.

1. VTube Studio에서 Live2D 모델을 열고 설정에서 API를 활성화합니다(기본 8001).
2. 운영 화면에서 **VTS 연결**을 누르고 VTS에서 플러그인을 허용합니다.
3. 모델 파라미터 설정에서 입력 `MouthOpen`을 모델의 입 벌림 파라미터(일반적으로 `ParamMouthOpenY`)에 연결합니다.
4. 표정은 해당 모델의 핫키 ID/이름을 `.env`에 넣고 서버를 재시작합니다.

```dotenv
VTS_HOTKEYS={"neutral":"기본표정핫키ID","happy":"미소핫키ID","surprised":"놀람핫키ID"}
```

토글 핫키는 같은 감정이 반복될 때 꺼질 수 있습니다. 다른 표정을 초기화하는 모델별 핫키로 구성하세요. 실제 MP3 재생은 Web Audio로 분석해 입 값을 보냅니다. 브라우저 데모 TTS는 오디오 분석이 안 되므로 VTS 입 움직임을 보내지 않습니다. 눈/고개/몸 움직임은 아직 자동 제어하지 않습니다. VTS를 재실행하면 운영 화면에서 다시 연결하세요.

## OBS로 치지직 송출

1. OBS에서 VTube Studio 창을 게임/윈도우 캡처합니다(모델이 있을 때).
2. 브라우저 소스 URL에 `http://localhost:3000/overlay.html`, 크기 1920×1080을 설정합니다. 투명 자막만 표시하며 이 소스 자체는 무음입니다.
3. Chrome/Edge 운영 화면을 계속 열어 두고 음성을 활성화합니다. OBS에서 해당 브라우저 애플리케이션 오디오 또는 데스크톱 오디오 **한 경로만** 캡처하세요. 중복 캡처하면 에코가 납니다.
4. OBS에서 치지직 송출 서버/스트림 키를 설정하고 비공개 녹화로 소리·입 움직임·자막을 점검한 뒤 방송을 시작합니다.

**진행 시작**은 AI를 진행시키며 OBS 송출 시작 버튼이 아닙니다. **즉시 정지**는 대기열, AI 요청, 음성 재생을 중단하지만 OBS 송출을 종료하지 않습니다. 송출 자동 시작/예약 종료, 게임 플레이, 장기 기억, 24시간 무인 운영은 이번 버전에 포함하지 않았습니다.

## 개발·검증

```sh
npm test
npm start
```

테스트는 실제 API 키/방송 없이 큐, 정지 도중 생성 취소, 재생 ACK, 중복, 호출 제한, 이벤트 정규화, 인증 state, 로컬 제어 보호를 확인합니다. 실제 네이버/OpenAI/치지직/VTS/OBS 연동은 각 계정과 Windows 방송 PC에서 통합 검증이 필요합니다.

서버는 `127.0.0.1`에만 바인딩합니다. 제어 요청은 같은 origin과 부팅마다 바뀌는 토큰을 요구합니다. 방송 채팅은 명령 실행 권한이 없고 OS/OBS 제어 도구에 접근하지 않습니다. 운영 화면·API는 로컬 전용으로 설계했으며 외부 호스팅용 인증 시스템은 아닙니다.

### 공식 문서

- [치지직 OAuth](https://chzzk.gitbook.io/chzzk/chzzk-api/authorization)
- [치지직 세션/이벤트](https://chzzk.gitbook.io/chzzk/chzzk-api/session)
- [네이버 CLOVA Voice](https://api.ncloud-docs.com/docs/ai-naver-clovavoice-ttspremium)
- [VTube Studio API](https://github.com/DenchiSoft/VTubeStudio)
- [OpenAI 텍스트 생성](https://developers.openai.com/api/docs/guides/text)
