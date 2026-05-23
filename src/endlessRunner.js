// Endless-runner "game within a game". Triggered from main.js when the player
// holds LEFT for three seconds on level 1. Pseudo-3D: three lanes, perspective
// projection, obstacles approach from the horizon. Reuses the main game's
// sprite sheets and key set.
(function (global) {
  const RWIDTH = 960;
  const RHEIGHT = 540;
  const HORIZON_Y = 210;
  const NUM_LANES = 3;
  const LANE_HALF_WIDTH = 1.4;
  const CAM_Z = 1.15;
  const PROJ_SCALE = 360;
  const FAR_Z = 22;
  const SPAWN_Z = 20;
  const INTRO_TIME = 1.4;
  const DEATH_DELAY = 0.9;
  const GRAVITY = 1500;
  const JUMP_SPEED = 620;
  const HIT_Z_NEAR = -0.15;
  const HIT_Z_FAR = 0.55;
  const COIN_Z_FAR = 0.45;
  const JUMP_CLEAR_HEIGHT = 70;
  const START_SPEED = 16;
  const SPEED_RAMP = 1.0;
  const SCORE_PER_SECOND = 12;
  const COIN_VALUE = 120;
  // Rough "world-space heights" in projection units. Multiplied by proj.scale
  // (which is ~PROJ_SCALE/(z+CAM_Z)) to get screen-pixel height, so a sprite
  // at z=0 with worldH=0.3 ends up around 94 px tall regardless of its frame
  // size on the source sheet. Width is then derived from the frame aspect.
  const ENTITY_WORLD_HEIGHT = {
    chomper: 0.50,
    ghostBoy: 0.70,
    monsterboy: 0.66,
    ogrebaby: 0.78,
  };
  const PLAYER_WORLD_HEIGHT = 0.40;
  const COIN_WORLD_HEIGHT = 0.26;
  const HEART_WORLD_HEIGHT = 0.30;
  const MAX_HEALTH = 5;
  const COINS_PER_HEART = 5;

  // Moon: rises from left horizon, arcs across the sky, sets on the right,
  // stays below the horizon for a beat, then rises again.
  const MOON_VISIBLE_DURATION = 75;
  const MOON_REST_DURATION = 15;
  const MOON_CYCLE_DURATION = MOON_VISIBLE_DURATION + MOON_REST_DURATION;
  const MOON_RADIUS = 28;
  const MOON_ARC_RADIUS_X = RWIDTH * 0.42;
  const MOON_PEAK_RISE = 150;
  // Stars rotate clockwise (on screen) around the same point the moon arcs
  // around — the horizon's midpoint — at 3.8% faster than the moon's angular
  // velocity (π / MOON_VISIBLE_DURATION). Distributed uniformly across a
  // disc that comfortably exceeds the visible sky so sectors rotating in
  // from off-screen stay populated.
  const STAR_PIVOT_X = RWIDTH / 2;
  const STAR_PIVOT_Y = HORIZON_Y;
  const STAR_ANGULAR_VEL = -1.038 * Math.PI / MOON_VISIBLE_DURATION;
  const STAR_COUNT = 260;
  const STAR_MAX_RADIUS = 720;
  const SKY_TOP_COLOR = [30, 27, 75];
  const SKY_MID_COLOR = [91, 33, 182];
  const SKY_HORIZON_COLOR = [219, 39, 119];

  const SWIPE_MIN_DISTANCE = 48;
  const SWIPE_MAX_VERTICAL_DRIFT = 80;
  const TAP_MAX_MOVE = 22;
  const TAP_MAX_DURATION_MS = 400;

  const EndlessRunner = {};
  let ctx, sprites, images, keys;
  let runner = null;
  let onExitCallback = null;
  let prevLeft = false;
  let prevRight = false;
  let prevJump = false;
  let prevExit = false;
  let isTouch = false;
  let canvasEl = null;
  let touchControlsBound = false;
  const activeTouches = new Map();
  let touchPulseLeft = false;
  let touchPulseRight = false;
  let touchPulseJump = false;
  let touchPulseStart = false;

  EndlessRunner.init = function (deps) {
    ctx = deps.ctx;
    sprites = deps.sprites;
    images = deps.images;
    keys = deps.keys;
    isTouch = !!deps.isTouch;
    if (deps.canvas) bindTouchControls(deps.canvas);
  };

  EndlessRunner.start = function (character, opts = {}) {
    runner = {
      character: character || "mark",
      lane: 1,
      laneX: 0,
      vy: 0,
      jumpY: 0,
      grounded: true,
      health: 3,
      score: 0,
      bestScore: opts.bestScore || 0,
      speed: START_SPEED,
      maxSpeed: START_SPEED,
      distance: 0,
      coinsCollected: 0,
      pendingHearts: 0,
      obstacles: [],
      coins: [],
      spawnTimer: 0.6,
      animTime: 0,
      introTimer: INTRO_TIME,
      waitingForInput: true,
      starRotation: 0,
      moonPhase: 0,
      dead: false,
      deathTimer: DEATH_DELAY,
      flashTimer: 0,
      stars: makeStarfield(),
    };
    onExitCallback = opts.onExit || null;
    activeTouches.clear();
    clearTouchPulses();
    // Snapshot held keys as "previous" so the gesture that opened Runner Mode
    // (held ArrowLeft) is not treated as a fresh press on the first tick.
    prevLeft = keyLeftDown();
    prevRight = keyRightDown();
    prevJump = keyJumpDown();
    prevExit = keys.has("Escape");
  };

  EndlessRunner.stop = function () {
    runner = null;
    onExitCallback = null;
    activeTouches.clear();
    clearTouchPulses();
  };

  EndlessRunner.isActive = function () {
    return !!runner;
  };

  EndlessRunner.update = function (dt) {
    if (!runner) return;
    runner.animTime += dt;
    // Sky animations advance through intro, waiting, and gameplay so the
    // night never freezes between phases — but they halt on the Caught
    // screen so the death scene reads as a still frame.
    if (!runner.dead) {
      runner.starRotation += STAR_ANGULAR_VEL * dt;
      runner.moonPhase = (runner.moonPhase + dt / MOON_CYCLE_DURATION) % 1;
    }
    if (runner.flashTimer > 0) runner.flashTimer -= dt;

    const touch = consumeTouchPulses();

    const exitPressed = keys.has("Escape");
    if (exitPressed && !prevExit) {
      EndlessRunner.exit();
      prevExit = exitPressed;
      return;
    }
    prevExit = exitPressed;

    if (runner.introTimer > 0) {
      runner.introTimer -= dt;
      // Track held keys during the intro fade so the gesture that opened
      // Runner Mode does not count as the "start" press once the user is
      // free to interact.
      prevLeft = keyLeftDown();
      prevRight = keyRightDown();
      prevJump = keyJumpDown() || keyStartDown();
      return;
    }

    if (runner.waitingForInput) {
      const leftDown = keyLeftDown();
      const rightDown = keyRightDown();
      const jumpDown = keyJumpDown() || keyStartDown();
      const freshPress =
        (leftDown && !prevLeft) ||
        (rightDown && !prevRight) ||
        (jumpDown && !prevJump) ||
        touch.start ||
        touch.jump ||
        touch.left ||
        touch.right;
      prevLeft = leftDown;
      prevRight = rightDown;
      prevJump = jumpDown;
      if (freshPress) runner.waitingForInput = false;
      return;
    }

    if (runner.dead) {
      if (runner.deathTimer > 0) runner.deathTimer -= dt;
      const restart = keyJumpDown() || keyStartDown() || touch.start || touch.jump;
      if (runner.deathTimer <= 0 && restart && !prevJump) {
        EndlessRunner.exit();
      }
      prevJump = restart;
      return;
    }

    const leftDown = keyLeftDown();
    const rightDown = keyRightDown();
    const jumpDown = keyJumpDown();

    if ((leftDown && !prevLeft) || touch.left) runner.lane = Math.max(0, runner.lane - 1);
    if ((rightDown && !prevRight) || touch.right) runner.lane = Math.min(NUM_LANES - 1, runner.lane + 1);
    prevLeft = leftDown;
    prevRight = rightDown;

    if (((jumpDown && !prevJump) || touch.jump) && runner.grounded) {
      runner.vy = -JUMP_SPEED;
      runner.grounded = false;
    }
    prevJump = jumpDown;

    const targetLaneX = (runner.lane - 1) * LANE_HALF_WIDTH;
    runner.laneX += (targetLaneX - runner.laneX) * Math.min(1, dt * 14);

    runner.vy += GRAVITY * dt;
    runner.jumpY -= runner.vy * dt;
    if (runner.jumpY <= 0) {
      runner.jumpY = 0;
      runner.vy = 0;
      runner.grounded = true;
    }

    const advance = runner.speed * dt;
    runner.distance += advance;
    runner.speed += SPEED_RAMP * dt;
    if (runner.speed > runner.maxSpeed) runner.maxSpeed = runner.speed;

    for (const obs of runner.obstacles) obs.z -= advance;
    for (const coin of runner.coins) coin.z -= advance;

    for (const obs of runner.obstacles) {
      if (obs.passed) continue;
      if (obs.z > HIT_Z_FAR) continue;
      if (obs.z < HIT_Z_NEAR) {
        obs.passed = true;
        continue;
      }
      if (obs.lane !== runner.lane) continue;
      if (runner.jumpY >= JUMP_CLEAR_HEIGHT) continue;
      obs.passed = true;
      hurtRunner();
    }

    for (const coin of runner.coins) {
      if (coin.picked) continue;
      if (coin.z > COIN_Z_FAR || coin.z < HIT_Z_NEAR) continue;
      if (coin.lane !== runner.lane) continue;
      coin.picked = true;
      if (coin.type === "heart") {
        runner.health = Math.min(MAX_HEALTH, runner.health + 1);
      } else {
        runner.score += COIN_VALUE;
        runner.coinsCollected += 1;
        if (runner.coinsCollected % COINS_PER_HEART === 0) runner.pendingHearts += 1;
      }
    }

    runner.obstacles = runner.obstacles.filter((o) => o.z > -0.6);
    runner.coins = runner.coins.filter((c) => c.z > -0.6 && !c.picked);

    runner.spawnTimer -= dt;
    if (runner.spawnTimer <= 0) {
      runner.spawnTimer = Math.max(0.42, 1.35 - runner.speed * 0.018);
      spawn();
    }

    runner.score += SCORE_PER_SECOND * dt;
    if (runner.score > runner.bestScore) runner.bestScore = runner.score;
  };

  function spawn() {
    if (Math.random() < 0.68) {
      const lane = Math.floor(Math.random() * NUM_LANES);
      const types = ["chomper", "ghostBoy", "monsterboy", "ogreBaby"];
      runner.obstacles.push({
        type: types[Math.floor(Math.random() * types.length)],
        lane,
        z: SPAWN_Z,
        animTime: Math.random() * 2,
        passed: false,
      });
    } else {
      const lane = Math.floor(Math.random() * NUM_LANES);
      const isHeart = runner.pendingHearts > 0;
      if (isHeart) runner.pendingHearts -= 1;
      runner.coins.push({
        type: isHeart ? "heart" : "coin",
        lane,
        z: SPAWN_Z,
        animTime: Math.random() * 2,
        picked: false,
      });
    }
  }

  function hurtRunner() {
    runner.health -= 1;
    runner.flashTimer = 0.3;
    if (runner.health <= 0) {
      runner.dead = true;
      runner.deathTimer = DEATH_DELAY;
    }
  }

  function project(worldX, worldZ, worldY = 0) {
    const denom = Math.max(worldZ + CAM_Z, 0.02);
    const scale = PROJ_SCALE / denom;
    const sx = RWIDTH / 2 + worldX * scale;
    const sy = HORIZON_Y + (RHEIGHT - HORIZON_Y) * (CAM_Z / denom) - worldY * scale * 0.6;
    return { sx, sy, scale };
  }

  EndlessRunner.draw = function () {
    if (!runner) return;
    drawSky();
    drawGround();
    drawOuterLanes();
    drawRoadEdges();
    drawLaneStripes();

    const things = [];
    for (const o of runner.obstacles) things.push({ kind: "obs", obj: o });
    for (const c of runner.coins) things.push({ kind: "coin", obj: c });
    things.sort((a, b) => b.obj.z - a.obj.z);
    for (const t of things) {
      if (t.kind === "obs") drawObstacle(t.obj);
      else drawCoin(t.obj);
    }

    drawPlayer();
    drawHud();

    if (runner.flashTimer > 0) {
      const a = Math.min(1, runner.flashTimer / 0.3) * 0.45;
      ctx.fillStyle = `rgba(248, 113, 113, ${a})`;
      ctx.fillRect(0, 0, RWIDTH, RHEIGHT);
    }
    if (runner.introTimer > 0 || runner.waitingForInput) drawIntro();
    if (runner.dead) drawGameOver();
  };

  function drawSky() {
    const grad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
    grad.addColorStop(0, rgbCss(SKY_TOP_COLOR));
    grad.addColorStop(0.6, rgbCss(SKY_MID_COLOR));
    grad.addColorStop(1, rgbCss(SKY_HORIZON_COLOR));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, RWIDTH, HORIZON_Y);

    drawStars();
    drawMoon();
  }

  function drawStars() {
    ctx.fillStyle = "rgba(254, 243, 199, 0.85)";
    for (const s of runner.stars) {
      const a = s.angle + runner.starRotation;
      // STAR_ANGULAR_VEL is negative, so the angle decreases over time, which
      // (with sy = pivot - r·sin) reads as clockwise rotation on screen.
      const sx = STAR_PIVOT_X + s.radius * Math.cos(a);
      const sy = STAR_PIVOT_Y - s.radius * Math.sin(a);
      if (sy >= HORIZON_Y || sx < -4 || sx >= RWIDTH + 4 || sy < -4) continue;
      ctx.fillRect(sx, sy, s.size, s.size);
    }
  }

  function drawMoon() {
    const cycleT = runner.moonPhase * MOON_CYCLE_DURATION;
    if (cycleT >= MOON_VISIBLE_DURATION) return; // below the horizon
    const phase = cycleT / MOON_VISIBLE_DURATION;
    const angle = Math.PI * (1 - phase); // π at left horizon → 0 at right horizon
    const mx = RWIDTH / 2 + MOON_ARC_RADIUS_X * Math.cos(angle);
    const my = HORIZON_Y - MOON_PEAK_RISE * Math.sin(angle);

    const glow = ctx.createRadialGradient(mx, my, MOON_RADIUS * 0.6, mx, my, MOON_RADIUS * 2.8);
    glow.addColorStop(0, "rgba(254, 240, 138, 0.42)");
    glow.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, MOON_RADIUS * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.arc(mx, my, MOON_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Crescent: overlay an offset disc tinted to the sky color sampled at
    // the moon's altitude, so the bite blends back into the gradient. The
    // bite circle is clipped to the moon's disc so it can't bulge out and
    // make the moon look peanut-shaped.
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, MOON_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = sampleSkyColor(my);
    ctx.beginPath();
    ctx.arc(mx + MOON_RADIUS * 0.5, my - MOON_RADIUS * 0.05, MOON_RADIUS * 0.94, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function sampleSkyColor(y) {
    const norm = Math.max(0, Math.min(1, y / HORIZON_Y));
    let lo, hi, k;
    if (norm <= 0.6) {
      lo = SKY_TOP_COLOR; hi = SKY_MID_COLOR; k = norm / 0.6;
    } else {
      lo = SKY_MID_COLOR; hi = SKY_HORIZON_COLOR; k = (norm - 0.6) / 0.4;
    }
    const r = Math.round(lo[0] + (hi[0] - lo[0]) * k);
    const g = Math.round(lo[1] + (hi[1] - lo[1]) * k);
    const b = Math.round(lo[2] + (hi[2] - lo[2]) * k);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function rgbCss(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  function drawGround() {
    const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, RHEIGHT);
    grad.addColorStop(0, "#3b0764");
    grad.addColorStop(0.5, "#1e1b4b");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, HORIZON_Y, RWIDTH, RHEIGHT - HORIZON_Y);

    const phase = runner.distance % 1;
    ctx.strokeStyle = "rgba(236, 72, 153, 0.55)";
    ctx.lineWidth = 2;
    for (let i = 1; i < 28; i += 1) {
      const z = i - phase;
      if (z <= 0.05) continue;
      const proj = project(0, z);
      if (proj.sy > RHEIGHT + 2) continue;
      ctx.beginPath();
      ctx.moveTo(0, proj.sy);
      ctx.lineTo(RWIDTH, proj.sy);
      ctx.stroke();
    }
  }

  function drawRoadEdges() {
    drawWorldLine(-LANE_HALF_WIDTH * 1.5 - 0.1, "rgba(250, 204, 21, 0.95)", 3);
    drawWorldLine(LANE_HALF_WIDTH * 1.5 + 0.1, "rgba(250, 204, 21, 0.95)", 3);
  }

  // Tints the left and right lane trapezoids with a lavender wash so the
  // three lanes read as distinct strips. Drawn after the ground gradient
  // but before the lane stripes / yellow edges, so those still pop on top.
  function drawOuterLanes() {
    const outerLeft = -LANE_HALF_WIDTH * 1.5 - 0.1;
    const outerRight = LANE_HALF_WIDTH * 1.5 + 0.1;
    const innerLeft = -LANE_HALF_WIDTH * 0.5;
    const innerRight = LANE_HALF_WIDTH * 0.5;
    ctx.fillStyle = "rgba(196, 181, 253, 0.22)";
    fillLaneTrapezoid(outerLeft, innerLeft);
    fillLaneTrapezoid(innerRight, outerRight);
  }

  function fillLaneTrapezoid(worldXLeft, worldXRight) {
    const nearL = project(worldXLeft, 0);
    const nearR = project(worldXRight, 0);
    const farR = project(worldXRight, FAR_Z);
    const farL = project(worldXLeft, FAR_Z);
    ctx.beginPath();
    ctx.moveTo(nearL.sx, nearL.sy);
    ctx.lineTo(nearR.sx, nearR.sy);
    ctx.lineTo(farR.sx, farR.sy);
    ctx.lineTo(farL.sx, farL.sy);
    ctx.closePath();
    ctx.fill();
  }

  function drawLaneStripes() {
    const phase = (runner.distance * 1.5) % 1;
    const stripeXs = [-LANE_HALF_WIDTH * 0.5, LANE_HALF_WIDTH * 0.5];
    ctx.strokeStyle = "rgba(254, 243, 199, 0.7)";
    ctx.lineWidth = 2;
    for (const lx of stripeXs) {
      for (let i = 0; i < 14; i += 1) {
        const zStart = i + phase;
        const zEnd = zStart + 0.4;
        if (zStart >= FAR_Z) continue;
        const a = project(lx, zStart);
        const b = project(lx, zEnd);
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
    }
  }

  function drawWorldLine(worldX, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    const near = project(worldX, 0.0);
    const far = project(worldX, FAR_Z);
    ctx.beginPath();
    ctx.moveTo(near.sx, near.sy);
    ctx.lineTo(far.sx, far.sy);
    ctx.stroke();
  }

  function drawObstacle(o) {
    if (o.z < 0.02) return;
    o.animTime += 0.016;
    const worldX = (o.lane - 1) * LANE_HALF_WIDTH;
    const proj = project(worldX, o.z);
    const spriteName = o.type === "ogreBaby" ? "ogrebaby" : o.type;
    const sprite = sprites[spriteName];
    if (!sprite) return;
    const anim = sprite.walk || sprite.run || sprite.float || sprite.idle;
    if (!anim) return;
    const frame = anim[Math.floor(o.animTime * 9) % anim.length];
    const image = images[sprite.sheet];
    if (!image) return;
    const worldH = ENTITY_WORLD_HEIGHT[spriteName] || 0.28;
    const drawH = worldH * proj.scale;
    const drawW = (frame.w / frame.h) * drawH;
    ctx.drawImage(
      image,
      frame.x, frame.y, frame.w, frame.h,
      Math.round(proj.sx - drawW / 2), Math.round(proj.sy - drawH),
      Math.round(drawW), Math.round(drawH),
    );
  }

  function drawCoin(c) {
    if (c.z < 0.02 || c.picked) return;
    c.animTime += 0.016;
    const isHeart = c.type === "heart";
    const sprite = isHeart ? sprites.heart : sprites.coin;
    if (!sprite) return;
    const frames = isHeart ? sprite.idle : sprite.spin;
    if (!frames) return;
    const fps = isHeart ? 8 : 14;
    const frame = frames[Math.floor(c.animTime * fps) % frames.length];
    const image = images[sprite.sheet];
    if (!image) return;
    const worldX = (c.lane - 1) * LANE_HALF_WIDTH;
    const proj = project(worldX, c.z, 0.6);
    const worldH = isHeart ? HEART_WORLD_HEIGHT : COIN_WORLD_HEIGHT;
    const drawH = worldH * proj.scale;
    const drawW = (frame.w / frame.h) * drawH;
    ctx.drawImage(
      image,
      frame.x, frame.y, frame.w, frame.h,
      Math.round(proj.sx - drawW / 2), Math.round(proj.sy - drawH),
      Math.round(drawW), Math.round(drawH),
    );
  }

  function drawPlayer() {
    const sprite = sprites[runner.character];
    if (!sprite) return;
    let anim;
    if (runner.dead) {
      // mark/maria don't ship a `defeated` strip, so this falls through to
      // `hurt` for them and would pick up `defeated` for any future hero.
      anim = sprite.defeated || sprite.hurt || sprite.idle;
    } else {
      const moving = Math.abs(runner.laneX - (runner.lane - 1) * LANE_HALF_WIDTH) > 0.05;
      anim = !runner.grounded ? (sprite.jump || sprite.walk) : (moving ? sprite.walk : sprite.idle);
    }
    if (!anim) return;
    const frame = anim[Math.floor(runner.animTime * 12) % anim.length];
    const image = images[sprite.sheet];
    if (!image) return;
    const proj = project(runner.laneX, 0.0);
    const drawH = PLAYER_WORLD_HEIGHT * proj.scale;
    const drawW = (frame.w / frame.h) * drawH;
    const dx = Math.round(proj.sx - drawW / 2);
    const dy = Math.round(proj.sy - drawH - runner.jumpY);

    if (runner.jumpY > 4) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
      ctx.beginPath();
      ctx.ellipse(proj.sx, proj.sy - 4, drawW * 0.32, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, dx, dy, Math.round(drawW), Math.round(drawH));
  }

  function drawHud() {
    ctx.fillStyle = "rgba(15, 23, 42, 0.62)";
    drawRoundRect(18, 16, 340, 82, 12);
    ctx.fillStyle = "#f8fafc";
    ctx.font = '800 22px "Nunito", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(`Runner  ·  ${Math.floor(runner.score)}`, 34, 44);
    ctx.font = '700 16px "Nunito", sans-serif';
    ctx.fillStyle = "#fda4af";
    ctx.fillText(`Health: ${"♥ ".repeat(Math.max(runner.health, 0)).trim() || "-"}`, 34, 68);
    ctx.fillStyle = "rgba(248, 250, 252, 0.72)";
    ctx.font = '700 13px "Nunito", sans-serif';
    ctx.fillText(`Speed x${runner.speed.toFixed(1)}`, 34, 88);

    ctx.fillStyle = "rgba(15, 23, 42, 0.62)";
    drawRoundRect(RWIDTH - 270, 16, 252, 50, 10);
    ctx.fillStyle = "#fde047";
    ctx.font = '800 14px "Nunito", sans-serif';
    ctx.fillText(runnerHudControlsLine(), RWIDTH - 256, 38);
    if (!isTouch) {
      ctx.fillStyle = "rgba(248, 250, 252, 0.7)";
      ctx.font = '700 12px "Nunito", sans-serif';
      ctx.fillText("ESC to exit Endless Mode", RWIDTH - 256, 56);
    }
  }

  function drawIntro() {
    const t = Math.max(0, runner.introTimer) / INTRO_TIME;
    ctx.fillStyle = `rgba(15, 23, 42, ${t})`;
    ctx.fillRect(0, 0, RWIDTH, RHEIGHT);
    ctx.fillStyle = "#fde047";
    ctx.font = '900 64px "Fraunces", Georgia, serif';
    ctx.textAlign = "center";
    ctx.fillText("ENDLESS RESCUE JAMES", RWIDTH / 2, RHEIGHT / 2 - 6);
    ctx.fillStyle = "#f8fafc";
    ctx.font = '700 18px "Nunito", sans-serif';
    ctx.fillText(runnerIntroControlsLine(), RWIDTH / 2, RHEIGHT / 2 + 32);
    if (runner.introTimer <= 0 && runner.waitingForInput) {
      const pulse = 0.55 + 0.45 * Math.sin(runner.animTime * 5);
      ctx.fillStyle = `rgba(253, 224, 71, ${pulse})`;
      ctx.font = '800 24px "Nunito", sans-serif';
      ctx.fillText(isTouch ? "Tap to start" : "Press any key to start", RWIDTH / 2, RHEIGHT / 2 + 86);
    }
    ctx.textAlign = "left";
  }

  function drawGameOver() {
    ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
    ctx.fillRect(0, 0, RWIDTH, RHEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f8fafc";
    ctx.font = '900 56px "Fraunces", Georgia, serif';
    ctx.fillText("Caught!", RWIDTH / 2, RHEIGHT / 2 - 24);
    ctx.font = '700 22px "Nunito", sans-serif';
    ctx.fillText(`Final Score: ${Math.floor(runner.score)}`, RWIDTH / 2, RHEIGHT / 2 + 14);
    ctx.fillText(`Top Speed: x${runner.maxSpeed.toFixed(1)}`, RWIDTH / 2, RHEIGHT / 2 + 44);
    if (runner.deathTimer <= 0) {
      ctx.fillStyle = "#fde047";
      ctx.font = '800 18px "Nunito", sans-serif';
      ctx.fillText(isTouch ? "Tap to return" : "Press SPACE to return", RWIDTH / 2, RHEIGHT / 2 + 84);
    }
    ctx.textAlign = "left";
  }

  function drawRoundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function makeStarfield() {
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i += 1) {
      // sqrt(uniform) gives uniform area density in the disc, so larger
      // radii (which sweep through more screen area) get proportionally
      // more stars and the sky never goes patchy as it rotates.
      stars.push({
        radius: Math.sqrt(Math.random()) * STAR_MAX_RADIUS,
        angle: Math.random() * Math.PI * 2,
        size: Math.random() < 0.18 ? 3 : 2,
      });
    }
    return stars;
  }

  function keyLeftDown() {
    return keys.has("ArrowLeft") || keys.has("KeyA");
  }

  function keyRightDown() {
    return keys.has("ArrowRight") || keys.has("KeyD");
  }

  function keyJumpDown() {
    return keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW");
  }

  function keyStartDown() {
    return keys.has("Enter");
  }

  function runnerIntroControlsLine() {
    if (isTouch) return "Swipe left or right to switch lanes  ·  Tap to jump";
    return "←/→ to switch lanes  ·  Space to jump  ·  ESC to exit";
  }

  function runnerHudControlsLine() {
    if (isTouch) return "Swipe to switch lane  ·  Tap to jump";
    return "←/→ switch lane  ·  Space jump";
  }

  function clearTouchPulses() {
    touchPulseLeft = false;
    touchPulseRight = false;
    touchPulseJump = false;
    touchPulseStart = false;
  }

  function consumeTouchPulses() {
    const pulses = {
      left: touchPulseLeft,
      right: touchPulseRight,
      jump: touchPulseJump,
      start: touchPulseStart,
    };
    clearTouchPulses();
    return pulses;
  }

  function touchCoords(clientX, clientY) {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvasEl.width / rect.width),
      y: (clientY - rect.top) * (canvasEl.height / rect.height),
    };
  }

  function resolveTouchGesture(start, endX, endY) {
    const dx = endX - start.x;
    const dy = endY - start.y;
    const dt = performance.now() - start.time;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const gameplayReady = runner.introTimer <= 0 && !runner.waitingForInput && !runner.dead;

    if (
      gameplayReady &&
      absDx >= SWIPE_MIN_DISTANCE &&
      absDx > absDy &&
      absDy <= SWIPE_MAX_VERTICAL_DRIFT
    ) {
      if (dx < 0) touchPulseLeft = true;
      else touchPulseRight = true;
      return;
    }

    if (absDx <= TAP_MAX_MOVE && absDy <= TAP_MAX_MOVE && dt <= TAP_MAX_DURATION_MS) {
      if (runner.waitingForInput || runner.dead) touchPulseStart = true;
      else if (gameplayReady) touchPulseJump = true;
    }
  }

  function bindTouchControls(canvas) {
    if (!isTouch || touchControlsBound) return;
    touchControlsBound = true;
    canvasEl = canvas;

    function onTouchStart(event) {
      if (!runner) return;
      event.preventDefault();
      for (const t of event.changedTouches) {
        const { x, y } = touchCoords(t.clientX, t.clientY);
        activeTouches.set(t.identifier, { x, y, time: performance.now() });
      }
    }

    function onTouchEnd(event) {
      if (!runner) return;
      event.preventDefault();
      for (const t of event.changedTouches) {
        const start = activeTouches.get(t.identifier);
        activeTouches.delete(t.identifier);
        if (!start) continue;
        const { x, y } = touchCoords(t.clientX, t.clientY);
        resolveTouchGesture(start, x, y);
      }
    }

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });
  }

  EndlessRunner.exit = function () {
    const cb = onExitCallback;
    const finalScore = runner ? Math.floor(runner.score) : 0;
    runner = null;
    onExitCallback = null;
    if (cb) cb(finalScore);
  };

  global.EndlessRunner = EndlessRunner;
})(window);
