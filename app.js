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
    goal: String(formData.get("goal") || "").trim(),
    tone: String(formData.get("tone") || "").trim(),
    language: String(formData.get("language") || "").trim(),
    audience: String(formData.get("audience") || "").trim(),
  };
}

function scoreVariant(text, index) {
  const lengthScore = Math.min(24, Math.round(text.length / 12));
  const detailScore = (text.match(/[,.;:]/g) || []).length * 3;
  const base = 68 + index * 5 + lengthScore + detailScore;

  return Math.max(0, Math.min(100, base));
}

function createMockVariants(payload) {
  const context = [
    payload.goal && `Ziel: ${payload.goal}`,
    payload.audience && `Zielgruppe: ${payload.audience}`,
    payload.tone && `Ton: ${payload.tone}`,
    payload.language && `Sprache: ${payload.language}`,
  ]
    .filter(Boolean)
    .join("; ");

  const contextLine = context ? ` Beruecksichtige dabei: ${context}.` : "";
  const prompt = payload.inputPrompt.replace(/\s+/g, " ");

  const variants = [
    {
      text: `Verbessere folgenden Prompt so, dass er klarer, konkreter und leichter ausfuehrbar ist: "${prompt}".${contextLine}`,
      reason: "Macht die Aufgabe klarer und reduziert unnoetige Offenheit.",
    },
    {
      text: `Analysiere den Prompt "${prompt}" und formuliere daraus eine praezise Anweisung mit Ziel, Kontext, Ausgabeformat und Qualitaetskriterien.${contextLine}`,
      reason: "Fuegt Struktur hinzu und zwingt die KI zu besser verwertbaren Antworten.",
    },
    {
      text: `Erstelle eine optimierte Version dieses Prompts: "${prompt}". Entferne unklare Woerter, ergaenze fehlenden Kontext und gib ein konkretes Ergebnisformat vor.${contextLine}`,
      reason: "Fokussiert auf Praezision, Effizienz und messbares Ergebnis.",
    },
    {
      text: `Du bist ein Prompt-Experte. Wandle "${prompt}" in einen starken Prompt um, der Aufgabe, Rahmenbedingungen, Zielgruppe, Stil und erwartete Ausgabe eindeutig beschreibt.${contextLine}`,
      reason: "Setzt eine klare Rolle und deckt mehrere Qualitaetsdimensionen ab.",
    },
    {
      text: `Optimiere diesen Prompt maximal: "${prompt}". Liefere eine kurze, direkte und vollstaendige Version mit eindeutiger Aufgabe, relevanten Details, Ausgabeformat und Erfolgskriterien.${contextLine}`,
      reason: "Beste Balance aus Kuerze, Genauigkeit und praktischer Nutzbarkeit.",
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
            <h3 class="variant-title">Variante ${index + 1}${isBest ? " · Beste Wahl" : ""}</h3>
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
  submitButton.textContent = isLoading ? "Analysiere..." : "Prompt verbessern";
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
