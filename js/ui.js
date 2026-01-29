export function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(text);
}

export function setEnergy(now, max) {
  setText("energyNow", now);
  setText("energyMax", max);

  const fill = document.getElementById("energyFill");
  if (fill) {
    const pct = max > 0 ? Math.max(0, Math.min(1, now / max)) : 0;
    fill.style.width = `${pct * 100}%`;
  }
}

export function showPage(name) {
  const pages = [
    ["click", "page-click"],
    ["nft", "page-nft"],
    ["tasks", "page-tasks"],
    ["wallet", "page-wallet"],
  ];

  for (const [key, id] of pages) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", key === name);
  }

  document.querySelectorAll(".navbtn").forEach((b) => {
    b.classList.toggle("active", b.dataset.page === name);
  });
}