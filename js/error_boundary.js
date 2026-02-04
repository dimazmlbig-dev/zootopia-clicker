(function () {
  const modalRoot = document.getElementById("modal-root");

  function showErrorDialog(error) {
    if (!modalRoot) return;
    modalRoot.innerHTML = "";
    modalRoot.classList.add("is-visible");

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <h3>Что-то пошло не так</h3>
      <p>${error.message || "Неизвестная ошибка"}</p>
      <button class="button" id="modal-reload">Перезапустить</button>
    `;

    modalRoot.appendChild(modal);

    const button = document.getElementById("modal-reload");
    button?.addEventListener("click", () => window.location.reload());
  }

  function handleError(error, context) {
    console.error("[GlobalError]", context, error);
    showErrorDialog(error instanceof Error ? error : new Error(String(error)));
  }

  window.onerror = function (message, source, lineno, colno, error) {
    handleError(error || new Error(String(message)), { source, lineno, colno });
  };

  window.onunhandledrejection = function (event) {
    handleError(event.reason || new Error("Unhandled rejection"), { promise: event.promise });
  };
})();
