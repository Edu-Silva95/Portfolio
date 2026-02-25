import { useEffect, useRef, useState } from "react";
import Window from "../folder_styles/FolderGeneral";

export default function DinoWindow({ onClose, onMinimize, closing = false }) {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [spriteError, setSpriteError] = useState("");
  const runningRef = useRef(false);
  const gameOverRef = useRef(false);
  const animationRef = useRef(null);
  const dinoImgRef = useRef(null);
  const [spritesReady, setSpritesReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;  
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const dinoImg = new Image();
    dinoImgRef.current = dinoImg;

    dinoImg.onload = () => setSpritesReady(true);
    dinoImg.onerror = () => setSpriteError("Failed to load /sprites/dino_small.png");
    dinoImg.src = "/sprites/dino_small.png";

    const width = 600;
    const height = 150;
    const GROUND_RISE = 14;
    const groundY = 140 - GROUND_RISE;
    canvas.width = width;
    canvas.height = height;

    let speed = 3;
    let gravity = 0.42;
    let frame = 0;

    const SPRITE_BASE = {
      TREX: { x: 848, y: 2 },
      PTERODACTYL: { x: 134, y: 2 },
      CACTUS_SMALL: { x: 228, y: 2 },
      CACTUS_LARGE: { x: 332, y: 2 },
    };

    const TREX_W = 44;
    const TREX_H = 47;
    const DUCK_W = 59;
    const DUCK_H = 30;
    const PTERO_W = 46;
    const PTERO_H = 40;
    const PTERO_MIN_Y = 45;
    const PTERO_MAX_Y = 85;
    const GROUND = { sx: 2, sy: 54, sw: 742, sh: 5 };
    const GROUND_ALT = { sx: 744, sy: 54, sw: 319, sh: 7 };
    const GROUND_Y_OFFSET = 1;
    const CLOUD = { sx: 90, sy: 2, sw: 41, sh: 12 };
    const GAME_OVER = { sx: 656, sy: 15, sw: 190, sh: 14 };
    const GAME_OVER_SCALE = 1.3;
    const CACTUS_GROUND_OFFSET = 12;
    const MAX_FALL_SPEED = 8;
    const DINO_HITBOX_PAD = { x: 8, y: 3 };
    const OBSTACLE_HITBOX_PAD = { x: 8, y: 3 };
    const LARGE_CACTUS_SCALE = 1;

    const DUCK_SY = 23;
    const DUCK_DRAW_OFFSET = 5;
    const DINO_SPRITES = {
      idle: { sx: SPRITE_BASE.TREX.x + 0, sy: SPRITE_BASE.TREX.y, sw: 44, sh: 47 },
      run1: { sx: SPRITE_BASE.TREX.x + 44, sy: SPRITE_BASE.TREX.y, sw: 44, sh: 47 },
      run2: { sx: SPRITE_BASE.TREX.x + 88, sy: SPRITE_BASE.TREX.y, sw: 44, sh: 47 },
      jump: { sx: SPRITE_BASE.TREX.x + 132, sy: SPRITE_BASE.TREX.y, sw: 44, sh: 47 },
      dead: { sx: SPRITE_BASE.TREX.x + 220, sy: SPRITE_BASE.TREX.y, sw: 44, sh: 47 },
      duck1: { sx: 1112, sy: DUCK_SY, sw: 59, sh: 30 },
      duck2: { sx: 1171, sy: DUCK_SY, sw: 59, sh: 30 },

    };

    const OBSTACLE_SPRITES = [
      { type: "cactus", sx: SPRITE_BASE.CACTUS_SMALL.x + 0, sy: SPRITE_BASE.CACTUS_SMALL.y, sw: 17, sh: 35 },
      { type: "cactus", sx: SPRITE_BASE.CACTUS_SMALL.x + 17, sy: SPRITE_BASE.CACTUS_SMALL.y, sw: 34, sh: 35 },
      { type: "cactus", sx: SPRITE_BASE.CACTUS_SMALL.x + 51, sy: SPRITE_BASE.CACTUS_SMALL.y, sw: 51, sh: 35 },
      { type: "cactus", sx: SPRITE_BASE.CACTUS_LARGE.x + 0, sy: SPRITE_BASE.CACTUS_LARGE.y, sw: 25, sh: 50, scale: LARGE_CACTUS_SCALE },
      { type: "cactus", sx: SPRITE_BASE.CACTUS_LARGE.x + 25, sy: SPRITE_BASE.CACTUS_LARGE.y, sw: 50, sh: 50, scale: LARGE_CACTUS_SCALE },
      { type: "cactus", sx: SPRITE_BASE.CACTUS_LARGE.x + 75, sy: SPRITE_BASE.CACTUS_LARGE.y, sw: 75, sh: 50, scale: LARGE_CACTUS_SCALE },
      {
        type: "bird", sx: SPRITE_BASE.PTERODACTYL.x, sy: SPRITE_BASE.PTERODACTYL.y, sw: PTERO_W, sh: PTERO_H,
        alt: { sx: SPRITE_BASE.PTERODACTYL.x + PTERO_W, sy: SPRITE_BASE.PTERODACTYL.y, sw: PTERO_W, sh: PTERO_H }
      },
    ];

    const GROUND_SEGMENTS = [GROUND, GROUND_ALT];
    const GROUND_TOTAL = GROUND_SEGMENTS.reduce((sum, seg) => sum + seg.sw, 0);

    const dino = {
      x: 0,
      y: groundY - TREX_H,
      w: TREX_W,
      h: TREX_H,
      vy: 0,
      jumping: false,
      ducking: false,
      distance: 0,      // run distance for frame cycle
      duckDistance: 0,  // duck frame counter
    };

    let obstacles = [];
    let clouds = [];
    let groundOffset = 0;
    let nextCloudFrame = 60;

    function spawnObstacle() {
      const sprite = OBSTACLE_SPRITES[Math.floor(Math.random() * OBSTACLE_SPRITES.length)];
      const scale = sprite.scale ?? 1;
      const baseY = sprite.type === "bird"
        ? PTERO_MIN_Y + Math.random() * (PTERO_MAX_Y - PTERO_MIN_Y)
        : groundY - sprite.sh * scale + CACTUS_GROUND_OFFSET;
      obstacles.push({ x: width, y: baseY, w: sprite.sw * scale, h: sprite.sh * scale, sprite, scale });
    }

    function spawnCloud() {
      const y = 18 + Math.random() * 35;
      const speedScale = 0.35 + Math.random() * 0.15;
      clouds.push({ x: width + 20, y, speed: speed * speedScale });
    }

    function drawDino(x, y, sprite) {
      const img = dinoImgRef.current;
      if (!spritesReady || !img?.complete || !sprite) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, y, dino.w, dino.h);
        return;
      }
      ctx.drawImage(img, sprite.sx, sprite.sy, sprite.sw, sprite.sh, x, y, sprite.sw, sprite.sh);
    }

    function drawObstacle(o) {
      const img = dinoImgRef.current;
      if (!spritesReady || !img?.complete || !o.sprite) {
        ctx.fillStyle = "#7ddc7d";
        ctx.fillRect(o.x, o.y, o.w, o.h);
        return;
      }
      const spriteFrame = o.sprite.type === "bird" && o.sprite.alt
        ? frame % 12 < 6 ? o.sprite : o.sprite.alt
        : o.sprite;
      const { sx, sy, sw, sh } = spriteFrame;
      const scale = o.scale ?? 1;
      ctx.drawImage(img, sx, sy, sw, sh, o.x, o.y, sw * scale, sh * scale);
    }

    function jump() {
      if (!dino.jumping) {
        dino.vy = -10;
        dino.jumping = true;
        dino.ducking = false;
      }
    }

    function collide(a, b) {
      const ax1 = a.x + DINO_HITBOX_PAD.x;
      const ay1 = a.y + DINO_HITBOX_PAD.y;
      const ax2 = a.x + a.w - DINO_HITBOX_PAD.x;
      const ay2 = a.y + a.h - DINO_HITBOX_PAD.y;

      const bx1 = b.x + OBSTACLE_HITBOX_PAD.x;
      const by1 = b.y + OBSTACLE_HITBOX_PAD.y;
      const bx2 = b.x + b.w - OBSTACLE_HITBOX_PAD.x;
      const by2 = b.y + b.h - OBSTACLE_HITBOX_PAD.y;

      return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
    }

    // --- RUN CYCLE ---
    const RUN_LEFT = DINO_SPRITES.jump;
    const RUN_MID = DINO_SPRITES.run1;
    const RUN_RIGHT = DINO_SPRITES.run2;
    const RUN_FRAME_DISTANCE = 28;

    function drawFrame() {
      frame++;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      const isGameOver = gameOverRef.current;

      // clouds
      if (spritesReady && dinoImgRef.current?.complete) {
        const img = dinoImgRef.current;
        if (frame >= nextCloudFrame) {
          spawnCloud();
          nextCloudFrame = frame + 90 + Math.floor(Math.random() * 120);
        }

        clouds.forEach((cloud) => {
          cloud.x -= cloud.speed;
          ctx.drawImage(img, CLOUD.sx, CLOUD.sy, CLOUD.sw, CLOUD.sh, cloud.x, cloud.y, CLOUD.sw, CLOUD.sh);
        });
        clouds = clouds.filter((cloud) => cloud.x + CLOUD.sw > 0);
      }

      // ground
      if (spritesReady && dinoImgRef.current?.complete) {
        const img = dinoImgRef.current;
        groundOffset = (groundOffset + speed) % GROUND_TOTAL;
        let offset = groundOffset;
        let segIndex = 0;

        while (offset >= GROUND_SEGMENTS[segIndex].sw) {
          offset -= GROUND_SEGMENTS[segIndex].sw;
          segIndex = (segIndex + 1) % GROUND_SEGMENTS.length;
        }

        for (let x = -offset; x < width; ) {
          const seg = GROUND_SEGMENTS[segIndex];
          ctx.drawImage(
            img,
            seg.sx,
            seg.sy,
            seg.sw,
            seg.sh,
            x,
            groundY - seg.sh + GROUND_Y_OFFSET,
            seg.sw,
            seg.sh
          );
          x += seg.sw;
          segIndex = (segIndex + 1) % GROUND_SEGMENTS.length;
        }
      } else {
        ctx.fillStyle = "#999";
        ctx.fillRect(0, groundY, width, 2);
      }

      if (!spritesReady && spriteError) {
        ctx.fillStyle = "#fff";
        ctx.font = "12px sans-serif";
        ctx.fillText(spriteError, 10, 20);
      }

      if (isGameOver) {
        dino.vy = 0;
        dino.y = groundY - dino.h;
        dino.jumping = false;
        dino.ducking = false;
      }

      const isDucking = dino.ducking && !dino.jumping;
      dino.h = isDucking ? DUCK_H : TREX_H;
      dino.w = isDucking ? DUCK_W : TREX_W;

      // physics
      if (!isGameOver) {
        dino.y += dino.vy;
        dino.vy += gravity;
        if (dino.vy > MAX_FALL_SPEED) dino.vy = MAX_FALL_SPEED;
      }

      if (dino.y >= groundY - dino.h) {
        dino.y = groundY - dino.h;
        dino.vy = 0;
        dino.jumping = false;
      }

      // --- sprite selection ---
      let sprite;
      let bobY = 0;

      if (!isDucking) dino.duckDistance = 0;

      if (isGameOver) {
        sprite = DINO_SPRITES.dead;
      } else if (isDucking) {
        // ducking animation
        dino.duckDistance += 1;
        const duckPhase = Math.floor(dino.duckDistance / 10) % 2;
        sprite = duckPhase === 0 ? DINO_SPRITES.duck1 : DINO_SPRITES.duck2;
      } else if (dino.jumping) {
        sprite = DINO_SPRITES.jump;
      } else if (runningRef.current) {
        // running animation
        dino.distance += speed;
        const runPhase = Math.floor(dino.distance / RUN_FRAME_DISTANCE) % 3;
        if (runPhase === 0) sprite = RUN_LEFT;
        else if (runPhase === 1) sprite = RUN_MID;
        else sprite = RUN_RIGHT;
        bobY = runPhase === 1 ? 0 : 1;
      } else {
        sprite = DINO_SPRITES.idle;
      }

      const drawY = isDucking ? dino.y + bobY + DUCK_DRAW_OFFSET : dino.y + bobY;
      drawDino(dino.x, drawY, sprite);

      if (isGameOver) {
        const img = dinoImgRef.current;
        const goW = GAME_OVER.sw * GAME_OVER_SCALE;
        const goH = GAME_OVER.sh * GAME_OVER_SCALE;
        const goX = (width - goW) / 2;
        const goY = 26;
        if (spritesReady && img?.complete) {
          ctx.drawImage(img, GAME_OVER.sx, GAME_OVER.sy, GAME_OVER.sw, GAME_OVER.sh, goX, goY, goW, goH);
        } else {
          ctx.fillStyle = "#111";
          ctx.font = "16px sans-serif";
          ctx.fillText("GAME OVER", goX, goY + 14);
        }
      }

      // obstacles
      obstacles.forEach(o => {
        o.x -= speed;
        drawObstacle(o);
      });

      obstacles = obstacles.filter(o => o.x + o.w > 0);

      if (frame % 90 === 0) spawnObstacle();

      if (runningRef.current && !isGameOver) {
        setScore(s => s + 1);
      }
    }

    function update() {
      drawFrame();
      for (const o of obstacles) {
        if (collide(dino, o)) {
          runningRef.current = false;
          gameOverRef.current = true;
          setRunning(false);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
          drawFrame();
          return;
        }
      }
      animationRef.current = requestAnimationFrame(update);
    }

    function resetGame() {
      obstacles = [];
      clouds = [];
      frame = 0;
      gameOverRef.current = false;
      dino.y = groundY - dino.h;
      dino.vy = 0;
      dino.jumping = false;
      dino.ducking = false;
      dino.distance = 0;
      dino.duckDistance = 0;
      groundOffset = 0;
      nextCloudFrame = 60;
      setScore(0);
      drawFrame();
    }

    function startGame() {
      if (runningRef.current) return;
      runningRef.current = true;
      setRunning(true);
      resetGame();
      animationRef.current = requestAnimationFrame(update);
    }

    function onKey(e) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!runningRef.current) startGame();
        jump();
      } else if (e.code === "ArrowDown") {
        dino.ducking = true;
      }
    }

    function onKeyUp(e) {
      if (e.code === "ArrowDown") {
        dino.ducking = false;
        dino.duckDistance = 0;
      }
    }

    function onPointer() {
      if (!runningRef.current) startGame();
      jump();
    }

    drawFrame();
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointer);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [spriteError, spritesReady]);

  return (
    <Window title="🦖 Chrome Dino.exe" onClose={onClose} onMinimize={onMinimize} closing={closing}>
      <div className="p-4 space-y-3 text-sm h-full flex flex-col">
        <div className="w-full flex justify-center">
          <div className="relative">
            <canvas ref={canvasRef} className="border border-white/20" />
            {!running && (
              <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-black/80">
                Press Space to start
              </div>
            )}
          </div>
        </div>
        <div className="w-full flex justify-center text-sm font-semibold text-white/80">
          <span>Score: {score}</span>
        </div>
      </div>
    </Window>
  );
}
