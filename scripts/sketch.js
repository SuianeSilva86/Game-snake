const GRID_SIZE = 35;
const HUD_ZONE_ROWS_NORMAL = 3;
const HUD_ZONE_ROWS_HARD = 3;
const HIGH_SCORE_KEY = "snake-retro-highscore";
const MONSTER_TRIGGER_MS = 5000;
const MONSTER_COUNTDOWN_MS = 3000;

const DIFFICULTY_CONFIG = {
  easy: { label: "Facil", speed: 8 },
  medium: { label: "Medio", speed: 11 },
  hard: { label: "Dificil", speed: 15 }
};

let snake = [];
let direction = { x: 1, y: 0 };
let queuedDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = 0;
let gameState = "start";
let selectedDifficulty = "medium";
let stepIntervalMs = 1000 / DIFFICULTY_CONFIG[selectedDifficulty].speed;
let stepAccumulator = 0;
let imageComida;
let swipeStart = null;
let hasStartedOnce = false;
let cellSize = 20;
let foodAgeMs = 0;
let isFoodMonster = false;

const ui = {};

function preload() {
  imageComida = loadImage("img/noun-food-1242332.png");
}

function setup() {
  const canvas = createCanvas(700, 700);
  canvas.parent("p5-root");
  frameRate(60);

  cacheUiElements();
  bindUiEvents();
  updateResponsiveStageSize();

  highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
  resetGameState();
  updateUi();
}

function draw() {
  drawBoard();
  updateFoodMode();
  drawFood();
  drawSnake();
  drawInGameInfo();
  drawMonsterCountdown();

  if (gameState !== "playing") {
    return;
  }

  // Verificar colisão do monstro todo frame — não apenas nos passos do jogo
  if (isFoodMonster && isMonsterOnSnake()) {
    setGameOver();
    return;
  }

  stepAccumulator += deltaTime;
  if (stepAccumulator < stepIntervalMs) {
    return;
  }
  stepAccumulator = 0;

  moveMonsterFood();

  if (isFoodMonster && isMonsterOnSnake()) {
    setGameOver();
    return;
  }

  direction = { ...queuedDirection };
  const head = snake[0];
  const next = { x: head.x + direction.x, y: head.y + direction.y };

  if (isWallCollision(next) || isBodyCollision(next) || isHudZoneCollision(next)) {
    setGameOver();
    return;
  }

  if (isFoodMonster && (next.x === food.x && next.y === food.y)) {
    setGameOver();
    return;
  }

  const ateFood = next.x === food.x && next.y === food.y;

  snake.unshift(next);
  if (!ateFood) {
    snake.pop();
  }

  if (isFoodMonster && isMonsterOnSnake()) {
    setGameOver();
    return;
  }

  if (ateFood) {
    score += 1;
    stepIntervalMs = max(55, stepIntervalMs - 2);
    placeFood();
    addPulseFeedback();
  }

  updateUi();
}

function drawBoard() {
  const hudZoneHeight = getHudZoneHeight();
  const panelTop = 4;
  const panelHeight = hudZoneHeight - panelTop * 2;
  const sidePadding = max(8, floor(cellSize * 0.6));
  const contentWidth = width - sidePadding * 2;
  background(7, 15, 35);

  stroke(40, 70, 116, 75);
  strokeWeight(1);
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const p = i * cellSize;
    line(p, 0, p, height);
    line(0, p, width, p);
  }

  fill(5, 18, 40, 200);
  rect(0, 0, width, hudZoneHeight);

  const panelWidth = contentWidth / 4;
  stroke(color(90, 189, 255, 180));
  strokeWeight(2);
  for (let i = 0; i < 4; i += 1) {
    rect(sidePadding + i * panelWidth + 4, panelTop, panelWidth - 8, panelHeight, 5);
  }
  noStroke();
}

