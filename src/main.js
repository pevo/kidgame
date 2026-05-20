const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 474;
const CHOMPER_FEET_OFFSET = 72;
const MAX_HEALTH = 5;

const keys = new Set();
const images = {};
const camera = { x: 0 };

const assets = {
  characters: "assets/sprites/characters.png",
  chomper: "assets/sprites/chomper.png",
  ghostBoy: "assets/sprites/ghostboy.png",
  monsterboy: "assets/sprites/monsterboy.png",
};

const state = {
  mode: "loading",
  selected: "mark",
  levelIndex: 0,
  messageTimer: 0,
  nextLevelTimer: 0,
  lastTime: 0,
};

const sprites = {
  mark: {
    sheet: "characters",
    scale: 2,
    drawW: 58,
    drawH: 88,
    idle: [
      { x: 39, y: 302, w: 43, h: 93 },
      { x: 104, y: 302, w: 42, h: 93 },
    ],
    walk: [
      { x: 207, y: 301, w: 49, h: 94 },
      { x: 272, y: 301, w: 38, h: 94 },
      { x: 323, y: 302, w: 48, h: 93 },
    ],
    attack: [
      { x: 409, y: 305, w: 62, h: 91 },
      { x: 499, y: 305, w: 63, h: 91 },
    ],
    jump: [{ x: 620, y: 297, w: 35, h: 77 }],
    hurt: [{ x: 784, y: 306, w: 46, h: 89 }],
  },
  maria: {
    sheet: "characters",
    scale: 2,
    drawW: 58,
    drawH: 88,
    idle: [
      { x: 36, y: 524, w: 43, h: 89 },
      { x: 109, y: 523, w: 43, h: 90 },
    ],
    walk: [
      { x: 200, y: 522, w: 47, h: 92 },
      { x: 263, y: 523, w: 45, h: 91 },
      { x: 323, y: 523, w: 45, h: 91 },
    ],
    attack: [
      { x: 408, y: 527, w: 58, h: 88 },
      { x: 491, y: 527, w: 84, h: 88 },
    ],
    jump: [{ x: 626, y: 512, w: 38, h: 74 }],
    hurt: [{ x: 785, y: 529, w: 43, h: 86 }],
  },
  james: {
    sheet: "characters",
    scale: 2,
    drawW: 54,
    drawH: 92,
    idle: [
      { x: 32, y: 734, w: 38, h: 107 },
      { x: 101, y: 734, w: 39, h: 107 },
    ],
    happy: [{ x: 621, y: 730, w: 39, h: 91 }],
  },
  boss: {
    sheet: "characters",
    scale: 2.15,
    drawW: 112,
    drawH: 104,
    idle: [
      { x: 17, y: 98, w: 88, h: 77 },
      { x: 104, y: 98, w: 106, h: 77 },
    ],
    walk: [
      { x: 220, y: 102, w: 84, h: 72 },
      { x: 308, y: 105, w: 68, h: 74 },
      { x: 381, y: 105, w: 68, h: 74 },
    ],
    hurt: [{ x: 733, y: 101, w: 88, h: 73 }],
    defeated: [{ x: 838, y: 139, w: 116, h: 35 }],
  },
  chomper: {
    sheet: "chomper",
    scale: 2,
    drawW: 76,
    drawH: 68,
    walk: [
      { x: 43, y: 182, w: 80, h: 61 },
      { x: 154, y: 181, w: 82, h: 62 },
      { x: 269, y: 181, w: 82, h: 62 },
      { x: 389, y: 179, w: 81, h: 64 },
      { x: 500, y: 180, w: 89, h: 63 },
      { x: 634, y: 178, w: 81, h: 65 },
    ],
    hurt: [
      { x: 46, y: 496, w: 75, h: 58 },
      { x: 168, y: 498, w: 79, h: 56 },
      { x: 289, y: 490, w: 74, h: 64 },
    ],
    defeated: [{ x: 181, y: 605, w: 99, h: 40 }],
  },
  ghostBoy: {
    sheet: "ghostBoy",
    scale: 1.4,
    drawW: 64,
    drawH: 92,
    idle: [
      { x: 103, y: 97, w: 58, h: 164 },
      { x: 238, y: 97, w: 58, h: 164 },
      { x: 379, y: 97, w: 59, h: 164 },
      { x: 523, y: 97, w: 59, h: 164 },
      { x: 673, y: 97, w: 59, h: 164 },
    ],
    float: [
      { x: 103, y: 301, w: 58, h: 160 },
      { x: 238, y: 301, w: 58, h: 160 },
      { x: 377, y: 301, w: 60, h: 160 },
      { x: 520, y: 301, w: 60, h: 160 },
      { x: 672, y: 301, w: 60, h: 160 },
    ],
    attack: [
      { x: 77, y: 520, w: 82, h: 134 },
      { x: 224, y: 518, w: 80, h: 136 },
      { x: 382, y: 516, w: 83, h: 138 },
      { x: 539, y: 516, w: 82, h: 138 },
      { x: 695, y: 515, w: 80, h: 139 },
      { x: 836, y: 515, w: 83, h: 139 },
      { x: 1004, y: 515, w: 80, h: 138 },
      { x: 1184, y: 516, w: 80, h: 137 },
    ],
    hurt: [
      { x: 93, y: 696, w: 74, h: 153 },
      { x: 237, y: 698, w: 71, h: 151 },
      { x: 372, y: 696, w: 75, h: 153 },
      { x: 521, y: 696, w: 62, h: 153 },
    ],
    defeated: [
      { x: 85, y: 893, w: 95, h: 103 },
      { x: 223, y: 894, w: 95, h: 102 },
      { x: 366, y: 892, w: 92, h: 104 },
      { x: 497, y: 931, w: 132, h: 64 },
    ],
  },
  monsterboy: {
    sheet: "monsterboy",
    scale: 1.15,
    drawW: 78,
    drawH: 94,
    idle: [
      { x: 101, y: 75, w: 95, h: 118 },
      { x: 223, y: 74, w: 95, h: 119 },
      { x: 349, y: 75, w: 95, h: 117 },
      { x: 478, y: 75, w: 95, h: 118 },
      { x: 603, y: 75, w: 95, h: 118 },
      { x: 730, y: 77, w: 95, h: 116 },
    ],
    walk: [
      { x: 101, y: 226, w: 82, h: 111 },
      { x: 222, y: 226, w: 82, h: 111 },
      { x: 347, y: 226, w: 79, h: 112 },
      { x: 477, y: 230, w: 82, h: 108 },
      { x: 605, y: 231, w: 88, h: 107 },
      { x: 734, y: 231, w: 87, h: 107 },
      { x: 858, y: 232, w: 89, h: 107 },
    ],
    run: [
      { x: 93, y: 368, w: 91, h: 103 },
      { x: 218, y: 369, w: 92, h: 102 },
      { x: 342, y: 370, w: 95, h: 100 },
      { x: 470, y: 370, w: 95, h: 101 },
      { x: 598, y: 370, w: 95, h: 100 },
      { x: 729, y: 370, w: 92, h: 101 },
      { x: 853, y: 370, w: 92, h: 101 },
      { x: 975, y: 371, w: 93, h: 100 },
      { x: 1100, y: 370, w: 88, h: 101 },
      { x: 1224, y: 371, w: 89, h: 102 },
    ],
    attack: [
      { x: 99, y: 641, w: 79, h: 97 },
      { x: 227, y: 641, w: 81, h: 97 },
      { x: 356, y: 640, w: 82, h: 98 },
      { x: 485, y: 640, w: 82, h: 98 },
      { x: 614, y: 640, w: 82, h: 98 },
      { x: 747, y: 638, w: 111, h: 100 },
      { x: 877, y: 640, w: 104, h: 98 },
      { x: 1009, y: 641, w: 104, h: 97 },
      { x: 1143, y: 641, w: 89, h: 97 },
    ],
    hurt: [
      { x: 106, y: 773, w: 69, h: 99 },
      { x: 234, y: 773, w: 76, h: 99 },
      { x: 364, y: 773, w: 77, h: 99 },
      { x: 493, y: 773, w: 69, h: 99 },
      { x: 617, y: 773, w: 69, h: 99 },
      { x: 742, y: 773, w: 69, h: 99 },
    ],
    defeated: [
      { x: 89, y: 918, w: 87, h: 81 },
      { x: 213, y: 918, w: 91, h: 81 },
      { x: 337, y: 932, w: 116, h: 68 },
      { x: 490, y: 952, w: 141, h: 48 },
    ],
    projectile: [
      { x: 1258, y: 677, w: 78, h: 27 },
      { x: 1391, y: 678, w: 79, h: 27 },
    ],
  },
};

