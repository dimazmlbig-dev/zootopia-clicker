export function loadUserState(userId) {
  try {
    const raw = localStorage.getItem(`zoo_state_${userId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserState(userId, state) {
  try {
    localStorage.setItem(`zoo_state_${userId}`, JSON.stringify(state));
  } catch {}
}