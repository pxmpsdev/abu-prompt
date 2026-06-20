const appShell = document.querySelector(".app-shell");
const homePage = document.querySelector("#home-page");
const composerPanel = document.querySelector(".composer-panel");
const form = document.querySelector("#prompt-form");
const inputPrompt = document.querySelector("#inputPrompt");
const promptError = document.querySelector("#prompt-error");
const submitButton = document.querySelector("#submit-button");
const clearButton = document.querySelector("#clear-button");
const attachTxtButton = document.querySelector("#attach-txt-button");
const txtFileInput = document.querySelector("#txt-file-input");
const attachmentPreview = document.querySelector("#attachment-preview");
const loaderView = document.querySelector("#loader-view");
const planningView = document.querySelector("#planning-view");
const planningToggle = document.querySelector("#planning-toggle");
const planningBody = document.querySelector("#planning-body");
const planningSteps = Array.from(document.querySelectorAll(".planning-steps li"));
const resultPanel = document.querySelector("#result-panel");
const results = document.querySelector("#results");
const bestScore = document.querySelector("#best-score");
const startOverButton = document.querySelector("#start-over-button");
const fluxLabel = document.querySelector("#flux-label");
const fluxTrack = document.querySelector("#flux-track");
const fluxFill = document.querySelector("#flux-fill");
const getStartedButtons = Array.from(document.querySelectorAll("[data-get-started]"));

const apiBaseUrl = "http://localhost:3000";
const maxPromptLength = 8000;
const loaderDurationMs = 2000;
const loaderPhases = [
  { at: 0, label: "Reading prompt" },
  { at: 25, label: "Building context" },
  { at: 55, label: "Drafting variants" },
  { at: 80, label: "Calculating scores" },
  { at: 100, label: "Done" },
];

let loaderFrame = 0;
let planningTimers = [];
let activeAbortController = null;

function getRouteName() {
  return window.location.pathname.replace(/\/+$/, "") === "/workspace" ? "workspace" : "home";
}

function getFormPayload() {
  const formData = new FormData(form);

  return {
    inputPrompt: String(formData.get("inputPrompt") || "").trim(),
  };
}