const levels = [
  {
    name: "Meadow Rescue",
    worldWidth: 3650,
    platforms: [
      { x: 0, y: GROUND_Y, w: 3650, h: 80 },
      { x: 420, y: 390, w: 220, h: 28 },
      { x: 760, y: 325, w: 220, h: 28 },
      { x: 1160, y: 405, w: 260, h: 28 },
      { x: 1540, y: 350, w: 210, h: 28 },
      { x: 1990, y: 390, w: 280, h: 28 },
      { x: 2440, y: 330, w: 220, h: 28 },
      { x: 2870, y: 400, w: 180, h: 28 },
    ],
    checkpoints: [
      { x: 520, label: "Stomp Chompers from above." },
      { x: 1600, label: "Keep moving. James is past the boss." },
      { x: 2870, label: "Defeat the boss with three stomp hits." },
    ],
    enemies: [
      { type: "chomper", x: 630, y: GROUND_Y - CHOMPER_FEET_OFFSET, minX: 560, maxX: 810 },
      { type: "chomper", x: 1110, y: GROUND_Y - CHOMPER_FEET_OFFSET, minX: 1040, maxX: 1340 },
      { type: "chomper", x: 1710, y: 350 - CHOMPER_FEET_OFFSET, minX: 1540, maxX: 1750 },
      { type: "chomper", x: 2210, y: 390 - CHOMPER_FEET_OFFSET, minX: 1990, maxX: 2270 },
      { type: "chomper", x: 2680, y: GROUND_Y - CHOMPER_FEET_OFFSET, minX: 2470, maxX: 2830 },
    ],
    boss: { x: 3110, minX: 3000, maxX: 3260 },
    jamesX: 3440,
    flags: { boss: 2960, james: 3400 },
  },
  {
    name: "Ghost Grove",
    worldWidth: 4300,
    platforms: [
      { x: 0, y: GROUND_Y, w: 4300, h: 80 },
      { x: 390, y: 394, w: 240, h: 28 },
      { x: 790, y: 330, w: 230, h: 28 },
      { x: 1190, y: 386, w: 260, h: 28 },
      { x: 1620, y: 315, w: 230, h: 28 },
      { x: 2030, y: 400, w: 300, h: 28 },
      { x: 2470, y: 336, w: 220, h: 28 },
      { x: 2910, y: 386, w: 260, h: 28 },
      { x: 3320, y: 328, w: 220, h: 28 },
    ],
    checkpoints: [
      { x: 520, label: "Ghost Boys can drift toward you." },
      { x: 1550, label: "Stomp floating enemies from above." },
      { x: 3330, label: "One more boss stands before James." },
    ],
    enemies: [
      { type: "chomper", x: 610, y: GROUND_Y - CHOMPER_FEET_OFFSET, minX: 520, maxX: 780 },
      { type: "ghostBoy", x: 930, y: 252 },
      { type: "chomper", x: 1280, y: 386 - CHOMPER_FEET_OFFSET, minX: 1190, maxX: 1450 },
      { type: "ghostBoy", x: 1770, y: 244 },
      { type: "chomper", x: 2210, y: 400 - CHOMPER_FEET_OFFSET, minX: 2030, maxX: 2330 },
      { type: "ghostBoy", x: 2650, y: 260 },
      { type: "chomper", x: 3060, y: 386 - CHOMPER_FEET_OFFSET, minX: 2910, maxX: 3170 },
      { type: "ghostBoy", x: 3400, y: 248 },
    ],
    collectibles: [
      { type: "blackSun", x: 1580, y: 260 },
    ],
    boss: { x: 3750, minX: 3640, maxX: 3920 },
    jamesX: 4120,
    flags: { boss: 3600, james: 4080 },
  },
  {
    name: "Verdant Wilds",
    worldWidth: 4850,
    platforms: [
      { x: 0, y: GROUND_Y, w: 4850, h: 80 },
      { x: 360, y: 386, w: 230, h: 28 },
      { x: 760, y: 318, w: 250, h: 28 },
      { x: 1160, y: 398, w: 260, h: 28 },
      { x: 1560, y: 340, w: 240, h: 28 },
      { x: 1990, y: 394, w: 280, h: 28 },
      { x: 2440, y: 322, w: 250, h: 28 },
      { x: 2870, y: 390, w: 290, h: 28 },
      { x: 3330, y: 330, w: 230, h: 28 },
      { x: 3740, y: 400, w: 250, h: 28 },
    ],
    checkpoints: [
      { x: 520, label: "Monsterboys are quick. Watch for green flames." },
      { x: 1840, label: "Black Sun attacks can stop Monsterboys too." },
      { x: 3840, label: "Defeat the last boss and reach James." },
    ],
    enemies: [
      { type: "monsterboy", x: 620, y: GROUND_Y - 74, minX: 520, maxX: 850 },
      { type: "chomper", x: 1210, y: 398 - CHOMPER_FEET_OFFSET, minX: 1160, maxX: 1420 },
      { type: "monsterboy", x: 1640, y: 340 - 74, minX: 1560, maxX: 1800 },
      { type: "ghostBoy", x: 2180, y: 252 },
      { type: "monsterboy", x: 2520, y: 322 - 74, minX: 2440, maxX: 2690 },
      { type: "chomper", x: 3010, y: 390 - CHOMPER_FEET_OFFSET, minX: 2870, maxX: 3160 },
      { type: "monsterboy", x: 3400, y: 330 - 74, minX: 3330, maxX: 3560 },
      { type: "ghostBoy", x: 3850, y: 254 },
    ],
    collectibles: [
      { type: "heart", x: 820, y: 272 },
      { type: "blackSun", x: 2470, y: 276 },
    ],
    boss: { x: 4250, minX: 4120, maxX: 4460 },
    jamesX: 4670,
    flags: { boss: 4080, james: 4630 },
  },
];

