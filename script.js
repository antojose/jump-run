// Jump‑and‑Run with doors, villains and win screen
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Full‑screen canvas and responsive margins
let CAMERA_MARGIN, LEFT_MARGIN;
function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  CAMERA_MARGIN = canvas.width / 3;
  LEFT_MARGIN = canvas.width / 4;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game constants
const GRAVITY = 0.6;
const FRICTION = 0.8;
const PLAYER_SPEED = 4;
const JUMP_STRENGTH = -12;

// Sprites (left/right Hercules)
const spriteRight = new Image();
spriteRight.src = 'assets/hercules-right.png';
const spriteLeft = new Image();
spriteLeft.src = 'assets/hercules-left.png';
let spriteLoaded = false;
spriteRight.onload = () => { spriteLoaded = true; };
spriteLeft.onload = () => { spriteLoaded = true; };

// Simple beep for jump (tiny wav data URL)
const jumpSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=');
jumpSound.volume = 0.6;

// Player object
const player = {
  facing: 'right',
  x: 50,
  y: 300,
  width: 40,
  height: 60,
  velX: 0,
  velY: 0,
  jumping: false,
};
let gameOver = false;
let gameWon = false;
let deathMessage = null;

// Platforms
const platforms = [
  { x: 0, y: 380, width: 2000, height: 20 },
  { x: 200, y: 300, width: 120, height: 10 },
  { x: 350, y: 250, width: 120, height: 10 },
  { x: 500, y: 200, width: 100, height: 10 },
  { x: 650, y: 180, width: 150, height: 10 },
  { x: 800, y: 260, width: 120, height: 10, velY: 1, minY: 200, maxY: 260 },
  { x: 950, y: 240, width: 120, height: 10 },
  { x: 1100, y: 220, width: 100, height: 10 },
  { x: 1300, y: 200, width: 150, height: 10, velX: 1, minX: 1200, maxX: 1400 },
  { x: 1500, y: 180, width: 120, height: 10 },
  { x: 1700, y: 160, width: 100, height: 10 },
  { x: 1900, y: 140, width: 150, height: 10 },
];

// Compute world width and max camera after platforms are defined
const WORLD_WIDTH = Math.max(...platforms.map(p => p.x + p.width));
const MAX_CAMERA = Math.max(0, WORLD_WIDTH - canvas.width);

// Doors (start and end)
const doors = [
  { x: 0, y: 320, width: 40, height: 80 }, // start door
  { x: WORLD_WIDTH - 50, y: 20, width: 40, height: 80 } // end door (top‑right)
];

// Villains – simple patrolling rectangles
const villains = [
  { x: 220, y: 260, width: 30, height: 40, velX: 1, leftBound: 200, rightBound: 340 },
  { x: 970, y: 190, width: 30, height: 40, velX: 1.5, leftBound: 950, rightBound: 1070 },
  { x: 1520, y: 140, width: 30, height: 40, velX: 1.2, leftBound: 1500, rightBound: 1620 },
];

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

function rectCollision(a, b){
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function update(){
  if (gameOver) return;
  // Horizontal movement with facing
  if (keys['ArrowRight'] || keys['KeyD']){ if (player.velX < PLAYER_SPEED) player.velX++; player.facing = 'right'; }
  else if (keys['ArrowLeft'] || keys['KeyA']){ if (player.velX > -PLAYER_SPEED) player.velX--; player.facing = 'left'; }
  else { player.velX *= FRICTION; }

  // Jump
  if ((keys['Space']||keys['ArrowUp']||keys['KeyW']) && !player.jumping){ player.jumping = true; player.velY = JUMP_STRENGTH; jumpSound.currentTime = 0; jumpSound.play(); }

  // Gravity
  player.velY += GRAVITY;
  // Apply velocity
  player.x += player.velX;
  player.y += player.velY;

   // World bounds (prevent moving left off start, wrap on right edge)
   if (player.x < 0) player.x = 0;
   if (player.x > WORLD_WIDTH - player.width) player.x = 0;
   // Death if player falls below the visible area
   if (player.y > canvas.height) {
       gameOver = true;
       deathMessage = 'Oh no, you are D.E.A.D!';
   }


  // Platform collisions
player.jumping = true;
// Update moving platforms (horizontal or vertical)
platforms.forEach(p => {
  if (p.velX) {
    p.x += p.velX;
    if (p.x < p.minX || p.x > p.maxX) p.velX *= -1;
  }
  if (p.velY) {
    p.y += p.velY;
    if (p.y < p.minY || p.y > p.maxY) p.velY *= -1;
  }
});
  for (let p of platforms){
    if (rectCollision(player,p)){
      if (player.velY > 0 && player.y + player.height - player.velY <= p.y){
  player.y = p.y - player.height;
  player.velY = 0;
  player.jumping = false;
  if (p.velX) player.x += p.velX;
  if (p.velY) player.y += p.velY;
}
      else if (player.velY < 0 && player.y >= p.y + p.height - player.velY){ player.y = p.y + p.height; player.velY = 0; }
      else if (player.velX > 0 && player.x + player.width - player.velX <= p.x){ player.x = p.x - player.width; player.velX = 0; }
      else if (player.velX < 0 && player.x >= p.x + p.width - player.velX){ player.x = p.x + p.width; player.velX = 0; }
    }
  }

  // Villains movement & collision
  villains.forEach(v => {
    v.x += v.velX;
    if (v.x < v.leftBound || v.x > v.rightBound) v.velX *= -1;
    if (rectCollision(player, v)){
      player.x = 50; player.y = 300; player.velX = 0; player.velY = 0; cameraX = 0;
    }
  });

  // End door collision -> win
  if (rectCollision(player, doors[1])){ gameOver = true; gameWon = true; }

  // Camera handling
  if (player.x - cameraX > CAMERA_MARGIN && player.x < WORLD_WIDTH - canvas.width + CAMERA_MARGIN){
    cameraX = player.x - CAMERA_MARGIN;
  } else if (player.x - cameraX < LEFT_MARGIN && player.x > CAMERA_MARGIN){
    cameraX = player.x - LEFT_MARGIN;
  }
  if (cameraX < 0) cameraX = 0;
  if (cameraX > MAX_CAMERA) cameraX = MAX_CAMERA;
}

let cameraX = 0;

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Platforms
  ctx.fillStyle = '#654321';
  platforms.forEach(p=> ctx.fillRect(p.x - cameraX, p.y, p.width, p.height));
  // Villains
  ctx.fillStyle = '#b00';
  villains.forEach(v=> ctx.fillRect(v.x - cameraX, v.y, v.width, v.height));
  // Doors
  ctx.fillStyle = '#8B4513';
  doors.forEach(d=> ctx.fillRect(d.x - cameraX, d.y, d.width, d.height));
  // Player
  if (spriteLoaded){
    const spr = player.facing === 'right' ? spriteRight : spriteLeft;
    ctx.drawImage(spr, player.x - cameraX, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = '#ff0';
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);
  }
   // End screen overlay
   if (gameOver){
     ctx.fillStyle = 'rgba(0,0,0,0.7)';
     ctx.fillRect(0,0,canvas.width,canvas.height);
     ctx.fillStyle = '#fff';
     ctx.font = '48px sans-serif';
     ctx.textAlign = 'center';
     const msg = deathMessage ? deathMessage : (gameWon ? 'You Win!' : 'Game Over');
     ctx.fillText(msg, canvas.width/2, canvas.height/2);
   }
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
