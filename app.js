const els = {
  book: document.getElementById("book"),
  cover: document.getElementById("cover"),
  spread: document.getElementById("spread"),
  sheetLeft: document.getElementById("sheetLeft"),
  sheetRight: document.getElementById("sheetRight"),
  sheetSingle: document.getElementById("sheetSingle"),
  flipper: document.getElementById("flipper"),
  flipFront: document.getElementById("flipFront"),
  flipBack: document.getElementById("flipBack"),
  backHotspot: document.getElementById("backHotspot"),
  nextHotspot: document.getElementById("nextHotspot"),
  sprinkleBtn: document.getElementById("sprinkleBtn"),
  micBtn: document.getElementById("micBtn"),
  angelBtn: document.getElementById("angelBtn"),
  resetCakeBtn: document.getElementById("resetCakeBtn"),
  resetBtn: document.getElementById("resetBtn"),
  hint: document.getElementById("hint"),
  stickers: document.getElementById("stickers"),
  confetti: document.getElementById("confetti"),
};

const mobileMedia = window.matchMedia("(max-width: 760px), (max-height: 560px)");
const reduceMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarseMedia = window.matchMedia("(pointer: coarse)");

const STICKER_PACK = [
  { src: "assets/stickers/rabbit.png", kind: "rabbit" },
  { src: "assets/stickers/cookie.png", kind: "cookie" },
  { src: "assets/stickers/bear.png", kind: "bear" },
  { src: "assets/stickers/peony.png", kind: "peony" },
];

const ANGEL_NUMBERS = [
  { n: "111", meaning: "A door is opening. Your thoughts are becoming real." },
  { n: "222", meaning: "You are on the right path. Keep going gently." },
  { n: "333", meaning: "Help is near. You are not doing this alone." },
  { n: "444", meaning: "You are held and protected. Rest if you need to." },
  { n: "555", meaning: "Change is coming, and it is making room for you." },
  { n: "666", meaning: "Come back to yourself. Balance is a kindness." },
  { n: "777", meaning: "Luck is leaning your way. Trust the quiet signs." },
  { n: "888", meaning: "Something good is filling up. There will be enough." },
  { n: "999", meaning: "A chapter is finishing so a kinder one can begin." },
  { n: "1111", meaning: "Make a wish. This is a bright little door." },
  { n: "1212", meaning: "A new cycle is starting. You are ready for it." },
  { n: "1234", meaning: "Things are unfolding in order. One step is enough." },
  { n: "1010", meaning: "Stay hopeful. The light is already turning toward you." },
  { n: "2222", meaning: "Patience. What you want is lining itself up." },
];

function milestoneText(count) {
  if (count === 8) return "Awow. Fave number";
  if (count === 28) return "28 yarn";
  if (count >= 29 && count <= 33) return "sobra na";
  if (count >= 35 && count <= 42) return "perfect age for eurotrip";
  if (count >= 43) return "awow grow old witchu yarn";
  return "";
}

// Where the door sits inside assets/home.png, as a fraction of the picture.
const DOOR_BOX = { left: 0.39, top: 0.17, width: 0.38, height: 0.57 };

let page = 0;
let turning = false;
let turnToken = 0;
let candleCount = 0;
let stickerItems = [];
let lastAngel = null;
let sprinkleItems = [];
let confettiTimer = 0;
let micToken = 0;
let layoutMobile = mobileMedia.matches;
let micState = freshMic();

function tpl(id) {
  return document.getElementById(id).innerHTML.trim();
}

function getView(index) {
  const views = {
    1: {
      left: tpl("tpl-1-text"),
      right: tpl("tpl-1-art"),
      single: tpl("tpl-1-art") + tpl("tpl-1-text"),
    },
    2: {
      left: tpl("tpl-2-text"),
      right: tpl("tpl-2-art"),
      single: tpl("tpl-2-art") + tpl("tpl-2-text"),
    },
    3: {
      left: `<div class="text-stack">${tpl("tpl-3-left")}${tpl("tpl-3-right")}</div>`,
      right: tpl("tpl-3-art"),
      single: tpl("tpl-3-art") + `<div class="text-stack">${tpl("tpl-3-left")}${tpl("tpl-3-right")}</div>`,
    },
    4: {
      left: tpl("tpl-4-text"),
      right: tpl("tpl-4-art"),
      single: tpl("tpl-4-art") + tpl("tpl-4-text"),
    },
    5: {
      left: tpl("tpl-5-text"),
      right: tpl("tpl-5-cake"),
      single: tpl("tpl-5-text") + tpl("tpl-5-cake"),
    },
  };
  return views[index];
}