let level = levels[0];

let player;
let enemies = [];
let enemyProjectiles = [];
let collectibles = [];
let boss;
let james;
let particles = [];

function loadImages() {
  const promises = Object.entries(assets).map(([name, src]) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      images[name] = image;
      resolve();
    };
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  }));

  Promise.all(promises)
    .then(() => {
      resetGame();
      state.mode = "select";
      requestAnimationFrame(loop);
    })
    .catch((error) => {
      state.mode = "error";
      state.error = error.message;
      requestAnimationFrame(loop);
    });
}

function resetGame(character = state.selected) {
  state.selected = character;
  state.levelIndex = 0;
  startLevel(0, character, 3, false);
}

function startLevel(levelIndex, character = state.selected, health = 3, attackUnlocked = false) {
  level = levels[levelIndex];
  state.levelIndex = levelIndex;
  state.selected = character;
  state.messageTimer = 0;
  state.nextLevelTimer = 0;
  camera.x = 0;
  player = {
    character,
    x: 90,
    y: GROUND_Y - 88,
    w: 38,
    h: 82,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: false,
    invincible: 0,
    health,
    attackUnlocked,
    attackTimer: 0,
    attackCooldown: 0,
    attackHasHit: false,
    animTime: 0,
  };
  enemies = level.enemies.map((enemy) => {
    if (enemy.type === "ghostBoy") return makeGhostBoy(enemy.x, enemy.y);
    if (enemy.type === "monsterboy") return makeMonsterboy(enemy.x, enemy.y, enemy.minX, enemy.maxX);
    return makeChomper(enemy.x, enemy.y, enemy.minX, enemy.maxX);
  });
  enemyProjectiles = [];
  collectibles = (level.collectibles || []).map((item) => makeCollectible(item.type, item.x, item.y));
  boss = {
    x: level.boss.x,
    y: GROUND_Y - 104,
    w: 86,
    h: 96,
    vx: -42,
    minX: level.boss.minX,
    maxX: level.boss.maxX,
    hp: 3,
    hurtTimer: 0,
    defeated: false,
    animTime: 0,
  };
  james = {
    x: level.jamesX,
    y: GROUND_Y - 92,
    w: 38,
    h: 88,
    rescued: false,
    animTime: 0,
  };
  particles = [];
}

function makeCollectible(type, x, y) {
  return {
    type,
    x,
    y,
    w: type === "heart" ? 30 : 44,
    h: type === "heart" ? 28 : 44,
    baseY: y,
    picked: false,
    animTime: 0,
  };
}

function makeChomper(x, y, minX, maxX) {
  return {
    type: "chomper",
    x,
    y,
    w: 58,
    h: 52,
    vx: -56,
    minX,
    maxX,
    defeated: false,
    hurtTimer: 0,
    animTime: 0,
  };
}

