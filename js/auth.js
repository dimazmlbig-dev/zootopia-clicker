(function () {
  const TOKEN_KEY = "zoo_auth_token";
  let authState = {
    token: localStorage.getItem(TOKEN_KEY),
    user: null,
  };

  function getInitData() {
    return window.Telegram?.WebApp?.initData || "";
  }

  function isLocalhost() {
    return ["localhost", "127.0.0.1"].includes(window.location.hostname);
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
      if (isLocalhost()) {
        authState.user =
          getUserFallback() || { id: "local-dev", username: "dev", first_name: "Dev" };
        return authState;
      }
      const error = new Error("initData missing");
      error.code = "init_data_missing";
      throw error;
    }

    let response;
    try {
      response = await window.App.apiFetch("/auth/telegram", {
        method: "POST",
        body: JSON.stringify({ initData }),
      });
    } catch (error) {
      if (error?.status === 400 || error?.status === 401) {
        clearToken();
        const authError = new Error("auth_failed");
        authError.code = "auth_failed";
        authError.status = error.status;
        throw authError;
      }
      throw error;
    }

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
    authState.user = null;
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