function isMobile() {
  return mobileMedia.matches;
}

function isCoarsePointer() {
  return coarseMedia.matches;
}

function prefersReduced() {
  return reduceMedia.matches;
}

function wait(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function freshMic() {
  return {
    enabled: false,
    audioContext: null,
    analyser: null,
    dataArray: null,
    rafId: null,
    stream: null,
    smoothed: 0,
    lastBlowAt: 0,
  };
}

function wrapWords(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (node.parentElement && node.parentElement.classList.contains("w")) return;
    if (node.parentElement && node.parentElement.closest(".wish, .cake-angel, .cake-count")) return;
    if (!node.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    node.textContent.split(/\s+/).filter(Boolean).forEach((word) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = word;
      frag.appendChild(span);
    });
    node.parentNode.replaceChild(frag, node);
  });
}

function setHint(text) {
  els.hint.textContent = text;
  wrapWords(els.hint);
}

function updateHint() {
  if (page !== 5) {
    setHint("");
    return;
  }

  const cake = document.getElementById("cake");
  const lit = cake ? cake.querySelectorAll(".candle:not(.extinguished)").length : 0;
  const any = cake ? cake.querySelectorAll(".candle").length : 0;

  if (lit > 0) {
    setHint(
      micState.enabled
        ? "Blow the candles out."
        : "Turn on the microphone, then blow them out.",
    );
    return;
  }

  setHint(any > 0 ? "The candles are out." : "Tap the frosting to light a candle.");
}

function updateChrome() {
  const open = page > 0;
  els.book.dataset.page = String(page);
  els.book.classList.toggle("is-mobile", isMobile());
  els.book.classList.toggle("is-open", open);
  els.cover.setAttribute("aria-expanded", open ? "true" : "false");
  els.backHotspot.hidden = page < 1 || page > 4;
  els.nextHotspot.hidden = page < 1 || page > 3;
  els.backHotspot.setAttribute("aria-label", page === 1 ? "Close the book" : "Previous page");
  els.micBtn.hidden = page !== 5;
  els.sprinkleBtn.hidden = page !== 5;
  els.angelBtn.hidden = page !== 5;
  if (els.resetCakeBtn) els.resetCakeBtn.hidden = page !== 5;
  updateCandleCount();
  paintAngel();
  updateHint();
}

function mountView(view) {
  const cake = document.getElementById("cake");
  if (cake) cake.remove();

  if (isMobile()) {
    els.sheetSingle.innerHTML = view.single;
    els.sheetLeft.innerHTML = "";
    els.sheetRight.innerHTML = "";
  } else {
    els.sheetLeft.innerHTML = view.left;
    els.sheetRight.innerHTML = view.right;
    els.sheetSingle.innerHTML = "";
  }

  const slot = document.getElementById("cake");
  if (cake && slot && slot !== cake) slot.replaceWith(cake);

  const liveCake = document.getElementById("cake");
  if (liveCake && !liveCake.dataset.bound) {
    liveCake.dataset.bound = "1";
    liveCake.addEventListener("click", placeCandleFromEvent);
  }

  scaleCake();
  paintSprinkles();
  positionDoors();
  updateCandleCount();
  wrapWords(els.sheetLeft);
  wrapWords(els.sheetRight);
  wrapWords(els.sheetSingle);
  const wish = document.getElementById("birthdayWish");
  if (wish) {
    wish.textContent =
      "May all your dreams come true and your heart be filled with peace.";
  }
  paintAngel();
}