function makeGhostBoy(x, y) {
  return {
    type: "ghostBoy",
    x,
    y,
    anchorX: x,
    anchorY: y,
    w: 44,
    h: 68,
    vx: 0,
    facing: -1,
    behavior: "idle",
    behaviorTimer: random(1.4, 3.2),
    phase: random(0, Math.PI * 2),
    defeated: false,
    hurtTimer: 0,
    animTime: 0,
  };
}

function makeMonsterboy(x, y, minX, maxX) {
  return {
    type: "monsterboy",
    x,
    y,
    w: 48,
    h: 70,
    vx: -96,
    minX,
    maxX,
    facing: -1,
    attackCooldown: random(0.8, 1.5),
    attackTimer: 0,
    defeated: false,
    hurtTimer: 0,
    animTime: 0,
  };
}

function loop(timestamp) {
  const dt = Math.min((timestamp - (state.lastTime || timestamp)) / 1000, 0.033);
  state.lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  if (state.mode === "playing") {
    updatePlayer(dt);
    updateAttack(dt);
    updateEnemies(dt);
    updateEnemyProjectiles(dt);
    updateBoss(dt);
    updateJames(dt);
    updateCollectibles(dt);
    updateParticles(dt);
    updateCamera();
  } else if (state.mode === "levelComplete") {
    updateIdleAnimations(dt);
    updateParticles(dt);
    state.nextLevelTimer -= dt;
    if (state.nextLevelTimer <= 0) {
      startLevel(state.levelIndex + 1, state.selected, Math.max(player.health, 1), player.attackUnlocked);
      state.mode = "playing";
      flashMessage(getLevelIntroMessage());
    }
  } else {
    updateIdleAnimations(dt);
  }
}

function updateIdleAnimations(dt) {
  if (player) player.animTime += dt;
  for (const enemy of enemies) enemy.animTime += dt;
  for (const projectile of enemyProjectiles) projectile.animTime += dt;
  for (const collectible of collectibles) collectible.animTime += dt;
  if (boss) boss.animTime += dt;
  if (james) james.animTime += dt;
}

function updatePlayer(dt) {
  const movingLeft = keys.has("ArrowLeft") || keys.has("KeyA");
  const movingRight = keys.has("ArrowRight") || keys.has("KeyD");
  const jumping = keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW");

  const accel = 1150;
  const friction = player.grounded ? 0.84 : 0.96;
  const maxSpeed = 245;

  if (movingLeft) {
    player.vx -= accel * dt;
    player.facing = -1;
  }
  if (movingRight) {
    player.vx += accel * dt;
    player.facing = 1;
  }
  if (!movingLeft && !movingRight) {
    player.vx *= friction;
  }
  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  if (jumping && player.grounded) {
    player.vy = player.character === "maria" ? -575 * 1.3 : -575;
    player.grounded = false;
  }

  player.vy += 1650 * dt;
  player.x += player.vx * dt;
  resolveHorizontalCollisions(player);

  player.y += player.vy * dt;
  player.grounded = false;
  resolveVerticalCollisions(player);

  player.x = clamp(player.x, 12, level.worldWidth - player.w - 12);
  if (player.y > HEIGHT + 240) hurtPlayer(true);
  if (player.invincible > 0) player.invincible -= dt;
  if (player.attackCooldown > 0) player.attackCooldown -= dt;
  player.animTime += dt;

  for (const marker of level.checkpoints) {
    if (Math.abs(player.x - marker.x) < 20) {
      flashMessage(marker.label);
    }
  }
  if (state.messageTimer > 0) state.messageTimer -= dt;
}

function updateAttack(dt) {
  if (player.attackTimer <= 0) return;
  player.attackTimer -= dt;

  if (player.attackHasHit) return;
  const attackBox = getAttackBox();

  for (const enemy of enemies) {
    if (!enemy.defeated && intersects(attackBox, enemy)) {
      defeatEnemy(enemy);
      player.attackHasHit = true;
    }
  }

  if (!player.attackHasHit && boss && !boss.defeated && intersects(attackBox, boss)) {
    damageBoss();
    player.attackHasHit = true;
  }
}

function resolveHorizontalCollisions(entity) {
  for (const platform of level.platforms) {
    if (!intersects(entity, platform)) continue;
    if (entity.vx > 0) entity.x = platform.x - entity.w;
    if (entity.vx < 0) entity.x = platform.x + platform.w;
    entity.vx = 0;
  }
}

function resolveVerticalCollisions(entity) {
  for (const platform of level.platforms) {
    if (!intersects(entity, platform)) continue;
    if (entity.vy > 0) {
      entity.y = platform.y - entity.h;
      entity.vy = 0;
      entity.grounded = true;
    } else if (entity.vy < 0) {
      entity.y = platform.y + platform.h;
      entity.vy = 0;
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    enemy.animTime += dt;
    if (enemy.defeated) {
      enemy.hurtTimer -= dt;
      continue;
    }

    if (enemy.type === "ghostBoy") {
      updateGhostBoy(enemy, dt);
    } else if (enemy.type === "monsterboy") {
      updateMonsterboy(enemy, dt);
    } else {
      updateChomper(enemy, dt);
    }

    if (intersects(player, enemy)) {
      if (isStomp(player, enemy)) {
        defeatEnemy(enemy);
      } else {
        hurtPlayer();
      }
    }
  }
}

function updateChomper(enemy, dt) {
  enemy.x += enemy.vx * dt;
  if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) {
    enemy.vx *= -1;
    enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX - enemy.w);
  }
}

