// js/auth.js
window.Auth = (() => {
  const TOKEN_KEY = "zoo_jwt";
  const API_BASE = window.API_BASE || localStorage.getItem("zoo_api_base") || "";
  let token = localStorage.getItem(TOKEN_KEY) || "";
  let user = null;
  let wallets = [];

  function getInitData() {
    const tg = window.Telegram?.WebApp;
    return tg?.initData || "";
  }

  function setToken(next) {
    token = next || "";
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  function apiUrl(path) {
    return `${API_BASE}${path}`;
  }

  async function apiFetch(path, options = {}) {
    const headers = { "content-type": "application/json", ...(options.headers || {}) };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(apiUrl(path), { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      setToken("");
    }
    const data = await response.json();
    return { status: response.status, data };
  }

  async function authTelegram() {
    const initData = getInitData();
    if (!initData) return null;
    const { status, data } = await apiFetch("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData }),
    });
    if (status >= 200 && status < 300 && data?.token) {
      setToken(data.token);
      user = data.user || null;
      return user;
    }
    return null;
  }

  async function getMe() {
    const { status, data } = await apiFetch("/me", { method: "GET" });
    if (status >= 200 && status < 300 && data?.user) {
      user = data.user;
      wallets = data.wallets || [];
      return data;
    }
    return null;
  }

  async function init() {
    if (token) {
      const me = await getMe();
      if (me) return me.user;
    }
    return authTelegram();
  }

  async function loadState() {
    if (!token) return null;
    const { status, data } = await apiFetch("/state", { method: "GET" });
    if (status >= 200 && status < 300) return data.state_json || null;
    return null;
  }

  async function saveState(stateJson) {
    if (!token) return null;
    const { status, data } = await apiFetch("/state", {
      method: "POST",
      body: JSON.stringify({ state_json: stateJson }),
    });
    if (status >= 200 && status < 300) return data;
    return null;
  }

  async function linkWallet(walletAddress) {
    if (!token || !walletAddress) return null;
    const { status, data } = await apiFetch("/wallet/link", {
      method: "POST",
      body: JSON.stringify({ wallet_address: walletAddress }),
    });
    if (status >= 200 && status < 300) {
      wallets = data.wallets || [];
      return wallets;
    }
    return null;
  }

  function isAuthenticated() {
    return Boolean(token);
  }

  function getUser() {
    return user;
  }

  function getWallets() {
    return wallets;
  }

  return {
    init,
    apiFetch,
    loadState,
    saveState,
    linkWallet,
    isAuthenticated,
    getUser,
    getWallets,
  };
})(); 
