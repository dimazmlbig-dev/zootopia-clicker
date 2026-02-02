window.Bonuses = (() => {
  function setActiveTab(tab) {
    document.querySelectorAll(".bonus-tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.bonusTab === tab);
    });
    document.querySelectorAll(".bonus-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.bonusPanel === tab);
    });
  }

  function bindTabs() {
    document.querySelectorAll(".bonus-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveTab(btn.dataset.bonusTab);
      });
    });
  }

  function initAI() {
    const askBtn = document.getElementById("aiAsk");
    const promptEl = document.getElementById("aiPrompt");
    const responseEl = document.getElementById("aiResponse");
    const statusEl = document.getElementById("aiStatus");
    if (!askBtn || !promptEl || !responseEl) return;

    if (statusEl) {
      statusEl.textContent = localStorage.getItem("YC_API_KEY")
        ? "Ключ найден в браузере, можно спрашивать."
        : "Добавьте ключ: localStorage.setItem('YC_API_KEY','...')";
    }

    askBtn.addEventListener("click", async () => {
      const prompt = promptEl.value.trim();
      if (!prompt) return;
      askBtn.disabled = true;
      askBtn.textContent = "Думаю...";
      responseEl.textContent = "";
      try {
        const reply = await window.AI?.ask?.(prompt, { temperature: 0.5 });
        responseEl.textContent = reply || "Пустой ответ от модели.";
      } catch (err) {
        responseEl.textContent = err?.message || "Ошибка запроса.";
      } finally {
        askBtn.disabled = false;
        askBtn.textContent = "Спросить";
      }
    });
  }

  function init() {
    bindTabs();
    setActiveTab("rewards");
    initAI();
    window.Match3?.init?.();
    window.Wheel?.init?.();
  }

  return { init };
})();
