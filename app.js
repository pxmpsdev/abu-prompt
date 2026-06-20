const form = document.querySelector("#prompt-form");
const inputPrompt = document.querySelector("#inputPrompt");
const promptError = document.querySelector("#prompt-error");
const submitButton = document.querySelector("#submit-button");
const clearButton = document.querySelector("#clear-button");
const emptyState = document.querySelector("#empty-state");
const loadingState = document.querySelector("#loading-state");
const results = document.querySelector("#results");
const bestScore = document.querySelector("#best-score");

function getFormPayload() {
  const formData = new FormData(form);

  return {
    inputPrompt: String(formData.get("inputPrompt") || "").trim(),
  };
}

function scoreVariant(text, index) {
  const lengthScore = Math.min(18, Math.round(text.length / 18));
  const detailScore = (text.match(/[,.;:]/g) || []).length * 2;
  const base = 74 + index * 4 + lengthScore + detailScore;

  return Math.max(0, Math.min(100, base));
}

function createMockVariants(payload) {
  const prompt = payload.inputPrompt.replace(/\s+/g, " ");

  const variants = [
    {
      name: "Targeted Fix",
      text: `Ueberarbeite diesen Prompt gezielt: "${prompt}". Entferne unklare Formulierungen, ergaenze fehlenden Kontext und formuliere die Aufgabe direkt aus.`,
      reason: "Schnelle Verbesserung, wenn der Prompt schon gut ist, aber klarer und genauer werden soll.",
    },
    {
      name: "Technique Injection",
      text: `Nutze eine strukturierte Prompt-Technik fuer: "${prompt}". Definiere Rolle, Ziel, Kontext, Arbeitsschritte, Ausgabeformat und Qualitaetskriterien.`,
      reason: "Fuegt eine starke Methode hinzu und macht die Antwort planbarer.",
    },
    {
      name: "Self-Reflection Rubric",
      text: `Verbessere den Prompt "${prompt}" und pruefe die Antwort anschliessend mit einer kurzen Rubric: Klarheit, Vollstaendigkeit, Genauigkeit und Nuetzlichkeit.`,
      reason: "Laesst die KI ihre eigene Antwort gegen klare Kriterien pruefen.",
    },
  ];

  return variants.map((variant, index) => ({
    ...variant,
    score: scoreVariant(variant.text, index),
  }));
}

function renderResults(variants) {
  const bestVariantIndex = variants.reduce((bestIndex, variant, index) => {
    return variant.score > variants[bestIndex].score ? index : bestIndex;
  }, 0);

  setBestScore(variants[bestVariantIndex].score);
  results.innerHTML = variants
    .map((variant, index) => {
      const isBest = index === bestVariantIndex;

      return `
        <article class="variant-card${isBest ? " best" : ""}">
          <div class="variant-topline">
            <h3 class="variant-title">${escapeHtml(variant.name)}${isBest ? " · Beste Wahl" : ""}</h3>
            <span class="variant-score">${variant.score}/100</span>
          </div>
          <p class="variant-text">${escapeHtml(variant.text)}</p>
          <p class="variant-reason">${escapeHtml(variant.reason)}</p>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.setAttribute("aria-label", isLoading ? "Analyse laeuft" : "Prompt senden");
  submitButton.innerHTML = isLoading
    ? '<span class="button-loader" aria-hidden="true"></span>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>';
  loadingState.hidden = !isLoading;
}

function setBestScore(score) {
  bestScore.value = String(score);
  bestScore.textContent = String(score);
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
  emptyState.hidden = true;
  results.innerHTML = "";
  setBestScore(0);
  setLoading(true);

  await new Promise((resolve) => setTimeout(resolve, 650));

  const variants = createMockVariants(payload);
  setLoading(false);
  renderResults(variants);
});

clearButton.addEventListener("click", () => {
  form.reset();
  promptError.textContent = "";
  results.innerHTML = "";
  emptyState.hidden = false;
  loadingState.hidden = true;
  setBestScore(0);
  inputPrompt.focus();
});

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
