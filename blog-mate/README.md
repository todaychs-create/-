# 블로그 메이트 🖊️

주제만 넣으면 **AI(Claude)가 블로그 초안**을 쓰고 **Pixabay에서 어울리는 이미지**를 찾아주는 웹앱입니다.
글은 화면에서 검토한 뒤 **직접 네이버에 올립니다** (자동 발행 아님 · 계정 접근 안 함).

- 사용 규모: 나 + 동생 2명, **공용 비밀번호 1개**로 접속
- 배포: 클라우드(Vercel) → 개발자 PC를 꺼도 24시간 동작

---

## 🚀 처음 올리는 법 (비개발자용, 약 15분)

### 준비물 3가지
1. **GitHub 계정** — 이 코드가 올라가는 곳 (무료)
2. **Vercel 계정** — 앱을 인터넷에 띄우는 곳 (무료, GitHub로 로그인 가능)
3. **API 키 2개**
   - Anthropic(Claude) 키: https://console.anthropic.com → API Keys (사용한 만큼 유료)
   - Pixabay 키: https://pixabay.com/api/docs/ (로그인하면 페이지 상단에 표시, 무료)

### 1단계 — 코드 올리기
이 `blog-mate` 폴더를 GitHub 저장소에 올립니다. (이미 저장소에 있다면 넘어가세요.)

### 2단계 — Vercel에 연결
1. https://vercel.com 접속 → **Add New… → Project**
2. 이 코드가 있는 GitHub 저장소를 선택 → **Import**
3. **Root Directory** 를 `blog-mate` 로 지정 (이 폴더가 저장소 하위에 있을 경우)
4. 아직 **Deploy 누르지 말고** 아래 3단계 먼저!

### 3단계 — 비밀 값(환경변수) 넣기
Vercel의 **Environment Variables** 칸에 아래 3개를 추가합니다.
(`.env.example` 파일에 설명이 있어요. 값은 여기 Vercel에만 넣고, 코드에는 넣지 마세요.)

| 이름 | 값 |
|------|----|
| `ANTHROPIC_API_KEY` | Anthropic에서 받은 키 (`sk-ant-...`) |
| `PIXABAY_API_KEY` | Pixabay에서 받은 키 |
| `SHARED_PASSWORD` | 나와 동생이 함께 쓸 접속 비밀번호 (자유롭게) |

### 4단계 — 배포
**Deploy** 버튼 클릭 → 1~2분 뒤 `https://내프로젝트.vercel.app` 주소가 나옵니다.
그 주소를 동생에게 알려주고, **공용 비밀번호**를 함께 공유하면 끝!

---

## 🖥️ 내 컴퓨터에서 먼저 테스트 (선택)

```bash
cd blog-mate
npm install
npm i -g vercel          # 처음 한 번만
vercel dev               # http://localhost:3000
```
`vercel dev` 실행 시 환경변수 3개를 물어보거나, `.env.local` 파일(같은 형식)을 만들어 두면 됩니다.

---

## ⚙️ 동작 방식 (간단히)

```
사용자 → [1] 주제 입력 → [2] /api/generate
                              → Claude가 초안(JSON) + 영어 이미지 키워드 생성
                          → [3] /api/images
                              → 영어 키워드로 Pixabay 검색
                          → [4] 화면에 미리보기 + 검수 체크리스트 + 복사 버튼
사용자 → 검토·수정 → 네이버에 직접 붙여넣기 발행
```

- `api/generate.js` — Claude 호출 (모델: `claude-opus-5`)
- `api/images.js` — Pixabay 호출 (한글→영어 변환은 generate 단계에서 Claude가 수행)
- `api/health.js` — 접속 비밀번호 확인
- `index.html` — 화면(프론트엔드)

---

## 💡 자주 바꾸는 것들

- **더 저렴하게 쓰고 싶다면**: `api/generate.js`의 `model: "claude-opus-5"` 를
  `"claude-sonnet-5"` (더 저렴) 또는 `"claude-haiku-4-5"` (가장 저렴)로 바꾸세요.
- **비밀번호 변경**: Vercel의 `SHARED_PASSWORD` 값을 바꾸고 재배포.
- **글 스타일/구성 변경**: `api/generate.js`의 `systemPrompt()` 문구를 수정.

## 🔐 보안 메모
- API 키는 **Vercel 환경변수에만** 두세요. 코드나 GitHub에 절대 넣지 마세요.
- 채팅 등에 노출된 적 있는 키는 재발급(rotate) 권장.
- Pixabay 이미지는 상업적 사용 무료지만, **발행 전 출처·저작권을 최종 확인**하세요.
