// AI 초안 생성 API
// 주제/옵션을 받아 Claude(Opus 5)로 블로그 초안을 만들고,
// 이미지 검색용 영어 키워드까지 함께 만들어 돌려줍니다.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // ANTHROPIC_API_KEY 환경변수를 자동으로 읽음

// 사용자가 화면에서 고를 수 있는 모델 목록 (서버가 이 목록만 허용)
const ALLOWED_MODELS = new Set([
  "claude-opus-5",   // 최고 품질 (기본)
  "claude-opus-4-6", // 이전 오푸스
  "claude-sonnet-5", // 균형 (더 저렴)
  "claude-haiku-4-5", // 가장 빠르고 저렴
]);
const DEFAULT_MODEL = "claude-opus-5";

// Claude가 반드시 이 형태(JSON)로만 답하도록 강제하는 스키마
const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    image_search_en: { type: "array", items: { type: "string" } },
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["heading", "paragraph", "callout", "list", "summary"],
          },
          text: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["type", "text", "items"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "tags", "image_search_en", "blocks"],
  additionalProperties: false,
};

const TONE_GUIDE = {
  친근하게: "친근한 구어체. ~거든요, ~같아요, ㅋㅋ, ~듯요 같은 표현을 자연스럽게 섞고, 독자에게 말 걸듯이 씁니다.",
  정보성: "정보 전달 위주의 깔끔한 존댓말. 핵심을 명확하게 정리하되 딱딱하지 않게.",
  담백하게: "군더더기 없는 담백한 존댓말. 짧은 문장, 과장 없는 톤.",
};

const LENGTH_GUIDE = {
  짧게: "약 900~1200자, 소제목 2~3개",
  보통: "약 1500~2200자, 소제목 3~5개",
  길게: "약 2500~3500자, 소제목 5~7개",
};

function systemPrompt(tone, length) {
  return [
    "당신은 한국어 블로그(네이버 블로그) 글을 잘 쓰는 작가입니다.",
    "개인 브랜딩용 정보성 블로그 글의 '초안'을 만듭니다. 발행은 사용자가 검수 후 직접 하므로, 사실 확인이 필요한 부분은 단정하지 말고 자연스럽게 여지를 둡니다.",
    "",
    "말투: " + (TONE_GUIDE[tone] || TONE_GUIDE["친근하게"]),
    "분량: " + (LENGTH_GUIDE[length] || LENGTH_GUIDE["보통"]),
    "",
    "글 구성 규칙:",
    "- 첫 블록은 type=\"paragraph\" 로 시작하는 도입부(독자의 궁금증을 여는 문장).",
    "- 소제목은 type=\"heading\" (가능하면 질문형: 예 \"이거 진짜예요?\").",
    "- 본문 설명은 type=\"paragraph\".",
    "- 강조하고 싶은 주의/포인트는 type=\"callout\" (text에 한 문장).",
    "- 나열이 필요하면 type=\"list\" (items 배열에 항목들, text는 목록 제목이나 빈 문자열).",
    "- 마지막에 type=\"summary\" 로 '정리하면' 핵심 요약 (items 배열에 3~5개 핵심).",
    "- list/summary가 아닌 블록은 items를 빈 배열([])로, list/summary 블록은 text에 짧은 안내나 빈 문자열로 둡니다.",
    "",
    "tags: 네이버 검색에 어울리는 해시태그용 키워드 4~6개 (# 없이 단어만).",
    "image_search_en: 이 글에 어울리는 이미지를 무료 스톡(Pixabay)에서 찾기 위한 '영어' 키워드 3~5개. 한국어 주제를 영어로 번역·확장해서 넣습니다. (예: 결혼 → wedding, marriage, couple)",
    "",
    "환각(사실이 아닌 내용)을 지어내지 말고, 확실하지 않은 수치나 날짜는 '검토 중', '발표를 지켜봐야' 처럼 여지를 두어 표현하세요.",
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 지원합니다." });
  }
  if ((req.headers["x-app-password"] || "") !== process.env.SHARED_PASSWORD) {
    return res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
  }

  const { topic, tone, length, model } = req.body || {};
  if (!topic || !String(topic).trim()) {
    return res.status(400).json({ error: "주제를 입력해 주세요." });
  }
  const chosenModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

  try {
    const response = await client.messages.create({
      model: chosenModel,
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
      system: systemPrompt(tone, length),
      messages: [
        {
          role: "user",
          content:
            "다음 주제로 블로그 글 초안을 만들어 주세요.\n\n주제: " +
            String(topic).trim(),
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return res
        .status(422)
        .json({ error: "이 주제로는 초안을 만들 수 없었어요. 다른 주제로 시도해 주세요." });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) {
      return res.status(502).json({ error: "AI 응답을 해석하지 못했어요. 다시 시도해 주세요." });
    }

    const data = JSON.parse(textBlock.text);
    return res.status(200).json(data);
  } catch (err) {
    console.error("generate error:", err);
    const status = err?.status || 500;
    if (status === 401) {
      return res
        .status(500)
        .json({ error: "서버의 Anthropic API 키가 올바르지 않습니다. 설정을 확인하세요." });
    }
    if (status === 429) {
      return res.status(429).json({ error: "요청이 많아요. 잠시 후 다시 시도해 주세요." });
    }
    return res.status(500).json({ error: "초안 생성 중 문제가 발생했어요. 다시 시도해 주세요." });
  }
}
