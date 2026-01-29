// v.1.5.7
function showStartScreen(type) {
  gameType = type;
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("start-screen").style.display = "flex";
  document.getElementById("start-desc").textContent = type === "countries" ?
    "Select a difficulty for Countries mode:" : "Select a difficulty for Cities mode:";
  document.getElementById("easy-btn");
  document.getElementById("medium-btn");
  document.getElementById("normal-btn");
  document.getElementById("hard-btn");
  document.getElementById("extreme-btn")
}

function showInstructions() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("instructions-overlay").style.display = "flex";
}

function closeInstructions() {
  document.getElementById("instructions-overlay").style.display = "none";
  document.getElementById("main-menu").style.display = "flex";
}

function showCredits() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("credits-overlay").style.display = "flex";
}

function closeCredits() {
  document.getElementById("credits-overlay").style.display = "none";
  document.getElementById("main-menu").style.display = "flex";
}
// Flags mode UI helpers
function showFlagsStart() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('flags-start-screen').style.display = 'flex';
  // hide map and controls while in flags UI
  document.getElementById('map').style.display = 'none';
  document.getElementById('controls').style.display = 'none';
}

function backToMainFromFlags() {
  document.getElementById('flags-start-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
  // restore map and controls
  document.getElementById('map').style.display = '';
  document.getElementById('controls').style.display = '';
}

function backToFlagsStart() {
  document.getElementById('flags-continent-screen').style.display = 'none';
  document.getElementById('flags-start-screen').style.display = 'flex';
}

function showFlagsContinentSelect(mode) {
  flagsGameMode = mode;
  document.getElementById('flags-start-screen').style.display = 'none';
  document.getElementById('flags-continent-screen').style.display = 'flex';
  document.getElementById('flags-subtitle').textContent = mode === 'flag-to-country' ? 'Assign flag to country' : 'Assign country to flag';
  // build continent buttons
  const container = document.getElementById('flags-continent-buttons');
  container.innerHTML = '';
  const continents = ['all', 'africa', 'asia', 'europe', 'north-america', 'south-america', 'oceania', 'antarctica'];
  continents.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c === 'all' ? 'All' : capitalizeWords(c.replace(/-/g, ' '));
    btn.onclick = () => {
      startFlagsGame(c);
    };
    container.appendChild(btn);
  });
}

// Timed mode UI handlers
function showTimedMode() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('timed-mode-screen').style.display = 'flex';
}

function closeTimedMode() {
  document.getElementById('timed-mode-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
}