// The artwork is letterboxed by object-fit, so the door button has to follow the
// picture rather than the figure it sits in.
function positionDoors() {
  document.querySelectorAll(".art--door").forEach((figure) => {
    const img = figure.querySelector("img");
    const door = figure.querySelector(".door");
    if (!img || !door) return;

    const natural = {
      w: img.naturalWidth || Number(img.getAttribute("width")) || 1122,
      h: img.naturalHeight || Number(img.getAttribute("height")) || 1402,
    };
    const figRect = figure.getBoundingClientRect();
    const boxRect = img.getBoundingClientRect();
    if (!boxRect.width || !boxRect.height) return;

    const scale = Math.min(boxRect.width / natural.w, boxRect.height / natural.h);
    const drawnW = natural.w * scale;
    const drawnH = natural.h * scale;
    const originX = boxRect.left - figRect.left + (boxRect.width - drawnW) / 2;
    const originY = boxRect.top - figRect.top + (boxRect.height - drawnH) / 2;

    door.style.left = `${originX + drawnW * DOOR_BOX.left}px`;
    door.style.top = `${originY + drawnH * DOOR_BOX.top}px`;
    door.style.width = `${drawnW * DOOR_BOX.width}px`;
    door.style.height = `${drawnH * DOOR_BOX.height}px`;

    if (!img.complete) img.addEventListener("load", positionDoors, { once: true });
  });
}

function scaleCake() {
  const cake = document.getElementById("cake");
  if (!cake) return;
  const host = cake.closest(".cake-page");
  if (!host) return;

  const pad = 16;
  const availW = Math.max(120, host.clientWidth - pad);
  const availH = Math.max(120, host.clientHeight - pad);
  const scale = Math.min(1, availW / 290, availH / 250);
  cake.style.setProperty("--cake-scale", String(scale));
}

function focusStory() {
  return;
}

function focusCover() {
  if (isCoarsePointer()) return;
  els.cover.focus({ preventScroll: true });
}

function stripIds(html) {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  wrap.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  return wrap.innerHTML;
}

function animateTurn(from, to, forward, token) {
  const fromView = getView(from);
  const toView = getView(to);
  const mobile = isMobile();

  if (prefersReduced()) return Promise.resolve();

  if (mobile) {
    els.flipFront.innerHTML = stripIds(fromView.single);
    els.flipBack.innerHTML = stripIds(toView.single);
    els.flipper.classList.add("is-forward");
    els.flipper.classList.remove("is-back");
  } else if (forward) {
    els.flipFront.innerHTML = stripIds(fromView.right);
    els.flipBack.innerHTML = stripIds(toView.left);
    els.flipper.classList.add("is-forward");
    els.flipper.classList.remove("is-back");
  } else {
    els.flipFront.innerHTML = stripIds(fromView.left);
    els.flipBack.innerHTML = stripIds(toView.right);
    els.flipper.classList.add("is-back");
    els.flipper.classList.remove("is-forward");
  }

  els.flipper.classList.add("is-active");
  void els.flipper.offsetWidth;

  if (mobile) els.sheetSingle.innerHTML = toView.single;
  else if (forward) els.sheetRight.innerHTML = toView.right;
  else els.sheetLeft.innerHTML = toView.left;

  void els.flipper.offsetWidth;
  els.flipper.classList.add("is-animating");

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      els.flipper.removeEventListener("transitionend", onEnd);
      if (token !== turnToken) {
        resolve();
        return;
      }
      els.flipper.classList.remove("is-active", "is-animating", "is-forward", "is-back");
      els.flipFront.innerHTML = "";
      els.flipBack.innerHTML = "";
      resolve();
    };
    const onEnd = (event) => {
      if (event.target !== els.flipper || event.propertyName !== "transform") return;
      finish();
    };
    els.flipper.addEventListener("transitionend", onEnd);
    window.setTimeout(finish, 900);
  });
}

async function openCover(token) {
  mountView(getView(1));
  if (!prefersReduced()) {
    els.book.classList.add("is-opening");
    await wait(680);
  }
  if (token !== turnToken) return;
  els.book.classList.remove("is-opening");
  page = 1;
  updateChrome();
  focusStory();
}

async function closeCover(token) {
  if (!prefersReduced()) {
    els.book.classList.add("is-closing");
    els.book.classList.remove("is-open");
    await wait(520);
  }
  if (token !== turnToken) return;
  els.book.classList.remove("is-closing", "is-open", "is-opening");
  page = 0;
  els.sheetLeft.innerHTML = "";
  els.sheetRight.innerHTML = "";
  els.sheetSingle.innerHTML = "";
  updateChrome();
  focusCover();
}

