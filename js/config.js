(function () {
  const storedApiBase = localStorage.getItem("zoo_api_base");
  const apiBase = storedApiBase || "https://example.yandexcloud.net/zootopia-api";
  const normalizedApiBase = apiBase.replace(/\/$/, "");

  window.AppConfig = {
    API_BASE: normalizedApiBase,
    manifestUrl: "./tonconnect-manifest.json",
    buildId: "20250310",
  };
})();
