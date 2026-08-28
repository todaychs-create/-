// 이미지 검색 API
// 영어 키워드들을 받아 Pixabay에서 저작권 안전 이미지를 찾아 돌려줍니다.
// (한글 → 영어 변환은 generate.js에서 Claude가 이미 해줍니다.)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 지원합니다." });
  }
  if ((req.headers["x-app-password"] || "") !== process.env.SHARED_PASSWORD) {
    return res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
  }

  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res
      .status(500)
      .json({ error: "서버에 Pixabay 키가 설정되지 않았습니다." });
  }

  const body = req.body || {};
  const queries = Array.isArray(body.queries) ? body.queries : [];
  const count = Math.min(Math.max(parseInt(body.count, 10) || 3, 1), 6);

  if (queries.length === 0) {
    return res.status(200).json({ images: [] });
  }

  const seen = new Set();
  const images = [];

  for (const q of queries) {
    if (images.length >= count) break;
    const url =
      "https://pixabay.com/api/?key=" +
      encodeURIComponent(key) +
      "&q=" +
      encodeURIComponent(String(q)) +
      "&image_type=photo&safesearch=true&order=popular&per_page=5&lang=en";
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const d = await r.json();
      for (const h of d.hits || []) {
        if (images.length >= count) break;
        if (seen.has(h.largeImageURL)) continue;
        seen.add(h.largeImageURL);
        images.push({
          url: h.largeImageURL,
          preview: h.webformatURL,
          tags: h.tags,
          page: h.pageURL,
          query: q,
        });
      }
    } catch (e) {
      // 한 키워드가 실패해도 다음 키워드로 계속 진행
      continue;
    }
  }

  return res.status(200).json({ images });
}
