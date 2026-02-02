// js/ai.js
(function () {
  const ENDPOINT = "https://functions.yandexcloud.net/d4e39nat9022creq4g1c";

  async function askAI(prompt) {
    const payload = {
      prompt: String(prompt || ""),
    };

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || response.statusText || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return typeof data?.text === "string" ? data.text : "";
  }

  window.AI = { askAI };
})();