async function goTo(to) {
  if (turning || to === page || to < 0 || to > 5) return;

  if (page === 0 && to === 1) {
    turning = true;
    const token = ++turnToken;
    try {
      await openCover(token);
    } finally {
      if (token === turnToken) turning = false;
    }
    return;
  }

  if (page === 0 || page === 5) return;
  if (Math.abs(to - page) !== 1) return;

  if (page === 1 && to === 0) {
    turning = true;
    const token = ++turnToken;
    try {
      await closeCover(token);
    } finally {
      if (token === turnToken) turning = false;
    }
    return;
  }

  turning = true;
  const from = page;
  const token = ++turnToken;
  els.book.classList.add("is-turning");
  try {
    await animateTurn(from, to, to > from, token);
    if (token !== turnToken) return;
    page = to;
    mountView(getView(page));
    updateChrome();
    focusStory();
  } finally {
    els.book.classList.remove("is-turning");
    if (token === turnToken) turning = false;
  }
}

function stickerSize(kind) {
  if (kind === "rabbit") return isMobile() ? 120 : 150;
  if (kind === "cookie" || kind === "peony") return isMobile() ? 64 : 84;
  return isMobile() ? 110 : 140;
}

function inflate(rect, pad) {
  return {
    left: rect.left - pad,
    top: rect.top - pad,
    right: rect.right + pad,
    bottom: rect.bottom + pad,
  };
}

function pickStickerSpot(size) {
  const host = els.stickers;
  if (!host) return null;
  const hr = host.getBoundingClientRect();
  const margin = 14;
  const maxX = hr.width - size - margin;
  const maxY = hr.height - size - margin;
  if (maxX <= margin || maxY <= margin) return null;

  const blocked = [];
  const add = (el, pad) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    blocked.push({
      left: r.left - hr.left - pad,
      top: r.top - hr.top - pad,
      right: r.right - hr.left + pad,
      bottom: r.bottom - hr.top + pad,
    });
  };

  document
    .querySelectorAll(".birthday, .wish, .prose p, .art img, .cake, .cake-meta, .cake-angel, .door")
    .forEach((el) => add(el, 18));

  stickerItems.forEach((item) => {
    const other = item.size || stickerSize(item.kind);
    blocked.push({
      left: item.x - 16,
      top: item.y - 16,
      right: item.x + other + 16,
      bottom: item.y + other + 16,
    });
  });

  for (let i = 0; i < 90; i += 1) {
    const x = margin + Math.random() * (maxX - margin);
    const y = margin + Math.random() * (maxY - margin);
    const box = { left: x, top: y, right: x + size, bottom: y + size };
    const hits = blocked.some(
      (b) => !(box.right < b.left || box.left > b.right || box.bottom < b.top || box.top > b.bottom),
    );
    if (!hits) return { x, y };
  }

  return null;
}

function paintStickers() {
  els.stickers.innerHTML = "";
  stickerItems.forEach((item) => {
    const li = document.createElement("li");
    li.classList.add(`is-${item.kind}`);
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = "";
    img.draggable = false;
    li.appendChild(img);
    if (item.size) {
      li.style.width = `${item.size}px`;
      li.style.height = `${item.size}px`;
    }
    li.style.left = `${item.x}px`;
    li.style.top = `${item.y}px`;
    li.style.animationDuration = `${2.2 + Math.random() * 1.6}s`;
    li.style.animationDelay = `${-Math.random() * 2}s`;
    els.stickers.appendChild(li);
  });
}

function countKind(kind) {
  return stickerItems.filter((sticker) => sticker.kind === kind).length;
}

function revealSticker(item) {
  if (countKind(item.kind) >= 3) return false;
  const sizes = item.kind === "rabbit" ? [stickerSize("rabbit"), 118, 96] : [stickerSize(item.kind)];
  for (const size of sizes) {
    const spot = pickStickerSpot(size);
    if (!spot) continue;
    stickerItems.push({
      src: item.src,
      kind: item.kind,
      x: spot.x,
      y: spot.y,
      size,
    });
    paintStickers();
    return true;
  }
  return false;
}

function spawnRandomSticker() {
  const needed = STICKER_PACK.filter((item) => countKind(item.kind) < 3);
  if (!needed.length) return;
  needed.sort((a, b) => {
    if (a.kind === "rabbit") return -1;
    if (b.kind === "rabbit") return 1;
    return countKind(a.kind) - countKind(b.kind);
  });
  revealSticker(needed[0]);
}