function drawInGameInfo() {
  const hudZoneHeight = getHudZoneHeight();
  const panelTop = 4;
  const panelHeight = hudZoneHeight - panelTop * 2;
  const sidePadding = max(8, floor(cellSize * 0.6));
  const contentWidth = width - sidePadding * 2;
  const labelY = panelTop + panelHeight * 0.32;
  const valueY = panelTop + panelHeight * 0.68;
  const stateLabel =
    gameState === "playing" ? "Jogando" : gameState === "gameOver" ? "Fim" : "Pronto";
  const entries = [
    { label: "SCORE", value: String(score) },
    { label: "RECORDE", value: String(highScore) },
    { label: "NIVEL", value: DIFFICULTY_CONFIG[selectedDifficulty].label },
    { label: "ESTADO", value: stateLabel }
  ];

  const panelWidth = contentWidth / entries.length;
  textAlign(CENTER, CENTER);
  textSize(max(9, floor(panelHeight * 0.19)));
  fill(157, 206, 255);

  for (let i = 0; i < entries.length; i += 1) {
    const x = sidePadding + i * panelWidth + panelWidth / 2;
    text(entries[i].label, x, labelY);
  }

  textSize(max(13, floor(panelHeight * 0.3)));
  fill(245, 247, 255);
  for (let i = 0; i < entries.length; i += 1) {
    const x = sidePadding + i * panelWidth + panelWidth / 2;
    text(entries[i].value, x, valueY);
  }

}

function drawSnake() {
  for (let i = snake.length - 1; i >= 0; i -= 1) {
    const part = snake[i];
    const isHead = i === 0;
    fill(isHead ? "#7bff00" : "#22c55e");
    rect(
      part.x * cellSize + 2,
      part.y * cellSize + 2,
      cellSize - 4,
      cellSize - 4,
      isHead ? 6 : 3
    );
  }
}

function drawFood() {
  const px = food.x * cellSize;
  const py = food.y * cellSize;
  const centerX = px + cellSize / 2;
  const centerY = py + cellSize / 2;

  if (isFoodMonster) {
    const pulse = 0.86 + 0.14 * sin(frameCount * 0.22);
    fill(255, 70, 70, 90);
    circle(centerX, centerY, cellSize + 10);

    fill(214, 34, 60);
    circle(centerX, centerY, (cellSize - 1) * pulse);

    fill(255);
    circle(centerX - cellSize * 0.18, centerY - cellSize * 0.1, cellSize * 0.2);
    circle(centerX + cellSize * 0.18, centerY - cellSize * 0.1, cellSize * 0.2);

    fill(30);
    circle(centerX - cellSize * 0.18, centerY - cellSize * 0.1, cellSize * 0.09);
    circle(centerX + cellSize * 0.18, centerY - cellSize * 0.1, cellSize * 0.09);

    stroke(30);
    strokeWeight(2);
    line(centerX - cellSize * 0.16, centerY + cellSize * 0.2, centerX + cellSize * 0.16, centerY + cellSize * 0.2);
    noStroke();
    return;
  }

  fill(255, 210, 70, 85);
  circle(centerX, centerY, cellSize + 8);

  fill(255, 75, 110);
  circle(centerX, centerY, cellSize - 2);

  if (imageComida && imageComida.width > 0) {
    image(imageComida, px - 2, py - 2, cellSize + 4, cellSize + 4);
    return;
  }

  fill("#fff4d0");
  circle(centerX, centerY, cellSize - 10);
}

function keyPressed() {
  const movementKey =
    keyCode === UP_ARROW ||
    keyCode === DOWN_ARROW ||
    keyCode === LEFT_ARROW ||
    keyCode === RIGHT_ARROW;

  if (keyCode === UP_ARROW) {
    queueDirection(0, -1);
  } else if (keyCode === DOWN_ARROW) {
    queueDirection(0, 1);
  } else if (keyCode === LEFT_ARROW) {
    queueDirection(-1, 0);
  } else if (keyCode === RIGHT_ARROW) {
    queueDirection(1, 0);
  } else if (key === " " && gameState === "start") {
    startGame();
    return false;
  } else if ((key === "r" || key === "R") && gameState === "gameOver") {
    restartGame();
  }

  if (movementKey || key === " " || key === "r" || key === "R") {
    return false;
  }

  return true;
}

function queueDirection(x, y) {
  if (gameState !== "playing") {
    return;
  }

  const tryingReverse = direction.x === -x && direction.y === -y;
  if (tryingReverse) {
    return;
  }

  queuedDirection = { x, y };
}

