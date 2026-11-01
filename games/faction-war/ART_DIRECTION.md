# 진영전쟁 — 고정 아트 디렉션

사용자 확정: 2026-11-01

## 필수 스타일

모든 게임 시각 자산은 **카툰 렌더링 느낌의 고품질 8비트 도트(픽셀 아트)**로 통일한다. 캐릭터, 초상화, 배경, 지형, 아이템, 효과, UI 프레임과 장식에 공통 적용한다. 중세 다크 판타지 분위기와 사용자 원작 캐릭터 디자인을 유지한다.

- 픽셀 윤곽, 선명한 실루엣, 제한적이며 일관된 팔레트, 명확한 셀 음영과 정교한 픽셀 군집을 사용한다.
- 같은 용도의 자산은 픽셀 밀도, 광원 방향, 외곽선, 명암 단계와 배율을 통일한다. 실제 타일·초상화 규격과 팔레트 수치는 제작 전 정하고 이후 함께 유지한다. 미확정 수치를 사용자 확정사항으로 취급하지 않는다.
- 확대는 정수 배율과 nearest-neighbor 방식을 기본으로 한다. 사진 같은 질감, 유화, 사실적 3D 렌더, 흐릿한 보간, 매끈한 벡터 일러스트를 섞지 않는다.
- 8비트는 사용자가 지정한 시각 스타일이다. 파일 인코딩이나 실제 역사적 하드웨어 제한을 임의로 강제하지 않는다.
- 한글 본문과 조작 요소는 읽기 쉬운 HTML 텍스트로 유지한다. 분위기를 위해 가독성과 키보드 접근성을 훼손하지 않는다.

## 이미지 생성 공통 프롬프트

High-quality 8-bit pixel art with a consistent cartoon / cel-shaded aesthetic, dark medieval fantasy, deliberate crisp pixel clusters, readable silhouettes, controlled limited palette, clean stepped shading, consistent pixel scale and lighting. No photorealism, no painterly oil textures, no smooth vector art, no realistic 3D rendering, no blurry upscaling. Preserve the supplied original character's defining design.

## 적용하지 않을 자산

/workspace/generated_images/exec-36b5dd31-b9ad-43dd-a775-530325ebad01.png 은 사실적인 콘셉트 이미지로 생성되었으며 승인된 게임 아트가 아니다. 게임 UI에 연결하거나 배포하지 않는다. 이후 문장 이미지 생성은 중단되었으며 사용할 자산으로 간주하지 않는다.

## 작업 연속성

다음 시각 작업을 시작하기 전에 이 문서를 읽는다. 기존 프로젝트 체크아웃을 사용하고, 사용자의 요청 없이 Git worktree를 만들지 않는다. 새 스타일 제안이 이 고정 기준과 충돌하면 임의로 바꾸지 않는다.

## 적용한 UI 자산

- public/assets/borderland-pixel.png: 황혼의 변경 마을, 폐성, 밀밭과 숲을 표현한 도트 배경. 로그인 화면과 사이트 배경에 사용.
- public/assets/panel-pixel.png: 짙은 남색과 오래된 금색의 도트 패널. nine-slice 프레임으로 사용해 모서리와 텍스트가 겹치지 않도록 구성.
- 두 이미지는 이번 프로젝트용으로 생성한 환경/UI 이미지이며 기존 인물의 공식 디자인을 대체하지 않는다.
- PC 1440px 및 모바일 390px Chromium에서 이미지 응답, 수평 넘침, 가입·게임 진입·로그아웃을 확인했다. 실제 게임 지도와 캐릭터는 아직 임시 도형이다.

- public/assets/world-sprites.png: 4열×2행 아틀라스. 위 행 검사·마법사·사냥꾼·장인, 아래 행 늑대·해골·집·침엽수. 각 셀을 canvas에서 직접 읽고 픽셀 보간 없이 표시한다. 원작 캐릭터의 최종 외형을 대체하지 않는 임시 모험가/환경 자산이다.
