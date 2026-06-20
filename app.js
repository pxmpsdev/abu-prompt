const form = document.querySelector("#prompt-form");
const inputPrompt = document.querySelector("#inputPrompt");
const promptError = document.querySelector("#prompt-error");
const submitButton = document.querySelector("#submit-button");
const clearButton = document.querySelector("#clear-button");
const emptyState = document.querySelector("#empty-state");
const loadingState = document.querySelector("#loading-state");
const results = document.querySelector("#results");
const bestScore = document.querySelector("#best-score");
const apiBaseUrl = "http://localhost:3000";

function getFormPayload() {
  const formData = new FormData(form);

  return {
    inputPrompt: String(formData.get("inputPrompt") || "").trim(),
  };
}

async function improvePrompt(prompt) {
  const response = await fetch(`${apiBaseUrl}/api/prompts/improve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    let message = "KI-Endpunkt nicht erreichbar. Pruefe Backend, AI_BASE_URL, AI_MODEL und ob der Sonnet-Service laeuft.";

    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Keep the local configuration hint above.
    }

    throw new Error(message);
  }

  return response.json();
}

function renderResults(result) {
  const bestVariantIndex = result.variants.findIndex((variant) => variant.id === result.bestVariantId || variant.isWinner);
  const resolvedBestIndex = bestVariantIndex >= 0 ? bestVariantIndex : 0;
  const complaints = Array.isArray(result.complaints) ? result.complaints : [];
  const complaintItems = complaints
    .map((complaint) => `<li>${escapeHtml(complaint)}</li>`)
    .join("");

  setBestScore(result.variants[resolvedBestIndex].score);
  const variantCards = result.variants
    .map((variant, index) => {
      const isBest = index === resolvedBestIndex;
      const title = `${variant.name} - ${variant.technique}`;

      return `
        <article class="variant-card${isBest ? " best" : ""}">
          <div class="variant-topline">
            <h3 class="variant-title">${escapeHtml(title)}${isBest ? " - Beste Wahl" : ""}</h3>
            <span class="variant-score">${variant.score}/100</span>
          </div>
          <div class="prompt-diff" aria-label="Aenderungen gegenueber Originalprompt">
            ${renderPromptDiff(result.inputPrompt, variant.prompt)}
          </div>
          <p class="variant-reason">${escapeHtml(variant.reason)}</p>
        </article>
      `;
    })
    .join("");

  results.innerHTML = `
    <section class="complaints-panel" aria-labelledby="complaints-title">
      <div class="complaints-header">
        <h3 id="complaints-title">Complaints analyzed</h3>
        <span>${complaints.length}</span>
      </div>
      <ol class="complaints-list">${complaintItems}</ol>
    </section>
    ${variantCards}
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

function escapeHtml(value) {
  return String(value)
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

  try {
    const result = await improvePrompt(payload.inputPrompt);
    renderResults(result);
  } catch (error) {
    emptyState.hidden = false;
    promptError.textContent = error instanceof Error ? error.message : "Prompt konnte nicht verbessert werden.";
  } finally {
    setLoading(false);
  }
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
