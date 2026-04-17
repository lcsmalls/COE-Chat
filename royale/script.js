const firebaseConfig = {
  apiKey: "AIzaSyC5yaurfWJZJYqYDH6os2pgjsouHvQkRQg",
  authDomain: "catgirl-royale-4ceec.firebaseapp.com",
  databaseURL: "https://catgirl-royale-4ceec-default-rtdb.firebaseio.com",
  projectId: "catgirl-royale-4ceec",
  storageBucket: "catgirl-royale-4ceec.appspot.com",
  messagingSenderId: "239457944443",
  appId: "1:239457944443:web:d885e55fbb084d671db3de",
  measurementId: "G-L96K0QM97T"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let firebaseUser = null;
firebase.auth().onAuthStateChanged(function(user) {
  if (user) { firebaseUser = user; }
  else { firebase.auth().signInAnonymously(); }
});
let myName = "", myColor = "#ffb6c1", mode = "offline";
let gameCode = null, isCreator = false, onlinePlayers = [];
let myUID = null, gameStarted = false;
let players = [], bullets = [], winner = null, gameState = 'menu';
let keySequence = '', cheatCode = 'catgirl';
let keys = {}, onlineHeldKeys = {}, machineGunInterval = null;
let powerups = [], powerupTimer = 0;
let invincibleTimeouts = [null, null, null, null];
let mouseX = 400, mouseY = 300, walls = [
  { x: 300, y: 200, w: 40, h: 200 },
  { x: 500, y: 100, w: 200, h: 40 },
  { x: 150, y: 400, w: 120, h: 40 }
];
function showScreen(id) {
  for (const el of document.querySelectorAll('.screen')) el.classList.remove('active');
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.getElementById("game-panel").classList.toggle('hide', id !== "game-panel");
  document.getElementById("deathScreen").style.display = "none";
  window.scrollTo(0,0);
  resizeGameArea();
}
function genUID() { return "u" + Math.random().toString(36).substr(2,9); }
function genCode() { return Math.random().toString(36).substr(2,6).toUpperCase(); }
function startOffline() { mode = "offline"; showScreen("offlineSetup"); }
function startOnline() { mode = "online"; showScreen("ss2-player-info"); document.getElementById('onlineName').value = ""; selectCatColor("#ffb6c1"); }
function selectCatColor(color) {
  myColor = color; document.getElementById('onlineColor').value = color;
  for (const el of document.querySelectorAll('.cat-color')) el.classList.remove('selected');
  const elid = {"#ffb6c1":"cat-pink", "#4fc3f7":"cat-blue", "#a259e6":"cat-purple", "#ffb347":"cat-orange", "#7fff7f":"cat-green"}[color];
  document.getElementById(elid).classList.add('selected');
}
function confirmPlayerInfo() { myName = document.getElementById('onlineName').value.trim() || "Player"; showScreen("ss3-create-join"); }
function showJoinScreen() { showScreen("ss4-join-game"); document.getElementById("joinCode").value = ""; }
function createGame() {
  myUID = genUID(); const code = genCode(); gameCode = code; isCreator = true;
  db.ref('games/' + code).set({
    creator: myUID, started: false, winner: null, cheatwinner: null,
    players: { [myUID]: { name: myName, color: myColor, uid: myUID, ready: false, health: 100, invincible: false } }
  }).then(() => { showLobby(); listenLobby(); });
}
function joinGame() {
  const code = document.getElementById('joinCode').value.trim();
  myUID = genUID();
  db.ref('games/' + code + '/players').once('value').then(snap => {
    const pl = snap.val();
    if (!pl || Object.keys(pl).length >= 4) { alert("Game not found or full!"); return; }
    gameCode = code; isCreator = false;
    db.ref('games/' + code + '/players/' + myUID).set({ name: myName, color: myColor, uid: myUID, ready: false, health: 100, invincible: false }).then(() => { showLobby(); listenLobby(); });
  });
}
function showLobby() { showScreen("lobby"); document.getElementById("lobbyCode").innerText = gameCode; document.getElementById("startBtn").style.display = "none"; updatePlayerList([]); }
function updatePlayerList(list) {
  const listEl = document.getElementById("playerList"); listEl.innerHTML = "";
  list.forEach((p,i) => { const div = document.createElement('div'); div.className = "player" + (i===0?" creator":""); div.innerHTML = `<span class="player-color" style="background:${p.color}"></span> ${p.name}`; listEl.appendChild(div); });
}
function listenLobby() {
  db.ref('games/' + gameCode + '/players').on('value', snap => {
    const pl = snap.val()||{}; onlinePlayers = Object.values(pl); updatePlayerList(onlinePlayers);
    if (isCreator && onlinePlayers.length >= 2 && onlinePlayers.length <= 4) document.getElementById("startBtn").style.display = "";
    else document.getElementById("startBtn").style.display = "none";
  });
  db.ref('games/' + gameCode + '/started').on('value', snap => { 
    if (snap.val()) { 
      winner = null; gameState = 'playing';
      gameStarted = true; // <-- Fix: set gameStarted true so processShootEvents runs
      db.ref('games/' + gameCode + '/winner').set(null);
      db.ref('games/' + gameCode + '/cheatwinner').set(null);
      startOnlineGame(true); 
    } 
  });
  db.ref('games/' + gameCode + '/winner').on('value', snap => { if (snap.val()) showWinScreen(snap.val()); });
  db.ref('games/' + gameCode + '/cheatwinner').on('value', snap => { if (snap.val()) showWinScreen(snap.val()); });
}
function startGame() { 
  // Reset health/invincible for all players before starting
  db.ref('games/' + gameCode + '/players').once('value').then(snap => {
    const pl = snap.val();
    if (pl) {
      Object.keys(pl).forEach(uid => {
        db.ref('games/' + gameCode + '/players/' + uid).update({ health: 100, invincible: false });
      });
    }
    db.ref('games/' + gameCode + '/winner').set(null);
    db.ref('games/' + gameCode + '/cheatwinner').set(null);
    db.ref('games/' + gameCode + '/started').set(true);
  });
}
function showWinScreen(name) { document.getElementById("winnerText").innerText = `${name} won!`; document.getElementById("deathScreen").style.display = "flex"; resizeGameArea(); }
function rematch() {
  if (mode == "offline") showScreen("offlineSetup");
  else {
    db.ref('games/' + gameCode + '/winner').set(null);
    db.ref('games/' + gameCode + '/cheatwinner').set(null);
    db.ref('games/' + gameCode + '/bullets').set([]);
    db.ref('games/' + gameCode + '/powerups').set([]);
    db.ref('games/' + gameCode + '/started').set(false);
    let newPlayers = {};
    onlinePlayers.forEach((p, i) => {
      newPlayers[p.uid] = { name: p.name, color: p.color, uid: p.uid, ready: false, health: 100, invincible: false };
    });
    db.ref('games/' + gameCode + '/players').set(newPlayers);
    db.ref('games/' + gameCode + '/creator').set(onlinePlayers[0]?.uid || myUID);
    isCreator = (onlinePlayers[0]?.uid === myUID);
    winner = null; gameState = 'menu';
    showLobby();
    listenLobby();
  }
}
const catImages = { blue: new Image(), violet: new Image(), pink: new Image(), orange: new Image(), green: new Image() };
catImages.blue.src = 'https://coe-chat.vercel.app/royale/cat_blue.png';
catImages.violet.src = 'https://coe-chat.vercel.app/royale/cat_violet.png';
catImages.pink.src = 'https://coe-chat.vercel.app/royale/cat_pink.png';
catImages.orange.src = 'https://coe-chat.vercel.app/royale/cat_orange.png';
catImages.green.src = 'https://coe-chat.vercel.app/royale/cat_green.png';
const colorToCat = { '#4fc3f7':'blue', '#a259e6':'violet', '#ffb6c1':'pink', '#ffb347':'orange', '#7fff7f':'green' };
const gunImgRight = new Image(); gunImgRight.src = 'https://coe-chat.vercel.app/royale/gun_facing_right.png';
const gunImgLeft = new Image(); gunImgLeft.src = 'https://coe-chat.vercel.app/royale/gun_facing_left.png';
const gunImgUp = new Image(); gunImgUp.src = 'https://coe-chat.vercel.app/royale/gun_facing_up.png';
const gunImgDown = new Image(); gunImgDown.src = 'https://coe-chat.vercel.app/royale/gun_facing_down.png';
const canvas = document.getElementById('game'); const ctx = canvas.getContext('2d'); canvas.width = 800; canvas.height = 600;
const bulletSpeed = 10, machineGunRate = 80, POWERUP_SPAWN_INTERVAL = 900, INVINCIBLE_DURATION = 5000;
/* -- Offline Logic -- */
function selectOfflineCatColor(playerNum, color) {
  document.getElementById('p'+playerNum+'color').value = color;
  for (const el of document.querySelectorAll('#p'+playerNum+'cat-select .cat-color')) el.classList.remove('selected');
  const elid = {"#ffb6c1":"p"+playerNum+"cat-pink", "#4fc3f7":"p"+playerNum+"cat-blue", "#a259e6":"p"+playerNum+"cat-purple", "#ffb347":"p"+playerNum+"cat-orange", "#7fff7f":"p"+playerNum+"cat-green"}[color];
  document.getElementById(elid).classList.add('selected');
}
selectOfflineCatColor(1, "#ffb6c1");
selectOfflineCatColor(2, "#4fc3f7");
function startOfflineGame() {
  players = [
    { x: canvas.width*3/4, y: canvas.height/2, radius: 25, speed: 4, angle: 0, color: document.getElementById('p1color').value, name: document.getElementById('p1name').value.trim()||'Player 1', health: 100, maxHealth: 100, xp:0, invincible:false, lastMoveDir:{x:-1,y:0} },
    { x: canvas.width/4, y: canvas.height/2, radius: 25, speed: 4, angle: 0, color: document.getElementById('p2color').value, name: document.getElementById('p2name').value.trim()||'Player 2', health: 100, maxHealth: 100, xp:0, invincible:false, lastMoveDir:{x:1,y:0} }
  ];
  bullets = []; winner = null; powerups = []; powerupTimer = 0; gameState = 'playing'; showScreen("game-panel"); requestAnimationFrame(gameLoop); setupInputHandlers(2);
}
function setupInputHandlers(numPlayers) {
  keys = {}; keySequence = ''; machineGunInterval = null;
  window.onkeydown = function(e) {
    const key = e.key.toLowerCase();
    if (!keys[key]) {
      keys[key] = true;
      keySequence += key;
      if (keySequence.length > cheatCode.length) keySequence = keySequence.slice(-cheatCode.length);
      if (keySequence === cheatCode) { winner = players[0].name; gameState = 'gameover'; showWinScreen(winner); }
      if (e.code == "KeyE" && !machineGunInterval) { fireBullet(0); machineGunInterval = setInterval(() => fireBullet(0), machineGunRate); }
      if (e.code == "KeyM" && !machineGunInterval) { fireBullet(1); machineGunInterval = setInterval(() => fireBullet(1), machineGunRate); }
    }
  };
  window.onkeyup = function(e) {
    const key = e.key.toLowerCase(); keys[key] = false;
    if (e.code == "KeyE" || e.code == "KeyM") { clearInterval(machineGunInterval); machineGunInterval = null; }
  };
  canvas.onmousemove = e => { const rect = canvas.getBoundingClientRect(); mouseX = e.clientX - rect.left; mouseY = e.clientY - rect.top; };
  canvas.onclick = function(e) { if (gameState == 'gameover') rematch(); };
}
/* -- Online Logic -- */
function startOnlineGame(isStart) {
  players = onlinePlayers.map((p,i) => ({
    x: canvas.width/2 + (i-1.5)*120, y: canvas.height/2, radius: 25, speed: 4, angle: 0,
    color: p.color, name: p.name, health: isStart ? 100 : (p.health ?? 100), maxHealth: 100, xp:0, invincible: isStart ? false : (p.invincible ?? false), lastMoveDir:{x:-1,y:0}, uid:p.uid
  }));
  bullets = []; winner = null; powerups = []; powerupTimer = 0; gameState = 'playing';
  gameStarted = true; // <-- Fix: set gameStarted true so processShootEvents runs
  showScreen("game-panel"); requestAnimationFrame(gameLoop); setupOnlineInputHandlers(players.length);
  setInterval(syncOnlineState, 33);
  db.ref('games/' + gameCode + '/cheatwinner').on('value', snap => { if (snap.val()) showWinScreen(snap.val()); });
}
function setupOnlineInputHandlers(numPlayers) {
  keys = {}; onlineHeldKeys = {}; keySequence = ''; machineGunInterval = null;
  window.onkeydown = function(e) {
    const key = e.key.toLowerCase();
    if (!onlineHeldKeys[key]) {
      onlineHeldKeys[key] = true;
      keySequence += key;
      if (keySequence.length > cheatCode.length) keySequence = keySequence.slice(-cheatCode.length);
      if (keySequence === cheatCode) { winner = myName; db.ref('games/' + gameCode + '/cheatwinner').set(myName); gameState = 'gameover'; showWinScreen(winner); }
      if (e.code == "KeyE" && !machineGunInterval) {
        db.ref('games/' + gameCode + '/events').push({type:"shoot",uid:myUID});
        machineGunInterval = setInterval(() => db.ref('games/' + gameCode + '/events').push({type:"shoot",uid:myUID}), machineGunRate);
      }
    }
  };
  window.onkeyup = function(e) {
    const key = e.key.toLowerCase(); onlineHeldKeys[key] = false;
    if (e.code == "KeyE") { clearInterval(machineGunInterval); machineGunInterval = null; }
  };
  canvas.onmousemove = e => { const rect = canvas.getBoundingClientRect(); mouseX = e.clientX - rect.left; mouseY = e.clientY - rect.top; };
  canvas.onclick = function(e) { if (gameState == 'gameover') rematch(); };
}
let lastProcessedEvent = {};
function processShootEvents() {
  if (!isCreator || !gameStarted) return;
  db.ref('games/' + gameCode + '/events').limitToLast(10).once('value', snap => {
    snap.forEach(ss => {
      const ev = ss.val();
      const key = ss.key;
      if (ev.type === "shoot" && !lastProcessedEvent[key]) {
        let idx = onlinePlayers.findIndex(p=>p.uid==ev.uid);
        if (idx !== -1) fireBullet(idx);
        lastProcessedEvent[key] = true;
      }
    });
    db.ref('games/' + gameCode + '/bullets').set(bullets);
  });
}
function sendMoveAndUpdateDB() {
  let idx = onlinePlayers.findIndex(p=>p.uid==myUID);
  if (idx==-1) return;
  let p = players[idx];
  if (onlineHeldKeys['w']) p.y -= p.speed, p.lastMoveDir = {x:0,y:-1};
  if (onlineHeldKeys['s']) p.y += p.speed, p.lastMoveDir = {x:0,y:1};
  if (onlineHeldKeys['a']) p.x -= p.speed, p.lastMoveDir = {x:-1,y:0};
  if (onlineHeldKeys['d']) p.x += p.speed, p.lastMoveDir = {x:1,y:0};
  for (const wall of walls) resolveCircleRectCollision(p, wall);
  p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y));
  p.angle = Math.atan2(p.lastMoveDir.y, p.lastMoveDir.x);
  db.ref('games/' + gameCode + '/players/' + myUID).update({
    x: p.x, y: p.y, lastMoveDir: p.lastMoveDir, angle: p.angle, color: myColor
  });
}
function fireBullet(ownerIdx) {
  const p = players[ownerIdx];
  const angle = Math.atan2(p.lastMoveDir.y, p.lastMoveDir.x);
  bullets.push({
    x: p.x + Math.cos(angle)*(p.radius+10),
    y: p.y + Math.sin(angle)*(p.radius+10),
    dx: Math.cos(angle)*bulletSpeed,
    dy: Math.sin(angle)*bulletSpeed,
    radius: 7,
    owner: ownerIdx
  });
}
function circleRectCollides(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx+rw));
  const closestY = Math.max(ry, Math.min(cy, ry+rh));
  const dx = cx-closestX, dy = cy-closestY;
  return (dx*dx+dy*dy)<(cr*cr);
}
function resolveCircleRectCollision(p, wall) {
  if (!circleRectCollides(p.x,p.y,p.radius,wall.x,wall.y,wall.w,wall.h)) return;
  const closestX = Math.max(wall.x, Math.min(p.x, wall.x+wall.w));
  const closestY = Math.max(wall.y, Math.min(p.y, wall.y+wall.h));
  let dx = p.x-closestX, dy=p.y-closestY;
  const dist = Math.sqrt(dx*dx+dy*dy)||1;
  const overlap = p.radius - dist + 0.1;
  if (overlap>0) { dx/=dist; dy/=dist; p.x+=dx*overlap; p.y+=dy*overlap; }
}
function getPlayerDamage(p) { return 4; }
function update() {
  if (gameState!=='playing'||winner) return;
  if (mode=="offline") {
    if (keys['w']) players[0].y -= players[0].speed, players[0].lastMoveDir = {x:0,y:-1};
    if (keys['s']) players[0].y += players[0].speed, players[0].lastMoveDir = {x:0,y:1};
    if (keys['a']) players[0].x -= players[0].speed, players[0].lastMoveDir = {x:-1,y:0};
    if (keys['d']) players[0].x += players[0].speed, players[0].lastMoveDir = {x:1,y:0};
    if (keys['arrowup']) players[1].y -= players[1].speed, players[1].lastMoveDir = {x:0,y:-1};
    if (keys['arrowdown']) players[1].y += players[1].speed, players[1].lastMoveDir = {x:0,y:1};
    if (keys['arrowleft']) players[1].x -= players[1].speed, players[1].lastMoveDir = {x:-1,y:0};
    if (keys['arrowright']) players[1].x += players[1].speed, players[1].lastMoveDir = {x:1,y:0};
    for (const wall of walls) {resolveCircleRectCollision(players[0], wall);resolveCircleRectCollision(players[1], wall);}
    players[0].x = Math.max(players[0].radius, Math.min(canvas.width-players[0].radius, players[0].x));
    players[0].y = Math.max(players[0].radius, Math.min(canvas.height-players[0].radius, players[0].y));
    players[1].x = Math.max(players[1].radius, Math.min(canvas.width-players[1].radius, players[1].x));
    players[1].y = Math.max(players[1].radius, Math.min(canvas.height-players[1].radius, players[1].y));
    players[0].angle=Math.atan2(players[0].lastMoveDir.y,players[0].lastMoveDir.x);
    players[1].angle=Math.atan2(players[1].lastMoveDir.y,players[1].lastMoveDir.x);

    // --- Bullet movement and collision for offline mode ---
    for (let i=bullets.length-1;i>=0;i--) {
      const b=bullets[i]; b.x+=b.dx; b.y+=b.dy;
      if (b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) { bullets.splice(i,1); continue; }
      let hitWall=false;
      for (const wall of walls) { if (circleRectCollides(b.x,b.y,b.radius,wall.x,wall.y,wall.w,wall.h)) { hitWall=true; break; } }
      if (hitWall) { bullets.splice(i,1); continue; }
      for (let j=0;j<players.length;j++) {
        if (b.owner!==j) {
          const dx=b.x-players[j].x, dy=b.y-players[j].y;
          if (Math.sqrt(dx*dx+dy*dy)<players[j].radius && !players[j].invincible && players[j].health>0) {
            players[j].health -= getPlayerDamage(players[b.owner]);
            bullets.splice(i,1); break;
          }
        }
      }
    }
    // --- end offline bullet logic ---
  } else {
    let idx = onlinePlayers.findIndex(p=>p.uid==myUID);
    if (idx==-1) return;
    let p = players[idx];
    if (onlineHeldKeys['w']) p.y -= p.speed, p.lastMoveDir = {x:0,y:-1};
    if (onlineHeldKeys['s']) p.y += p.speed, p.lastMoveDir = {x:0,y:1};
    if (onlineHeldKeys['a']) p.x -= p.speed, p.lastMoveDir = {x:-1,y:0};
    if (onlineHeldKeys['d']) p.x += p.speed, p.lastMoveDir = {x:1,y:0};
    for (const wall of walls) resolveCircleRectCollision(p, wall);
    p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y));
    p.angle = Math.atan2(p.lastMoveDir.y, p.lastMoveDir.x);
    // Only sync position, NOT health!
    db.ref('games/' + gameCode + '/players/' + myUID).update({
      x: p.x, y: p.y, lastMoveDir: p.lastMoveDir, angle: p.angle, color: myColor
    });
  }
  powerupTimer++;
  if (powerupTimer >= POWERUP_SPAWN_INTERVAL && powerups.filter(p=>p.active).length==0) {
    powerupTimer = 0;
    powerups.push({ x: Math.random()*(canvas.width-60)+30, y: Math.random()*(canvas.height-60)+30, radius: 18, active: true });
  }
  // --- Only the creator should process bullets and damage ---
  if (mode=="online" && isCreator) {
    for (let i=bullets.length-1;i>=0;i--) {
      const b=bullets[i]; b.x+=b.dx; b.y+=b.dy;
      if (b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) { bullets.splice(i,1); continue; }
      let hitWall=false;
      for (const wall of walls) { if (circleRectCollides(b.x,b.y,b.radius,wall.x,wall.y,wall.w,wall.h)) { hitWall=true; break; } }
      if (hitWall) { bullets.splice(i,1); continue; }
      for (let j=0;j<players.length;j++) {
        if (b.owner!==j) {
          const dx=b.x-players[j].x, dy=b.y-players[j].y;
          if (Math.sqrt(dx*dx+dy*dy)<players[j].radius && !players[j].invincible && players[j].health>0) {
            // Only the creator updates health in DB!
            players[j].health -= getPlayerDamage(players[b.owner]);
            db.ref('games/' + gameCode + '/players/' + players[j].uid).update({ 
              health: players[j].health,
              lastMoveDir: players[j].lastMoveDir,
              angle: players[j].angle
            });
            bullets.splice(i,1); break;
          }
        }
      }
    }
    db.ref('games/' + gameCode + '/bullets').set(bullets);
  }
  for (let i=powerups.length-1;i>=0;i--) {
    const pwr=powerups[i]; if (!pwr.active) continue;
    for (let j=0;j<players.length;j++) {
      if (Math.hypot(players[j].x-pwr.x,players[j].y-pwr.y)<players[j].radius+pwr.radius) {
        pwr.active = false;
        players[j].invincible = true;
        clearTimeout(invincibleTimeouts[j]);
        invincibleTimeouts[j]=setTimeout(()=>players[j].invincible=false,INVINCIBLE_DURATION);
        db.ref('games/' + gameCode + '/players/' + players[j].uid).update({ invincible: true });
      }
    }
  }
  powerups = powerups.filter(p=>p.active);
  for (let j=0;j<players.length;j++) players[j].health = Math.max(0,players[j].health);
  let living = players.filter(p=>p.health>0);
  if (living.length==1) {
    winner = living[0].name;
    gameState = 'gameover';
    if (mode=="online") db.ref('games/' + gameCode + '/winner').set(winner);
    showWinScreen(winner);
  }
}
function syncOnlineState() {
  let idx = onlinePlayers.findIndex(p=>p.uid==myUID);
  if (idx==-1) return;
  // Only update position, NOT health!
  db.ref('games/' + gameCode + '/players/' + myUID).update({
    x: players[idx].x, y: players[idx].y,
    lastMoveDir: players[idx].lastMoveDir,
    angle: players[idx].angle,
    color: myColor, name: myName, uid: myUID,
    invincible: players[idx].invincible
  });
  db.ref('games/' + gameCode + '/bullets').once('value').then(snap=>{bullets = snap.val()||[];});
  db.ref('games/' + gameCode + '/players').once('value').then(snap=>{
    const pl = snap.val(); if (!pl) return;
    onlinePlayers = Object.values(pl);
    for (let i=0;i<onlinePlayers.length;i++) {
      if (typeof players[i]!=='object') continue;
      players[i].x = onlinePlayers[i].x??players[i].x;
      players[i].y = onlinePlayers[i].y??players[i].y;
      players[i].health = onlinePlayers[i].health??players[i].health; // health always comes from DB!
      players[i].invincible = onlinePlayers[i].invincible??players[i].invincible;
      players[i].lastMoveDir = onlinePlayers[i].lastMoveDir??players[i].lastMoveDir;
      players[i].angle = onlinePlayers[i].angle??players[i].angle;
      players[i].color = onlinePlayers[i].color??players[i].color;
      players[i].name = onlinePlayers[i].name??players[i].name;
      players[i].uid = onlinePlayers[i].uid??players[i].uid;
    }
  });
  db.ref('games/' + gameCode + '/powerups').once('value').then(snap=>{powerups = snap.val()||[];});
}
// Responsive canvas and end screen
function resizeGameArea() {
  const panel = document.getElementById('game-panel');
  const canvas = document.getElementById('game');
  let w = Math.min(window.innerWidth * 0.98, 900);
  let h = Math.min(window.innerHeight * 0.82, 700);
  // Maintain aspect ratio 4:3
  if (w / h > 4/3) w = h * 4/3;
  else h = w * 3/4;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  panel.style.maxWidth = w + 'px';
  panel.style.width = '100%';
  // End screen
  const deathScreen = document.getElementById('deathScreen');
  deathScreen.style.width = window.innerWidth + 'px';
  deathScreen.style.height = window.innerHeight + 'px';
}
window.addEventListener('resize', resizeGameArea);

