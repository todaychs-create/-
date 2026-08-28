// 접속 비밀번호 확인용 API (로그인 화면에서 사용)
export default function handler(req, res) {
  if ((req.headers["x-app-password"] || "") !== process.env.SHARED_PASSWORD) {
    return res.status(401).json({ ok: false });
  }
  return res.status(200).json({ ok: true });
}
