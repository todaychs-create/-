// 숏폼 생성기 — 유튜브 쇼츠형 + 타임라인 영상 출력 (1080x1920)
(function () {
  "use strict";

  const W = 1080, H = 1920, HEADER = 470;
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  let bgImage = null;      // 배경 이미지
  let bgVideo = null;      // 배경 영상
  let avatarImage = null;  // 채널 로고

  const $ = (id) => document.getElementById(id);
  const F = {
    handle: $("handle"), channelName: $("channelName"),
    titleLine1: $("titleLine1"), titleLine2: $("titleLine2"),
    labelHi: $("labelHi"), labelRest: $("labelRest"),
    labelStart: $("labelStart"), labelEnd: $("labelEnd"),
    subtitleCues: $("subtitleCues"),
    commentUser: $("commentUser"), commentTime: $("commentTime"),
    commentText: $("commentText"), commentLikes: $("commentLikes"),
    commentStart: $("commentStart"), commentEnd: $("commentEnd"),
    source: $("source"), duration: $("duration"),
  };

  // ---------- 유틸 ----------
  function num(el, d) { const v = parseFloat(el.value); return isNaN(v) ? d : v; }

  function wrapText(text, maxWidth) {
    const words = text.split(/(\s+)/); const lines = []; let cur = "";
    for (const w of words) { const test = cur + w;
      if (ctx.measureText(test).width > maxWidth && cur.trim() !== "") { lines.push(cur.trimEnd()); cur = w.trimStart(); }
      else { cur = test; } }
    if (cur.trim() !== "") lines.push(cur.trimEnd()); return lines;
  }
  function drawCover(img, x, y, w, h) {
    const iw = img.videoWidth || img.width, ih = img.videoHeight || img.height;
    if (!iw || !ih) return;
    const ir = iw / ih, r = w / h; let sw, sh, sx, sy;
    if (ir > r) { sh = ih; sw = sh * r; sx = (iw - sw) / 2; sy = 0; }
    else { sw = iw; sh = sw / r; sx = 0; sy = (ih - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function outlineText(text, x, y, fill, stroke, lw) {
    ctx.lineJoin = "round"; ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y);
    ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }
  // 페이드 알파 계산
  function alphaFor(start, end, t, fade) {
    fade = fade || 0.25;
    if (t < start || t > end) return 0;
    let a = 1;
    if (t < start + fade) a = (t - start) / fade;
    if (t > end - fade) a = Math.min(a, (end - t) / fade);
    return Math.max(0, Math.min(1, a));
  }
  // 자막 큐 파싱: "시작,끝,문구" (줄바꿈 구분)
  function parseCues(text) {
    return text.split("\n").map((line) => {
      const p = line.split(",");
      if (p.length < 3) return null;
      const s = parseFloat(p[0]), e = parseFloat(p[1]);
      if (isNaN(s) || isNaN(e)) return null;
      return { start: s, end: e, text: p.slice(2).join(",").trim() };
    }).filter(Boolean);
  }

  // ---------- 프레임 렌더 (시간 t초) ----------
  function renderFrame(t) {
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    // 1) 미디어
    if (bgVideo && bgVideo.readyState >= 2) {
      ctx.fillStyle = "#000"; ctx.fillRect(0, HEADER, W, H - HEADER);
      ctx.save(); ctx.beginPath(); ctx.rect(0, HEADER, W, H - HEADER); ctx.clip();
      drawCover(bgVideo, 0, HEADER, W, H - HEADER); ctx.restore();
    } else if (bgImage) {
      ctx.fillStyle = "#000"; ctx.fillRect(0, HEADER, W, H - HEADER);
      ctx.save(); ctx.beginPath(); ctx.rect(0, HEADER, W, H - HEADER); ctx.clip();
      drawCover(bgImage, 0, HEADER, W, H - HEADER); ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, HEADER, 0, H);
      g.addColorStop(0, "#5a5f6b"); g.addColorStop(1, "#23262e");
      ctx.fillStyle = g; ctx.fillRect(0, HEADER, W, H - HEADER);
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.textAlign = "center";
      ctx.font = "600 40px system-ui, sans-serif";
      ctx.fillText("배경 이미지/영상을 업로드하세요", W / 2, HEADER + (H - HEADER) / 2);
    }

    // 2) 흰색 헤더 (상시)
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, HEADER);
    const avX = 44, avY = 40, avD = 76;
    ctx.save(); ctx.beginPath(); ctx.arc(avX + avD / 2, avY + avD / 2, avD / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (avatarImage) { drawCover(avatarImage, avX, avY, avD, avD); }
    else { const ag = ctx.createLinearGradient(avX, avY, avX + avD, avY + avD);
      ag.addColorStop(0, "#3aa0ff"); ag.addColorStop(1, "#7a5cff"); ctx.fillStyle = ag; ctx.fillRect(avX, avY, avD, avD); }
    ctx.restore();
    ctx.textAlign = "left"; ctx.fillStyle = "#666"; ctx.font = "500 30px system-ui, sans-serif";
    ctx.fillText(F.handle.value.trim(), avX + avD + 20, avY + 30);
    ctx.fillStyle = "#111"; ctx.font = "700 36px system-ui, sans-serif";
    ctx.fillText(F.channelName.value.trim(), avX + avD + 20, avY + 70);

    // 제목 (상시)
    const t1 = F.titleLine1.value.trim(), t2 = F.titleLine2.value.trim();
    ctx.textAlign = "center"; ctx.font = "800 82px system-ui, 'Apple SD Gothic Neo', sans-serif";
    const titleLines = [];
    if (t1) titleLines.push(...wrapText(t1, W - 100));
    if (t2) titleLines.push(...wrapText(t2, W - 100));
    const tLineH = 96; let ty = 200 + (2 - Math.min(titleLines.length, 2)) * (tLineH / 2);
    ctx.fillStyle = "#111"; for (const line of titleLines) { ctx.fillText(line, W / 2, ty); ty += tLineH; }

    // 3) 상단 라벨 (타임드)
    const la = alphaFor(num(F.labelStart, 0), num(F.labelEnd, 9999), t);
    const hi = F.labelHi.value.trim(), rest = F.labelRest.value.trim();
    if (la > 0 && (hi || rest)) {
      ctx.globalAlpha = la;
      ctx.font = "800 52px system-ui, sans-serif"; const padX = 20, gap = 16;
      const hiW = hi ? ctx.measureText(hi).width + padX * 2 : 0;
      const restW = rest ? ctx.measureText(" " + rest).width : 0;
      const totalW = hiW + (hi && rest ? gap : 0) + restW;
      let lx = (W - totalW) / 2; const ly = HEADER + 90; ctx.textAlign = "left";
      if (hi) { ctx.fillStyle = "#e60023"; roundRect(lx, ly - 46, hiW, 62, 10); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillText(hi, lx + padX, ly); lx += hiW + gap; }
      if (rest) { outlineText(rest, lx, ly, "#111", "#fff", 8); }
      ctx.globalAlpha = 1;
    }

    // 4) 자막 큐 (시간대별 교체)
    const cues = parseCues(F.subtitleCues.value);
    for (const c of cues) {
      const a = alphaFor(c.start, c.end, t);
      if (a > 0 && c.text) {
        ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.font = "800 70px system-ui, sans-serif";
        outlineText(c.text, W / 2, H - 560, "#ffffff", "#000000", 12);
        ctx.globalAlpha = 1;
      }
    }

    // 5) 댓글 카드 (타임드 + 살짝 위로 슬라이드)
    const ca = alphaFor(num(F.commentStart, 0), num(F.commentEnd, 9999), t);
    const cUser = F.commentUser.value.trim(), cText = F.commentText.value.trim();
    if (ca > 0 && (cUser || cText)) {
      ctx.globalAlpha = ca;
      const slide = (1 - ca) * 40;
      const cardX = 70, cardW = W - 140, cardY = H - 470 + slide, cardH = 300;
      ctx.fillStyle = "rgba(255,255,255,0.92)"; roundRect(cardX, cardY, cardW, cardH, 24); ctx.fill();
      const cav = cardX + 40, cavY = cardY + 40, cavD = 56;
      ctx.save(); ctx.beginPath(); ctx.arc(cav + cavD / 2, cavY + cavD / 2, cavD / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.fillStyle = "#c9ced6"; ctx.fillRect(cav, cavY, cavD, cavD); ctx.restore();
      const tx = cav + cavD + 20; ctx.textAlign = "left";
      ctx.font = "700 30px system-ui, sans-serif"; ctx.fillStyle = "#222"; ctx.fillText(cUser, tx, cardY + 62);
      const uw = ctx.measureText(cUser).width;
      ctx.font = "400 26px system-ui, sans-serif"; ctx.fillStyle = "#888";
      ctx.fillText("  " + F.commentTime.value.trim(), tx + uw, cardY + 62);
      ctx.font = "400 34px system-ui, sans-serif"; ctx.fillStyle = "#111";
      const commentLines = wrapText(cText, cardW - 100); let cLy = cardY + 120;
      for (const line of commentLines.slice(0, 2)) { ctx.fillText(line, tx, cLy); cLy += 44; }
      ctx.font = "400 30px system-ui, sans-serif"; ctx.fillStyle = "#555";
      ctx.fillText("👍 " + F.commentLikes.value.trim() + "     👎        답글", tx, cardY + cardH - 40);
      ctx.globalAlpha = 1;
    }

    // 6) 출처 (상시)
    const src = F.source.value.trim();
    if (src) { ctx.textAlign = "center"; ctx.font = "800 46px system-ui, sans-serif";
      outlineText(src, W / 2, H - 70, "#ffffff", "#000000", 10); }
  }

  // ---------- 재생 / 녹화 ----------
  let playing = false;
  function stopVideoBg() { if (bgVideo) { try { bgVideo.pause(); bgVideo.currentTime = 0; } catch (e) {} } }

  function runTimeline(record) {
    if (playing) return;
    playing = true;
    const dur = num(F.duration, 8);
    const btnRec = $("recordBtn"), btnPlay = $("playBtn");
    if (btnRec) btnRec.disabled = true;
    if (btnPlay) btnPlay.disabled = true;

    let recorder = null, chunks = [];
    if (record) {
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9" : "video/webm";
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const a = document.createElement("a");
        a.download = "shortform.webm"; a.href = URL.createObjectURL(blob); a.click();
      };
      recorder.start();
    }

    if (bgVideo) { try { bgVideo.currentTime = 0; bgVideo.play(); } catch (e) {} }
    const startT = performance.now();
    function loop(now) {
      const t = (now - startT) / 1000;
      renderFrame(t);
      if (t >= dur) {
        if (recorder) recorder.stop();
        stopVideoBg();
        playing = false;
        if (btnRec) btnRec.disabled = false;
        if (btnPlay) btnPlay.disabled = false;
        return;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // ---------- 이벤트 ----------
  Object.values(F).forEach((el) => el.addEventListener("input", () => { if (!playing) renderFrame(0); }));

  $("imageInput").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    bgVideo = null;
    const img = new Image(); img.onload = () => { bgImage = img; renderFrame(0); }; img.src = URL.createObjectURL(f);
  });
  const vEl = $("videoInput");
  if (vEl) vEl.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    bgImage = null;
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.loop = true; v.src = URL.createObjectURL(f);
    v.onloadeddata = () => { bgVideo = v; renderFrame(0); };
  });
  $("avatarInput").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const img = new Image(); img.onload = () => { avatarImage = img; renderFrame(0); }; img.src = URL.createObjectURL(f);
  });

  $("playBtn").addEventListener("click", () => runTimeline(false));
  $("recordBtn").addEventListener("click", () => runTimeline(true));
  $("downloadBtn").addEventListener("click", () => {
    renderFrame(0);
    const a = document.createElement("a");
    a.download = "shortform.png"; a.href = canvas.toDataURL("image/png"); a.click();
  });

  renderFrame(0);
})();