function ensureStickerSet() {
  const pack = [...STICKER_PACK].sort((a, b) => {
    if (a.kind === "rabbit") return -1;
    if (b.kind === "rabbit") return 1;
    return 0;
  });
  pack.forEach((item) => {
    let tries = 0;
    while (countKind(item.kind) < 3 && tries < 24) {
      if (!revealSticker(item)) break;
      tries += 1;
    }
  });
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isOnCakeTop({ x, y, w, h }) {
  const cx = w * 0.5;
  const cy = h * 0.22;
  const rx = w * 0.44;
  const ry = h * 0.16;
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  return nx * nx + ny * ny <= 1;
}

function addCandleAtPoint({ xPx, yPx }) {
  const candles = document.getElementById("candles");
  if (!candles || page !== 5) return;

  candleCount += 1;
  const candle = document.createElement("div");
  candle.className = candleCount % 2 === 0 ? "candle candle--lilac" : "candle";
  candle.style.left = `${xPx}px`;
  candle.style.top = `${yPx}px`;
  candle.innerHTML = '<div class="flame"></div>';
  candles.appendChild(candle);

  spawnRandomSticker();
  if (candleCount >= 28) ensureStickerSet();
  updateCandleCount();
  showMilestone(candleCount);
  updateHint();
}

function updateCandleCount() {
  const countEl = document.getElementById("cakeCandleCount");
  if (countEl) countEl.textContent = String(candleCount);
}

function showMilestone(count) {
  const note = document.getElementById("cakeSurprise");
  if (!note) return;

  const text = milestoneText(count);
  if (!text) {
    note.hidden = true;
    note.textContent = "";
    return;
  }

  note.hidden = false;
  note.textContent = text;
  wrapWords(note);
  const persist = (count >= 29 && count <= 33) || (count >= 35 && count <= 42) || count >= 43;
  if (persist) return;
  window.setTimeout(() => {
    if (note.textContent === text) {
      note.hidden = true;
      note.textContent = "";
    }
  }, 2800);
}

function clearCandles() {
  candleCount = 0;
  const candles = document.getElementById("candles");
  if (candles) candles.innerHTML = "";
  updateCandleCount();
  const note = document.getElementById("cakeSurprise");
  if (note) {
    note.hidden = true;
    note.textContent = "";
  }
}

const SPRINKLE_COLORS = ["#7a4eab", "#e7a0c4", "#f2d48a", "#8fbf9f", "#c9a0e8", "#f6e27a", "#fff6ea", "#d46b8c"];

function pickIcingPoint() {
  for (let i = 0; i < 24; i += 1) {
    const x = 28 + Math.random() * 214;
    const y = 10 + Math.random() * 72;
    if (isOnCakeTop({ x, y, w: 270, h: 230 })) return { x, y };
  }
  return { x: 80 + Math.random() * 110, y: 28 + Math.random() * 28 };
}

function makeSprinkle(spec) {
  const el = document.createElement("span");
  el.className = "sprinkle";
  el.style.left = `${spec.x}px`;
  el.style.top = `${spec.y}px`;
  el.style.width = `${spec.w}px`;
  el.style.height = `${spec.h}px`;
  el.style.background = spec.color;
  el.style.borderRadius = spec.round ? "50%" : "2px";
  el.style.transform = `translate(-50%, -50%) rotate(${spec.rot}deg)`;
  return el;
}

function ensureSprinkleLayer() {
  const cake = document.getElementById("cake");
  if (!cake) return null;
  let layer = cake.querySelector(".sprinkles");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "sprinkles";
    layer.id = "sprinkles";
    layer.setAttribute("aria-hidden", "true");
    const candles = cake.querySelector(".candles");
    if (candles) cake.insertBefore(layer, candles);
    else cake.appendChild(layer);
  }
  return layer;
}

function paintSprinkles() {
  const layer = ensureSprinkleLayer();
  if (!layer) return;
  layer.innerHTML = "";
  sprinkleItems.forEach((spec) => layer.appendChild(makeSprinkle(spec)));
}

function addSprinkles() {
  if (page !== 5) return;
  const layer = ensureSprinkleLayer();
  if (!layer) return;

  const count = 26 + ((Math.random() * 18) | 0);
  for (let i = 0; i < count; i += 1) {
    const point = pickIcingPoint();
    const spec = {
      x: point.x,
      y: point.y,
      w: 3 + Math.random() * 4,
      h: 7 + Math.random() * 5,
      rot: Math.random() * 180,
      color: SPRINKLE_COLORS[(Math.random() * SPRINKLE_COLORS.length) | 0],
      round: Math.random() > 0.72,
    };
    sprinkleItems.push(spec);
    layer.appendChild(makeSprinkle(spec));
  }
}

