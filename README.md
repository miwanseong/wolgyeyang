# AI VTuber — CHZZK MVP

월계향 AI 버튜버의 1차 MVP입니다.

현재 목표:

- CHZZK 채팅 수신
- OpenAI를 이용한 자연어 응답
- 감정 상태(`neutral`, `happy`, `angry`, `sad`, `surprised`, `shy`) 생성
- OpenAI TTS 음성 생성
- 브라우저 대시보드에서 채팅/감정 확인
- 후원 및 구독 이벤트 처리

## 요구사항

- Node.js 18+
- OpenAI API 키
- CHZZK 채널

`chzzk` 패키지는 CHZZK의 비공식 API 라이브러리이며, `channelId`를 지정하면 채팅 채널 ID를 확인하고 연결하는 방식으로 사용할 수 있습니다.

## Windows 실행

```powershell
npm install
copy .env.example .env
notepad .env
npm start
```

브라우저에서 `http://localhost:3000` 접속.

`.env`의 `OPENAI_API_KEY`에 본인의 키를 입력합니다. API 키는 GitHub에 올리지 마세요.

## CHZZK

월계향 채널 ID:

`e76d5740ed3e21bcbd2daaff045ce955`

실시간 채팅은 서버에서 수신합니다. 방송이 종료되어 채팅 채널이 없는 경우 라이브 시작 후 자동 재연결되는 구조를 사용합니다.

## 다음 단계

1. 채팅 우선순위/도배 필터
2. 캐릭터 장기 기억
3. 캐릭터 고유 말투와 성격 설정
4. TTS 재생 큐와 중복 응답 방지
5. OBS용 브라우저 소스 화면
6. 2D/3D 캐릭터 연결
7. 게임 상태 인식 및 게임 플레이
