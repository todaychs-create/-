// 숏폼 생성기 — 1080x1920 캔버스 렌더링
(function () {
  "use strict";

  const W = 1080;
  const H = 1920;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // 사용자 업로드 이미지 (없으면 플레이스홀더)
  let bgImage = null;

  const fields = {
    titleLine1: document.getElementById("titleLine1"),
    titleLine2: document.getElementById("titleLine2"),
    caption: document.getElementById("caption"),
    location: document.getElementById("location"),
    handle: document.getElementById("handle"),
    footer: document.getElementById("footer"),
  };

  // --- 유틸: 텍스트 줄바꿈 ---
  function wrapText(text, maxWidth) {
    const words = text.split(/(\s+)/); // 공백 유지
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur + w;
      if (ctx.measureText(test).width > maxWidth && cur.trim() !== "") {
        lines.push(cur.trimEnd());
        cur = w.trimStart();
      } else {
        cur = test;
      }
    }
    if (cur.trim() !== "") lines.push(cur.trimEnd());
    return lines;
  }

  // --- 배경 이미지를 cover 방식으로 그리기 ---
  function drawCover(img, x, y, w, h) {
    const ir = img.width / img.height;
    const r = w / h;
    let sw, sh, sx, sy;
    if (ir > r) {
      sh = img.height;
      sw = sh * r;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / r;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawPlaceholder() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#3a3f4b");
    g.addColorStop(1, "#12141a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "600 44px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("배경 이미지를 업로드하세요", W / 2, H / 2);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // 1) 배경
    if (bgImage) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      drawCover(bgImage, 0, 0, W, H);
    } else {
      drawPlaceholder();
    }

    // 2) 상단 검정 바 + 제목
    const t1 = fields.titleLine1.value.trim();
    const t2 = fields.titleLine2.value.trim();
    ctx.textAlign = "center";
    ctx.font = "800 74px system-ui, 'Apple SD Gothic Neo', sans-serif";
    const maxTitleW = W - 120;
    const l1 = t1 ? wrapText(t1, maxTitleW) : [];
    const l2 = t2 ? wrapText(t2, maxTitleW) : [];
    const lineH = 90;
    const totalLines = l1.length + l2.length;
    const barPadTop = 60;
    const barH = barPadTop * 2 + totalLines * lineH;

    if (totalLines > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.92)";
      ctx.fillRect(0, 0, W, barH);
      let y = barPadTop + lineH * 0.72;
      ctx.fillStyle = "#ffffff";
      for (const line of l1) { ctx.fillText(line, W / 2, y); y += lineH; }
      ctx.fillStyle = "#ffd400";
      for (const line of l2) { ctx.fillText(line, W / 2, y); y += lineH; }
    }

    // 3) 하단 메타 영역 배경 (검정)
    const metaTop = H - 300;
    ctx.fillStyle = "rgba(0,0,0,0.96)";
    ctx.fillRect(0, metaTop, W, 300);

    // 4) 자막 바 (메타 위에 겹침)
    const cap = fields.caption.value.trim();
    if (cap) {
      ctx.font = "800 60px system-ui, sans-serif";
      const capLines = wrapText(cap, W - 120);
      const capLineH = 78;
      const capH = capLines.length * capLineH + 44;
      const capY = metaTop - capH - 24;
      // 반투명 검정 박스
      ctx.fillStyle = "rgba(0,0,0,0.78)";
      ctx.fillRect(0, capY, W, capH);
      ctx.fillStyle = "#ffffff";
      let cy = capY + 22 + capLineH * 0.72;
      for (const line of capLines) { ctx.fillText(line, W / 2, cy); cy += capLineH; }
    }

    // 5) 위치 핀
    ctx.textAlign = "left";
    let my = metaTop + 62;
    const loc = fields.location.value.trim();
    if (loc) {
      drawPin(64, my - 22, "#4da3ff");
      ctx.fillStyle = "#ffffff";
      ctx.font = "500 40px system-ui, sans-serif";
      ctx.fillText(loc, 108, my);
    }

    // 6) 채널 핸들 + 구독 버튼
    my += 78;
    const handle = fields.handle.value.trim();
    if (handle) {
      // 아바타
      ctx.save();
      ctx.beginPath();
      ctx.arc(84, my - 14, 30, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = "#c9402f";
      ctx.fillRect(54, my - 44, 60, 60);
      ctx.restore();

      ctx.fillStyle = "#ffffff";
      ctx.font = "600 38px system-ui, sans-serif";
      ctx.fillText(handle, 130, my);

      // 구독 버튼
      const hw = ctx.measureText(handle).width;
      const btnX = 130 + hw + 28;
      const btnY = my - 40;
      const btnW = 128, btnH = 56;
      ctx.fillStyle = "#ffffff";
      roundRect(btnX, btnY, btnW, btnH, 28);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.font = "700 32px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("구독", btnX + btnW / 2, btnY + 39);
      ctx.textAlign = "left";
    }

    // 7) 하단 캡션
    my += 74;
    const footer = fields.footer.value.trim();
    if (footer) {
      ctx.fillStyle = "#dddddd";
      ctx.font = "500 34px system-ui, sans-serif";
      ctx.fillText("▶ " + footer, 64, my);
    }
  }

  // --- 도형 헬퍼 ---
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPin(x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 14, y + 14, 14, Math.PI, 0);
    ctx.lineTo(x + 14, y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + 14, y + 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- 이벤트 ---
  Object.values(fields).forEach((el) => el.addEventListener("input", render));

  document.getElementById("imageInput").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => { bgImage = img; render(); };
    img.src = URL.createObjectURL(file);
  });

  document.getElementById("downloadBtn").addEventListener("click", () => {
    render();
    const link = document.createElement("a");
    link.download = "shortform.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  render();
})();
