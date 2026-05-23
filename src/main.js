const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const gameFrame = document.querySelector(".game-frame");
const fullscreenButton = document.querySelector(".fullscreen-button");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 474;
const GRAVITY = 1650;
const CHOMPER_FEET_OFFSET = 72;
const CHOMPER_HITBOX_Y_OFFSET = 10;
const MAX_HEALTH = 5;
const PLAYER_STANDING_HEIGHT = 82;
const PLAYER_DUCKING_HEIGHT = 48;
const BOSS_STOMP_BOUNCE_SPEED = 500;
const GHOST_CHASE_DISTANCE = 380;
const GHOST_LEASH_X = 440;
const GHOST_LEASH_Y = 290;
const GHOST_CHASE_SPEED_X = 76;
const GHOST_CHASE_SPEED_Y = 48;
const LEDGE_HAND_Y = 26;
const LEDGE_GRAB_VERT_TOLERANCE = 26;
const LEDGE_GRAB_HORZ_TOLERANCE = 18;
const LEDGE_CLIMB_DURATION = 0.34;
const LEDGE_RELEASE_GAP = 2;
const FLASH_MESSAGE_DURATION = 1.8;
const HIGH_SCORE_KEY = "rescueJamesHighScore";
const APP_COMMIT = "dev";
const TITLE_FONT = '"Fraunces", Georgia, serif';
const UI_FONT = '"Nunito", "Trebuchet MS", sans-serif';

const keys = new Set();
const images = {};
const camera = { x: 0 };

const IS_TOUCH = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const TOUCH_BTNS = [
  { id: "up",     key: "ArrowUp",     x: 106, y: 420, r: 32, label: "▲", fontSize: 17 },
  { id: "left",   key: "ArrowLeft",   x: 58,  y: 468, r: 32, label: "◀", fontSize: 17 },
  { id: "right",  key: "ArrowRight",  x: 154, y: 468, r: 32, label: "▶", fontSize: 17 },
  { id: "down",   key: "ArrowDown",   x: 106, y: 508, r: 32, label: "▼", fontSize: 17 },
  { id: "jump",   key: "Space",       x: 806, y: 470, r: 42, label: "▲", fontSize: 22 },
  { id: "attack", key: "ControlLeft", x: 906, y: 470, r: 42, label: "⚡", fontSize: 22 },
];
const DPAD_CENTER = { x: 106, y: 466 };
const DPAD_OUTER_R = 82;
const DPAD_DEAD_ZONE = 13;
const DPAD_IDS = new Set(["up", "left", "right", "down"]);
let touchPressedKeys = new Set();

const assets = {
  characters: "assets/sprites/characters.png",
  chomper: "assets/sprites/chomper.png",
  ghostBoy: "assets/sprites/ghostboy.png",
  monsterboy: "assets/sprites/monsterboy.png",
  ogrebaby: "assets/sprites/ogrebaby.png",
  ogreboss: "assets/sprites/ogreboss.png",
  coin: "assets/sprites/coin.png",
  heartBlackSun: "assets/sprites/heartblacksun.png",
};

