const negativeFields = [
  ["ik", "抗强度 Iₖ", "痛苦、压力、阻滞的核心强度", 5],
  ["dk", "抗持续 Dₖ", "负向感受已持续或预计持续的长度", 5],
  ["b", "身体负荷 B", "紧绷、疼痛、疲惫、胃堵等身体代价", 5],
  ["r", "认知占用 R", "反复想起、侵入注意力、难以摆脱", 5],
];

const positiveFields = [
  ["in", "柠强度 Iₙ", "愉悦、满足、安宁、兴奋的核心强度", 5],
  ["dn", "柠持续 Dₙ", "正向感受已持续或预计持续的长度", 5],
  ["m", "意义增益 M", "值得、成长、连接、理解感", 5],
  ["s", "身体舒展 S", "放松、轻盈、舒适、呼吸打开", 5],
];

const modifierFields = [
  ["g", "可控性 G", "能否选择、停止、解释或调整体验", 5],
  ["c", "置信度 C", "你对本次评分准确性的把握", 5],
];

const constants = [
  ["a", "抗持续系数 a", 0.08],
  ["bCoef", "身体负荷系数 b", 0.05],
  ["cCoef", "认知占用系数 c", 0.04],
  ["d", "可控抗修正 d", 0.04],
  ["e", "柠持续系数 e", 0.06],
  ["f", "意义增益系数 f", 0.05],
  ["gCoef", "身体舒展系数 g", 0.03],
  ["h", "可控柠修正 h", 0.03],
];

const defaults = Object.fromEntries([
  ...negativeFields.map(([id, , , value]) => [id, value]),
  ...positiveFields.map(([id, , , value]) => [id, value]),
  ...modifierFields.map(([id, , , value]) => [id, value]),
  ...constants.map(([id, , value]) => [id, value]),
]);