function startGame() {
  gameState = "playing";
  if (!hasStartedOnce) {
    ui.appHeader.classList.add("is-hidden");
    hasStartedOnce = true;
    updateResponsiveStageSize();
  }
  hideOverlay(ui.startOverlay);
  hideOverlay(ui.gameOverOverlay);
  updateUi();
}

function restartGame() {
  resetGameState();
  startGame();
}

function resetGameState() {
  snake = [
    { x: 10, y: 17 },
    { x: 9, y: 17 },
    { x: 8, y: 17 }
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = { x: 1, y: 0 };
  score = 0;
  foodAgeMs = 0;
  isFoodMonster = false;
  stepAccumulator = 0;
  stepIntervalMs = 1000 / DIFFICULTY_CONFIG[selectedDifficulty].speed;
  gameState = "start";
  placeFood();
  showOverlay(ui.startOverlay);
  hideOverlay(ui.gameOverOverlay);
}

function setGameOver() {
  gameState = "gameOver";
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  }

  ui.gameOverText.textContent = `Sua pontuacao: ${score} | Recorde: ${highScore}`;
  ui.canvasShell.classList.remove("shake");
  void ui.canvasShell.offsetWidth;
  ui.canvasShell.classList.add("shake");

  hideOverlay(ui.startOverlay);
  showOverlay(ui.gameOverOverlay);
  updateUi();
}

function isWallCollision(pos) {
  return pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE;
}

function isBodyCollision(pos) {
  return snake.some((part) => part.x === pos.x && part.y === pos.y);
}

function isHudZoneCollision(pos) {
  return selectedDifficulty === "medium" && pos.y < getHudZoneRows();
}

function placeFood() {
  do {
    food = {
      x: floor(random(GRID_SIZE)),
      y: floor(random(GRID_SIZE))
    };
  } while (
    snake.some((part) => part.x === food.x && part.y === food.y) ||
    (selectedDifficulty === "medium" && food.y < getHudZoneRows())
  );

  foodAgeMs = 0;
  isFoodMonster = false;
}

function getHudZoneRows() {
  return selectedDifficulty === "hard" ? HUD_ZONE_ROWS_HARD : HUD_ZONE_ROWS_NORMAL;
}

function getHudZoneHeight() {
  return getHudZoneRows() * cellSize;
}

function updateUi() {
  ui.startHint.textContent = "Setas movem a cobra. No celular, use toque ou swipe na tela.";
}

function updateFoodMode() {
  if (gameState !== "playing") {
    return;
  }

  foodAgeMs += deltaTime;
  isFoodMonster = selectedDifficulty === "hard" && foodAgeMs >= MONSTER_TRIGGER_MS;
}

function drawMonsterCountdown() {
  if (selectedDifficulty !== "hard" || gameState !== "playing" || isFoodMonster) {
    return;
  }

  const timeToMonster = MONSTER_TRIGGER_MS - foodAgeMs;
  if (timeToMonster > MONSTER_COUNTDOWN_MS || timeToMonster <= 0) {
    return;
  }

  const countdownValue = ceil(timeToMonster / 1000);
  const px = food.x * cellSize + cellSize / 2;
  const py = food.y * cellSize - cellSize * 0.9;

  textAlign(CENTER, CENTER);
  textSize(max(14, floor(cellSize * 0.95)));
  fill(255, 235, 140);
  text(String(countdownValue), px, py);
}

function moveMonsterFood() {
  if (!isFoodMonster || snake.length === 0) {
    return;
  }

  const head = snake[0];
  const dx = head.x - food.x;
  const dy = head.y - food.y;

  let stepX = 0;
  let stepY = 0;

  if (abs(dx) > abs(dy)) {
    stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  } else {
    stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
  }

  const candidate = {
    x: constrain(food.x + stepX, 0, GRID_SIZE - 1),
    y: constrain(food.y + stepY, 0, GRID_SIZE - 1)
  };

  food = candidate;
}

function isMonsterOnSnake() {
  return snake.some((part) => part.x === food.x && part.y === food.y);
}

