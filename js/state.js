window.State = (() => {
  let s = null;

  function get() { return s; }

  async function init() {
    const loaded = await window.StorageManager.loadStateAsync();
    s = loaded || window.StorageManager.defaultState();

    // refCode (простой, чтобы всегда был)
    if (!s.refCode) s.refCode = String(Date.now()).slice(-10);

    return s;
  }

  function set(patch) {
    s = { ...s, ...patch };
    return s;
  }

  function inc(key, delta) {
    s[key] = (s[key] || 0) + delta;
    return s[key];
  }

  function save() {
    return window.StorageManager.saveStateAsync(s);
  }

  return { init, get, set, inc, save };
})();