function updateGhostBoy(enemy, dt) {
  const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
  const dy = player.y + player.h / 2 - (enemy.y + enemy.h / 2);
  const horizontalOverlap = Math.abs(dx) < enemy.w * 1.8;
  const playerIsBelow = player.y > enemy.y + enemy.h * 0.7;
  const nearPlayer = Math.hypot(dx, dy) < 280;
  const playerBelowNearby = playerIsBelow && horizontalOverlap && dy < 280;

  enemy.behaviorTimer -= dt;
  if (enemy.behaviorTimer <= 0) {
    if ((nearPlayer || playerBelowNearby) && Math.random() < 0.5) {
      enemy.behavior = "chase";
      enemy.behaviorTimer = random(1.0, 1.8);
    } else {
      enemy.behavior = Math.random() < 0.1 ? "wander" : "idle";
      enemy.behaviorTimer = random(1.4, 3.0);
    }
  }

  const bobY = enemy.anchorY + Math.sin(enemy.animTime * 2.6 + enemy.phase) * 8;
  const minX = enemy.anchorX - enemy.w;
  const maxX = enemy.anchorX + enemy.w;
  const minY = enemy.anchorY - enemy.h * 0.65;
  const maxY = enemy.anchorY + enemy.h * 0.65;
  let targetX = enemy.anchorX;
  let targetY = bobY;

  if (enemy.behavior === "wander") {
    targetX = enemy.anchorX + Math.sin(enemy.animTime * 1.4 + enemy.phase) * enemy.w;
  } else if (enemy.behavior === "chase" && (nearPlayer || playerBelowNearby)) {
    targetX = enemy.x + Math.sign(dx || 1) * 38 * dt;
    targetY = enemy.y + Math.sign(dy || 1) * (playerBelowNearby ? 34 : 24) * dt;
  }

  const previousX = enemy.x;
  enemy.x = clamp(lerp(enemy.x, targetX, enemy.behavior === "chase" ? 0.4 : 0.08), minX, maxX);
  enemy.y = clamp(lerp(enemy.y, targetY, enemy.behavior === "chase" ? 0.25 : 0.12), minY, maxY);
  enemy.vx = (enemy.x - previousX) / Math.max(dt, 0.001);
  if (Math.abs(enemy.vx) > 4) enemy.facing = enemy.vx < 0 ? -1 : 1;
}

function updateMonsterboy(enemy, dt) {
  if (enemy.hurtTimer > 0) enemy.hurtTimer -= dt;
  if (enemy.attackTimer > 0) enemy.attackTimer -= dt;
  if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

  enemy.x += enemy.vx * dt;
  if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) {
    enemy.vx *= -1;
    enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX - enemy.w);
  }
  enemy.facing = enemy.vx < 0 ? -1 : 1;

  const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
  const dy = Math.abs(player.y + player.h / 2 - (enemy.y + enemy.h / 2));
  const canShoot = Math.abs(dx) < 470 && dy < 130 && enemy.attackCooldown <= 0;
  if (canShoot) {
    fireMonsterboyProjectile(enemy, Math.sign(dx || enemy.facing));
  }
}

function fireMonsterboyProjectile(enemy, direction) {
  enemy.facing = direction;
  enemy.attackTimer = 0.48;
  enemy.attackCooldown = random(1.3, 2.1);
  enemyProjectiles.push({
    type: "monsterFlame",
    x: direction > 0 ? enemy.x + enemy.w - 4 : enemy.x - 28,
    y: enemy.y + 29,
    w: 34,
    h: 16,
    vx: direction * 260,
    animTime: 0,
  });
}

function updateEnemyProjectiles(dt) {
  enemyProjectiles = enemyProjectiles.filter((projectile) => {
    projectile.animTime += dt;
    projectile.x += projectile.vx * dt;

    if (intersects(player, projectile)) {
      hurtPlayer();
      return false;
    }

    if (projectile.x + projectile.w < 0 || projectile.x > level.worldWidth) return false;
    return !level.platforms.some((platform) => intersects(projectile, platform));
  });
}

function updateBoss(dt) {
  boss.animTime += dt;
  if (boss.hurtTimer > 0) boss.hurtTimer -= dt;
  if (boss.defeated) return;

  boss.x += boss.vx * dt;
  if (boss.x < boss.minX || boss.x + boss.w > boss.maxX) {
    boss.vx *= -1;
    boss.x = clamp(boss.x, boss.minX, boss.maxX - boss.w);
  }

  if (intersects(player, boss)) {
    if (isStomp(player, boss)) {
      player.vy = -500;
      damageBoss();
    } else {
      hurtPlayer();
    }
  }
}

function damageBoss() {
  boss.hp -= 1;
  boss.hurtTimer = 0.45;
  spawnBurst(boss.x + boss.w / 2, boss.y + 18, "#facc15");
  flashMessage(boss.hp > 0 ? `${boss.hp} hit${boss.hp === 1 ? "" : "s"} left!` : "The boss is down. Rescue James!");
  if (boss.hp <= 0) {
    boss.defeated = true;
    boss.vx = 0;
    boss.y = GROUND_Y - 52;
    dropHeart();
  }
}

function dropHeart() {
  collectibles.push(makeCollectible("heart", boss.x + boss.w / 2 - 15, GROUND_Y - 72));
}

function updateJames(dt) {
  james.animTime += dt;
  if (!boss.defeated) return;
  if (intersects(player, james)) {
    james.rescued = true;
    flashMessage("James is safe!");
    spawnBurst(james.x + james.w / 2, james.y + 18, "#a78bfa");
    if (state.levelIndex < levels.length - 1) {
      state.mode = "levelComplete";
      state.nextLevelTimer = 1.8;
    } else {
      state.mode = "won";
    }
  }
}

function updateCollectibles(dt) {
  for (const collectible of collectibles) {
    if (collectible.picked) continue;
    collectible.animTime += dt;
    collectible.y = collectible.baseY + Math.sin(collectible.animTime * 3) * 5;

    if (!intersects(player, collectible)) continue;
    collectible.picked = true;

    if (collectible.type === "heart") {
      player.health = Math.min(MAX_HEALTH, player.health + 1);
      flashMessage("Health increased!");
      spawnBurst(collectible.x + collectible.w / 2, collectible.y + collectible.h / 2, "#ef4444");
    } else if (collectible.type === "blackSun") {
      player.attackUnlocked = true;
      flashMessage("Black Sun collected. Press CTRL to attack!");
      spawnBurst(collectible.x + collectible.w / 2, collectible.y + collectible.h / 2, "#111827");
    }
  }
}