const elements = {
  negativeInputs: document.querySelector("#negativeInputs"),
  positiveInputs: document.querySelector("#positiveInputs"),
  modifierInputs: document.querySelector("#modifierInputs"),
  constantInputs: document.querySelector("#constantInputs"),
  eventName: document.querySelector("#eventName"),
  kScore: document.querySelector("#kScore"),
  nScore: document.querySelector("#nScore"),
  knScore: document.querySelector("#knScore"),
  confidenceScore: document.querySelector("#confidenceScore"),
  scoreLabel: document.querySelector("#scoreLabel"),
  scoreHint: document.querySelector("#scoreHint"),
  interpretation: document.querySelector("#interpretation"),
  resultText: document.querySelector("#resultText"),
  resetBtn: document.querySelector("#resetBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  downloadBtn: document.querySelector("#downloadBtn"),
  gauge: document.querySelector("#gauge"),
};

function createRange(container, field, options = {}) {
  const [id, label, help, value] = field;
  const min = options.min ?? 0;
  const max = options.max ?? 10;
  const step = options.step ?? 1;
  const row = document.createElement("div");
  row.className = "input-row";
  row.innerHTML = `
    <div class="row-head">
      <label for="${id}">${label}</label>
      <output id="${id}Value" for="${id}">${value}</output>
    </div>
    <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" />
    <small>${help}</small>
  `;
  container.appendChild(row);
}

function renderInputs() {
  negativeFields.forEach((field) => createRange(elements.negativeInputs, field));
  positiveFields.forEach((field) => createRange(elements.positiveInputs, field));
  modifierFields.forEach((field) => createRange(elements.modifierInputs, field));
  constants.forEach(([id, label, value]) => {
    createRange(elements.constantInputs, [id, label, "默认取概念模型建议区间的中间值", value], {
      min: 0,
      max: 0.12,
      step: 0.01,
    });
  });
}

function value(id) {
  return Number(document.querySelector(`#${id}`).value);
}

function calculate() {
  const v = Object.fromEntries(Object.keys(defaults).map((id) => [id, value(id)]));
  const k =
    v.ik *
    (1 + v.a * v.dk) *
    (1 + v.bCoef * v.b + v.cCoef * v.r) *
    Math.max(0, 1 - v.d * v.g);
  const n =
    v.in *
    (1 + v.e * v.dn) *
    (1 + v.f * v.m + v.gCoef * v.s) *
    (1 + v.h * v.g);
  const kn = n - k;
  return { ...v, k, n, kn, confidence: Math.round(v.c * 10) };
}

function classify(kn) {
  if (kn <= -30) return ["显著抗态", "当前体验以痛苦、压迫或损耗为主，需要优先关注恢复与支持。", "negative"];
  if (kn < -8) return ["轻中度抗态", "负向体验占优，但仍可能存在可被识别和保留的柠成分。", "negative"];
  if (kn <= 8) return ["中性 / 混合", "当前抗柠值接近 0，表示中性、麻木或抗柠成分相互抵消。", "neutral"];
  if (kn < 30) return ["轻中度柠态", "正向体验占优，愉悦、意义或舒展感已经超过负向负荷。", "positive"];
  return ["显著柠态", "当前体验具有强烈正向净值，可记录它的来源、持续条件和身体状态。", "positive"];
}

function fmt(num) {
  return num.toFixed(2);
}

function updateOutputs() {
  const result = calculate();
  const [label, text, tone] = classify(result.kn);
  elements.kScore.textContent = fmt(result.k);
  elements.nScore.textContent = fmt(result.n);
  elements.knScore.textContent = fmt(result.kn);
  elements.confidenceScore.textContent = `${result.confidence}%`;
  elements.scoreLabel.textContent = label;
  elements.scoreLabel.style.background = tone === "negative" ? "var(--negative-soft)" : tone === "positive" ? "var(--positive-soft)" : "var(--accent-soft)";
  elements.scoreLabel.style.color = tone === "negative" ? "var(--negative)" : tone === "positive" ? "var(--positive)" : "var(--accent)";
  elements.scoreHint.textContent = result.kn < 0 ? "净值偏抗" : result.kn > 0 ? "净值偏柠" : "净值平衡";
  elements.interpretation.textContent = text;
  elements.resultText.value = buildResultText(result, label, text);
  drawGauge(result.kn);
  syncOutputLabels();
}

function buildResultText(result, label, text) {
  return [
    `事件：${elements.eventName.value || "一次未命名体验"}`,
    `抗值 K-：${fmt(result.k)}`,
    `柠值 N+：${fmt(result.n)}`,
    `净抗柠值 KN：${fmt(result.kn)}`,
    `状态：${label}`,
    `置信度：${result.confidence}%`,
    `解释：${text}`,
  ].join("\n");
}

function syncOutputLabels() {
  Object.keys(defaults).forEach((id) => {
    const input = document.querySelector(`#${id}`);
    const output = document.querySelector(`#${id}Value`);
    if (!input || !output) return;
    output.value = Number(input.value).toFixed(input.step.includes(".") ? 2 : 0);
  });
}

function drawGauge(kn) {
  const canvas = elements.gauge;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height * 0.86;
  const radius = width * 0.39;
  ctx.clearRect(0, 0, width, height);
  drawArc(ctx, cx, cy, radius, Math.PI, Math.PI * 1.5, "#b83b4a", 22);
  drawArc(ctx, cx, cy, radius, Math.PI * 1.5, Math.PI * 2, "#087b72", 22);
  drawTicks(ctx, cx, cy, radius);
  const normalized = Math.max(-50, Math.min(50, kn)) / 100 + 0.5;
  const angle = Math.PI + normalized * Math.PI;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(radius - 20, 0);
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#202833";
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#202833";
  ctx.fill();
}

function drawArc(ctx, cx, cy, radius, start, end, color, lineWidth) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawTicks(ctx, cx, cy, radius) {
  ctx.save();
  ctx.strokeStyle = "#9aa4b2";
  ctx.fillStyle = "#687381";
  ctx.font = "20px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  [-50, -30, -8, 0, 8, 30, 50].forEach((tick) => {
    const normalized = tick / 100 + 0.5;
    const angle = Math.PI + normalized * Math.PI;
    const x1 = cx + Math.cos(angle) * (radius - 8);
    const y1 = cy + Math.sin(angle) * (radius - 8);
    const x2 = cx + Math.cos(angle) * (radius + 14);
    const y2 = cy + Math.sin(angle) * (radius + 14);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = tick === 0 ? 4 : 2;
    ctx.stroke();
    const lx = cx + Math.cos(angle) * (radius + 42);
    const ly = cy + Math.sin(angle) * (radius + 42);
    ctx.fillText(String(tick), lx, ly);
  });
  ctx.restore();
}

function reset() {
  Object.entries(defaults).forEach(([id, defaultValue]) => {
    document.querySelector(`#${id}`).value = defaultValue;
  });
  elements.eventName.value = "一次未命名体验";
  updateOutputs();
}

function downloadRecord() {
  const blob = new Blob([elements.resultText.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "抗柠指标记录.txt";
  a.click();
  URL.revokeObjectURL(url);
}

renderInputs();
document.addEventListener("input", updateOutputs);
elements.resetBtn.addEventListener("click", reset);
elements.copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(elements.resultText.value);
  elements.copyBtn.textContent = "已复制";
  setTimeout(() => {
    elements.copyBtn.textContent = "复制结果";
  }, 1200);
});
elements.downloadBtn.addEventListener("click", downloadRecord);
updateOutputs();