const state = {
  mode: "loading",
  selected: "mark",
  levelIndex: 0,
  monsterMultiplier: 1,
  score: 0,
  highScore: loadHighScore(),
  newHighScore: false,
  wonInputReadyAt: 0,
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

sprites.ogrebaby = {
  sheet: "ogrebaby",
  idle: [
    { x: 88, y: 131, w: 155, h: 174 },
    { x: 277, y: 131, w: 149, h: 173 },
    { x: 460, y: 132, w: 155, h: 172 },
    { x: 648, y: 131, w: 162, h: 174 },
  ],
  walk: [
    { x: 89, y: 365, w: 156, h: 164 },
    { x: 289, y: 362, w: 139, h: 166 },
    { x: 476, y: 361, w: 140, h: 166 },
    { x: 670, y: 359, w: 152, h: 169 },
    { x: 872, y: 358, w: 149, h: 169 },
    { x: 1060, y: 358, w: 168, h: 170 },
  ],
  attack: [
    { x: 54, y: 599, w: 159, h: 154 },
    { x: 266, y: 599, w: 148, h: 152 },
    { x: 419, y: 598, w: 166, h: 154 },
    { x: 640, y: 593, w: 199, h: 160 },
    { x: 859, y: 598, w: 174, h: 155 },
    { x: 1048, y: 600, w: 161, h: 153 },
    { x: 1225, y: 602, w: 171, h: 151 },
  ],
  hurt: [
    { x: 60, y: 798, w: 160, h: 156 },
    { x: 269, y: 808, w: 144, h: 148 },
    { x: 460, y: 809, w: 143, h: 144 },
    { x: 649, y: 814, w: 150, h: 140 },
  ],
  defeated: [
    { x: 59, y: 1000, w: 164, h: 104 },
    { x: 251, y: 1014, w: 190, h: 94 },
    { x: 465, y: 1024, w: 204, h: 85 },
    { x: 697, y: 1028, w: 212, h: 75 },
  ],
};
sprites.ogrebaby.run = sprites.ogrebaby.walk;

sprites.ogreboss = {
  sheet: "ogreboss",
  idle: [
    { x: 61, y: 114, w: 168, h: 176 },
    { x: 261, y: 119, w: 163, h: 169 },
    { x: 454, y: 119, w: 157, h: 172 },
    { x: 663, y: 118, w: 167, h: 173 },
  ],
  walk: [
    { x: 76, y: 348, w: 152, h: 159 },
    { x: 250, y: 346, w: 162, h: 161 },
    { x: 436, y: 348, w: 147, h: 160 },
    { x: 623, y: 347, w: 158, h: 161 },
    { x: 818, y: 349, w: 159, h: 159 },
    { x: 1010, y: 350, w: 159, h: 159 },
    { x: 1194, y: 350, w: 149, h: 159 },
  ],
  attack: [
    { x: 29, y: 565, w: 172, h: 158 },
    { x: 226, y: 568, w: 172, h: 155 },
    { x: 398, y: 568, w: 171, h: 155 },
    { x: 611, y: 575, w: 202, h: 148 },
    { x: 828, y: 574, w: 177, h: 151 },
    { x: 1016, y: 572, w: 183, h: 153 },
    { x: 1199, y: 572, w: 182, h: 153 },
  ],
  hurt: [
    { x: 50, y: 756, w: 167, h: 162 },
    { x: 253, y: 765, w: 164, h: 153 },
    { x: 450, y: 772, w: 132, h: 144 },
    { x: 630, y: 790, w: 137, h: 129 },
  ],
  defeated: [
    { x: 50, y: 956, w: 167, h: 127 },
    { x: 235, y: 977, w: 190, h: 105 },
    { x: 441, y: 993, w: 226, h: 89 },
    { x: 684, y: 1002, w: 217, h: 81 },
  ],
};
sprites.ogreboss.run = sprites.ogreboss.walk;

sprites.coin = {
  sheet: "coin",
  spin: [
    { x: 42, y: 456, w: 90, h: 120 },
    { x: 195, y: 456, w: 59, h: 120 },
    { x: 333, y: 456, w: 36, h: 120 },
    { x: 454, y: 456, w: 25, h: 120 },
    { x: 569, y: 456, w: 31, h: 120 },
    { x: 698, y: 456, w: 37, h: 120 },
    { x: 830, y: 456, w: 73, h: 120 },
    { x: 980, y: 456, w: 78, h: 120 },
    { x: 1129, y: 456, w: 75, h: 120 },
    { x: 1273, y: 456, w: 71, h: 120 },
    { x: 1406, y: 456, w: 80, h: 120 },
  ],
};

sprites.heart = {
  sheet: "heartBlackSun",
  idle: [
    { x: 67, y: 154, w: 64, h: 113 },
    { x: 216, y: 154, w: 72, h: 113 },
    { x: 381, y: 154, w: 63, h: 113 },
    { x: 544, y: 154, w: 72, h: 113 },
    { x: 697, y: 154, w: 69, h: 113 },
    { x: 845, y: 154, w: 64, h: 113 },
    { x: 1005, y: 154, w: 71, h: 113 },
    { x: 1148, y: 154, w: 70, h: 113 },
    { x: 1301, y: 154, w: 72, h: 113 },
  ],
};

sprites.blackSun = {
  sheet: "heartBlackSun",
  idle: [
    { x: 54, y: 531, w: 105, h: 140 },
    { x: 209, y: 531, w: 109, h: 140 },
    { x: 366, y: 531, w: 107, h: 140 },
    { x: 516, y: 531, w: 117, h: 140 },
    { x: 681, y: 531, w: 102, h: 140 },
    { x: 829, y: 531, w: 124, h: 140 },
    { x: 996, y: 531, w: 105, h: 140 },
    { x: 1143, y: 531, w: 119, h: 140 },
    { x: 1302, y: 531, w: 102, h: 140 },
  ],
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
    collectibles: [
      { type: "coin", x: 510, y: 348 },
      { type: "coin", x: 870, y: 282 },
      { type: "coin", x: 1290, y: 360 },
      { type: "coin", x: 2110, y: 348 },
      { type: "coin", x: 2540, y: 286 },
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
      { type: "coin", x: 470, y: 352 },
      { type: "coin", x: 880, y: 288 },
      { type: "blackSun", x: 1580, y: 260 },
      { type: "coin", x: 2120, y: 358 },
      { type: "coin", x: 2570, y: 294 },
      { type: "coin", x: 3010, y: 344 },
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
      { type: "coin", x: 440, y: 344 },
      { type: "heart", x: 820, y: 272 },
      { type: "coin", x: 1240, y: 356 },
      { type: "coin", x: 1660, y: 296 },
      { type: "coin", x: 2110, y: 350 },
      { type: "blackSun", x: 2470, y: 276 },
      { type: "coin", x: 2960, y: 346 },
      { type: "coin", x: 3400, y: 288 },
      { type: "coin", x: 3830, y: 358 },
    ],
    boss: { x: 4250, minX: 4120, maxX: 4460 },
    jamesX: 4670,
    flags: { boss: 4080, james: 4630 },
  },
  {
    name: "Ogre Citadel",
    worldWidth: 5600,
    platforms: [
      { x: 0, y: GROUND_Y, w: 5600, h: 80 },
      { x: 380, y: 392, w: 260, h: 28 },
      { x: 820, y: 322, w: 240, h: 28 },
      { x: 1260, y: 402, w: 280, h: 28 },
      { x: 1720, y: 334, w: 240, h: 28 },
      { x: 2160, y: 394, w: 300, h: 28 },
      { x: 2660, y: 328, w: 250, h: 28 },
      { x: 3140, y: 388, w: 280, h: 28 },
      { x: 3620, y: 320, w: 250, h: 28 },
      { x: 4080, y: 398, w: 280, h: 28 },
      { x: 4560, y: 330, w: 250, h: 28 },
    ],
    checkpoints: [
      { x: 520, label: "Ogre Babies swing clubs every ten seconds." },
      { x: 2600, label: "The Ogre boss swings hard every five seconds." },
      { x: 4620, label: "The Ogre needs four hits to go down." },
    ],
    enemies: [
      { type: "ogreBaby", x: 600, y: GROUND_Y - 74, minX: 500, maxX: 840 },
      { type: "chomper", x: 1040, y: 322 - CHOMPER_FEET_OFFSET, minX: 820, maxX: 1060 },
      { type: "ghostBoy", x: 1440, y: 244 },
      { type: "monsterboy", x: 1860, y: 334 - 74, minX: 1720, maxX: 1970 },
      { type: "ogreBaby", x: 2320, y: 394 - 74, minX: 2160, maxX: 2460 },
      { type: "chomper", x: 2760, y: 328 - CHOMPER_FEET_OFFSET, minX: 2660, maxX: 2910 },
      { type: "ghostBoy", x: 3280, y: 238 },
      { type: "monsterboy", x: 3720, y: 320 - 74, minX: 3620, maxX: 3870 },
      { type: "ogreBaby", x: 4220, y: 398 - 74, minX: 4080, maxX: 4360 },
      { type: "chomper", x: 4670, y: 330 - CHOMPER_FEET_OFFSET, minX: 4560, maxX: 4810 },
    ],
    collectibles: [
      { type: "coin", x: 460, y: 350 },
      { type: "coin", x: 890, y: 280 },
      { type: "coin", x: 1340, y: 358 },
      { type: "heart", x: 1820, y: 286 },
      { type: "coin", x: 2260, y: 350 },
      { type: "coin", x: 2740, y: 286 },
      { type: "coin", x: 3220, y: 346 },
      { type: "blackSun", x: 3640, y: 272 },
      { type: "coin", x: 4160, y: 356 },
      { type: "coin", x: 4620, y: 288 },
    ],
    boss: { type: "ogreboss", x: 5000, minX: 4860, maxX: 5300, hp: 4 },
    jamesX: 5430,
    flags: { boss: 4840, james: 5390 },
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
  state.monsterMultiplier = 1;
  state.score = 0;
  state.newHighScore = false;
  state.wonInputReadyAt = 0;
  startLevel(0, character, 3, false);
}

function startLevel(levelIndex, character = state.selected, health = 3, attackUnlocked = false, sunCount = attackUnlocked ? 1 : 0) {
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
    h: PLAYER_STANDING_HEIGHT,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: false,
    invincible: 0,
    health,
    sunCount,
    attackUnlocked: sunCount > 0,
    attackTimer: 0,
    attackCooldown: 0,
    attackHasHit: false,
    attackDirection: "forward",
    animTime: 0,
    ducking: false,
    ledgeGrab: null,
    climbing: false,
    climbTimer: 0,
  };
  enemies = level.enemies.flatMap((enemy) => makeEnemyWave(enemy, state.monsterMultiplier));
  enemyProjectiles = [];
  collectibles = (level.collectibles || []).map((item) => makeCollectible(item.type, item.x, item.y));
  const bossStats = getBossStats(level.boss.type);
  boss = {
    type: level.boss.type || "boss",
    x: level.boss.x,
    y: GROUND_Y - bossStats.h - bossStats.groundOffset,
    w: bossStats.w,
    h: bossStats.h,
    vx: -42,
    vy: 0,
    jumpTimer: 7,
    minX: level.boss.minX,
    maxX: level.boss.maxX,
    hp: level.boss.hp || bossStats.hp,
    hurtTimer: 0,
    attackCooldown: bossStats.attackCooldown,
    attackTimer: 0,
    attackHasHit: false,
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

function getBossStats(type = "boss") {
  if (type === "ogreboss") {
    return {
      w: 102,
      h: PLAYER_STANDING_HEIGHT * 2,
      hp: 4,
      attackCooldown: 5,
      groundOffset: 0,
    };
  }
  return {
    w: 86,
    h: 96,
    hp: 3,
    attackCooldown: 0,
    groundOffset: 8,
  };
}

function makeEnemyWave(enemy, multiplier) {
  return Array.from({ length: multiplier }, (_, index) => makeEnemyCopy(enemy, index, multiplier));
}

function makeEnemyCopy(enemy, index, total) {
  if (enemy.type === "ghostBoy") {
    const offset = spreadOffset(index, total, 90);
    return makeGhostBoy(clamp(enemy.x + offset, 160, level.worldWidth - 160), enemy.y);
  }

  const minX = enemy.minX;
  const maxX = enemy.maxX;
  const x = total === 1
    ? enemy.x
    : minX + ((maxX - minX) * (index + 1)) / (total + 1);

  if (enemy.type === "ogreBaby") return makeOgreBaby(x, enemy.y, minX, maxX);
  if (enemy.type === "monsterboy") return makeMonsterboy(x, enemy.y, minX, maxX);
  return makeChomper(x, enemy.y, minX, maxX);
}

function spreadOffset(index, total, spacing) {
  return (index - (total - 1) / 2) * spacing;
}

function makeCollectible(type, x, y) {
  const size = type === "heart" ? { w: 30, h: 28 } : type === "coin" ? { w: 32, h: 32 } : { w: 44, h: 44 };
  return {
    type,
    x,
    y,
    w: size.w,
    h: size.h,
    baseY: y,
    picked: false,
    animTime: Math.random() * 2,
  };
}

function makeChomper(x, y, minX, maxX) {
  return {
    type: "chomper",
    x,
    y: y + CHOMPER_HITBOX_Y_OFFSET,
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
    hp: 2,
    defeated: false,
    hurtTimer: 0,
    animTime: 0,
  };
}

function makeOgreBaby(x, y, minX, maxX) {
  return {
    type: "ogreBaby",
    x,
    y,
    w: 52,
    h: 74,
    vx: -84,
    minX,
    maxX,
    facing: -1,
    attackCooldown: random(5.5, 8.5),
    attackTimer: 0,
    attackHasHit: false,
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
      startLevel(state.levelIndex + 1, state.selected, Math.max(player.health, 1), player.attackUnlocked, player.sunCount);
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
  if (player.character === "mark" && player.climbing) {
    updateLedgeClimb(dt);
    finishPlayerFrame(dt);
    return;
  }
  if (player.character === "mark" && player.ledgeGrab) {
    updateLedgeHang(dt);
    finishPlayerFrame(dt);
    return;
  }

  const movingLeft = keys.has("ArrowLeft") || keys.has("KeyA");
  const movingRight = keys.has("ArrowRight") || keys.has("KeyD");
  const jumping = keys.has("Space");
  const ducking = player.grounded && isPressingDown();
  updatePlayerDucking(ducking);

  const accel = 1150;
  const friction = player.grounded ? 0.84 : 0.96;
  const maxSpeed = 245;
  const speedScale = player.ducking ? 0.45 : 1;

  if (movingLeft) {
    player.vx -= accel * speedScale * dt;
    player.facing = -1;
  }
  if (movingRight) {
    player.vx += accel * speedScale * dt;
    player.facing = 1;
  }
  if (!movingLeft && !movingRight) {
    player.vx *= friction;
  }
  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  if (jumping && player.grounded) {
    if (player.ducking) updatePlayerDucking(false);
    if (!player.ducking) {
      player.vy = player.character === "maria" ? -575 * 1.3 : -575;
      player.grounded = false;
    }
  }

  player.vy += GRAVITY * dt;
  player.x += player.vx * dt;
  resolveHorizontalCollisions(player);

  player.y += player.vy * dt;
  player.grounded = false;
  resolveVerticalCollisions(player);

  if (player.character === "mark" && !player.grounded && player.vy > 40) {
    tryAttachLedgeGrab();
  }

  player.x = clamp(player.x, 12, level.worldWidth - player.w - 12);
  if (player.y > HEIGHT + 240) hurtPlayer(true);
  finishPlayerFrame(dt);
}

function updatePlayerDucking(shouldDuck) {
  if (shouldDuck === player.ducking) return;
  if (!shouldDuck && !canStandUp()) return;

  const bottom = player.y + player.h;
  player.ducking = shouldDuck;
  player.h = shouldDuck ? PLAYER_DUCKING_HEIGHT : PLAYER_STANDING_HEIGHT;
  player.y = bottom - player.h;
}

function canStandUp() {
  if (!player.ducking) return true;
  const standingBox = {
    x: player.x,
    y: player.y + player.h - PLAYER_STANDING_HEIGHT,
    w: player.w,
    h: PLAYER_STANDING_HEIGHT,
  };
  return !level.platforms.some((platform) => intersects(standingBox, platform));
}

function finishPlayerFrame(dt) {
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

function isGrabbableLedge(platform) {
  return platform.h <= 40 && platform.y < GROUND_Y - 12;
}

function findLedgeGrab() {
  const handY = player.y + LEDGE_HAND_Y;

  for (const platform of level.platforms) {
    if (!isGrabbableLedge(platform)) continue;

    const ledgeY = platform.y;
    if (handY < ledgeY - LEDGE_GRAB_VERT_TOLERANCE || handY > ledgeY + 10) continue;
    if (player.y + player.h * 0.35 < ledgeY - 6) continue;

    const leftReach = (player.x + player.w) - platform.x;
    if (
      leftReach >= -LEDGE_GRAB_HORZ_TOLERANCE
      && leftReach <= LEDGE_GRAB_HORZ_TOLERANCE
      && player.x + player.w / 2 < platform.x + platform.w * 0.55
    ) {
      return {
        platform,
        side: "left",
        facing: 1,
        x: platform.x - player.w + 10,
        y: ledgeY - player.h + 8,
      };
    }

    const rightReach = (platform.x + platform.w) - player.x;
    if (
      rightReach >= -LEDGE_GRAB_HORZ_TOLERANCE
      && rightReach <= LEDGE_GRAB_HORZ_TOLERANCE
      && player.x + player.w / 2 > platform.x + platform.w * 0.45
    ) {
      return {
        platform,
        side: "right",
        facing: -1,
        x: platform.x + platform.w - 10,
        y: ledgeY - player.h + 8,
      };
    }
  }

  return null;
}

function tryAttachLedgeGrab() {
  const grab = findLedgeGrab();
  if (!grab) return;
  player.ledgeGrab = grab;
  player.x = grab.x;
  player.y = grab.y;
  player.vx = 0;
  player.vy = 0;
  player.facing = grab.facing;
}

function releaseLedgeGrab(dropVy = 0) {
  const grab = player.ledgeGrab;
  if (grab && !player.climbing) {
    player.x = grab.side === "left"
      ? grab.platform.x - player.w - LEDGE_RELEASE_GAP
      : grab.platform.x + grab.platform.w + LEDGE_RELEASE_GAP;
  }
  player.ledgeGrab = null;
  player.climbing = false;
  player.climbTimer = 0;
  player.vy = dropVy;
}

function startLedgeClimb() {
  const grab = player.ledgeGrab;
  const platform = grab.platform;
  player.climbing = true;
  player.climbTimer = 0;
  player.ledgeGrab = {
    ...grab,
    climbFrom: { x: player.x, y: player.y },
    climbTo: {
      x: grab.side === "left" ? platform.x + 10 : platform.x + platform.w - player.w - 10,
      y: platform.y - player.h,
    },
  };
}

function updateLedgeHang(dt) {
  const grab = player.ledgeGrab;
  player.x = grab.x;
  player.y = grab.y;
  player.vx = 0;
  player.vy = 0;
  player.facing = grab.facing;
  player.grounded = false;

  const climbInput = keys.has("ArrowUp") || keys.has("KeyW");
  const dropInput = keys.has("ArrowDown") || keys.has("KeyS");
  const jumpOff = keys.has("Space");
  const movingLeft = keys.has("ArrowLeft") || keys.has("KeyA");
  const movingRight = keys.has("ArrowRight") || keys.has("KeyD");

  if (dropInput) {
    releaseLedgeGrab(120);
    return;
  }
  if (jumpOff && !climbInput) {
    releaseLedgeGrab(-520);
    player.vx = movingLeft === movingRight ? 0 : movingLeft ? -170 : 170;
    return;
  }
  if (climbInput) {
    startLedgeClimb();
  }
}

function updateLedgeClimb(dt) {
  const grab = player.ledgeGrab;
  player.climbTimer += dt;
  const progress = clamp(player.climbTimer / LEDGE_CLIMB_DURATION, 0, 1);
  const eased = progress * progress * (3 - 2 * progress);
  player.x = lerp(grab.climbFrom.x, grab.climbTo.x, eased);
  player.y = lerp(grab.climbFrom.y, grab.climbTo.y, eased);
  player.vx = 0;
  player.vy = 0;
  player.facing = grab.facing;

  if (progress < 1) return;

  player.x = grab.climbTo.x;
  player.y = grab.climbTo.y;
  player.grounded = true;
  releaseLedgeGrab();
}

function updateAttack(dt) {
  if (player.attackTimer <= 0) return;
  player.attackTimer -= dt;
  if (isPressingUp()) player.attackDirection = "up";

  const attackBox = getAttackBox();
  destroyProjectilesInAttack(attackBox);
  if (player.attackHasHit) return;

  for (const enemy of enemies) {
    if (!enemy.defeated && intersects(attackBox, enemy)) {
      hitEnemy(enemy, "attack");
      player.attackHasHit = true;
    }
  }

  if (!player.attackHasHit && boss && !boss.defeated && intersects(attackBox, boss)) {
    damageBoss();
    player.attackHasHit = true;
  }
}

function destroyProjectilesInAttack(attackBox) {
  enemyProjectiles = enemyProjectiles.filter((projectile) => {
    if (!intersects(attackBox, projectile)) return true;
    spawnBurst(projectile.x + projectile.w / 2, projectile.y + projectile.h / 2, "#22c55e");
    return false;
  });
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
    } else if (enemy.type === "ogreBaby") {
      updateOgreBaby(enemy, dt);
    } else if (enemy.type === "monsterboy") {
      updateMonsterboy(enemy, dt);
    } else {
      updateChomper(enemy, dt);
    }

    if (enemy.hurtTimer > 0) continue;

    if (intersects(player, enemy)) {
      if (isStomp(player, enemy)) {
        hitEnemy(enemy, "stomp");
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
  const nearPlayer = Math.hypot(dx, dy) < GHOST_CHASE_DISTANCE;
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
  const minX = enemy.anchorX - GHOST_LEASH_X;
  const maxX = enemy.anchorX + GHOST_LEASH_X;
  const minY = enemy.anchorY - GHOST_LEASH_Y;
  const maxY = enemy.anchorY + GHOST_LEASH_Y;
  let targetX = enemy.anchorX;
  let targetY = bobY;

  if (enemy.behavior === "wander") {
    targetX = enemy.anchorX + Math.sin(enemy.animTime * 1.4 + enemy.phase) * enemy.w;
  } else if (enemy.behavior === "chase" && (nearPlayer || playerBelowNearby)) {
    targetX = enemy.x + Math.sign(dx || 1) * GHOST_CHASE_SPEED_X * dt;
    targetY = enemy.y + Math.sign(dy || 1) * (playerBelowNearby ? GHOST_CHASE_SPEED_Y * 1.4 : GHOST_CHASE_SPEED_Y) * dt;
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
  const directionToPlayer = Math.sign(dx || enemy.facing);
  const canShoot = Math.abs(dx) < 470 && dy < 130 && enemy.attackCooldown <= 0 && directionToPlayer === enemy.facing;
  if (canShoot) {
    fireMonsterboyProjectile(enemy, directionToPlayer);
  }
}

function updateOgreBaby(enemy, dt) {
  if (enemy.hurtTimer > 0) enemy.hurtTimer -= dt;
  if (enemy.attackTimer > 0) enemy.attackTimer -= dt;
  if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

  enemy.x += enemy.vx * dt;
  if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) {
    enemy.vx *= -1;
    enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX - enemy.w);
  }
  enemy.facing = enemy.vx < 0 ? -1 : 1;

  if (enemy.attackCooldown <= 0) {
    enemy.attackCooldown = 10;
    enemy.attackTimer = 0.62;
    enemy.attackHasHit = false;
  }

  tryClubSwing(enemy, 64, 48, 0.4, 0.12);
}

function tryClubSwing(attacker, reachX, reachY, hitStart, hitEnd) {
  if (attacker.attackTimer <= 0 || attacker.attackHasHit) return;
  if (attacker.attackTimer < hitEnd || attacker.attackTimer > hitStart) return;
  const clubBox = getClubHitBox(attacker, reachX, reachY);
  if (!intersects(player, clubBox)) return;
  attacker.attackHasHit = true;
  hurtPlayer();
}

function getClubHitBox(attacker, reachX, reachY) {
  return {
    x: attacker.facing > 0 ? attacker.x + attacker.w - 4 : attacker.x - reachX + 4,
    y: attacker.y + attacker.h * 0.22,
    w: reachX,
    h: reachY,
  };
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

  if (boss.type === "ogreboss") {
    if (boss.attackTimer > 0) boss.attackTimer -= dt;
    if (boss.attackCooldown > 0) boss.attackCooldown -= dt;
    if (boss.attackCooldown <= 0) {
      boss.attackCooldown = 5;
      boss.attackTimer = 0.72;
      boss.attackHasHit = false;
    }
    tryClubSwing(boss, 106, 70, 0.5, 0.14);
  }

  boss.jumpTimer -= dt;
  const onGround = boss.y + boss.h >= GROUND_Y - 2;
  if (boss.jumpTimer <= 0 && onGround) {
    boss.vy = -660;
    boss.jumpTimer = 7;
  }
  boss.vy += GRAVITY * dt;
  boss.y += boss.vy * dt;
  if (boss.y + boss.h >= GROUND_Y) {
    boss.y = GROUND_Y - boss.h;
    boss.vy = 0;
  }

  boss.x += boss.vx * dt;
  if (boss.x < boss.minX || boss.x + boss.w > boss.maxX) {
    boss.vx *= -1;
    boss.x = clamp(boss.x, boss.minX, boss.maxX - boss.w);
  }

  if (intersects(player, boss)) {
    if (isStomp(player, boss)) {
      const extraHeight = boss.type !== "ogreboss" ? growBoss() : 0;
      damageBoss();
      player.y = Math.min(player.y, boss.y - player.h - 2);
      player.vy = -Math.sqrt(BOSS_STOMP_BOUNCE_SPEED ** 2 + 2 * GRAVITY * Math.max(extraHeight, 0));
    } else {
      hurtPlayer();
    }
  }
}

function growBoss() {
  const centerX = boss.x + boss.w / 2;
  const bottomY = boss.y + boss.h;
  const prevH = boss.h;
  boss.w *= 1.5;
  boss.h *= 1.5;
  boss.x = clamp(centerX - boss.w / 2, boss.minX, boss.maxX - boss.w);
  boss.y = bottomY - boss.h;
  return boss.h - prevH;
}

function damageBoss() {
  boss.hp -= 1;
  boss.hurtTimer = 0.45;
  addScore(100);
  flashMessage(boss.hp > 0 ? `${boss.hp} hit${boss.hp === 1 ? "" : "s"} left!` : "The boss is down. Rescue James!");
  if (boss.hp <= 0) {
    spawnBossDefeatBurst();
    boss.defeated = true;
    boss.vx = 0;
    boss.y = boss.type === "ogreboss" ? GROUND_Y - boss.h : GROUND_Y - 52;
    dropHeart();
  } else {
    spawnBurst(boss.x + boss.w / 2, boss.y + 18, "#facc15");
  }
}

function spawnBossDefeatBurst() {
  const bossScale = Math.max(3, boss.h / 96);
  spawnBurst(boss.x + boss.w / 2, boss.y + boss.h / 2, "#facc15", {
    count: Math.round(84 * bossScale),
    speedScale: bossScale * 0.68,
    lifeScale: 1.85,
    spreadX: boss.w * 0.45,
    spreadY: boss.h * 0.38,
  });
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
      state.wonInputReadyAt = performance.now() + 450;
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
      addScore(3000);
      flashMessage("Health increased!");
      spawnBurst(collectible.x + collectible.w / 2, collectible.y + collectible.h / 2, "#ef4444");
    } else if (collectible.type === "blackSun") {
      player.sunCount += 1;
      player.attackUnlocked = true;
      addScore(1000);
      flashMessage(`Black Sun x${player.sunCount}. Press CTRL to attack!`);
      spawnBurst(collectible.x + collectible.w / 2, collectible.y + collectible.h / 2, "#111827");
    } else if (collectible.type === "coin") {
      addScore(500);
      flashMessage("+500");
      spawnBurst(collectible.x + collectible.w / 2, collectible.y + collectible.h / 2, "#facc15");
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

function hitEnemy(enemy, source = "stomp") {
  addScore(100);
  if (enemy.type === "monsterboy") {
    enemy.hp -= 1;
    if (enemy.hp > 0) {
      enemy.hurtTimer = 0.45;
      if (source === "stomp") player.vy = -360;
      spawnBurst(enemy.x + enemy.w / 2, enemy.y + 10, "#22c55e");
      flashMessage("Monsterboy needs one more hit!");
      return;
    }
  }

  defeatEnemy(enemy, source);
}

function defeatEnemy(enemy, source = "stomp") {
  enemy.defeated = true;
  enemy.hurtTimer = 0.8;
  if (source === "stomp") player.vy = -440;
  const burstColor = enemy.type === "ghostBoy" ? "#c084fc" : enemy.type === "monsterboy" ? "#22c55e" : enemy.type === "ogreBaby" ? "#fb923c" : "#e5e7eb";
  const enemyName = enemy.type === "ghostBoy" ? "Ghost Boy" : enemy.type === "monsterboy" ? "Monsterboy" : enemy.type === "ogreBaby" ? "Ogre Baby" : "Chomper";
  spawnBurst(enemy.x + enemy.w / 2, enemy.y + 10, burstColor);
  flashMessage(`${enemyName} defeated!`);
}

function hurtPlayer(fell = false) {
  if (player.invincible > 0) return;
  releaseLedgeGrab();
  loseSun();
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

function loseSun() {
  if (player.sunCount <= 0) return;
  player.sunCount -= 1;
  player.attackUnlocked = player.sunCount > 0;
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
  player.attackDirection = isPressingUp() ? "up" : "forward";
}

function isPressingUp() {
  return keys.has("ArrowUp") || keys.has("KeyW");
}

function isPressingDown() {
  return keys.has("ArrowDown") || keys.has("KeyS");
}

function getAttackBox() {
  const sunMultiplier = Math.max(player.sunCount, 1);
  const range = 74 * sunMultiplier;
  if (player.attackDirection === "up") {
    return {
      x: player.x + player.w / 2 - 34,
      y: player.y - range + 18,
      w: 68,
      h: range,
    };
  }

  return {
    x: player.facing > 0 ? player.x + player.w - 4 : player.x - range + 4,
    y: player.y + 16,
    w: range,
    h: 46,
  };
}

function flashMessage(text) {
  state.message = text;
  state.messageTimer = FLASH_MESSAGE_DURATION;
}

function addScore(points) {
  state.score += points;
  if (state.score <= state.highScore) return;
  state.highScore = state.score;
  state.newHighScore = true;
  saveHighScore(state.highScore);
}

function loadHighScore() {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // High score persistence is optional when storage is unavailable.
  }
}

function attachFooterCommit() {
  const copyrightText = document.querySelector(".copyright-text");
  if (!copyrightText) return;
  const commitTag = document.createElement("span");
  commitTag.className = "git-commit";
  commitTag.textContent = `(${APP_COMMIT})`;
  copyrightText.append(commitTag);
}

function getLevelIntroMessage() {
  if (state.levelIndex === 1) return `${level.name}: watch for Ghost Boys!`;
  if (state.levelIndex === 2) return `${level.name}: dodge the green flames!`;
  if (state.levelIndex === 3) return `${level.name}: Ogre ahead. Dodge the club swing!`;
  return `${level.name}: rescue James!`;
}

function spawnBurst(x, y, color, options = {}) {
  const count = options.count || 12;
  const speedScale = options.speedScale || 1;
  const lifeScale = options.lifeScale || 1;
  const spreadX = options.spreadX || 0;
  const spreadY = options.spreadY || 0;

  for (let i = 0; i < count; i += 1) {
    const originX = x + random(-spreadX, spreadX);
    const originY = y + random(-spreadY, spreadY);
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos((Math.PI * 2 * i) / count) * random(70, 150) * speedScale,
      vy: Math.sin((Math.PI * 2 * i) / count) * random(70, 150) * speedScale,
      life: random(0.35, 0.75) * lifeScale,
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
    drawWinScreen();
  } else if (state.mode === "lost") {
    drawGameOverPanel();
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
  if (IS_TOUCH && state.mode === "playing") drawTouchOverlay();
}

function drawTouchOverlay() {
  for (const btn of TOUCH_BTNS) {
    const attackUnavailable = btn.id === "attack" && !player?.attackUnlocked;
    const pressed = keys.has(btn.key);
    ctx.save();
    ctx.globalAlpha = attackUnavailable ? 0.1 : pressed ? 0.72 : 0.38;
    ctx.fillStyle = pressed ? "#fde68a" : "#1e293b";
    ctx.beginPath();
    ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pressed ? "#fbbf24" : "rgba(248,250,252,0.55)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.globalAlpha = attackUnavailable ? 0.12 : pressed ? 1 : 0.75;
    ctx.fillStyle = pressed ? "#1e293b" : "#f8fafc";
    ctx.font = canvasFont(800, btn.fontSize);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x, btn.y);
    ctx.restore();
  }
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  if (state.levelIndex === 3) {
    gradient.addColorStop(0, "#2a1608");
    gradient.addColorStop(0.4, "#6b4322");
    gradient.addColorStop(0.78, "#a87544");
    gradient.addColorStop(1, "#c89770");
  } else if (state.levelIndex === 2) {
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

  if (state.levelIndex === 3) return;

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
  } else if (state.levelIndex === 3) {
    drawCaveSpikes();
  }
}

const CAVE_STALACTITES = [
  { x: 180, base: 78, length: 150 },
  { x: 420, base: 46, length: 92 },
  { x: 740, base: 90, length: 180 },
  { x: 1050, base: 56, length: 118 },
  { x: 1380, base: 72, length: 140 },
  { x: 1720, base: 100, length: 196 },
  { x: 2040, base: 50, length: 96 },
  { x: 2360, base: 78, length: 158 },
  { x: 2680, base: 62, length: 128 },
  { x: 3020, base: 90, length: 174 },
  { x: 3360, base: 54, length: 108 },
  { x: 3690, base: 82, length: 162 },
  { x: 4030, base: 70, length: 138 },
  { x: 4380, base: 96, length: 188 },
  { x: 4720, base: 58, length: 112 },
  { x: 5060, base: 84, length: 168 },
  { x: 5380, base: 50, length: 102 },
];

const CAVE_STALAGMITES = [
  { x: 80, base: 90, length: 132 },
  { x: 280, base: 54, length: 78 },
  { x: 560, base: 84, length: 124 },
  { x: 880, base: 62, length: 92 },
  { x: 1200, base: 96, length: 142 },
  { x: 1520, base: 56, length: 84 },
  { x: 1880, base: 78, length: 116 },
  { x: 2220, base: 102, length: 150 },
  { x: 2540, base: 60, length: 90 },
  { x: 2880, base: 88, length: 128 },
  { x: 3200, base: 72, length: 108 },
  { x: 3540, base: 94, length: 138 },
  { x: 3880, base: 58, length: 86 },
  { x: 4220, base: 86, length: 126 },
  { x: 4560, base: 74, length: 110 },
  { x: 4880, base: 100, length: 146 },
  { x: 5220, base: 64, length: 96 },
  { x: 5480, base: 80, length: 118 },
];

function drawCaveSpikes() {
  for (const s of CAVE_STALACTITES) {
    drawStalactite(s.x, s.base, s.length);
  }
  for (const s of CAVE_STALAGMITES) {
    drawStalagmite(s.x, s.base, s.length);
  }
}

function drawStalactite(x, base, length) {
  const half = base / 2;
  const grad = ctx.createLinearGradient(x - half, 0, x + half, 0);
  grad.addColorStop(0, "#5c3618");
  grad.addColorStop(0.5, "#a87544");
  grad.addColorStop(1, "#5c3618");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - half, 0);
  ctx.lineTo(x + half, 0);
  ctx.lineTo(x + half * 0.18, length);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255, 220, 170, 0.18)";
  ctx.beginPath();
  ctx.moveTo(x - half * 0.55, 0);
  ctx.lineTo(x - half * 0.05, 0);
  ctx.lineTo(x + half * 0.05, length * 0.7);
  ctx.closePath();
  ctx.fill();
}

function drawStalagmite(x, base, length) {
  const half = base / 2;
  const baseY = GROUND_Y;
  const tipY = baseY - length;
  const grad = ctx.createLinearGradient(x - half, 0, x + half, 0);
  grad.addColorStop(0, "#4a2a12");
  grad.addColorStop(0.5, "#9a6938");
  grad.addColorStop(1, "#4a2a12");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - half, baseY);
  ctx.lineTo(x + half, baseY);
  ctx.lineTo(x - half * 0.18, tipY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255, 220, 170, 0.16)";
  ctx.beginPath();
  ctx.moveTo(x + half * 0.05, baseY);
  ctx.lineTo(x + half * 0.55, baseY);
  ctx.lineTo(x - half * 0.05, tipY + length * 0.3);
  ctx.closePath();
  ctx.fill();
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
    ctx.fillStyle = state.levelIndex === 3 ? "#7a4a22" : state.levelIndex === 2 ? "#5f3b1f" : "#7c4a2d";
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = state.levelIndex === 3 ? "#c89464" : state.levelIndex === 2 ? "#16a34a" : "#22c55e";
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

const COLLECTIBLE_SPRITE = {
  heart:    { sprite: "heart",    anim: "idle", scale: 0.36, fps: 8 },
  blackSun: { sprite: "blackSun", anim: "idle", scale: 0.40, fps: 7 },
  coin:     { sprite: "coin",     anim: "spin", scale: 0.34, fps: 14 },
};

function drawCollectibles() {
  for (const collectible of collectibles) {
    if (collectible.picked) continue;
    const cfg = COLLECTIBLE_SPRITE[collectible.type];
    if (!cfg) continue;
    drawCollectibleSprite(
      cfg,
      collectible.x + collectible.w / 2,
      collectible.y + collectible.h / 2,
      collectible.animTime,
    );
  }
}

function drawCollectibleSprite(cfg, cx, cy, animTime) {
  const sprite = sprites[cfg.sprite];
  const frames = sprite[cfg.anim];
  const frame = frames[Math.floor(animTime * cfg.fps) % frames.length];
  const image = images[sprite.sheet];
  if (!image) return;
  const drawW = Math.round(frame.w * cfg.scale);
  const drawH = Math.round(frame.h * cfg.scale);
  ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, Math.round(cx - drawW / 2), Math.round(cy - drawH / 2), drawW, drawH);
}

function drawFlag(x, text) {
  ctx.fillStyle = "#92400e";
  ctx.fillRect(x, GROUND_Y - 76, 8, 76);
  ctx.fillStyle = "#fde047";
  ctx.fillRect(x + 8, GROUND_Y - 76, 78, 34);
  ctx.fillStyle = "#111827";
  ctx.font = canvasFont(800, 15);
  ctx.fillText(text, x + 16, GROUND_Y - 54);
}

function drawPlayer() {
  const blinking = player.invincible > 0 && Math.floor(player.invincible * 16) % 2 === 0;
  if (blinking) return;
  let animation = player.attackTimer > 0 ? "attack" : player.grounded ? (Math.abs(player.vx) > 18 ? "walk" : "idle") : "jump";
  let drawYOffset = 0;
  if (player.character === "mark" && player.ledgeGrab && !player.climbing) {
    animation = "jump";
    drawYOffset = 8;
  } else if (player.character === "mark" && player.climbing) {
    animation = "walk";
  }
  drawEntity(player, player.character, animation, player.x - 10, player.y - 6 + drawYOffset, player.w + 20, player.h + 6, player.facing);
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

    if (enemy.type === "ogreBaby") {
      const animation = enemy.defeated ? "defeated" : enemy.hurtTimer > 0 ? "hurt" : enemy.attackTimer > 0 ? "attack" : "walk";
      drawEntity(
        enemy,
        "ogrebaby",
        animation,
        enemy.x - 29,
        enemy.y - 24,
        enemy.w + 58,
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
      enemy.y - 6 - CHOMPER_HITBOX_Y_OFFSET,
      enemy.w + 24,
      enemy.h + 26,
      enemy.vx < 0 ? 1 : -1,
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
  if (boss.type === "ogreboss") {
    if (boss.defeated) return;
    const animation = boss.hurtTimer > 0 ? "hurt" : boss.attackTimer > 0 ? "attack" : "walk";
    drawEntity(boss, "ogreboss", animation, boss.x - 26, boss.y - 44, boss.w + 56, boss.h + 44, boss.vx < 0 ? -1 : 1);
    return;
  }

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
  ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
  drawRoundRect(18, 16, 328, 96, 12);
  ctx.fillStyle = "#f8fafc";
  ctx.font = canvasFont(800, 22);
  ctx.fillText(`Hero: ${capitalize(state.selected)}  L${state.levelIndex + 1}`, 34, 44);
  ctx.font = canvasFont(800, 16);
  ctx.fillText(`Score: ${state.score}`, 214, 44);
  ctx.fillStyle = "rgba(248, 250, 252, 0.58)";
  ctx.font = canvasFont(700, 12);
  ctx.fillText(`High: ${state.highScore}`, 214, 60);
  ctx.fillStyle = "#f8fafc";
  ctx.font = canvasFont(700, 18);
  ctx.fillText(`Health: ${"I ".repeat(Math.max(player?.health || 0, 0)).trim()}`, 34, 78);
  if (player?.attackUnlocked) {
    ctx.fillStyle = "#c4b5fd";
    ctx.fillText(`CTRL attack x${player.sunCount}`, 34, 100);
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
  drawRoundRect(WIDTH - 328, 16, 310, 72, 12);
  ctx.fillStyle = "#f8fafc";
  ctx.font = canvasFont(800, 18);
  ctx.fillText("Objective", WIDTH - 310, 44);
  ctx.font = canvasFont(700, 16);
  ctx.fillText(boss?.defeated ? "Reach James!" : `${level.name}: stomp the boss.`, WIDTH - 310, 70);

  if (state.messageTimer > 0) {
    const fadeProgress = clamp(state.messageTimer / FLASH_MESSAGE_DURATION, 0, 1);
    const messageAlpha = Math.sin(fadeProgress * Math.PI / 2);
    ctx.fillStyle = `rgba(15, 23, 42, ${0.58 * messageAlpha})`;
    drawRoundRect(WIDTH / 2 - 180, 108, 360, 34, 10);
    ctx.fillStyle = `rgba(253, 224, 71, ${messageAlpha})`;
    ctx.font = canvasFont(800, 15);
    ctx.textAlign = "center";
    ctx.fillText(state.message, WIDTH / 2, 130);
    ctx.textAlign = "left";
  }
}

function drawCharacterSelect() {
  ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.font = canvasFont(800, 36);
  ctx.fillText("Choose Your Hero", WIDTH / 2, 104);
  ctx.font = canvasFont(700, 18);
  ctx.fillText("Click a character, or press M for Mark and A for Maria.", WIDTH / 2, 142);

  drawCharacterCard("mark", WIDTH / 2 - 250, 190);
  drawCharacterCard("maria", WIDTH / 2 + 70, 190);
  ctx.textAlign = "left";
}

function drawCharacterCard(character, x, y) {
  const isSelected = state.selected === character;
  ctx.fillStyle = isSelected ? "rgba(250, 204, 21, 0.24)" : "rgba(248, 250, 252, 0.12)";
  ctx.strokeStyle = isSelected ? "#facc15" : "rgba(248, 250, 252, 0.45)";
  ctx.lineWidth = 4;
  drawRoundRect(x, y, 180, 230, 16);
  strokeRoundRect(x, y, 180, 230, 16);

  const fakeEntity = { animTime: performance.now() / 1000 };
  drawEntity(fakeEntity, character, "idle", x + 55, y + 36, 70, 112, 1);
  ctx.fillStyle = "#f8fafc";
  ctx.font = canvasFont(800, 28);
  ctx.textAlign = "center";
  ctx.fillText(capitalize(character), x + 90, y + 178);
  ctx.font = canvasFont(700, 14);
  ctx.fillText(character === "mark" ? "Grabs ledges to climb up" : "Light and nimble", x + 90, y + 206);
}

function drawPanel(title, line1, line2) {
  ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  drawRoundRect(WIDTH / 2 - 320, HEIGHT / 2 - 112, 640, 204, 21);
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.font = canvasFont(850, 52, TITLE_FONT);
  ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 54);
  ctx.font = canvasFont(700, 22);
  ctx.fillText(line1, WIDTH / 2, HEIGHT / 2 - 12);
  if (line2) ctx.fillText(line2, WIDTH / 2, HEIGHT / 2 + 28);
  ctx.textAlign = "left";
}

function drawGameOverPanel() {
  drawPanel("Game Over", "Enemies are dangerous from the side.", "");
  if (state.newHighScore) {
    ctx.fillStyle = "#fde047";
    ctx.font = canvasFont(800, 22);
    ctx.textAlign = "center";
    ctx.fillText("New High Score!", WIDTH / 2, HEIGHT / 2 + 22);
  }
  const button = getPlayAgainButtonBounds();
  ctx.fillStyle = "rgba(250, 204, 21, 0.92)";
  drawRoundRect(button.x, button.y, button.w, button.h, 16);
  ctx.fillStyle = "#111827";
  ctx.font = canvasFont(800, 20);
  ctx.textAlign = "center";
  ctx.fillText("Play Again", button.x + button.w / 2, button.y + 31);
  ctx.textAlign = "left";
}

function drawWinScreen() {
  ctx.fillStyle = "rgba(10, 18, 36, 0.91)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";

  ctx.fillStyle = "#fde68a";
  ctx.font = canvasFont(850, 48, TITLE_FONT);
  ctx.fillText("Winner Winner", WIDTH / 2, 108);
  ctx.fillStyle = "#fbbf24";
  ctx.font = canvasFont(850, 54, TITLE_FONT);
  ctx.fillText("Chicken Dinner!", WIDTH / 2, 168);

  ctx.fillStyle = "rgba(248,250,252,0.72)";
  ctx.font = canvasFont(600, 18);
  ctx.fillText("James is safe. You cleared all the levels.", WIDTH / 2, 204);

  // Coupon card
  const cx = WIDTH / 2, cy = 320, cw = 580, ch = 170;
  ctx.fillStyle = "#fefce8";
  drawRoundRect(cx - cw / 2, cy - ch / 2, cw, ch, 14);

  ctx.save();
  ctx.strokeStyle = "#a16207";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.roundRect(cx - cw / 2 + 8, cy - ch / 2 + 8, cw - 16, ch - 16, 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.fillStyle = "#92400e";
  ctx.font = canvasFont(800, 11);
  ctx.fillText("✂  CLIP AND SAVE  ✂", cx, cy - ch / 2 + 22);

  ctx.fillStyle = "#b45309";
  ctx.font = canvasFont(850, 42, TITLE_FONT);
  ctx.fillText("2-FOR-1 ENEMIES", cx, cy - 10);

  ctx.fillStyle = "#78350f";
  ctx.font = canvasFont(700, 15);
  ctx.fillText("For each enemy, get one free!", cx, cy + 16);
  ctx.fillText("TODAY ONLY  ·  Cannot be combined with other offers", cx, cy + 56);

  ctx.fillStyle = "#d97706";
  ctx.font = canvasFont(800, 12);
  ctx.fillText("Signed: James  |  Expires: Never  |  Valid: Now", cx, cy + ch / 2 - 14);

  const btn = getWinPlayAgainButtonBounds();
  ctx.fillStyle = "rgba(250, 204, 21, 0.94)";
  drawRoundRect(btn.x, btn.y, btn.w, btn.h, 16);
  ctx.fillStyle = "#111827";
  ctx.font = canvasFont(800, 18);
  ctx.fillText("Use Coupon & Play Again", btn.x + btn.w / 2, btn.y + 31);

  ctx.textAlign = "left";
}

function getPlayAgainButtonBounds() {
  return {
    x: WIDTH / 2 - 82,
    y: HEIGHT / 2 + 168,
    w: 164,
    h: 48,
  };
}

function getWinPlayAgainButtonBounds() {
  return {
    x: WIDTH / 2 - 168,
    y: HEIGHT / 2 + 168,
    w: 336,
    h: 48,
  };
}

function drawRoundRect(x, y, w, h, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function strokeRoundRect(x, y, w, h, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.stroke();
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

function canvasFont(weight, size, family = UI_FONT) {
  return `${weight} ${size}px ${family}`;
}

function selectCharacter(character) {
  resetGame(character);
  state.mode = "playing";
  flashMessage(`Go, ${capitalize(character)}! Rescue James.`);
}

// return hotkey number, else -1
function getHotkeyLevelNumber(code) {
  const match = code.match(/^(?:Digit|Numpad)([0-9])$/);
  return (match === null) ? -1 : (Number(match[1])>=0 ? Number(match[1]) : -1);
}

// if level number is zero, display the win screen
// else, select the level
function startDebugLevel(levelNumber) {
  if (levelNumber === 0)
  {
    startLevel(levels.length - 1, state.selected, 3, false);
    state.mode = "playing";
    flashMessage(`Debug win: ${level.name}`);
    state.mode = "won";
    return true;    
  }
  else if (levelNumber < 1 || levelNumber > levels.length) return false;
  startLevel(levelNumber - 1, state.selected, 3, false);
  state.mode = "playing";
  flashMessage(`Debug jump: ${level.name}`);
  return true;
}

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "ControlLeft", "ControlRight"].includes(event.code)) {
    event.preventDefault();
  }

  if (state.mode === "playing" && (event.code === "ControlLeft" || event.code === "ControlRight")) {
    startAttack();
  }

  if (state.mode === "select") {
    if (event.ctrlKey && event.altKey && event.shiftKey && startDebugLevel(getHotkeyLevelNumber(event.code))) {
      event.preventDefault();
      return;
    }
    if (event.code === "ArrowLeft") state.selected = "mark";
    if (event.code === "ArrowRight") state.selected = "maria";
    if (event.code === "KeyM") selectCharacter("mark");
    if (event.code === "KeyA") selectCharacter("maria");
    if (event.code === "Enter") selectCharacter(state.selected);
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

function canvasCoordsFromClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (WIDTH / rect.width),
    y: (clientY - rect.top) * (HEIGHT / rect.height),
  };
}

function handleCanvasTap(x, y) {
  if (state.mode === "lost") {
    const button = getPlayAgainButtonBounds();
    if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
      resetGame(state.selected);
      state.mode = "select";
    }
    return;
  }
  if (state.mode === "won") {
    if (performance.now() < state.wonInputReadyAt) return;
    const button = getWinPlayAgainButtonBounds();
    if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
      state.monsterMultiplier *= 2;
      startLevel(0, state.selected, Math.max(player.health, 1), player.attackUnlocked, player.sunCount);
      state.mode = "playing";
      flashMessage(`Round ${Math.log2(state.monsterMultiplier) + 1}: monsters x${state.monsterMultiplier}!`);
    }
    return;
  }
  if (state.mode !== "select") return;
  const cards = [
    { character: "mark", x: WIDTH / 2 - 250, y: 190, w: 180, h: 230 },
    { character: "maria", x: WIDTH / 2 + 70, y: 190, w: 180, h: 230 },
  ];
  const card = cards.find((c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
  if (card) selectCharacter(card.character);
}

canvas.addEventListener("click", (event) => {
  const { x, y } = canvasCoordsFromClient(event.clientX, event.clientY);
  handleCanvasTap(x, y);
});

function applyTouches(event) {
  event.preventDefault();
  const prevAttack = touchPressedKeys.has("ControlLeft");
  const nowPressed = new Set();
  for (const t of event.touches) {
    const { x, y } = canvasCoordsFromClient(t.clientX, t.clientY);
    const ddx = x - DPAD_CENTER.x, ddy = y - DPAD_CENTER.y;
    if (ddx * ddx + ddy * ddy <= DPAD_OUTER_R * DPAD_OUTER_R) {
      if (ddx < -DPAD_DEAD_ZONE) nowPressed.add("ArrowLeft");
      if (ddx >  DPAD_DEAD_ZONE) nowPressed.add("ArrowRight");
      if (ddy < -DPAD_DEAD_ZONE && -ddy > Math.abs(ddx) * 0.7) nowPressed.add("ArrowUp");
      if (ddy >  DPAD_DEAD_ZONE &&  ddy > Math.abs(ddx) * 0.7) nowPressed.add("ArrowDown");
    } else {
      for (const btn of TOUCH_BTNS) {
        if (DPAD_IDS.has(btn.id)) continue;
        const bx = x - btn.x, by = y - btn.y;
        if (bx * bx + by * by <= btn.r * btn.r) nowPressed.add(btn.key);
      }
    }
  }
  for (const btn of TOUCH_BTNS) {
    if (nowPressed.has(btn.key)) keys.add(btn.key);
    else keys.delete(btn.key);
  }
  if (nowPressed.has("ControlLeft") && !prevAttack && state.mode === "playing") startAttack();
  touchPressedKeys = nowPressed;
}

canvas.addEventListener("touchstart", applyTouches, { passive: false });
canvas.addEventListener("touchmove", applyTouches, { passive: false });
canvas.addEventListener("touchcancel", applyTouches, { passive: false });
canvas.addEventListener("touchend", (event) => {
  if (event.changedTouches.length > 0 && state.mode !== "playing") {
    const t = event.changedTouches[0];
    const { x, y } = canvasCoordsFromClient(t.clientX, t.clientY);
    handleCanvasTap(x, y);
  }
  applyTouches(event);
}, { passive: false });

function isFullscreenActive() {
  return !!(
    document.fullscreenElement
    || document.webkitFullscreenElement
    || document.documentElement.classList.contains("immersive")
  );
}

function syncFullscreenButton() {
  if (!fullscreenButton) return;
  const active = isFullscreenActive();
  fullscreenButton.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
  fullscreenButton.setAttribute("aria-pressed", String(active));
}

async function enterGameFullscreen() {
  const target = gameFrame || document.documentElement;
  const request = target.requestFullscreen?.bind(target) || target.webkitRequestFullscreen?.bind(target);
  if (request) {
    try {
      await request();
      syncFullscreenButton();
      return;
    } catch {
      // iOS Safari usually rejects element fullscreen; use CSS immersive mode.
    }
  }
  document.documentElement.classList.add("immersive");
  syncFullscreenButton();
}

async function exitGameFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    const exit = document.exitFullscreen?.bind(document) || document.webkitExitFullscreen?.bind(document);
    if (exit) {
      try {
        await exit();
      } catch {
        // ignore
      }
    }
  }
  document.documentElement.classList.remove("immersive");
  syncFullscreenButton();
}

async function toggleGameFullscreen() {
  if (isFullscreenActive()) await exitGameFullscreen();
  else await enterGameFullscreen();
}

["fullscreenchange", "webkitfullscreenchange"].forEach((eventName) => {
  document.addEventListener(eventName, () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      document.documentElement.classList.remove("immersive");
    }
    syncFullscreenButton();
  });
});

fullscreenButton?.addEventListener("click", () => {
  toggleGameFullscreen();
});

attachFooterCommit();
loadImages();