function updateParticles(dt) {
  particles = particles.filter((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 500 * dt;
    return particle.life > 0;
  });
}

function updateCamera() {
  const target = player.x + player.w / 2 - WIDTH * 0.42;
  camera.x += (clamp(target, 0, level.worldWidth - WIDTH) - camera.x) * 0.12;
}

function isStomp(attacker, target) {
  const attackerBottom = attacker.y + attacker.h;
  const targetTop = target.y + 18;
  return attacker.vy > 120 && attackerBottom - targetTop < 34;
}

function defeatEnemy(enemy) {
  enemy.defeated = true;
  enemy.hurtTimer = 0.8;
  player.vy = -440;
  const burstColor = enemy.type === "ghostBoy" ? "#c084fc" : enemy.type === "monsterboy" ? "#22c55e" : "#e5e7eb";
  const enemyName = enemy.type === "ghostBoy" ? "Ghost Boy" : enemy.type === "monsterboy" ? "Monsterboy" : "Chomper";
  spawnBurst(enemy.x + enemy.w / 2, enemy.y + 10, burstColor);
  flashMessage(`${enemyName} defeated!`);
}

function hurtPlayer(fell = false) {
  if (player.invincible > 0) return;
  player.health -= 1;
  player.invincible = 1.4;
  player.vx = fell ? 0 : -player.facing * 190;
  player.vy = -380;
  spawnBurst(player.x + player.w / 2, player.y + 24, "#fb7185");
  flashMessage(player.health > 0 ? "Ouch! Stomp enemies from above." : "Try again?");

  if (player.health <= 0 || fell) {
    state.mode = "lost";
  }
}

function startAttack() {
  if (!player?.attackUnlocked) {
    flashMessage("Find the Black Sun to unlock attack.");
    return;
  }
  if (player.attackCooldown > 0 || player.attackTimer > 0) return;
  player.attackTimer = 0.28;
  player.attackCooldown = 0.55;
  player.attackHasHit = false;
}

function getAttackBox() {
  const range = 74;
  return {
    x: player.facing > 0 ? player.x + player.w - 4 : player.x - range + 4,
    y: player.y + 16,
    w: range,
    h: 46,
  };
}

function flashMessage(text) {
  state.message = text;
  state.messageTimer = 2.4;
}

function getLevelIntroMessage() {
  if (state.levelIndex === 1) return `${level.name}: watch for Ghost Boys!`;
  if (state.levelIndex === 2) return `${level.name}: dodge the green flames!`;
  return `${level.name}: rescue James!`;
}

