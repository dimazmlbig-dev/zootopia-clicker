window.Match3 = (() => {
  const boardSize = 6;
  const animals = ["🐶", "🐱", "🦊", "🐼", "🐵", "🐯"];
  const powerEmoji = "🐾";

  const gameState = {
    board: [],
    selected: null,
    score: 0,
    level: 1,
    target: 120,
    combo: 1,
    rewardBase: 60,
  };
  let fullscreenBound = false;

  function randomAnimal() {
    return animals[Math.floor(Math.random() * animals.length)];
  }

  function makeTile(kind = "normal") {
    return {
      kind,
      emoji: kind === "power" ? powerEmoji : randomAnimal(),
    };
  }

  function createEmptyBoard() {
    return Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => makeTile())
    );
  }

  function setScore(points) {
    gameState.score += points;
    const progress = Math.min(100, (gameState.score / gameState.target) * 100);
    const progressEl = document.getElementById("matchProgress");
    const scoreEl = document.getElementById("matchScore");
    const targetEl = document.getElementById("matchTarget");
    if (progressEl) progressEl.style.width = `${progress}%`;
    if (scoreEl) scoreEl.textContent = `${gameState.score}`;
    if (targetEl) targetEl.textContent = `${gameState.target}`;
    if (gameState.score >= gameState.target) {
      levelUp();
    }
  }

  function updateMeta() {
    const levelEl = document.getElementById("matchLevel");
    const rewardEl = document.getElementById("matchReward");
    const comboEl = document.getElementById("matchCombo");
    if (levelEl) levelEl.textContent = `${gameState.level}`;
    if (rewardEl) rewardEl.textContent = `${gameState.rewardBase + gameState.level * 15}`;
    if (comboEl) comboEl.textContent = `Комбо x${gameState.combo}`;
  }

  function levelUp() {
    gameState.score = 0;
    gameState.level += 1;
    gameState.target = 120 + gameState.level * 35;
    gameState.combo = 1;
    const reward = gameState.rewardBase + gameState.level * 15;
    window.State?.update?.((s) => {
      s.balance += reward;
    });
    window.AudioFX?.playLevelUp?.();
    updateMeta();
    setScore(0);
  }

  function renderBoard() {
    const boardEl = document.getElementById("matchBoard");
    if (!boardEl) return;
    boardEl.innerHTML = "";
    gameState.board.forEach((row, r) => {
      row.forEach((tile, c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "match3-tile";
        if (tile.kind === "power") btn.classList.add("match3-tile--power");
        if (gameState.selected && gameState.selected.r === r && gameState.selected.c === c) {
          btn.classList.add("is-selected");
        }
        btn.dataset.row = r;
        btn.dataset.col = c;
        btn.textContent = tile.emoji;
        boardEl.appendChild(btn);
      });
    });
  }

  function pulseBoard(effectClass) {
    const boardEl = document.getElementById("matchBoard");
    if (!boardEl) return;
    boardEl.classList.remove("is-clearing", "is-power");
    void boardEl.offsetWidth;
    boardEl.classList.add(effectClass);
  }

  function spawnMatchEffects(positions, intensity = 1) {
    const boardEl = document.getElementById("matchBoard");
    if (!boardEl || !positions?.length) return;
    const rect = boardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const cellSize = rect.width / boardSize;
    const particlesPerCell = Math.min(8, 4 + intensity);

    positions.forEach(({ r, c }) => {
      const centerX = c * cellSize + cellSize / 2;
      const centerY = r * cellSize + cellSize / 2;
      for (let i = 0; i < particlesPerCell; i += 1) {
        const spark = document.createElement("span");
        spark.className = "match3-spark";
        const angle = Math.random() * Math.PI * 2;
        const distance = 8 + Math.random() * 16;
        spark.style.left = `${centerX}px`;
        spark.style.top = `${centerY}px`;
        spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        spark.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
        spark.style.setProperty("--hue", `${Math.floor(140 + Math.random() * 80)}`);
        boardEl.appendChild(spark);
        spark.addEventListener("animationend", () => spark.remove());
      }
    });
  }

  function isAdjacent(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  function swapTiles(a, b) {
    const temp = gameState.board[a.r][a.c];
    gameState.board[a.r][a.c] = gameState.board[b.r][b.c];
    gameState.board[b.r][b.c] = temp;
  }

  function findMatches() {
    const matches = [];
    // Rows
    for (let r = 0; r < boardSize; r += 1) {
      let start = 0;
      for (let c = 1; c <= boardSize; c += 1) {
        const curr = gameState.board[r][c];
        const prev = gameState.board[r][start];
        if (c < boardSize && curr?.emoji === prev?.emoji && curr?.kind === "normal" && prev?.kind === "normal") {
          continue;
        }
        const length = c - start;
        if (length >= 3) {
          matches.push({ direction: "row", r, start, length });
        }
        start = c;
      }
    }
    // Columns
    for (let c = 0; c < boardSize; c += 1) {
      let start = 0;
      for (let r = 1; r <= boardSize; r += 1) {
        const curr = gameState.board[r]?.[c];
        const prev = gameState.board[start]?.[c];
        if (r < boardSize && curr?.emoji === prev?.emoji && curr?.kind === "normal" && prev?.kind === "normal") {
          continue;
        }
        const length = r - start;
        if (length >= 3) {
          matches.push({ direction: "col", c, start, length });
        }
        start = r;
      }
    }
    return matches;
  }

  function applyMatches(matches) {
    const toClear = new Set();
    matches.forEach((match) => {
      if (match.direction === "row") {
        for (let i = 0; i < match.length; i += 1) {
          const c = match.start + i;
          if (i === 1 && match.length >= 4) {
            gameState.board[match.r][c] = makeTile("power");
          } else {
            toClear.add(`${match.r}:${c}`);
          }
        }
      } else {
        for (let i = 0; i < match.length; i += 1) {
          const r = match.start + i;
          if (i === 1 && match.length >= 4) {
            gameState.board[r][match.c] = makeTile("power");
          } else {
            toClear.add(`${r}:${match.c}`);
          }
        }
      }
    });

    toClear.forEach((key) => {
      const [r, c] = key.split(":").map(Number);
      gameState.board[r][c] = null;
    });
    const positions = Array.from(toClear).map((key) => {
      const [r, c] = key.split(":").map(Number);
      return { r, c };
    });
    return { cleared: toClear.size, positions };
  }

  function collapseBoard() {
    for (let c = 0; c < boardSize; c += 1) {
      let pointer = boardSize - 1;
      for (let r = boardSize - 1; r >= 0; r -= 1) {
        const tile = gameState.board[r][c];
        if (tile) {
          gameState.board[pointer][c] = tile;
          if (pointer !== r) gameState.board[r][c] = null;
          pointer -= 1;
        }
      }
      for (let r = pointer; r >= 0; r -= 1) {
        gameState.board[r][c] = makeTile();
      }
    }
  }

  function resolveBoard() {
    let matches = findMatches();
    let chain = 0;
    while (matches.length) {
      chain += 1;
      const result = applyMatches(matches);
      if (result.cleared > 0) {
        const bonus = 1 + (chain - 1) * 0.25;
        const points = Math.round(result.cleared * 10 * bonus);
        gameState.combo = Math.min(4, 1 + chain - 1);
        setScore(points);
        spawnMatchEffects(result.positions, chain);
        pulseBoard("is-clearing");
        window.AudioFX?.playMatch?.(chain, result.cleared);
      }
      collapseBoard();
      matches = findMatches();
    }
    gameState.combo = 1;
    updateMeta();
  }

  function activatePower(r, c) {
    let cleared = 0;
    const positions = [];
    for (let i = 0; i < boardSize; i += 1) {
      if (gameState.board[r][i]) {
        gameState.board[r][i] = null;
        cleared += 1;
        positions.push({ r, c: i });
      }
      if (gameState.board[i][c]) {
        gameState.board[i][c] = null;
        cleared += 1;
        positions.push({ r: i, c });
      }
    }
    setScore(cleared * 12);
    spawnMatchEffects(positions, 3);
    pulseBoard("is-power");
    window.AudioFX?.playPower?.();
    collapseBoard();
    resolveBoard();
  }

  function handleTileClick(event) {
    const target = event.target.closest(".match3-tile");
    if (!target) return;
    const r = Number(target.dataset.row);
    const c = Number(target.dataset.col);
    const tile = gameState.board[r][c];
    if (!tile) return;

    if (tile.kind === "power" && !gameState.selected) {
      activatePower(r, c);
      renderBoard();
      return;
    }

    if (!gameState.selected) {
      gameState.selected = { r, c };
      renderBoard();
      return;
    }

    if (gameState.selected.r === r && gameState.selected.c === c) {
      gameState.selected = null;
      renderBoard();
      return;
    }

    if (!isAdjacent(gameState.selected, { r, c })) {
      gameState.selected = { r, c };
      renderBoard();
      return;
    }

    const prev = { ...gameState.selected };
    swapTiles(prev, { r, c });
    gameState.selected = null;
    const matches = findMatches();
    if (!matches.length) {
      swapTiles(prev, { r, c });
      renderBoard();
      window.AudioFX?.playSwap?.(false);
      return;
    }
    window.AudioFX?.playSwap?.(true);
    resolveBoard();
    renderBoard();
  }

  function resetBoard() {
    gameState.board = createEmptyBoard();
    gameState.selected = null;
    resolveBoard();
    renderBoard();
    window.AudioFX?.playShuffle?.();
  }

  function updateFullscreenLabel() {
    const fullscreenBtn = document.getElementById("matchFullscreen");
    if (!fullscreenBtn) return;
    fullscreenBtn.textContent = document.fullscreenElement ? "Выйти из фуллскрина" : "На весь экран";
  }

  function initFullscreen() {
    const fullscreenBtn = document.getElementById("matchFullscreen");
    const container = document.getElementById("match3Game");
    if (!fullscreenBtn || !container) return;

    fullscreenBtn.addEventListener("click", async () => {
      if (!document.fullscreenElement) {
        try {
          await container.requestFullscreen();
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.error(err);
        }
      }
      updateFullscreenLabel();
    });

    if (!fullscreenBound) {
      document.addEventListener("fullscreenchange", updateFullscreenLabel);
      fullscreenBound = true;
    }
    updateFullscreenLabel();
  }

  function init() {
    const boardEl = document.getElementById("matchBoard");
    if (!boardEl) return;
    boardEl.removeEventListener("click", handleTileClick);
    boardEl.addEventListener("click", handleTileClick);

    const resetBtn = document.getElementById("matchReset");
    resetBtn?.removeEventListener("click", resetBoard);
    resetBtn?.addEventListener("click", resetBoard);

    gameState.board = createEmptyBoard();
    gameState.score = 0;
    gameState.level = 1;
    gameState.target = 120;
    gameState.combo = 1;
    updateMeta();
    setScore(0);
    resolveBoard();
    renderBoard();
    initFullscreen();
  }

  return { init };
})();
