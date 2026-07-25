// 숏폼 생성기 — 유튜브 쇼츠형 템플릿 (1080x1920)
(function () {
  "use strict";

  const W = 1080, H = 1920;
  const HEADER = 470; // 상단 흰색 헤더 높이

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  let bgImage = null;
  let avatarImage = null;

  const fields = {
    handle: document.getElementById("handle"),
    channelName: document.getElementById("channelName"),
    titleLine1: document.getElementById("titleLine1"),
    titleLine2: document.getElementById("titleLine2"),
    labelHi: document.getElementById("labelHi"),
    labelRest: document.getElementById("labelRest"),
    subtitle: document.getElementById("subtitle"),
    commentUser: document.getElementById("commentUser"),
    commentTime: document.getElementById("commentTime"),
    commentText: document.getElementById("commentText"),
    commentLikes: document.getElementById("commentLikes"),
    source: document.getElementById("source"),
  };

  // ---------- 유틸 ----------
  function wrapText(text, maxWidth) {
    const words = text.split(/(\s+)/);
    const lines = []; let cur = "";
    for (const w of words) {
      const test = cur + w;
      if (ctx.measureText(test).width > maxWidth && cur.trim() !== "") {
        lines.push(cur.trimEnd()); cur = w.trimStart();
      } else { cur = test; }
    }
    if (cur.trim() !== "") lines.push(cur.trimEnd());
    return lines;
  }

  function drawCover(img, x, y, w, h) {
    const ir = img.width / img.height, r = w / h;
    let sw, sh, sx, sy;
    if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // 외곽선 텍스트 (자막용)
  function outlineText(text, x, y, fill, stroke, lw) {
    ctx.lineJoin = "round";
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  // ---------- 렌더 ----------
  function render() {
    ctx.clearRect(0, 0, W, H);

    // 1) 미디어 (헤더 아래 전체)
    if (bgImage) {
      ctx.fillStyle = "#000"; ctx.fillRect(0, HEADER, W, H - HEADER);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, HEADER, W, H - HEADER); ctx.clip();
      drawCover(bgImage, 0, HEADER, W, H - HEADER);
      ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, HEADER, 0, H);
      g.addColorStop(0, "#5a5f6b"); g.addColorStop(1, "#23262e");
      ctx.fillStyle = g; ctx.fillRect(0, HEADER, W, H - HEADER);
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.textAlign = "center";
      ctx.font = "600 40px system-ui, sans-serif";
      ctx.fillText("배경 이미지를 업로드하세요", W / 2, HEADER + (H - HEADER) / 2);
    }

    // 2) 상단 흰색 헤더
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, HEADER);

    // 2a) 채널 로고 + 이름
    const avX = 44, avY = 40, avD = 76;
    ctx.save();
    ctx.beginPath(); ctx.arc(avX + avD / 2, avY + avD / 2, avD / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (avatarImage) { drawCover(avatarImage, avX, avY, avD, avD); }
    else {
      const ag = ctx.createLinearGradient(avX, avY, avX + avD, avY + avD);
      ag.addColorStop(0, "#3aa0ff"); ag.addColorStop(1, "#7a5cff");
      ctx.fillStyle = ag; ctx.fillRect(avX, avY, avD, avD);
    }
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = "#666";
    ctx.font = "500 30px system-ui, sans-serif";
    ctx.fillText(fields.handle.value.trim(), avX + avD + 20, avY + 30);
    ctx.fillStyle = "#111";
    ctx.font = "700 36px system-ui, sans-serif";
    ctx.fillText(fields.channelName.value.trim(), avX + avD + 20, avY + 70);

    // 2b) 제목 (검정 굵게, 중앙)
    const t1 = fields.titleLine1.value.trim(), t2 = fields.titleLine2.value.trim();
    ctx.textAlign = "center";
    ctx.font = "800 82px system-ui, 'Apple SD Gothic Neo', sans-serif";
    const titleLines = [];
    if (t1) titleLines.push(...wrapText(t1, W - 100));
    if (t2) titleLines.push(...wrapText(t2, W - 100));
    const tLineH = 96;
    let ty = 200 + (2 - Math.min(titleLines.length, 2)) * (tLineH / 2);
    ctx.fillStyle = "#111";
    for (const line of titleLines) { ctx.fillText(line, W / 2, ty); ty += tLineH; }

    // 3) 상단 라벨 (빨강 강조 + 검정)
    const hi = fields.labelHi.value.trim(), rest = fields.labelRest.value.trim();
    if (hi || rest) {
      ctx.font = "800 52px system-ui, sans-serif";
      const padX = 20, gap = 16;
      const hiW = hi ? ctx.measureText(hi).width + padX * 2 : 0;
      const restW = rest ? ctx.measureText(" " + rest).width : 0;
      const totalW = hiW + (hi && rest ? gap : 0) + restW;
      let lx = (W - totalW) / 2;
      const ly = HEADER + 90;
      ctx.textAlign = "left";
      if (hi) {
        ctx.fillStyle = "#e60023";
        roundRect(lx, ly - 46, hiW, 62, 10); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText(hi, lx + padX, ly);
        lx += hiW + gap;
      }
      if (rest) {
        outlineText(rest, lx, ly, "#111", "#fff", 8);
      }
    }

    // 4) 중앙 자막 (흰색 + 검정 외곽선)
    const sub = fields.subtitle.value.trim();
    if (sub) {
      ctx.textAlign = "center";
      ctx.font = "800 70px system-ui, sans-serif";
      outlineText(sub, W / 2, H - 560, "#ffffff", "#000000", 12);
    }

    // 5) 댓글 카드
    const cUser = fields.commentUser.value.trim();
    const cText = fields.commentText.value.trim();
    if (cUser || cText) {
      const cardX = 70, cardW = W - 140;
      const cardY = H - 470, cardH = 300;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      roundRect(cardX, cardY, cardW, cardH, 24); ctx.fill();

      // 유저 아바타
      const cav = cardX + 40, cavY = cardY + 40, cavD = 56;
      ctx.save();
      ctx.beginPath(); ctx.arc(cav + cavD / 2, cavY + cavD / 2, cavD / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.fillStyle = "#c9ced6"; ctx.fillRect(cav, cavY, cavD, cavD);
      ctx.restore();

      const tx = cav + cavD + 20;
      ctx.textAlign = "left";
      ctx.font = "700 30px system-ui, sans-serif"; ctx.fillStyle = "#222";
      ctx.fillText(cUser, tx, cardY + 62);
      const uw = ctx.measureText(cUser).width;
      ctx.font = "400 26px system-ui, sans-serif"; ctx.fillStyle = "#888";
      ctx.fillText("  " + fields.commentTime.value.trim(), tx + uw, cardY + 62);

      // 댓글 본문
      ctx.font = "400 34px system-ui, sans-serif"; ctx.fillStyle = "#111";
      const commentLines = wrapText(cText, cardW - 100);
      let cLy = cardY + 120;
      for (const line of commentLines.slice(0, 2)) { ctx.fillText(line, tx, cLy); cLy += 44; }

      // 좋아요 / 답글
      const rowY = cardY + cardH - 40;
      ctx.font = "400 30px system-ui, sans-serif"; ctx.fillStyle = "#555";
      ctx.fillText("👍 " + fields.commentLikes.value.trim() + "     👎        답글", tx, rowY);
    }

    // 6) 출처 캡션 (하단)
    const src = fields.source.value.trim();
    if (src) {
      ctx.textAlign = "center";
      ctx.font = "800 46px system-ui, sans-serif";
      outlineText(src, W / 2, H - 70, "#ffffff", "#000000", 10);
    }
  }

  // ---------- 이벤트 ----------
  Object.values(fields).forEach((el) => el.addEventListener("input", render));

  document.getElementById("imageInput").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const img = new Image(); img.onload = () => { bgImage = img; render(); };
    img.src = URL.createObjectURL(f);
  });
  const avEl = document.getElementById("avatarInput");
  if (avEl) avEl.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const img = new Image(); img.onload = () => { avatarImage = img; render(); };
    img.src = URL.createObjectURL(f);
  });

  document.getElementById("downloadBtn").addEventListener("click", () => {
    render();
    const link = document.createElement("a");
    link.download = "shortform.png"; link.href = canvas.toDataURL("image/png"); link.click();
  });

  render();
})();