function clearSprinkles() {
  sprinkleItems = [];
  const layer = document.querySelector("#cake .sprinkles");
  if (layer) layer.innerHTML = "";
}

function clearConfetti() {
  window.clearTimeout(confettiTimer);
  els.confetti.innerHTML = "";
}

function burstConfetti() {
  const colors = ["#6e5a86", "#e4d5ef", "#e7d7a8", "#f7f1e6", "#d7b7c4", "#8aa384"];
  const count = 100;
  const now = Date.now();
  const reduce = prefersReduced();

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[(Math.random() * colors.length) | 0];
    piece.style.width = `${6 + Math.random() * 7}px`;
    piece.style.height = `${9 + Math.random() * 12}px`;
    piece.style.borderRadius = Math.random() > 0.75 ? "50%" : "2px";
    piece.dataset.spawnedAt = String(now);
    if (reduce) {
      piece.style.top = `${8 + Math.random() * 70}vh`;
      piece.style.animation = "none";
    } else {
      piece.style.animationDuration = `${2.4 + Math.random() * 1.5}s`;
      piece.style.animationDelay = `${Math.random() * 0.12}s`;
    }
    els.confetti.appendChild(piece);
  }

  confettiTimer = window.setTimeout(() => {
    const cutoff = Date.now() - 3200;
    els.confetti.querySelectorAll(".confetti").forEach((piece) => {
      const spawned = Number(piece.dataset.spawnedAt || "0");
      if (spawned < cutoff) piece.remove();
    });
  }, 3800);
}

function extinguishAllCandles() {
  const candles = document.querySelectorAll("#cake .candle");
  if (!candles.length || page !== 5) return;
  candles.forEach((candle) => candle.classList.add("extinguished"));
  updateHint();
  burstConfetti();
}

function computeRmsNormalized(timeDomainBytes) {
  let sumSq = 0;
  for (let i = 0; i < timeDomainBytes.length; i += 1) {
    const v = (timeDomainBytes[i] - 128) / 128;
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / timeDomainBytes.length);
}

function analyzeMic() {
  if (!micState.analyser || !micState.dataArray) return;

  micState.analyser.getByteTimeDomainData(micState.dataArray);
  const rms = computeRmsNormalized(micState.dataArray);
  micState.smoothed = micState.smoothed * 0.88 + rms * 0.12;

  const lit = document.querySelectorAll("#cake .candle:not(.extinguished)");
  const now = Date.now();

  if (page === 5 && lit.length > 0 && micState.smoothed > 0.12 && now - micState.lastBlowAt > 1400) {
    micState.lastBlowAt = now;
    extinguishAllCandles();
  }

  micState.rafId = requestAnimationFrame(analyzeMic);
}

function stopMic() {
  micToken += 1;
  if (micState.rafId) cancelAnimationFrame(micState.rafId);
  if (micState.stream) micState.stream.getTracks().forEach((track) => track.stop());
  if (micState.audioContext && micState.audioContext.state !== "closed") {
    micState.audioContext.close();
  }
  micState = freshMic();
  els.micBtn.disabled = false;
  els.micBtn.textContent = "Turn on the microphone";
  els.micBtn.setAttribute("aria-pressed", "false");
}

async function enableMic() {
  if (micState.enabled || page !== 5) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setHint("This browser needs an https:// address to use the microphone.");
    return;
  }

  const token = ++micToken;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    if (token !== micToken) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Safari hands back a suspended context until the page asks it to start.
    if (audioContext.state === "suspended") await audioContext.resume();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    micState = {
      enabled: true,
      audioContext,
      analyser,
      dataArray: new Uint8Array(analyser.fftSize),
      rafId: requestAnimationFrame(analyzeMic),
      stream,
      smoothed: 0,
      lastBlowAt: 0,
    };

    els.micBtn.textContent = "Microphone is on";
    els.micBtn.disabled = true;
    els.micBtn.setAttribute("aria-pressed", "true");
    updateHint();
  } catch (err) {
    console.error(err);
    if (token !== micToken) return;
    setHint("The microphone stayed off. You can still light candles by tapping.");
  }
}