async function improvePrompt(prompt, signal) {
  const response = await fetch(`${apiBaseUrl}/api/prompts/improve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!response.ok) {
    throw new Error("Prompt could not be improved.");
  }

  return response.json();
}

function renderResults(result) {
  const variants = Array.isArray(result.variants) ? result.variants.slice(0, 3) : [];
  const complaints = Array.isArray(result.complaints) ? result.complaints.slice(0, 10) : [];
  const bestVariantIndex = variants.findIndex((variant) => variant.id === result.bestVariantId || variant.isWinner);
  const resolvedBestIndex = bestVariantIndex >= 0 ? bestVariantIndex : 0;
  const complaintItems = complaints.map((complaint) => `<li>${escapeHtml(complaint)}</li>`).join("");

  setBestScore(variants[resolvedBestIndex]?.score ?? 0);

  const variantCards = variants
    .map((variant, index) => {
      const isBest = index === resolvedBestIndex;
      const title = `${variant.name || `Variant ${index + 1}`} - ${variant.technique || "Prompt Update"}`;

      return `
        <article class="variant-card${isBest ? " best" : ""}">
          <div class="variant-topline">
            <h2 class="variant-title">${escapeHtml(title)}</h2>
            <div class="variant-actions">
              <span class="variant-score">${escapeHtml(variant.score ?? 0)}/100</span>
              <button class="copy-variant-button" type="button" data-prompt="${escapeHtml(variant.prompt || "")}" aria-label="Copy ${escapeHtml(title)}" title="Copy prompt">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="9" y="9" width="11" height="11" rx="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
              </button>
            </div>
          </div>
          <p class="variant-prompt">${renderPromptDiff(result.inputPrompt || "", variant.prompt || "")}</p>
          <p class="variant-reason">${escapeHtml(variant.reason || "")}</p>
        </article>
      `;
    })
    .join("");

  results.innerHTML = `
    <section class="result-map${complaints.length ? " has-complaints" : ""}" aria-label="Prompt variations">
      <article class="source-card">
        <span class="node-label">Original prompt</span>
        <p>${escapeHtml(result.inputPrompt || "")}</p>
      </article>

      ${
        complaints.length
          ? `<article class="complaints-card">
              <div class="complaints-head">
                <span>Complaints analyzed</span>
                <strong>${complaints.length}</strong>
              </div>
              <ol>${complaintItems}</ol>
            </article>`
          : ""
      }

      <div class="animated-beam-stage" aria-hidden="true">
        <svg class="beam-svg" viewBox="0 0 1000 128" preserveAspectRatio="none">
          <defs>
            <linearGradient id="animated-beam-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="0">
              <stop stop-color="#ffaa40" stop-opacity="0"></stop>
              <stop stop-color="#ffaa40"></stop>
              <stop offset="32.5%" stop-color="#9c40ff"></stop>
              <stop offset="100%" stop-color="#9c40ff" stop-opacity="0"></stop>
              <animate attributeName="x1" values="10%;110%" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1"></animate>
              <animate attributeName="x2" values="0%;100%" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1"></animate>
              <animate attributeName="y1" values="0%;0%" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1"></animate>
              <animate attributeName="y2" values="0%;0%" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1"></animate>
            </linearGradient>
            <linearGradient id="animated-beam-gradient-reverse" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="0">
              <stop stop-color="#ffaa40" stop-opacity="0"></stop>
              <stop stop-color="#ffaa40"></stop>
              <stop offset="32.5%" stop-color="#9c40ff"></stop>
              <stop offset="100%" stop-color="#9c40ff" stop-opacity="0"></stop>
              <animate attributeName="x1" values="90%;-10%" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1"></animate>
              <animate attributeName="x2" values="100%;0%" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1"></animate>
              <animate attributeName="y1" values="0%;0%" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1"></animate>
              <animate attributeName="y2" values="0%;0%" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1"></animate>
            </linearGradient>
          </defs>
          <path class="beam-path beam-path-base" d="M 500,0 Q 166,44 166,118"></path>
          <path class="beam-path beam-path-base" d="M 500,0 Q 500,62 500,118"></path>
          <path class="beam-path beam-path-base" d="M 500,0 Q 834,44 834,118"></path>
          <path class="beam-path beam-path-gradient reverse" d="M 500,0 Q 166,44 166,118"></path>
          <path class="beam-path beam-path-gradient" d="M 500,0 Q 500,62 500,118"></path>
          <path class="beam-path beam-path-gradient" d="M 500,0 Q 834,44 834,118"></path>
        </svg>
        <span class="beam-node beam-node-source"></span>
        <span class="beam-node beam-node-a"></span>
        <span class="beam-node beam-node-b"></span>
        <span class="beam-node beam-node-c"></span>
      </div>

      <div class="variant-grid">
        ${variantCards}
      </div>
    </section>
  `;
}

function renderPromptDiff(originalPrompt, improvedPrompt) {
  const originalTokens = tokenizePrompt(originalPrompt);
  const improvedTokens = tokenizePrompt(improvedPrompt);
  const dp = Array.from({ length: originalTokens.length + 1 }, () => Array(improvedTokens.length + 1).fill(0));

  for (let i = originalTokens.length - 1; i >= 0; i -= 1) {
    for (let j = improvedTokens.length - 1; j >= 0; j -= 1) {
      dp[i][j] =
        normalizeToken(originalTokens[i]) === normalizeToken(improvedTokens[j])
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const parts = [];
  let i = 0;
  let j = 0;

  while (i < originalTokens.length && j < improvedTokens.length) {
    if (normalizeToken(originalTokens[i]) === normalizeToken(improvedTokens[j])) {
      parts.push(`<span>${escapeHtml(improvedTokens[j])}</span>`);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      parts.push(`<del>${escapeHtml(originalTokens[i])}</del>`);
      i += 1;
    } else {
      parts.push(`<ins>${escapeHtml(improvedTokens[j])}</ins>`);
      j += 1;
    }
  }

  while (i < originalTokens.length) {
    parts.push(`<del>${escapeHtml(originalTokens[i])}</del>`);
    i += 1;
  }

  while (j < improvedTokens.length) {
    parts.push(`<ins>${escapeHtml(improvedTokens[j])}</ins>`);
    j += 1;
  }

  return parts.join(" ");
}

function tokenizePrompt(value) {
  return String(value).match(/\S+/g) || [];
}

function normalizeToken(value) {
  return value.toLowerCase();
}

function createFallbackResult(prompt) {
  return {
    inputPrompt: prompt,
    complaints: [
      "Prompt objective is not specific enough",
      "Audience or target model is missing",
      "Output format is not defined",
      "Quality criteria are vague",
      "Context is too thin",
      "Constraints need clearer wording",
      "Tone or style is underspecified",
      "Important negative constraints are missing",
      "Success criteria are not measurable",
      "Some words are too generic"
    ],
    bestVariantId: "variant-c",
    variants: [
      {
        id: "variant-a",
        name: "Variant A",
        technique: "Targeted Fix",
        score: 86,
        prompt: `${prompt} Add clear subject framing, sharper visual details, explicit style constraints, and a concise quality target while preserving the original composition.`,
        reason: "Makes the prompt more concrete and reduces interpretation gaps.",
      },
      {
        id: "variant-b",
        name: "Variant B",
        technique: "Technique Injection",
        score: 89,
        prompt: `${prompt} Use precise photographic language, define the desired mood and composition, and keep negative constraints direct and production-ready.`,
        reason: "Adds stronger structure while keeping the prompt ready to use.",
      },
      {
        id: "variant-c",
        name: "Variant C",
        technique: "Self-Reflection Rubric",
        isWinner: true,
        score: 92,
        prompt: `${prompt} Clarify the main subject, lighting, camera perspective, background separation, realism level, and exclusion rules in one polished final prompt.`,
        reason: "Combines wording improvements with a practical quality check.",
      },
    ],
  };
}

function setView(state) {
  const routeName = getRouteName();
  appShell.dataset.state = state;
  appShell.dataset.route = routeName;
  homePage.hidden = state !== "idle" || routeName === "workspace";
  loaderView.hidden = state !== "loading";
  planningView.hidden = state !== "planning";
  resultPanel.hidden = state !== "results";
  composerPanel.hidden = state !== "idle" || routeName !== "workspace";
}

function setLoadingButton(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.setAttribute("aria-label", isLoading ? "Analysis running" : "Submit prompt");
  submitButton.innerHTML = isLoading
    ? '<span class="button-loader" aria-hidden="true"></span>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>';
}

function setBestScore(score) {
  const normalizedScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  bestScore.value = String(normalizedScore);
  bestScore.textContent = `\u2605 ${normalizedScore}/100`;
}

function startFluxLoader() {
  cancelAnimationFrame(loaderFrame);
  const startedAt = performance.now();
  let previousLabel = "";

  const tick = (now) => {
    const progress = Math.min(100, ((now - startedAt) / loaderDurationMs) * 100);
    const rounded = Math.round(progress);
    const label = pickLabel(progress);

    fluxFill.style.width = `${progress}%`;
    fluxTrack.setAttribute("aria-valuenow", String(rounded));
    fluxTrack.setAttribute("aria-valuetext", `${rounded}% - ${label}`);

    if (label !== previousLabel) {
      previousLabel = label;
      fluxLabel.textContent = label;
      fluxLabel.classList.remove("is-switching");
      void fluxLabel.offsetWidth;
      fluxLabel.classList.add("is-switching");
    }

    if (progress < 100) {
      loaderFrame = requestAnimationFrame(tick);
    }
  };

  fluxFill.style.width = "0%";
  fluxLabel.textContent = loaderPhases[0].label;
  loaderFrame = requestAnimationFrame(tick);
}

function stopFluxLoader() {
  cancelAnimationFrame(loaderFrame);
  fluxFill.style.width = "100%";
  fluxTrack.setAttribute("aria-valuenow", "100");
  fluxTrack.setAttribute("aria-valuetext", "100% - Done");
}

function startPlanning() {
  stopPlanning();
  setPlanningStep(0);

  const finalIndex = planningSteps.length - 1;
  const stepDurationMs = 1800;

  if (finalIndex <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    for (let index = 1; index <= finalIndex; index += 1) {
      const timer = window.setTimeout(() => {
        setPlanningStep(index);

        if (index === finalIndex) {
          resolve();
        }
      }, index * stepDurationMs);

      planningTimers.push(timer);
    }
  });
}

function stopPlanning({ complete = false } = {}) {
  planningTimers.forEach((timer) => window.clearTimeout(timer));
  planningTimers = [];

  if (complete) {
    setPlanningStep(planningSteps.length);
  }
}

function setPlanningStep(activeIndex) {
  planningSteps.forEach((step, index) => {
    const duration = step.querySelector(".step-duration");

    step.classList.toggle("is-active", index === activeIndex);
    step.classList.toggle("is-done", index < activeIndex);
    step.classList.toggle("is-pending", index > activeIndex);

    if (duration) {
      if (index < activeIndex) {
        duration.textContent = `${(0.4 + index * 0.7).toFixed(1)}s`;
      } else if (index === activeIndex) {
        duration.textContent = "...";
      } else {
        duration.textContent = "pending";
      }
    }
  });
}

function pickLabel(value) {
  let active = loaderPhases[0].label;
  for (const phase of loaderPhases) {
    if (value >= phase.at) active = phase.label;
  }
  return active;
}

function isTxtFile(file) {
  return file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain" || file.type === "";
}

function insertPromptText(text) {
  const incomingText = text.trim();
  const currentText = inputPrompt.value.trim();

  if (!incomingText) {
    promptError.textContent = "The TXT file is empty.";
    return false;
  }

  const nextText = currentText ? `${currentText}\n\n${incomingText}` : incomingText;

  if (nextText.length > maxPromptLength) {
    promptError.textContent = `The TXT file is too long. Prompts are limited to ${maxPromptLength} characters.`;
    return false;
  }

  inputPrompt.value = nextText;
  resizePromptInput();
  return true;
}

function renderAttachmentPreview(file) {
  attachmentPreview.hidden = false;
  attachmentPreview.innerHTML = `
    <span class="attachment-chip" title="${escapeHtml(file.name)}">
      <span class="attachment-file-icon" aria-hidden="true">TXT</span>
      <span class="attachment-file-name">${escapeHtml(file.name)}</span>
      <span class="attachment-file-size">${formatFileSize(file.size)}</span>
    </span>
  `;
}

function clearAttachment() {
  txtFileInput.value = "";
  attachmentPreview.innerHTML = "";
  attachmentPreview.hidden = true;
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

function resizePromptInput() {
  inputPrompt.style.height = "auto";
  inputPrompt.style.height = `${Math.min(inputPrompt.scrollHeight, 240)}px`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  document.body.append(textArea);
  textArea.select();
  document.execCommand("copy");
  textArea.remove();
}

function resetExperience() {
  activeAbortController?.abort();
  activeAbortController = null;
  cancelAnimationFrame(loaderFrame);
  stopPlanning();
  form.reset();
  clearAttachment();
  inputPrompt.style.height = "";
  promptError.textContent = "";
  results.innerHTML = "";
  setBestScore(0);
  setLoadingButton(false);
  setView("idle");
  inputPrompt.focus();
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function openPromptWorkspace() {
  if (getRouteName() !== "workspace") {
    window.history.pushState({ route: "workspace" }, "", "/workspace");
  }

  setView("idle");
  composerPanel.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => {
    inputPrompt.focus();
  }, 420);
}

async function requestPromptResult(prompt, signal) {
  const result = await improvePrompt(prompt, signal)
    .then((response) => (isValidResult(response) ? response : null))
    .catch(() => null);

  if (!result) {
    return createFallbackResult(prompt);
  }

  return {
    ...result,
    inputPrompt: result.inputPrompt || prompt,
  };
}

async function getResultWithLoadingFlow(prompt) {
  activeAbortController?.abort();

  await delay(loaderDurationMs);
  stopFluxLoader();
  setView("planning");
  const planningDone = startPlanning();

  activeAbortController = new AbortController();

  try {
    const [result] = await Promise.all([requestPromptResult(prompt, activeAbortController.signal), planningDone]);
    return result;
  } finally {
    activeAbortController = null;
    stopPlanning({ complete: true });
  }
}

function isValidResult(result) {
  return Boolean(result && Array.isArray(result.variants) && result.variants.length >= 3);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = getFormPayload();

  if (!payload.inputPrompt) {
    promptError.textContent = "Please enter an original prompt first.";
    inputPrompt.focus();
    return;
  }

  promptError.textContent = "";
  results.innerHTML = "";
  setBestScore(0);
  setLoadingButton(true);
  setView("loading");
  startFluxLoader();

  const result = await getResultWithLoadingFlow(payload.inputPrompt);

  renderResults(result);
  setLoadingButton(false);
  setView("results");
});

clearButton.addEventListener("click", resetExperience);
startOverButton.addEventListener("click", resetExperience);

getStartedButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openPromptWorkspace();
  });
});

window.addEventListener("popstate", () => {
  setView("idle");
});

setView("idle");

planningToggle.addEventListener("click", () => {
  const isExpanded = planningToggle.getAttribute("aria-expanded") === "true";
  planningToggle.setAttribute("aria-expanded", String(!isExpanded));
  planningBody.hidden = isExpanded;
});

results.addEventListener("click", async (event) => {
  const copyButton = event.target.closest(".copy-variant-button");

  if (!copyButton) {
    return;
  }

  const originalLabel = copyButton.querySelector("span")?.textContent || "Copy";
  const prompt = copyButton.dataset.prompt || "";

  try {
    await copyText(prompt);
    copyButton.classList.add("is-copied");
    copyButton.querySelector("span").textContent = "Copied";

    window.setTimeout(() => {
      copyButton.classList.remove("is-copied");
      copyButton.querySelector("span").textContent = originalLabel;
    }, 1400);
  } catch {
    copyButton.querySelector("span").textContent = "Error";
    window.setTimeout(() => {
      copyButton.querySelector("span").textContent = originalLabel;
    }, 1400);
  }
});

attachTxtButton.addEventListener("click", () => {
  txtFileInput.click();
});

txtFileInput.addEventListener("change", async () => {
  const file = txtFileInput.files?.[0];

  if (!file) {
    return;
  }

  if (!isTxtFile(file)) {
    promptError.textContent = "Please choose a .txt file.";
    clearAttachment();
    return;
  }

  try {
    const text = await file.text();
    const wasInserted = insertPromptText(text);

    if (wasInserted) {
      promptError.textContent = "";
      renderAttachmentPreview(file);
      inputPrompt.focus();
    } else {
      clearAttachment();
    }
  } catch {
    promptError.textContent = "The TXT file could not be read.";
    clearAttachment();
  }
});

inputPrompt.addEventListener("input", () => {
  resizePromptInput();
});

inputPrompt.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
