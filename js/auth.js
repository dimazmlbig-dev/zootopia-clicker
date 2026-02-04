(function () {
  const TOKEN_KEY = "zoo_auth_token";
  let authState = {
    token: localStorage.getItem(TOKEN_KEY),
    user: null,
  };

  function getInitData() {
    return window.Telegram?.WebApp?.initData || "";
  }

  function getUserFallback() {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser) return null;
    return {
      id: tgUser.id,
      username: tgUser.username || null,
      first_name: tgUser.first_name || null,
      last_name: tgUser.last_name || null,
    };
  }

  async function authenticate() {
    const initData = getInitData();
    if (!initData) {
      authState.user = getUserFallback();
      return authState;
    }

    const response = await window.App.apiFetch("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData }),
    });

    authState.token = response.token;
    authState.user = response.user;
    localStorage.setItem(TOKEN_KEY, response.token);
    return authState;
  }

  function getToken() {
    return authState.token;
  }

  function getUser() {
    return authState.user;
  }

  function isAuthenticated() {
    return Boolean(authState.token);
  }

  function clearToken() {
    authState.token = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  window.Auth = {
    authenticate,
    getToken,
    getUser,
    isAuthenticated,
    clearToken,
  };
})();
