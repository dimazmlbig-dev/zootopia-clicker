(function () {
  function clone(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function createStore(initialState) {
    let state = clone(initialState);
    const listeners = new Set();

    function getState() {
      return state;
    }

    function setState(nextState) {
      state = clone(nextState);
      listeners.forEach((listener) => listener(state));
    }

    function update(updater) {
      const draft = clone(state);
      const nextState = updater(draft) || draft;
      state = clone(nextState);
      listeners.forEach((listener) => listener(state));
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    return { getState, setState, update, subscribe };
  }

  window.App = window.App || {};
  window.App.createStore = createStore;
})();