// Call resize on game start and end screen show
function showScreen(id) {
  for (const el of document.querySelectorAll('.screen')) el.classList.remove('active');
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.getElementById("game-panel").classList.toggle('hide', id !== "game-panel");
  document.getElementById("deathScreen").style.display = "none";
  window.scrollTo(0,0);
  resizeGameArea();
}

function showWinScreen(name) {
  document.getElementById("winnerText").innerText = `${name} won!`;
  document.getElementById("deathScreen").style.display = "flex";
  resizeGameArea();
}

function drawPlayer(p,i) {
  ctx.save();
  const catKey = colorToCat[p.color]||'pink';
  const img = catImages[catKey];
  const drawW=56, drawH=74;
  if (img.complete&&img.naturalWidth>0) ctx.drawImage(img,p.x-drawW/2,p.y-drawH/2,drawW,drawH);
  else { ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fillStyle = p.color; ctx.fill(); }
  let angle = p.angle; angle = (angle+2*Math.PI)%(2*Math.PI);
  let gunImg,gunAngle=0,offsetX=0,offsetY=0,gunOffset=36;
  if ((angle<Math.PI/4)||(angle>=7*Math.PI/4)) {gunImg=gunImgRight;gunAngle=0;offsetX=gunOffset;}
  else if (angle>=Math.PI/4&&angle<3*Math.PI/4) {gunImg=gunImgDown;gunAngle=Math.PI/2;offsetY=gunOffset;}
  else if (angle>=3*Math.PI/4&&angle<5*Math.PI/4) {gunImg=gunImgLeft;gunAngle=Math.PI;offsetX=-gunOffset;}
  else {gunImg=gunImgUp;gunAngle=-Math.PI/2;offsetY=-gunOffset;}
  if (gunImg.complete&&gunImg.naturalWidth>0) {
    ctx.save(); ctx.translate(p.x+offsetX, p.y+offsetY); ctx.rotate(gunAngle-p.angle); ctx.drawImage(gunImg,-8,-8,32,32); ctx.restore();
  }
  ctx.restore();
}
function drawBullets() { ctx.save(); for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x,b.y,b.radius,0,Math.PI*2); ctx.fillStyle = players[b.owner]?.color||"#fff"; ctx.globalAlpha=0.98; ctx.fill(); ctx.globalAlpha=1; } ctx.restore(); }
function drawPowerups() { ctx.save(); for (const pwr of powerups) { if (!pwr.active) continue; ctx.beginPath(); ctx.arc(pwr.x,pwr.y,pwr.radius,0,Math.PI*2); ctx.fillStyle = "#00ffea"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0; ctx.font = 'bold 20px Geologica'; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText("★",pwr.x,pwr.y+8); } ctx.restore(); }
function drawWalls() { ctx.save(); ctx.fillStyle="#888"; for (const wall of walls) ctx.fillRect(wall.x,wall.y,wall.w,wall.h); ctx.restore(); }
function getContrastYIQ(hexcolor) { hexcolor = hexcolor.replace('#',''); if (hexcolor.length===3) hexcolor=hexcolor[0]+hexcolor[0]+hexcolor[1]+hexcolor[1]+hexcolor[2]+hexcolor[2]; const r=parseInt(hexcolor.substr(0,2),16),g=parseInt(hexcolor.substr(2,2),16),b=parseInt(hexcolor.substr(4,2),16); const yiq=((r*299)+(g*587)+(b*114))/1000; return (yiq>=128)?'#222':'#fff'; }
function drawHealthBars() { ctx.save(); for (let i=0;i<players.length;i++) { const p=players[i]; let x=i<2?20:canvas.width-220, y=20+i*30; ctx.fillStyle="#222"; ctx.fillRect(x,y,200,20); ctx.fillStyle = p.color; ctx.fillRect(x,y,200*(p.health/p.maxHealth),20); ctx.strokeStyle="#fff"; ctx.strokeRect(x,y,200,20); ctx.font='16px Geologica'; ctx.fillStyle=getContrastYIQ(p.color); ctx.fillText(p.name,x+5,y+16); } ctx.restore(); }
function drawXPBars() { ctx.save(); for (let i=0;i<players.length;i++) { const p=players[i]; let x=i<2?20:canvas.width-220, y=44+i*30; ctx.fillStyle='#444'; ctx.fillRect(x,y,200,10); ctx.fillStyle='#ffd700'; ctx.fillRect(x,y,Math.min(200,p.xp*2),10); ctx.strokeStyle='#fff'; ctx.strokeRect(x,y,200,10); } ctx.restore(); }
function gameLoop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (gameState=='playing') {
    update();
    drawWalls();
    for (let i=0;i<players.length;i++) drawPlayer(players[i],i);
    drawBullets();
    drawPowerups();
    drawHealthBars();
    drawXPBars();
    if (mode=="online" && isCreator) processShootEvents();
    if (!winner) requestAnimationFrame(gameLoop);
  }
}
// Ensure initial resize
resizeGameArea();
showScreen("ss1-mode-select");