function spawnBurst(x, y, color) {
  for (let i = 0; i < 12; i += 1) {
    particles.push({
      x,
      y,
      vx: Math.cos((Math.PI * 2 * i) / 12) * random(70, 150),
      vy: Math.sin((Math.PI * 2 * i) / 12) * random(70, 150),
      life: random(0.35, 0.75),
      color,
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (state.mode === "error") {
    drawPanel("Sprite Load Error", state.error || "Could not load assets.", "Check the assets/sprites folder.");
    return;
  }

  drawWorld();

  if (state.mode === "loading") {
    drawPanel("Loading", "Preparing the rescue mission...", "");
  } else if (state.mode === "select") {
    drawCharacterSelect();
  } else if (state.mode === "levelComplete") {
    const nextLevel = levels[state.levelIndex + 1];
    drawPanel("James Is Safe!", `${nextLevel.name} is ahead.`, `Get ready for level ${state.levelIndex + 2}...`);
  } else if (state.mode === "won") {
    drawPanel("James Rescued!", "You cleared all three levels and saved James.", "Press R to play again.");
  } else if (state.mode === "lost") {
    drawPanel("Game Over", "Enemies are dangerous from the side.", "Press R to try again.");
  }
}

function drawWorld() {
  drawSky();

  ctx.save();
  ctx.translate(-Math.round(camera.x), 0);
  drawBackgroundDetails();
  drawPlatforms();
  drawSignposts();
  drawCollectibles();
  drawEntity(james, "james", james.rescued ? "happy" : "idle", james.x, james.y + 3, james.w, james.h, 1);
  drawBoss();
  drawEnemies();
  drawEnemyProjectiles();
  drawPlayer();
  drawAttack();
  drawParticles();
  ctx.restore();

  drawHud();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  if (state.levelIndex === 2) {
    gradient.addColorStop(0, "#14532d");
    gradient.addColorStop(0.58, "#22c55e");
    gradient.addColorStop(1, "#bbf7d0");
  } else if (state.levelIndex === 1) {
    gradient.addColorStop(0, "#1e1b4b");
    gradient.addColorStop(0.62, "#4c1d95");
    gradient.addColorStop(1, "#312e81");
  } else {
    gradient.addColorStop(0, "#7dd3fc");
    gradient.addColorStop(0.72, "#bae6fd");
    gradient.addColorStop(1, "#bbf7d0");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = state.levelIndex === 1 ? "rgba(226, 232, 240, 0.28)" : state.levelIndex === 2 ? "rgba(240, 253, 244, 0.66)" : "rgba(255,255,255,0.85)";
  drawCloud(140, 80);
  drawCloud(520, 120);
  drawCloud(850, 75);
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.arc(x + 32, y - 10, 36, 0, Math.PI * 2);
  ctx.arc(x + 72, y, 28, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackgroundDetails() {
  if (state.levelIndex === 1) {
    drawDeadTree(720, GROUND_Y, 1.08);
    drawDeadTree(2520, GROUND_Y, 0.9);
  } else if (state.levelIndex === 2) {
    drawForestTree(520, GROUND_Y, 1.08);
    drawForestTree(1420, GROUND_Y, 0.92);
    drawForestTree(2360, GROUND_Y, 1.18);
    drawForestTree(3240, GROUND_Y, 0.98);
    drawForestTree(4320, GROUND_Y, 1.08);
  }
}

function drawForestTree(x, groundY, scale) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-16, -116, 32, 116);
  ctx.fillStyle = "#166534";
  ctx.beginPath();
  ctx.arc(-34, -128, 48, 0, Math.PI * 2);
  ctx.arc(18, -158, 58, 0, Math.PI * 2);
  ctx.arc(62, -118, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(-12, -172, 34, 0, Math.PI * 2);
  ctx.arc(42, -154, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(20, 83, 45, 0.22)";
  ctx.beginPath();
  ctx.ellipse(8, 4, 68, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDeadTree(x, groundY, scale) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "rgba(15, 23, 42, 0.78)";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(6, -92);
  ctx.lineTo(-4, -148);
  ctx.stroke();

  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(2, -82);
  ctx.lineTo(-42, -118);
  ctx.lineTo(-62, -150);
  ctx.moveTo(4, -105);
  ctx.lineTo(42, -140);
  ctx.lineTo(58, -176);
  ctx.moveTo(-1, -135);
  ctx.lineTo(-28, -170);
  ctx.moveTo(2, -122);
  ctx.lineTo(33, -112);
  ctx.stroke();

  ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
  ctx.beginPath();
  ctx.ellipse(5, 4, 44, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlatforms() {
  for (const platform of level.platforms) {
    ctx.fillStyle = state.levelIndex === 2 ? "#5f3b1f" : "#7c4a2d";
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = state.levelIndex === 2 ? "#16a34a" : "#22c55e";
    ctx.fillRect(platform.x, platform.y, platform.w, Math.min(12, platform.h));
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    for (let x = platform.x + 12; x < platform.x + platform.w; x += 46) {
      ctx.fillRect(x, platform.y + 22, 20, 4);
    }
  }
}

function drawSignposts() {
  drawFlag(120, "Start");
  drawFlag(level.flags.boss, "Boss");
  drawFlag(level.flags.james, "James");
}

function drawCollectibles() {
  for (const collectible of collectibles) {
    if (collectible.picked) continue;
    if (collectible.type === "heart") {
      drawHeart(collectible.x + collectible.w / 2, collectible.y + collectible.h / 2, 1);
    } else if (collectible.type === "blackSun") {
      drawBlackSun(collectible.x + collectible.w / 2, collectible.y + collectible.h / 2, 1);
    }
  }
}

function drawHeart(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-24, -6, -12, -24, 0, -10);
  ctx.bezierCurveTo(12, -24, 24, -6, 0, 12);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(-7, -12, 5, 4);
  ctx.restore();
}

function drawBlackSun(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#020617";
  ctx.fillStyle = "#020617";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
    ctx.lineTo(Math.cos(angle) * 29, Math.sin(angle) * 29);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlag(x, text) {
  ctx.fillStyle = "#92400e";
  ctx.fillRect(x, GROUND_Y - 76, 8, 76);
  ctx.fillStyle = "#fde047";
  ctx.fillRect(x + 8, GROUND_Y - 76, 78, 34);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 15px Arial";
  ctx.fillText(text, x + 16, GROUND_Y - 54);
}

function drawPlayer() {
  const blinking = player.invincible > 0 && Math.floor(player.invincible * 16) % 2 === 0;
  if (blinking) return;
  const animation = player.attackTimer > 0 ? "attack" : player.grounded ? (Math.abs(player.vx) > 18 ? "walk" : "idle") : "jump";
  drawEntity(player, player.character, animation, player.x - 10, player.y - 6, player.w + 20, player.h + 6, player.facing);
}

function drawAttack() {
  if (!player || player.attackTimer <= 0) return;
  const attackBox = getAttackBox();
  ctx.save();
  ctx.globalAlpha = 0.32 + player.attackTimer;
  ctx.fillStyle = player.character === "maria" ? "#e879f9" : "#facc15";
  ctx.beginPath();
  ctx.ellipse(
    attackBox.x + attackBox.w / 2,
    attackBox.y + attackBox.h / 2,
    attackBox.w / 2,
    attackBox.h / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (enemy.defeated && enemy.hurtTimer <= 0) continue;
    if (enemy.type === "ghostBoy") {
      const animation = enemy.defeated ? "defeated" : enemy.hurtTimer > 0 ? "hurt" : enemy.behavior === "chase" ? "attack" : "float";
      drawEntity(
        enemy,
        "ghostBoy",
        animation,
        enemy.x - 12,
        enemy.y - 18,
        enemy.w + 30,
        enemy.h + 34,
        enemy.facing,
      );
      continue;
    }

    if (enemy.type === "monsterboy") {
      const animation = enemy.defeated ? "defeated" : enemy.hurtTimer > 0 ? "hurt" : enemy.attackTimer > 0 ? "attack" : "run";
      drawEntity(
        enemy,
        "monsterboy",
        animation,
        enemy.x - 17,
        enemy.y - 24,
        enemy.w + 42,
        enemy.h + 28,
        enemy.facing,
      );
      continue;
    }

    drawEntity(
      enemy,
      "chomper",
      enemy.defeated ? "defeated" : "walk",
      enemy.x - 10,
      enemy.y - 6,
      enemy.w + 24,
      enemy.h + 26,
      enemy.vx < 0 ? -1 : 1,
    );
  }
}

function drawEnemyProjectiles() {
  for (const projectile of enemyProjectiles) {
    if (projectile.type === "monsterFlame") {
      drawMonsterFlame(projectile);
    }
  }
}

function drawMonsterFlame(projectile) {
  const frames = sprites.monsterboy.projectile;
  const frame = frames[Math.floor(projectile.animTime * 12) % frames.length];
  const image = images.monsterboy;

  if (!image) {
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.ellipse(projectile.x + projectile.w / 2, projectile.y + projectile.h / 2, projectile.w / 2, projectile.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.save();
  if (projectile.vx < 0) {
    ctx.translate(projectile.x + projectile.w, projectile.y);
    ctx.scale(-1, 1);
    ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, projectile.w, projectile.h);
  } else {
    ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, projectile.x, projectile.y, projectile.w, projectile.h);
  }
  ctx.restore();
}

function drawBoss() {
  const animation = boss.defeated ? "defeated" : boss.hurtTimer > 0 ? "hurt" : "walk";
  const drawY = boss.defeated ? boss.y - 30 : boss.y - 5;
  const drawH = boss.defeated ? boss.h - 10 : boss.h + 12;
  drawEntity(boss, "boss", animation, boss.x - 16, drawY, boss.w + 36, drawH, boss.vx < 0 ? -1 : 1);
}

function drawEntity(entity, spriteName, animation, x, y, w, h, facing = 1) {
  const sprite = sprites[spriteName];
  const frames = sprite[animation] || sprite.idle || sprite.walk;
  const frame = frames[Math.floor(entity.animTime * 8) % frames.length];
  const image = images[sprite.sheet];
  const scale = Math.min(w / frame.w, h / frame.h);
  const drawW = Math.round(frame.w * scale);
  const drawH = Math.round(frame.h * scale);
  const drawX = Math.round(x + (w - drawW) / 2);
  const drawY = Math.round(y + h - drawH);

  if (!image) {
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(drawX, drawY, drawW, drawH);
    return;
  }

  ctx.save();
  if (facing < 0) {
    ctx.translate(drawX + drawW, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = clamp(particle.life * 2, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - 3, particle.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}

function drawHud() {
  ctx.fillStyle = "rgba(15, 23, 42, 0.76)";
  ctx.fillRect(18, 16, 328, 72);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 22px Arial";
  ctx.fillText(`Hero: ${capitalize(state.selected)}  L${state.levelIndex + 1}`, 34, 44);
  ctx.font = "18px Arial";
  ctx.fillText(`Health: ${"I ".repeat(Math.max(player?.health || 0, 0)).trim()}`, 34, 72);
  if (player?.attackUnlocked) {
    ctx.fillStyle = "#c4b5fd";
    ctx.fillText("CTRL attack ready", 146, 72);
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.76)";
  ctx.fillRect(WIDTH - 328, 16, 310, 72);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 18px Arial";
  ctx.fillText("Objective", WIDTH - 310, 44);
  ctx.font = "16px Arial";
  ctx.fillText(boss?.defeated ? "Reach James!" : `${level.name}: stomp the boss.`, WIDTH - 310, 70);

  if (state.messageTimer > 0) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
    ctx.fillRect(WIDTH / 2 - 230, 104, 460, 44);
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(state.message, WIDTH / 2, 132);
    ctx.textAlign = "left";
  }
}

function drawCharacterSelect() {
  ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.font = "bold 44px Arial";
  ctx.fillText("Choose Your Hero", WIDTH / 2, 96);
  ctx.font = "20px Arial";
  ctx.fillText("Click a character, or press M for Mark and A for Maria.", WIDTH / 2, 132);

  drawCharacterCard("mark", WIDTH / 2 - 250, 185);
  drawCharacterCard("maria", WIDTH / 2 + 70, 185);
  ctx.textAlign = "left";
}

function drawCharacterCard(character, x, y) {
  const isSelected = state.selected === character;
  ctx.fillStyle = isSelected ? "rgba(250, 204, 21, 0.24)" : "rgba(248, 250, 252, 0.12)";
  ctx.strokeStyle = isSelected ? "#facc15" : "rgba(248, 250, 252, 0.45)";
  ctx.lineWidth = 4;
  ctx.fillRect(x, y, 180, 230);
  ctx.strokeRect(x, y, 180, 230);

  const fakeEntity = { animTime: performance.now() / 1000 };
  drawEntity(fakeEntity, character, "idle", x + 55, y + 36, 70, 112, 1);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(capitalize(character), x + 90, y + 178);
  ctx.font = "16px Arial";
  ctx.fillText(character === "mark" ? "Quick and steady" : "Light and nimble", x + 90, y + 206);
}

function drawPanel(title, line1, line2) {
  ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.font = "bold 48px Arial";
  ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 54);
  ctx.font = "22px Arial";
  ctx.fillText(line1, WIDTH / 2, HEIGHT / 2 - 12);
  if (line2) ctx.fillText(line2, WIDTH / 2, HEIGHT / 2 + 28);
  ctx.textAlign = "left";
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function selectCharacter(character) {
  resetGame(character);
  state.mode = "playing";
  flashMessage(`Go, ${capitalize(character)}! Rescue James.`);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "ControlLeft", "ControlRight"].includes(event.code)) {
    event.preventDefault();
  }

  if (state.mode === "playing" && (event.code === "ControlLeft" || event.code === "ControlRight")) {
    startAttack();
  }

  if (state.mode === "select") {
    if (event.code === "KeyM") selectCharacter("mark");
    if (event.code === "KeyA") selectCharacter("maria");
    if (event.code === "Enter") selectCharacter(state.selected);
  }

  if ((state.mode === "won" || state.mode === "lost") && event.code === "KeyR") {
    resetGame(state.selected);
    state.mode = "select";
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

canvas.addEventListener("click", (event) => {
  if (state.mode !== "select") return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const cards = [
    { character: "mark", x: WIDTH / 2 - 250, y: 185, w: 180, h: 230 },
    { character: "maria", x: WIDTH / 2 + 70, y: 185, w: 180, h: 230 },
  ];
  const card = cards.find((candidate) => x >= candidate.x && x <= candidate.x + candidate.w && y >= candidate.y && y <= candidate.y + candidate.h);
  if (card) selectCharacter(card.character);
});

loadImages();
