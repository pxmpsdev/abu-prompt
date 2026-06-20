const appShell = document.querySelector(".app-shell");
const form = document.querySelector("#prompt-form");
const inputPrompt = document.querySelector("#inputPrompt");
const promptError = document.querySelector("#prompt-error");
const submitButton = document.querySelector("#submit-button");
const clearButton = document.querySelector("#clear-button");
const loaderView = document.querySelector("#loader-view");
const planningView = document.querySelector("#planning-view");
const planningSteps = Array.from(document.querySelectorAll(".planning-steps li"));
const resultPanel = document.querySelector("#result-panel");
const results = document.querySelector("#results");
const bestScore = document.querySelector("#best-score");
const startOverButton = document.querySelector("#start-over-button");
const fluxLabel = document.querySelector("#flux-label");
const fluxTrack = document.querySelector("#flux-track");
const fluxFill = document.querySelector("#flux-fill");

const apiBaseUrl = "http://localhost:3000";
const loaderDurationMs = 2000;
const minPlanningDurationMs = 800;
const loaderPhases = [
  { at: 0, label: "Prompt lesen" },
  { at: 25, label: "Kontext bauen" },
  { at: 55, label: "Varianten entwerfen" },
  { at: 80, label: "Scores berechnen" },
  { at: 100, label: "Fertig" },
];

let loaderFrame = 0;
let planningTimer = 0;
let activeAbortController = null;

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
    throw new Error("Prompt konnte nicht verbessert werden.");
  }

  return response.json();
}

function renderResults(result) {
  const variants = Array.isArray(result.variants) ? result.variants.slice(0, 3) : [];
  const bestVariantIndex = variants.findIndex((variant) => variant.id === result.bestVariantId || variant.isWinner);
  const resolvedBestIndex = bestVariantIndex >= 0 ? bestVariantIndex : 0;

  setBestScore(variants[resolvedBestIndex]?.score ?? 0);

  const variantCards = variants
    .map((variant, index) => {
      const isBest = index === resolvedBestIndex;
      const title = `${variant.name || `Variante ${index + 1}`} - ${variant.technique || "Prompt Update"}`;

      return `
        <article class="variant-card${isBest ? " best" : ""}">
          <div class="variant-topline">
            <h2 class="variant-title">${escapeHtml(title)}</h2>
            <span class="variant-score">${escapeHtml(variant.score ?? 0)}/100</span>
          </div>
          <p class="variant-prompt">${escapeHtml(variant.prompt || "")}</p>
          <p class="variant-reason">${escapeHtml(variant.reason || "")}</p>
        </article>
      `;
    })
    .join("");

  results.innerHTML = `
    <section class="result-map" aria-label="Prompt Varianten">
      <article class="source-card">
        <span class="node-label">Eingangsprompt</span>
        <p>${escapeHtml(result.inputPrompt || "")}</p>
      </article>

      <div class="connector-stage" aria-hidden="true">
        <span class="connector-drop"></span>
        <span class="connector-drop"></span>
        <span class="connector-drop"></span>
      </div>

      <div class="variant-grid">
        ${variantCards}
      </div>
    </section>
  `;
}

function createFallbackResult(prompt) {
  return {
    inputPrompt: prompt,
    bestVariantId: "variant-c",
    variants: [
      {
        id: "variant-a",
        name: "Variante A",
        technique: "Targeted Fix",
        score: 86,
        prompt: `Ueberarbeite diesen Prompt so, dass Ziel, Kontext, Zielgruppe, Ausgabeformat und Erfolgskriterien klar sind: ${prompt}`,
        reason: "Macht den Auftrag konkreter und reduziert Interpretationsspielraum.",
      },
      {
        id: "variant-b",
        name: "Variante B",
        technique: "Technique Injection",
        score: 89,
        prompt: `Handle als erfahrener Prompt Engineer. Verwandle diesen Rohprompt in einen direkt nutzbaren Prompt mit Rolle, Aufgabe, Kontext, Constraints und gewuenschtem Format: ${prompt}`,
        reason: "Fuegt Struktur und klare Rollenlogik hinzu.",
      },
      {
        id: "variant-c",
        name: "Variante C",
        technique: "Self-Reflection Rubric",
        isWinner: true,
        score: 92,
        prompt: `Erstelle aus dem folgenden Prompt eine praezise Version. Pruefe vor der finalen Antwort, ob Ziel, Kontext, Format, Tonalitaet, Grenzen und Bewertungskriterien vollstaendig abgedeckt sind: ${prompt}`,
        reason: "Kombiniert Verbesserung mit einer internen Qualitaetspruefung.",
      },
    ],
  };
}

function setView(state) {
  appShell.dataset.state = state;
  loaderView.hidden = state !== "loading";
  planningView.hidden = state !== "planning";
  resultPanel.hidden = state !== "results";
  document.querySelector(".composer-panel").hidden = state !== "idle";
}

function setLoadingButton(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.setAttribute("aria-label", isLoading ? "Analyse laeuft" : "Prompt senden");
  submitButton.innerHTML = isLoading
    ? '<span class="button-loader" aria-hidden="true"></span>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>';
}

function setBestScore(score) {
  bestScore.value = String(score);
  bestScore.textContent = String(score);
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
  fluxTrack.setAttribute("aria-valuetext", "100% - Fertig");
}

function startPlanning() {
  stopPlanning();
  let activeIndex = 0;
  setPlanningStep(activeIndex);
  planningTimer = window.setInterval(() => {
    activeIndex = (activeIndex + 1) % planningSteps.length;
    setPlanningStep(activeIndex);
  }, 760);
}

function stopPlanning() {
  window.clearInterval(planningTimer);
  planningTimer = 0;
}

function setPlanningStep(activeIndex) {
  planningSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === activeIndex);
    step.classList.toggle("is-done", index < activeIndex);
  });
}

function pickLabel(value) {
  let active = loaderPhases[0].label;
  for (const phase of loaderPhases) {
    if (value >= phase.at) active = phase.label;
  }
  return active;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetExperience() {
  activeAbortController?.abort();
  activeAbortController = null;
  cancelAnimationFrame(loaderFrame);
  stopPlanning();
  form.reset();
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
  activeAbortController = new AbortController();
  const request = requestPromptResult(prompt, activeAbortController.signal);

  await delay(loaderDurationMs);
  stopFluxLoader();
  setView("planning");
  startPlanning();

  const [result] = await Promise.all([request, delay(minPlanningDurationMs)]);
  activeAbortController = null;
  stopPlanning();
  return result;
}

function isValidResult(result) {
  return Boolean(result && Array.isArray(result.variants) && result.variants.length >= 3);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = getFormPayload();

  if (!payload.inputPrompt) {
    promptError.textContent = "Bitte gib zuerst einen Eingangsprompt ein.";
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

inputPrompt.addEventListener("input", () => {
  inputPrompt.style.height = "auto";
  inputPrompt.style.height = `${Math.min(inputPrompt.scrollHeight, 240)}px`;
});

inputPrompt.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
