// js/state.js
window.State = (() => {
  let s = null;

  function init() {
    const loaded = window.StorageManager.load();
    s = sanitize(loaded);
    window.StorageManager.save(s);
    return s;
  }

  function sanitize(x) {
    const d = window.StorageManager.defaultState();
    if (!x || typeof x !== "object") return d;

    // shallow merge with defaults
    const out = { ...d, ...x };

    // deep for nested
    out.mining = { ...d.mining, ...(x.mining || {}) };
    out.tasks = { ...d.tasks, ...(x.tasks || {}) };
    out.ownedNft = { ...(x.ownedNft || {}) };
    out.equipped = { ...d.equipped, ...(x.equipped || {}) };

    // numbers safety
    out.bones = Number(out.bones || 0);
    out.zoo = Number(out.zoo || 0);
    out.energy = Number(out.energy || 0);
    out.maxEnergy = Number(out.maxEnergy || 1000);

    out.referrals = Number(out.referrals || 0);
    out.referralsMax = Number(out.referralsMax || 5);
    out.tonBalanceNano = Number(out.tonBalanceNano || 0);

    if (out.energy > out.maxEnergy) out.energy = out.maxEnergy;
    if (out.energy < 0) out.energy = 0;

    return out;
  }

  function get() {
    return s;
  }

  function save() {
    window.StorageManager.save(s);
  }

  // game actions
  function canTap() {
    return s.energy >= 1;
  }

  function tap() {
    if (!canTap()) return false;
    s.energy -= 1;
    s.bones += 1;
    s.tasks.taps += 1;
    return true;
  }

  function regenEnergy(perSec = 1) {
    s.energy = Math.min(s.maxEnergy, s.energy + perSec);
  }

  function addZoo(amount) {
    s.zoo += amount;
  }

  function spendZoo(amount) {
    if (s.zoo < amount) return false;
    s.zoo -= amount;
    return true;
  }

  // nft
  function ownNft(id) {
    s.ownedNft[id] = true;
  }

  function isOwned(id) {
    return !!s.ownedNft[id];
  }

  function equip(slot, idOrNull) {
    s.equipped[slot] = idOrNull;
  }

  return {
    init, get, save,
    tap, canTap, regenEnergy,
    addZoo, spendZoo,
    ownNft, isOwned, equip,
  };
})();