function resetCake() {
  clearCandles();
  clearSprinkles();
  clearConfetti();
  stickerItems = [];
  lastAngel = null;
  paintStickers();
  paintAngel();
  updateHint();
}

function resetAll() {
  turnToken += 1;
  turning = false;
  stopMic();
  clearCandles();
  clearSprinkles();
  clearConfetti();
  stickerItems = [];
  lastAngel = null;
  paintStickers();
  page = 0;
  els.book.classList.remove("is-open", "is-opening", "is-closing", "is-turning");
  els.flipper.classList.remove("is-active", "is-animating", "is-forward", "is-back");
  els.flipFront.innerHTML = "";
  els.flipBack.innerHTML = "";
  els.sheetLeft.innerHTML = "";
  els.sheetRight.innerHTML = "";
  els.sheetSingle.innerHTML = "";
  updateChrome();
  focusCover();
}

function onForwardSheet(event) {
  if (turning || page === 0 || page === 5) return;
  if (event.target.closest(".door")) {
    goTo(5);
    return;
  }
  if (event.target.closest("#cake, .page-hotspot")) return;
  if (page >= 1 && page <= 3) goTo(page + 1);
}

function placeCandleFromEvent(event) {
  if (page !== 5) return;
  const cake = document.getElementById("cake");
  if (!cake) return;

  const rect = cake.getBoundingClientRect();
  const layoutW = cake.offsetWidth;
  const layoutH = cake.offsetHeight;
  if (!rect.width || !rect.height) return;

  const x = ((event.clientX - rect.left) / rect.width) * layoutW;
  const y = ((event.clientY - rect.top) / rect.height) * layoutH;

  if (!isOnCakeTop({ x, y, w: layoutW, h: layoutH })) {
    setHint("Tap the frosting on top of the cake.");
    return;
  }

  addCandleAtPoint({
    xPx: clamp(x, 18, layoutW - 18),
    yPx: clamp(y, 28, layoutH * 0.38),
  });
}

els.cover.addEventListener("click", () => {
  if (page === 0) goTo(1);
});

els.nextHotspot.addEventListener("click", () => {
  if (page >= 1 && page <= 3) goTo(page + 1);
});

els.backHotspot.addEventListener("click", () => {
  if (page === 1) goTo(0);
  else if (page > 1 && page <= 4) goTo(page - 1);
});

els.sheetRight.addEventListener("click", onForwardSheet);
els.sheetSingle.addEventListener("click", onForwardSheet);

document.addEventListener("keydown", (event) => {
  const cake = document.getElementById("cake");
  if (!cake || document.activeElement !== cake) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  const layoutW = cake.offsetWidth;
  const layoutH = cake.offsetHeight;
  addCandleAtPoint({ xPx: layoutW * 0.5, yPx: layoutH * 0.2 });
});

function paintAngel() {
  const box = document.getElementById("cakeAngel");
  if (!box) return;
  if (!lastAngel) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const number = box.querySelector(".cake-angel__n");
  const meaning = box.querySelector(".cake-angel__m");
  if (number) number.textContent = lastAngel.n;
  if (meaning) meaning.textContent = lastAngel.meaning;
}

function showAngelNumber() {
  lastAngel = ANGEL_NUMBERS[(Math.random() * ANGEL_NUMBERS.length) | 0];
  paintAngel();
}

els.sprinkleBtn.addEventListener("click", () => {
  addSprinkles();
});

els.angelBtn.addEventListener("click", () => {
  showAngelNumber();
});

els.resetCakeBtn.addEventListener("click", () => {
  resetCake();
});

els.micBtn.addEventListener("click", () => {
  enableMic();
});

els.resetBtn.addEventListener("click", () => {
  resetAll();
});

function relayout() {
  const nextMobile = isMobile();
  if (nextMobile !== layoutMobile) {
    layoutMobile = nextMobile;
    els.book.classList.toggle("is-mobile", nextMobile);
    if (page > 0) mountView(getView(page));
  }
  scaleCake();
  positionDoors();
  paintStickers();
}

window.addEventListener("resize", relayout);
window.addEventListener("orientationchange", () => {
  window.setTimeout(relayout, 250);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", relayout);
}

if (mobileMedia.addEventListener) mobileMedia.addEventListener("change", relayout);
else mobileMedia.addListener(relayout);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(relayout);
}

wrapWords(els.cover);
wrapWords(document.querySelector(".tools"));
updateChrome();