function cacheUiElements() {
  ui.appShell = document.querySelector(".app-shell");
  ui.appHeader = document.querySelector(".app-header");
  ui.gameStage = document.querySelector(".game-stage");
  ui.startOverlay = document.getElementById("start-overlay");
  ui.gameOverOverlay = document.getElementById("game-over-overlay");
  ui.gameOverText = document.getElementById("game-over-text");
  ui.startHint = document.getElementById("start-hint");
  ui.startBtn = document.getElementById("start-btn");
  ui.restartBtn = document.getElementById("restart-btn");
  ui.difficultyButtons = document.querySelectorAll(".difficulty-btn");
  ui.canvasShell = document.querySelector(".canvas-shell");
}

function bindUiEvents() {
  ui.startBtn.addEventListener("click", startGame);
  ui.restartBtn.addEventListener("click", restartGame);

  ui.difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedDifficulty = button.dataset.difficulty;
      ui.difficultyButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      resetGameState();
      updateUi();
    });
  });

  ui.canvasShell.addEventListener("touchstart", (event) => {
    event.preventDefault();
    const touch = event.changedTouches[0];
    swipeStart = { x: touch.clientX, y: touch.clientY };

    if (gameState !== "playing") {
      return;
    }

    const tapDirection = getTouchDirection(touch.clientX, touch.clientY);
    if (tapDirection) {
      queueDirection(tapDirection.x, tapDirection.y);
    }
  });

  ui.canvasShell.addEventListener("touchend", (event) => {
    event.preventDefault();
    if (!swipeStart || gameState !== "playing") {
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - swipeStart.x;
    const dy = touch.clientY - swipeStart.y;
    const threshold = 22;

    if (abs(dx) < threshold && abs(dy) < threshold) {
      return;
    }

    if (abs(dx) > abs(dy)) {
      queueDirection(dx > 0 ? 1 : -1, 0);
    } else {
      queueDirection(0, dy > 0 ? 1 : -1);
    }

    swipeStart = null;
  });

  window.addEventListener("resize", updateResponsiveStageSize);
  window.addEventListener("orientationchange", updateResponsiveStageSize);
}

function updateResponsiveStageSize() {
  const bodyStyles = getComputedStyle(document.body);
  const appStyles = getComputedStyle(ui.appShell);

  const bodyPaddingY =
    parseFloat(bodyStyles.paddingTop) + parseFloat(bodyStyles.paddingBottom);
  const bodyPaddingX =
    parseFloat(bodyStyles.paddingLeft) + parseFloat(bodyStyles.paddingRight);

  const appGap = parseFloat(appStyles.rowGap || appStyles.gap) || 16;
  const occupiedHeight =
    ui.appHeader.offsetHeight + bodyPaddingY + appGap * 2;

  const maxByHeight = window.innerHeight - occupiedHeight;
  const maxByWidth =
    Math.min(ui.appShell.clientWidth, window.innerWidth - bodyPaddingX) - 6;

  const maxSquare = Math.min(maxByWidth, maxByHeight);
  const snappedSize = Math.floor(maxSquare / GRID_SIZE) * GRID_SIZE;
  const stageSize = snappedSize > 0 ? snappedSize : Math.max(140, Math.floor(maxSquare));

  if (Number.isFinite(stageSize) && stageSize > 0) {
    document.documentElement.style.setProperty("--stage-size", `${stageSize}px`);
    if (width !== stageSize || height !== stageSize) {
      resizeCanvas(stageSize, stageSize);
      cellSize = width / GRID_SIZE;
    }
  }
}

function getTouchDirection(clientX, clientY) {
  const rect = ui.canvasShell.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const dx = localX - centerX;
  const dy = localY - centerY;

  if (abs(dx) > abs(dy)) {
    return { x: dx > 0 ? 1 : -1, y: 0 };
  }

  return { x: 0, y: dy > 0 ? 1 : -1 };
}

function showOverlay(element) {
  element.classList.remove("is-hidden", "animate__fadeOut");
  element.classList.add("animate__fadeIn");
}

function hideOverlay(element) {
  element.classList.add("is-hidden");
  element.classList.remove("animate__fadeIn");
}

function addPulseFeedback() {
  ui.canvasShell.classList.remove("pulse");
  void ui.canvasShell.offsetWidth;
  ui.canvasShell.classList.add("pulse");
}
