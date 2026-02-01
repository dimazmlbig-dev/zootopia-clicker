// js/ai.js
// Yandex AI Studio (OpenAI-compatible) — client-side quick test
// WARNING: do NOT ship with a real API key in frontend. Use a backend proxy for production.

window.AI = (function () {
  const BASE_URL = "https://ai.api.cloud.yandex.net/v1";
  const FOLDER_ID = "b1g23m98hsu3kfpel6e3"; // твой folder id
  const MODEL_NAME = "yandexgpt"; // можно заменить на другую модель из Model Gallery
  const MODEL = `gpt://${FOLDER_ID}/${MODEL_NAME}`;

  // Положи ключ в localStorage один раз:
  // localStorage.setItem('YC_API_KEY', 'AQVN...');
  function getApiKey() {
    return localStorage.getItem("YC_API_KEY") || "";
  }

  async function ask(prompt, opts = {}) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("YC_API_KEY пуст. Установи: localStorage.setItem('YC_API_KEY','...')");

    const body = {
      model: MODEL,
      input: String(prompt || "").slice(0, 8000),
      temperature: typeof opts.temperature === "number" ? opts.temperature : 0.4,
      max_output_tokens: typeof opts.maxTokens === "number" ? opts.maxTokens : 400,
    };

    const res = await fetch(`${BASE_URL}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Api-Key ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI error ${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json();

    // В OpenAI-compatible Responses API удобно брать output_text
    // Но на всякий случай делаем fallback.
    return (
      data.output_text ||
      (data.output?.[0]?.content?.[0]?.text) ||
      ""
    );
  }

  return { ask };
})();