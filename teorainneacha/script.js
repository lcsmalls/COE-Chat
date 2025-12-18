// Hardcode the version of the current instance here
const CURRENT_VERSION = "1.4.7"; 

// Wrap initialization in DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    // 1. Run the check immediately on page start
    checkForUpdates();

    // 2. Set the recurring interval (5 minutes = 300,000ms)
    setInterval(checkForUpdates, 300000);
});

async function checkForUpdates() {
    try {
        // Fetch version.json with a cache-busting timestamp
        const response = await fetch(`https://teorainneacha.vercel.app/version.json?v=${new Date().getTime()}`);
        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data.version;

        // Compare server version to current instance
        if (serverVersion !== CURRENT_VERSION) {
            showUpdatePopup();
        }
    } catch (error) {
        console.error("Update check failed:", error);
    }
}

function showUpdatePopup() {
    // Prevent duplicate banners
    if (document.getElementById('update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `      
      position: fixed;
      top: 20px;
      right: 20px;
      background: #222;
      color: #fff;
      padding: 20px; /* Increased padding slightly for the round corners */
      border-radius: 25px; /* Slightly smaller radius for better space efficiency */
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      font-family: 'Geologica', sans-serif;
      max-width: 300px; /* Prevents it from stretching too wide */
    `;
    
    banner.innerHTML = `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.4;">
        A new version of Teorainneacha is available. Any issues you may have encountered may have been fixed.
      </p>
      <div style="display: flex; gap: 15px; align-items: center; justify-content: flex-start;">
        <button onclick="window.location.reload()" style="
            font-family: 'Geologica', sans-serif; 
            background: #007acc; 
            color: white; 
            border: none; 
            padding: 8px 20px; 
            border-radius: 35px; 
            cursor: pointer; 
            font-weight: bold; 
            min-width: 100px; /* Fixed the syntax here */
            white-space: nowrap;">
            Reload
        </button>
        <button onclick="document.getElementById('update-banner').remove()" style="
            font-family: 'Geologica', sans-serif; 
            background: none; 
            color: #007acc; 
            border: none; 
            cursor: pointer; 
            text-decoration: underline; 
            font-size: 13px;
            white-space: nowrap;">
            Dismiss
        </button>
      </div>
    `;
    document.body.appendChild(banner);
}




// Splash screen logic with simulated loader and milestones
window.addEventListener('DOMContentLoaded', function() {
  const splash = document.getElementById('splash-screen');
  const logo = document.getElementById('splash-logo');
  const progressInner = document.getElementById('splash-progress-inner');
  // percent and status elements (created in markup)
  const percentEl = document.getElementById('splash-percent');
  const statusEl = document.getElementById('splash-status');
  splash.style.opacity = '1';
  logo.style.opacity = '0';
  setTimeout(() => {
    logo.style.opacity = '1';
  }, 300);
  // Milestones to display during the fake load (percent triggers)
  const milestones = [{
      pct: 3,
      text: 'Loading Fonts'
    },
    {
      pct: 6,
      text: 'Loaded Fonts'
    },
    {
      pct: 18,
      text: 'Initialized projection (d3)'
    },
    {
      pct: 30,
      text: 'Loaded country list (restcountries)'
    },
    {
      pct: 44,
      text: 'Loaded topojson/world-atlas'
    },
    {
      pct: 56,
      text: 'Prepared flags dataset'
    },
    {
      pct: 68,
      text: 'Loaded assets (icons & images)'
    },
    {
      pct: 78,
      text: 'Wired handlers (Countries Mode)'
    },
    {
      pct: 82,
      text: 'Wired handlers (Cities Mode)'
    },
    {
      pct: 84,
      text: 'Wired handlers (Flags mode)'
    },
    {
      pct: 90,
      text: 'Built Quizes'
    },
    {
      pct: 94,
      text: 'Finalising.'
    },
    {
      pct: 95,
      text: 'Finalising..'
    },
    {
      pct: 96,
      text: 'Finalising...'
    },
    {
      pct: 97,
      text: 'Finalising.'
    },
    {
      pct: 98,
      text: 'Finalising..'
    },
    {
      pct: 99,
      text: 'Finalising...'
    },
    {
      pct: 100,
      text: 'Ready'
    }
  ];
  let pct = 0;
  let milestoneIndex = 0;
  const totalDuration = 4200; // ms - visual length of the fake load
  const start = Date.now();
  // Use an interval to simulate progress with slight random stalls for realism
  const tickInterval = 60; // ms
  const interval = setInterval(() => {
    const elapsed = Date.now() - start;
    const t = Math.min(1, elapsed / totalDuration);
    // ease-out cubic for smoother finish
    let target = Math.floor(100 * (1 - Math.pow(1 - t, 3)));
    // introduce occasional tiny backward stalls/jitter for realism
    if (Math.random() < 0.04) target = Math.max(0, target - Math.floor(Math.random() * 3));
    // slow down near certain ranges to create pauses
    if (target > 40 && target < 50) target = Math.min(28, target);
    if (target > 64 && target < 70) target = Math.min(66, target);
    if (target > pct) pct = target;
    if (pct > 100) pct = 100;
    // update UI
    progressInner.style.width = pct + '%';
    if (percentEl) percentEl.textContent = pct + '%';
    // milestone messages
    while (milestoneIndex < milestones.length && pct >= milestones[milestoneIndex].pct) {
      const m = milestones[milestoneIndex];
      if (statusEl) statusEl.textContent = m.text;
      milestoneIndex++;
    }
    // finish
    if (pct >= 100 || elapsed > totalDuration + 800) {
      clearInterval(interval);
      // final flash and hide
      setTimeout(() => {
        logo.style.opacity = '0';
        splash.style.opacity = '0';
      }, 200);
      setTimeout(() => {
        splash.style.display = 'none';
        const main = document.getElementById('main-menu');
        if (main) {
          main.style.opacity = '0';
          main.style.display = 'flex';
          setTimeout(() => {
            main.style.opacity = '1';
          }, 100);
        }
      }, 600);
    }
  }, tickInterval);
});
let countriesData = [];
let features = [];
let projection;
let path;
let svg;
let mapGroup;
let round = 1;
let currentContinent = "";
let currentLetter = "";
let currentCountry = null;
let revealedCountries = new Set();
let nameIndex = new Map();
let skippedCountries = [];
let lastPromptLetter = null;
let featureByCCA3 = new Map();
let featureByName = new Map();
let wrongGuesses = 0;
let gameMode = "Normal";
let gameType = "countries";
let startTime = null;
let elapsed = 0;
let timerInterval = null;
let paused = false;
const continentOrder = ["Europe", "Oceania", "Americas", "Asia", "Africa", "Antarctic"];
let noregdip = 0;
// Cities mode data
let capitalsData = [];
let capitalsByCountry = new Map();
let revealedCapitals = new Set();
let capitalDots = [];
let capitalsIndex = new Map();
let capitalsOrder = [];
// Flags game data and state
let flagsDataByContinent = {};
let flagsAllList = [];
let flagsGameMode = null; // 'flag-to-country' or 'country-to-flag'
let flagsContinent = 'all';
let flagsQuestionIndex = 0;
let flagsQuestionList = [];
let flagsCurrentQuestion = null;
// Improved manual mapping for problematic countries
const manualFeatureMap = {
  northmacedonia: "MKD",
  southsudan: "SSD",
  democraticrepublicofthecongo: "COD",
  centralafricanrepublic: "CAF",
  republicofthecongo: "COG",
  unitedstates: "USA",
  stvincentandthegrenadines: "VCT",
  bosniaandherzegovina: "BIH",
  puertorico: "PRI",
  papuanewguinea: "PNG",
  libya: "LBY",
  dominicanrepublic: "DOM",
  "sãotoméandpríncipe": "STP",
  "sao tome and principe": "STP",
  "sao tome": "STP",
  "são tomé": "STP",
  "são tomé e príncipe": "STP",
  "sao tome e principe": "STP",
  svalbard: "SJM",
  "svalbardandjanmayen": "SJM",
  "svalbard and jan mayen": "SJM",
  "janmayen": "SJM",
  "jan mayen": "SJM",
  "ivorycoast": "CIV",
  "cotedivoire": "CIV",
  "capeverde": "CPV",
  "equatorialguinea": "GNQ",
  "northerncyprus": "CYN",
  "turkishcyprus": "CYN",
  "somaliland": "SOL",
  "faroeislands": "FRO",
  "faroe islands": "FRO",
  "faroes": "FRO",
  "alandislands": "ALA",
  "ålandislands": "ALA",
  "aland": "ALA",
  "åland": "ALA"
};
// TopoJSON id mapping for problematic countries
const topoIdMap = {
  "COD": "180",
  "SSD": "728",
  "EQG": "226",
  "ESH": "732",
  "STP": "678",
  "CPV": "132",
  "GNQ": "226",
  "FRO": "234", // Faroe Islands (ISO 3166-1 numeric: 234)
  "ALA": "248" // Åland Islands (ISO 3166-1 numeric: 248)
}

function normalizeName(s) {
  return (s || "").toLowerCase().replace(/[^a-z]+/g, '');
}

function showMessage(text, icon = 'info') {
  const modal = document.getElementById("message-modal");
  modal.innerHTML = `<span class="material-symbols-rounded">${icon}</span><span>${text}</span>`;
  modal.style.opacity = "1";
  modal.style.display = "flex";
  modal.setAttribute('aria-hidden', 'false');
  let color = '';
  let duration = 2000;
  if (icon === 'correct') {
    color = '#0f992f';
    duration = 1000;
  } else if (icon === 'continent') {
    color = '#0f992f';
    duration = 3000;
  }
  if (color) modal.style.background = color;
  else modal.style.background = 'rgba(20,20,20,0.98)';
  if (modal._hideTimeout) clearTimeout(modal._hideTimeout);
  modal._hideTimeout = setTimeout(() => {
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
      modal.setAttribute('aria-hidden', 'true');
      modal.style.background = 'rgba(20,20,20,0.98)';
    }, 200);
  }, duration);
}

function levenshtein(a, b) {
  a = a || '';
  b = b || '';
  const n = a.length,
    m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  let prev = new Array(m + 1);
  let cur = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    cur[0] = i;
    const ai = a.charAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const cost = ai === b.charAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    const tmp = prev;
    prev = cur;
    cur = tmp;
  }
  return prev[m];
}
async function init() {
  svg = d3.select("#map");
  const width = window.innerWidth;
  const height = window.innerHeight * 0.7;
  svg.attr("width", width).attr("height", height);
  // Use Van der Grinten projection
  projection = d3.geoWinkel3()
    .scale(Math.min(width / 6, height / 3.2))
    .translate([width / 2, height / 2])
    .precision(0.1);
  path = d3.geoPath().projection(projection);
  mapGroup = svg.append("g").attr("class", "map-content");
  svg.call(d3.zoom().scaleExtent([1, 4000]).on("zoom", event => {
    mapGroup.attr("transform", event.transform);
  }));
  const rc = await fetch('https://restcountries.com/v3.1/all?fields=cca2,cca3,name,region,altSpellings').then(r => r.json());
  rc.forEach(c => {
    const cca3 = c.cca3 || "",
      cca2 = c.cca2 || "",
      common = c.name.common,
      region = c.region || "Other";
    const aliases = new Set([common, c.name.official, ...(c.altSpellings || [])]);
    if (common === "São Tomé and Príncipe") aliases.add("Sao Tome and Principe");
    if (common === "Democratic Republic of the Congo") aliases.add("DR Congo");
    if (common === "Central African Republic") aliases.add("CAR");
    if (common === "Dominican Republic") aliases.add("Dom. Rep.");
    if (common === "Republic of the Congo") aliases.add("Congo");
    if (common === "Ivory Coast") aliases.add("Côte d'Ivoire");
    if (common === "East Timor") aliases.add("Timor-Leste");
    if (common === "Vatican City") aliases.add("Holy See");
    if (common === "Myanmar") aliases.add("Burma");
    if (common === "Eswatini") aliases.add("Swaziland");
    if (common === "Palestine") aliases.add("Palestinian Territories");
    const rec = {
      name: common,
      cca2,
      cca3,
      region,
      aliases: [...aliases]
    };
    countriesData.push(rec);
    rec.aliases.forEach(a => nameIndex.set(normalizeName(a), rec));
  });
  let topoJSONLink = 'https://unpkg.com/world-atlas@2/countries-50m.json';
  const topo = await fetch(topoJSONLink).then(r => r.json());
  const objKey = Object.keys(topo.objects)[0];
  features = topojson.feature(topo, topo.objects[objKey]).features;
  features.forEach(f => {
    const props = f.properties || {};
    const iso = props.iso_a3 || props.ISO_A3 || props.ADM0_A3 || "";
    const pname = props.name || props.NAME || props.ADMIN || "";
    if (iso) featureByCCA3.set(iso, f);
    if (pname) featureByName.set(normalizeName(pname), f);
  });
  projection.fitSize([width, height], {
    type: "FeatureCollection",
    features: features
  });
  mapGroup.selectAll("path").data(features).join("path").attr("d", path).attr("class", "country");
  document.getElementById("main-menu").style.display = "flex";
  document.getElementById("start-screen").style.display = "none";
  const capitalsRaw = await fetch('https://restcountries.com/v3.1/all?fields=cca2,cca3,name,region,capital,capitalInfo').then(r => r.json());
  capitalsData = [];
  capitalsByCountry.clear();
  capitalsIndex.clear();
  capitalsOrder = [];
  capitalsRaw.forEach(c => {
    if (!c.capital || !c.capital.length || !c.capitalInfo || !c.capitalInfo.latlng) return;
    const cca3 = c.cca3 || "",
      cca2 = c.cca2 || "",
      common = c.name.common,
      region = c.region || "Other";
    const capital = c.capital[0],
      latlng = c.capitalInfo.latlng;
    const rec = {
      country: common,
      cca2,
      cca3,
      region,
      capital,
      latlng
    };
    capitalsData.push(rec);
    capitalsByCountry.set(common, rec);
    capitalsIndex.set(normalizeName(capital), rec);
  });
  capitalsOrder = continentOrder.flatMap(cont =>
    capitalsData.filter(c => c.region === cont).sort((a, b) => a.country.localeCompare(b.country))
  );
}

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
// Unicode-aware capitalize: handles characters like Å correctly
function capitalizeWords(s) {
  if (!s) return '';
  return s.split(' ').map(w => {
    if (!w) return w;
    return w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase();
  }).join(' ');
}
async function ensureFlagsData() {
  if (flagsAllList.length) return;
  try {
    const resp = await fetch('https://teorainneacha.vercel.app/bratai/countries.json');
    const json = await resp.json();
    flagsDataByContinent = json;
    flagsAllList = Object.values(json).flat();
  } catch (err) {
    console.error('Failed to load flags dataset', err);
    showMessage('Failed to load flags data', 'error');
  }
}

function startFlagsGame(continent) {
  flagsContinent = continent;
  document.getElementById('flags-continent-screen').style.display = 'none';
  document.getElementById('flags-game-screen').style.display = 'block';
  // ensure map/controls are hidden
  document.getElementById('map').style.display = 'none';
  document.getElementById('controls').style.display = 'none';
  document.getElementById('flags-visual').innerHTML = '';
  document.getElementById('flags-options').innerHTML = '';
  flagsQuestionIndex = 0;
  flagsQuestionList = [];
  flagsCorrect = 0;
  flagsWrong = 0;
  flagsElapsed = 0;
  ensureFlagsData().then(() => {
    let pool = flagsContinent === 'all' ? flagsAllList.slice() : (flagsDataByContinent[flagsContinent] || []).slice();
    // normalize pool to unique entries
    pool = pool.filter(Boolean);
    // Build questions as array of country keys
    flagsQuestionList = shuffle(pool.slice());
    // update round display
    document.getElementById('flags-round').textContent = `Round 0/${flagsQuestionList.length}`;
    // start flags timer
    startFlagsTimer();
    nextFlagQuestion();
  });
}

function endFlagsGame() {
  document.getElementById('flags-game-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
  // restore map and controls
  document.getElementById('map').style.display = '';
  document.getElementById('controls').style.display = '';
  // stop flags timer
  if (flagsTimerInterval) {
    clearInterval(flagsTimerInterval);
    flagsTimerInterval = null;
  }
  // show results in the results screen
  const total = (flagsCorrect || 0) + (flagsWrong || 0);
  const percent = total > 0 ? (((flagsCorrect || 0) / total) * 100).toFixed(1) : 100;
  const minutes = Math.floor((flagsElapsed || 0) / 60000);
  const seconds = Math.floor(((flagsElapsed || 0) / 1000) % 60).toString().padStart(2, '0');
  document.getElementById('results-text').innerHTML = `
      <div>Flags Game Over (${flagsGameMode === 'flag-to-country' ? 'Assign flag to country' : 'Assign country to flag'})</div>
      <div>Time: ${minutes}:${seconds}</div>
      <div>Wrong Attempts: ${flagsWrong||0}</div>
      <div>Accuracy: ${percent}%</div>`;
  document.getElementById('results-screen').style.display = 'flex';
}

function nextFlagQuestion() {
  document.getElementById('flags-next-btn').style.display = 'none';
  document.getElementById('flags-options').innerHTML = '';
  if (flagsQuestionIndex >= flagsQuestionList.length) {
    showMessage('Flags game completed!', 'correct');
    endFlagsGame();
    return;
  }
  const key = flagsQuestionList[flagsQuestionIndex];
  flagsCurrentQuestion = key;
  const pretty = capitalizeWords(key.replace(/-/g, ' '));
  // update round display
  document.getElementById('flags-round').textContent = `Round ${Math.min(flagsQuestionIndex+1, flagsQuestionList.length)}/${flagsQuestionList.length}`;
  if (flagsGameMode === 'flag-to-country') {
    document.getElementById('flags-prompt').textContent = 'Which country does this flag belong to?';
    // show flag image
    const img = document.createElement('img');
    img.src = `https://teorainneacha.vercel.app/bratai/${key}.svg`;
    img.alt = pretty + ' flag';
    img.style.width = '240px';
    img.style.height = '160px';
    img.style.objectFit = 'contain';
    const visual = document.getElementById('flags-visual');
    visual.innerHTML = '';
    visual.appendChild(img);
    // options: one correct country name + 3 random wrong names
    const pool = (flagsContinent === 'all' ? flagsAllList : (flagsDataByContinent[flagsContinent] || [])).filter(k => k !== key);
    const wrong = sample(pool, 3).map(k => capitalizeWords(k.replace(/-/g, ' ')));
    const options = shuffle([capitalizeWords(key.replace(/-/g, ' ')), ...wrong]);
    renderFlagOptions(options, 'text', key);
  } else {
    // country-to-flag
    document.getElementById('flags-prompt').textContent = `What is the flag of ${pretty}?`;
    const visual = document.getElementById('flags-visual');
    visual.innerHTML = '';
    // options: one correct flag + 3 wrong flags
    const pool = (flagsContinent === 'all' ? flagsAllList : (flagsDataByContinent[flagsContinent] || [])).filter(k => k !== key);
    const wrong = sample(pool, 3);
    const options = shuffle([key, ...wrong]);
    renderFlagOptions(options, 'image', key);
  }
}

function renderFlagOptions(options, mode, correctKey) {
  const container = document.getElementById('flags-options');
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.style.width = 'auto';
    btn.style.height = 'auto';
    btn.style.minWidth = '160px';
    btn.style.minHeight = '60px';
    btn.style.padding = '8px';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.setAttribute('data-opt', opt);
    if (mode === 'text') {
      btn.textContent = opt;
    } else {
      const img = document.createElement('img');
      img.src = `https://teorainneacha.vercel.app/bratai/${opt}.svg`;
      img.alt = opt;
      img.style.width = '120px';
      img.style.height = '80px';
      img.style.objectFit = 'contain';
      // on error, remove the broken image and show the prettified country name as fallback
      img.onerror = function() {
        img.remove();
        const fallback = document.createElement('div');
        fallback.className = 'flag-fallback';
        fallback.textContent = capitalizeWords(opt.replace(/-/g, ' '));
        fallback.style.display = 'block';
        btn.appendChild(fallback);
      };
      btn.appendChild(img);
    }
    btn.onclick = () => {
      handleFlagSelection(btn, opt, correctKey, mode);
    };
    container.appendChild(btn);
  });
}

function handleFlagSelection(btn, opt, correctKey, mode) {
  // If game is paused (either global or flags), ignore input
  if (paused || flagsPaused) return;
  // Disable further clicks for this question
  Array.from(document.getElementById('flags-options').children).forEach(b => b.disabled = true);
  const pickedKey = mode === 'text' ? opt.replace(/\b\w/g, ch => ch.toLowerCase()) : opt; // for image mode opt is key
  const correctPretty = capitalizeWords(correctKey.replace(/-/g, ' '));
  if ((mode === 'text' && opt.toLowerCase() === capitalizeWords(correctKey.replace(/-/g, ' ')).toLowerCase()) || opt === correctKey) {
    // correct
    btn.style.outline = '4px solid #0f992f';
    showMessage('Correct!', 'check');
    // update counters if flags mode
    flagsCorrect = (typeof flagsCorrect === 'number') ? flagsCorrect + 1 : 1;
    // auto-advance after a short delay
    setTimeout(() => {
      nextFlagQuestion();
    }, 700);
  } else {
    // wrong: highlight picked red and highlight correct green
    btn.style.outline = '4px solid #e53935';
    // find correct button
    const children = Array.from(document.getElementById('flags-options').children);
    children.forEach(b => {
      const data = b.getAttribute('data-opt');
      if (mode === 'text') {
        if (data.toLowerCase() === capitalizeWords(correctKey.replace(/-/g, ' ')).toLowerCase()) {
          b.style.outline = '4px solid #0f992f';
        }
      } else {
        if (data === correctKey) b.style.outline = '4px solid #0f992f';
      }
    });
    // Learning message: tell user what their picked flag/country actually is
    if (mode === 'text') {
      // They clicked a country name; show which country that name is
      const pickedPretty = opt;
      showMessage(`The answer you picked is the country: ${pickedPretty}. Correct answer: ${correctPretty}`, 'error');
    } else {
      // They clicked a flag; say which country that flag belongs to
      const pickedKeyNorm = opt;
      const pickedPretty = capitalizeWords(pickedKeyNorm.replace(/-/g, ' '));
      showMessage(`The answer you picked is the flag of ${pickedPretty}. Correct answer: ${correctPretty}`, 'error');
    }
    document.getElementById('flags-next-btn').style.display = 'flex';
    flagsWrong = (typeof flagsWrong === 'number') ? flagsWrong + 1 : 1;
  }
  flagsQuestionIndex++;
}
// small helpers
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sample(arr, n) {
  const copy = arr.slice();
  shuffle(copy);
  return copy.slice(0, n);
}
document.getElementById("pause-mainmenu-btn").addEventListener("click", () => {
  clearInterval(timerInterval);
  paused = false;
  elapsed = 0;
  round = 1;
  noregdip = 0;
  wrongGuesses = 0;
  revealedCountries.clear();
  revealedCapitals.clear();
  mapGroup.selectAll("image").remove();
  mapGroup.selectAll("path.country").classed("revealed", false).attr("fill", null);
  capitalDots.forEach(dot => dot.remove());
  capitalDots = [];
  // flags cleanup if necessary
  if (flagsTimerInterval) {
    clearInterval(flagsTimerInterval);
    flagsTimerInterval = null;
  }
  flagsPaused = false;
  flagsQuestionIndex = 0;
  flagsQuestionList = [];
  document.getElementById('flags-game-screen').style.display = 'none';
  document.getElementById('flags-continent-screen').style.display = 'none';
  document.getElementById('flags-start-screen').style.display = 'none';
  document.getElementById("pause-overlay").style.display = "none";
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("main-menu").style.display = "flex";
});
document.getElementById("startscreen-mainmenu-btn").addEventListener("click", () => {
  clearInterval(timerInterval);
  paused = false;
  elapsed = 0;
  round = 1;
  noregdip = 0;
  wrongGuesses = 0;
  revealedCountries.clear();
  revealedCapitals.clear();
  mapGroup.selectAll("image").remove();
  mapGroup.selectAll("path.country").classed("revealed", false).attr("fill", null);
  capitalDots.forEach(dot => dot.remove());
  capitalDots = [];
  // flags cleanup if necessary
  if (flagsTimerInterval) {
    clearInterval(flagsTimerInterval);
    flagsTimerInterval = null;
  }
  flagsPaused = false;
  flagsQuestionIndex = 0;
  flagsQuestionList = [];
  document.getElementById('flags-game-screen').style.display = 'none';
  document.getElementById('flags-continent-screen').style.display = 'none';
  document.getElementById('flags-start-screen').style.display = 'none';
  document.getElementById("pause-overlay").style.display = "none";
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("main-menu").style.display = "flex";
});
document.getElementById("results-mainmenu-btn").addEventListener("click", () => {
  clearInterval(timerInterval);
  paused = false;
  elapsed = 0;
  round = 1;
  noregdip = 0;
  wrongGuesses = 0;
  revealedCountries.clear();
  revealedCapitals.clear();
  mapGroup.selectAll("image").remove();
  mapGroup.selectAll("path.country").classed("revealed", false).attr("fill", null);
  capitalDots.forEach(dot => dot.remove());
  capitalDots = [];
  document.getElementById("pause-overlay").style.display = "none";
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("main-menu").style.display = "flex";
});

function startGame(mode) {
  gameMode = mode;
  document.getElementById("start-screen").style.display = "none";
  round = 1;
  noregdip = 0;
  wrongGuesses = 0;
  revealedCountries.clear();
  revealedCapitals.clear();
  capitalDots.forEach(dot => dot.remove());
  capitalDots = [];
  if (gameType === "countries") {
    startTimer();
    nextRound();
  } else {
    mapGroup.selectAll("path.country").classed("revealed", true);
    capitalsOrder.forEach((rec, i) => {
      const coords = projection([rec.latlng[1], rec.latlng[0]]);
      const dot = mapGroup.append("circle")
        .attr("cx", coords[0]).attr("cy", coords[1])
        .attr("r", 2)
        .attr("class", "capital-dot capital-dot-grey")
        .attr("data-capital", rec.capital)
        .attr("data-country", rec.country);
      capitalDots.push(dot);
    });
    startTimer();
    nextCitiesRound();
  }
}

function getFeature(rec) {
  const key = normalizeName(rec.name);
  const topoId = topoIdMap[rec.cca3];
  // Try TopoJSON id match
  if (topoId) {
    const foundFeature = features.find(f => String(f.id) === topoId || f.id === topoId);
    if (foundFeature) return foundFeature;
  }
  // Try manualFeatureMap for custom codes
  if (manualFeatureMap[key] && featureByCCA3.has(manualFeatureMap[key])) return featureByCCA3.get(manualFeatureMap[key]);
  // Try direct cca3 match
  if (featureByCCA3.has(rec.cca3)) return featureByCCA3.get(rec.cca3);
  // Try name match
  if (featureByName.has(key)) return featureByName.get(key);
  // Try aliases
  for (let alias of rec.aliases) {
    const aliasKey = normalizeName(alias);
    if (manualFeatureMap[aliasKey] && featureByCCA3.has(manualFeatureMap[aliasKey])) return featureByCCA3.get(manualFeatureMap[aliasKey]);
    const f = featureByName.get(aliasKey);
    if (f) return f;
  }
  // Try feature properties for ISO code
  for (let f of features) {
    const props = f.properties || {};
    if (props.iso_a3 === rec.cca3 || props.ISO_A3 === rec.cca3 || props.ADM0_A3 === rec.cca3) {
      return f;
    }
  }
  // Try matching by normalized name in feature properties (for regions like Northern Cyprus, Somaliland)
  for (let f of features) {
    const props = f.properties || {};
    const fname = normalizeName(props.name || props.NAME || props.ADMIN || "");
    if (fname && (fname === key || fname.includes(key) || key.includes(fname))) {
      return f;
    }
  }
  // Try partial match in featureByName
  for (let [name, f] of featureByName) {
    if (name.includes(key) || key.includes(name)) return f;
  }
  return null;
}
const flagCache = new Map();
countriesData.forEach(c => {
  const img = new Image();
  img.src = `https://teorainneacha.vercel.app/bratai/${normalizeName(c.name)}.svg`;
  flagCache.set(c.cca2, img);
});

function revealCountry(rec) {
  if (revealedCountries.has(rec.name)) return;
  revealedCountries.add(rec.name);
  const forceStretch = new Set(["RUS"]);
  let feature = getFeature(rec);
  if (!feature) {
    if (rec.cca3 === "BSC") {
      const topoFeature = worldData.objects.countries.geometries.find(d => d.id === 686);
      if (topoFeature) feature = {
        type: "Feature",
        geometry: topoFeature.geometry,
        properties: {
          name: rec.name,
          iso_a3: rec.cca3
        }
      };
    } else if (rec.cca3 === "NCY") {
      const topoFeature = worldData.objects.countries.geometries.find(d => d.id === 0);
      if (topoFeature) feature = {
        type: "Feature",
        geometry: topoFeature.geometry,
        properties: {
          name: rec.name,
          iso_a3: rec.cca3
        }
      };
    }
    if (!feature) return;
  }
  if (feature.geometry.type === "MultiPolygon") {
    const polys = feature.geometry.coordinates;
    const areas = polys.map(poly => d3.geoArea({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: poly
      }
    }));
    const maxIndex = areas.indexOf(Math.max(...areas));
    if (rec.cca3 === "NLD") feature.geometry.coordinates = [polys[maxIndex]];
  }
  let flagImg = flagCache.get(rec.cca2);

  function brataiKey(name, cca3) {
    if (cca3 === "COD") return "democratic-republic-of-the-congo";
    if (cca3 === "GEO" || name.toLowerCase().includes('georgia')) return "georgia";
    if (cca3 === "JOR") return "jordan";
    if (cca3 === "CPV" || name.toLowerCase().includes('cape verde') || name.toLowerCase().includes('cabo verde')) return "cabo-verde";
    if (cca3 === "STP" || name.toLowerCase().includes('sao tome')) return "sao-tome-and-principe";
    if (cca3 === "CIV" || name.toLowerCase().includes("côte d'ivoire") || name.toLowerCase().includes("cote d'ivoire")) return "côte-d'ivoire";
    if (cca3 === "FRO" || name.toLowerCase().includes('faroe')) return "faroe-islands";
    if (cca3 === "ALA" || /\b(aland|åland)\b/i.test(name)) return "åland-islands";
    if (cca3 === "SJM" || name.toLowerCase().includes('svalbard') || name.toLowerCase().includes('jan mayen')) return "svalbard-and-jan-mayen";
    if (cca3 === "KIR" || name.toLowerCase().includes('kiribati')) return "kiribati";
    if (cca3 === "TKL" || name.toLowerCase().includes('tokelau')) return "tokelau";
    if (cca3 === "WSM" || name.toLowerCase().includes('samoa')) return "samoa";
    if (cca3 === "TON" || name.toLowerCase().includes('tonga')) return "tonga";
    if (cca3 === "NIU" || name.toLowerCase().includes('niue')) return "niue";
    if (cca3 === "COK" || name.toLowerCase().includes('cook islands')) return "cook-islands";
    if (cca3 === "PLW" || name.toLowerCase().includes('palau')) return "palau";
    if (cca3 === "NRU" || name.toLowerCase().includes('nauru')) return "nauru";
    if (cca3 === "TUV" || name.toLowerCase().includes('tuvalu')) return "tuvalu";
    if (cca3 === "BSC") return "british-somaliland";
    if (cca3 === "NCY") return "northern-cyprus";
    return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  let flagSrc = `https://teorainneacha.vercel.app/bratai/${brataiKey(rec.name, rec.cca3)}.svg`;
  if (!flagImg) {
    flagImg = new Image();
    flagImg.src = flagSrc;
    flagImg.onload = () => flagCache.set(rec.cca2, flagImg);
  }
  if (!window.flagCanvas) {
    window.flagCanvas = document.createElement('canvas');
    window.flagCtx = window.flagCanvas.getContext('2d');
    flagCanvas.style.position = 'absolute';
    flagCanvas.style.top = '0';
    flagCanvas.style.left = '0';
    flagCanvas.style.pointerEvents = 'none';
    document.body.appendChild(flagCanvas);

    function resizeFlagCanvas() {
      const svgNode = d3.select('svg').node();
      const width = svgNode ? svgNode.getBoundingClientRect().width : window.innerWidth;
      const height = svgNode ? svgNode.getBoundingClientRect().height : window.innerHeight;
      flagCanvas.width = width;
      flagCanvas.height = height;
      flagCanvas.style.width = width + 'px';
      flagCanvas.style.height = height + 'px';
    }
    window.addEventListener('resize', resizeFlagCanvas);
    resizeFlagCanvas();
  }

  function placeImageCover(imgSel, naturalImg, bounds) {
    const flagRatio = naturalImg.width / naturalImg.height;
    const wBox = bounds[1][0] - bounds[0][0];
    const hBox = bounds[1][1] - bounds[0][1];
    let width, height;
    if (flagRatio > (wBox / hBox)) {
      height = hBox;
      width = height * flagRatio;
    } else {
      width = wBox;
      height = width / flagRatio;
    }
    imgSel.attr("width", width).attr("height", height).attr("x", bounds[0][0] - (width - wBox) / 2).attr("y", bounds[0][1] - (height - hBox) / 2).attr("preserveAspectRatio", "xMidYMid slice");
  }

  function renderSingleFeature(feature, rec, clipId, stretchOverride = false) {
    const bounds = path.bounds(feature);
    const img = mapGroup.append("image").attr("href", flagSrc).attr("clip-path", `url(#${clipId})`).attr("style", "pointer-events:none;").attr("opacity", 0);
    const useStretch = forceStretch.has(rec.cca3) || stretchOverride;

    function applyStretch(imgSel, b) {
      imgSel.attr("x", b[0][0]).attr("y", b[0][1]).attr("width", b[1][0] - b[0][0]).attr("height", b[1][1] - b[0][1]).attr("preserveAspectRatio", "none");
    }
    if (flagImg && flagImg.complete && flagImg.naturalWidth) {
      if (useStretch) applyStretch(img, bounds);
      else placeImageCover(img, flagImg, bounds);
      img.transition().duration(600).attr("opacity", 1);
    } else {
      const tmp = new Image();
      tmp.onload = function() {
        if (useStretch) applyStretch(img, bounds);
        else placeImageCover(img, tmp, bounds);
        img.transition().duration(600).attr("opacity", 1);
      };
      tmp.onerror = function() {
        d3.select(img.node()).remove();
      };
      tmp.src = flagSrc;
    }
  }

  function processMultiPolygon(feature, rec) {
    let corsicaIndex = null;
    if (rec.cca3 === "FRA") {
      feature.geometry.coordinates.forEach((poly, idx) => {
        const lons = poly[0].map(p => p[0]);
        const lats = poly[0].map(p => p[1]);
        const cx = d3.mean(lons),
          cy = d3.mean(lats);
        if (cx > 8 && cx < 10 && cy > 41 && cy < 43) corsicaIndex = idx;
      });
    }
    feature.geometry.coordinates.forEach((poly, idx) => {
      const singleFeature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: poly
        },
        properties: feature.properties
      };
      const clipId = `clip-${rec.cca3}-part${idx}`;
      mapGroup.append("clipPath").attr("id", clipId).append("path").attr("d", path(singleFeature));
      const stretchOverride = (rec.cca3 === "FRA" && idx === corsicaIndex);
      renderSingleFeature(singleFeature, rec, clipId, stretchOverride);
    });
  }
  if (rec.cca3 === "RUS") {
    const clipId = `clip-${rec.cca3}`;
    mapGroup.append("clipPath").attr("id", clipId).append("path").attr("d", path(feature));
    renderSingleFeature(feature, rec, clipId);
  } else if (["USA", "FRA", "NLD", "PRT", "ESP", "TWN", "MLT", "AUS"].includes(rec.cca3) && feature.geometry.type === "MultiPolygon") processMultiPolygon(feature, rec);
  else {
    const clipId = `clip-${rec.cca3}`;
    mapGroup.append("clipPath").attr("id", clipId).append("path").attr("d", path(feature));
    renderSingleFeature(feature, rec, clipId);
  }
  const iso = rec.cca3;
  const countrySel = mapGroup.selectAll("path.country").filter(d => {
    const props = d.properties || {};
    return (props.iso_a3 === iso || props.ISO_A3 === iso || props.ADM0_A3 === iso);
  });
  countrySel.transition().duration(400).style("fill", "rgb(0,255,0)").style("opacity", 1);
  mapGroup.select(`#flag-${iso}`).transition().delay(350).duration(450).style("opacity", 1);
  countrySel.classed("revealed", true).raise();
}

function nextRound() {
  const submitSpan = document.querySelector("#submit-btn span");
  submitSpan.textContent = "arrow_forward_ios";
  submitSpan.style.fontSize = "24px";
  let remaining;
  if (gameMode === "Normal" || gameMode === "Hard") {
    while (noregdip < continentOrder.length) {
      const cont = continentOrder[noregdip];
      remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region === cont);
      if (remaining.length > 0) break;
      noregdip++;
    }
    if (noregdip >= continentOrder.length) {
      endGame();
      return;
    }
  } else {
    remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region !== "Antarctic");
  }
  if (!remaining || !remaining.length) {
    endGame();
    return;
  }
  // Pick a country such that the first letter is not the same as lastPromptLetter
  // Find a valid prompt letter with remaining countries
  let validLetters = Array.from(new Set(remaining.map(c => c.name[0].toUpperCase())));
  // Remove lastPromptLetter if possible
  if (validLetters.length > 1 && validLetters.includes(lastPromptLetter)) {
    validLetters = validLetters.filter(l => l !== lastPromptLetter);
  }
  if (validLetters.length === 0) {
    endGame();
    return;
  }
  // Pick a random valid letter
  currentLetter = validLetters[Math.floor(Math.random() * validLetters.length)];
  // Pick a country with that letter
  let rec = remaining.find(c => c.name[0].toUpperCase() === currentLetter);
  if (!rec) {
    endGame();
    return;
  }
  currentContinent = rec.region;
  lastPromptLetter = currentLetter;
  let promptText = `Round ${round}: Name a country starting with "${currentLetter}"`;
  if (gameMode === "Normal" || gameMode === "Hard" || gameMode === "Extreme") {
    promptText = `Round ${round}: Name a country in ${currentContinent} starting with "${currentLetter}"`;
  }
  document.getElementById("prompt").innerText = promptText;
}

function nextCitiesRound() {
  while (noregdip < continentOrder.length) {
    const cont = continentOrder[noregdip];
    const remaining = capitalsOrder.filter(c => !revealedCapitals.has(c.capital) && c.region === cont);
    if (remaining.length > 0) {
      // Pick a random country from the remaining in this continent
      currentCountry = remaining[Math.floor(Math.random() * remaining.length)];
      currentContinent = cont;
      break;
    }
    noregdip++;
  }
  if (noregdip >= continentOrder.length) {
    endGame();
    return;
  }
  if (!currentCountry) {
    endGame();
    return;
  }
  let promptText = `Round ${round}: What is the capital of ${currentCountry.country}?`;
  document.getElementById("prompt").innerText = promptText;
}
const answerInput = document.getElementById("answer"),
  autocompleteList = document.getElementById("autocomplete-list");
let autocompleteHighlightIndex = 0;
answerInput.addEventListener("input", function() {
  autocompleteList.innerHTML = "";
  if (gameMode === "Extreme") return; // No autocomplete in Extreme mode
  const val = normalizeName(this.value);
  if (!val) return;
  if (this.value.trim() === "|ra") return;
  let matches = [];
  if (gameType === "countries") {
    if (gameMode === "Hard") {
      return;
    }
    matches = countriesData.map(c => c.name).filter(n => normalizeName(n).startsWith(val) && !revealedCountries.has(n));
  } else {
    if (gameMode === "Hard") {
      return;
    }
    matches = capitalsOrder.filter(c => normalizeName(c.capital).startsWith(val) && !revealedCapitals.has(c.capital)).map(c => c.capital);
  }
  autocompleteHighlightIndex = 0;
  matches.forEach((name, i) => {
    const div = document.createElement("div");
    div.classList.add("autocomplete-item");
    div.textContent = name;
    if (i === autocompleteHighlightIndex) div.classList.add("highlighted");
    div.onclick = () => {
      answerInput.value = name;
      autocompleteList.innerHTML = "";
      submitAnswer();
    };
    autocompleteList.appendChild(div);
  });
  // Ensure highlighted item is visible
  setTimeout(() => {
    const highlighted = autocompleteList.querySelector('.autocomplete-item.highlighted');
    if (highlighted) {
      const listRect = autocompleteList.getBoundingClientRect();
      const itemRect = highlighted.getBoundingClientRect();
      if (itemRect.top < listRect.top) {
        autocompleteList.scrollTop += itemRect.top - listRect.top;
      } else if (itemRect.bottom > listRect.bottom) {
        autocompleteList.scrollTop += itemRect.bottom - listRect.bottom;
      }
    }
  }, 0);
});
answerInput.addEventListener("keydown", function(e) {
  const items = Array.from(autocompleteList.children || []);
  let changed = false;
  if (e.key === "ArrowDown" && items.length) {
    autocompleteHighlightIndex = Math.min(autocompleteHighlightIndex + 1, items.length - 1);
    changed = true;
    e.preventDefault();
  }
  if (e.key === "ArrowUp" && items.length) {
    autocompleteHighlightIndex = Math.max(autocompleteHighlightIndex - 1, 0);
    changed = true;
    e.preventDefault();
  }
  if (changed) {
    items.forEach((item, i) => item.classList.toggle("highlighted", i === autocompleteHighlightIndex));
    // Ensure highlighted item is visible
    setTimeout(() => {
      const highlighted = autocompleteList.querySelector('.autocomplete-item.highlighted');
      if (highlighted) {
        const listRect = autocompleteList.getBoundingClientRect();
        const itemRect = highlighted.getBoundingClientRect();
        if (itemRect.top < listRect.top) {
          autocompleteList.scrollTop += itemRect.top - listRect.top;
        } else if (itemRect.bottom > listRect.bottom) {
          autocompleteList.scrollTop += itemRect.bottom - listRect.bottom;
        }
      }
    }, 0);
  }
  if (e.key === "Enter") {
    if (this.value.trim() === "|ra") {
      submitAnswer();
      autocompleteList.innerHTML = "";
      e.preventDefault();
      return;
    }
    if (items.length) {
      this.value = items[autocompleteHighlightIndex].textContent;
    }
    submitAnswer();
    autocompleteList.innerHTML = "";
    e.preventDefault();
  }
});
document.addEventListener("click", e => {
  if (e.target !== answerInput) autocompleteList.innerHTML = "";
});
document.getElementById("submit-btn").addEventListener("click", submitAnswer);

function submitAnswer() {
  if (paused) return;
  const rawInput = answerInput.value.trim();
  answerInput.value = "";
  autocompleteList.innerHTML = "";
  if (!rawInput) return;
  if (rawInput.toLowerCase() === "skip") {
    // Add current prompt to skippedCountries
    if (gameType === "countries") {
      let remaining;
      if (gameMode === "Normal" || gameMode === "Hard") {
        remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region === currentContinent);
      } else {
        remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region !== "Antarctic");
      }
      // Find the current country for this round
      let rec = remaining.find(c => c.name[0].toUpperCase() === currentLetter);
      if (rec) skippedCountries.push({
        country: rec,
        letter: currentLetter,
        continent: currentContinent
      });
    } else {
      // Capitals mode
      if (currentCountry) skippedCountries.push(currentCountry);
    }
    round++;
    setTimeout(() => {
      if (gameType === "countries") nextRound();
      else nextCitiesRound();
    }, 300);
    return;
  }
  if (rawInput === "|ra") {
    if (gameType === "countries") {
      countriesData.forEach(revealCountry);
    } else {
      capitalsOrder.forEach(revealCapital);
    }
    endGame();
    return;
  }
  const submitSpan = document.querySelector("#submit-btn span");
  if (gameType === "countries") {
    let rec;
    let usedFuzzy = false;
    if (gameMode === "Extreme") {
      // Extreme mode: no autocorrect, autocomplete, skip
      rec = nameIndex.get(normalizeName(rawInput));
      // Must match exactly (case-sensitive)
      if (!rec || rec.name !== rawInput) {
        showMessage(`Incorrect! You must type the country name perfectly.`, 'error');
        wrongGuesses++;
        // Reset map and show alert
        revealedCountries.clear();
        mapGroup.selectAll("image").remove();
        mapGroup.selectAll("path.country")
          .classed("revealed", false)
          .attr("fill", null)
          .attr("stroke", "#95abc2")
          .attr("stroke-width", 0.075);
        // Remove highlight overlays
        mapGroup.selectAll(".country-highlight").remove();
        // Flash map red
        d3.select("#map").transition().duration(200).style("background", "#e53935")
          .transition().duration(400).style("background", "#042342");
        showMessage('Map reset! Try again from scratch.', 'warning');
        round = 1;
        noregdip = 0;
        setTimeout(nextRound, 1200);
        return;
      }
      // Fix DRC/Georgia bug: allow DRC for 'D' in Africa, Georgia for 'G' in Asia
      if ((gameMode === "Normal" || gameMode === "Hard" || gameMode === "Extreme") && rec.region !== currentContinent) {
        if ((rec.name === "Democratic Republic of the Congo" && currentContinent === "Africa" && currentLetter === "D") ||
          (rec.name === "Georgia" && currentContinent === "Asia" && currentLetter === "G")) {
          // Accept
        } else {
          showMessage(`Wrong continent: ${rec.name} is in ${rec.region}`, 'public');
          wrongGuesses++;
          revealedCountries.clear();
          mapGroup.selectAll("image").remove();
          mapGroup.selectAll("path.country")
            .classed("revealed", false)
            .attr("fill", null)
            .attr("stroke", "#95abc2")
            .attr("stroke-width", 0.075);
          mapGroup.selectAll(".country-highlight").remove();
          d3.select("#map").transition().duration(200).style("background", "#e53935")
            .transition().duration(400).style("background", "#042342");
          showMessage('Map reset! Try again from scratch.', 'warning');
          round = 1;
          noregdip = 0;
          setTimeout(nextRound, 1200);
          return;
        }
      }
      if (!rec.name.toUpperCase().startsWith(currentLetter)) {
        showMessage(`Wrong letter: ${rec.name} does not start with ${currentLetter}`, 'warning');
        wrongGuesses++;
        revealedCountries.clear();
        mapGroup.selectAll("image").remove();
        mapGroup.selectAll("path.country")
          .classed("revealed", false)
          .attr("fill", null)
          .attr("stroke", "#95abc2")
          .attr("stroke-width", 0.075);
        mapGroup.selectAll(".country-highlight").remove();
        d3.select("#map").transition().duration(200).style("background", "#e53935")
          .transition().duration(400).style("background", "#042342");
        showMessage('Map reset! Try again from scratch.', 'warning');
        round = 1;
        noregdip = 0;
        setTimeout(nextRound, 1200);
        return;
      }
      submitSpan.textContent = "check_circle";
      submitSpan.style.fontSize = "36px";
      showMessage('Correct!', 'check');
      revealCountry(rec);
      round++;
      setTimeout(nextRound, 500);
      return;
    }
    // Other modes: autocorrect, autocomplete, skip allowed
    rec = nameIndex.get(normalizeName(rawInput));
    if (!rec) {
      let best = null,
        bestDist = 999;
      for (const [norm, val] of nameIndex) {
        const d = levenshtein(normalizeName(rawInput), norm);
        if (d < bestDist) {
          bestDist = d;
          best = val;
        }
      }
      if (best && bestDist <= 2) {
        rec = best;
        usedFuzzy = true;
        showMessage(`Correct spelling: ${best.name}`, 'spellcheck');
      }
    }
    if (!rec) {
      showMessage(`Invalid input: ${rawInput}`, 'error');
      wrongGuesses++;
      return;
    }
    if ((gameMode === "Normal" || gameMode === "Hard") && rec.region !== currentContinent) {
      showMessage(`Wrong continent: ${rec.name} is in ${rec.region}`, 'public');
      wrongGuesses++;
      return;
    }
    if (!rec.name.toUpperCase().startsWith(currentLetter)) {
      showMessage(`Wrong letter: ${rec.name} does not start with ${currentLetter}`, 'warning');
      wrongGuesses++;
      return;
    }
    submitSpan.textContent = "check_circle";
    submitSpan.style.fontSize = "36px";
    if (!usedFuzzy) showMessage('Correct!', 'check');
    revealCountry(rec);
    round++;
    setTimeout(nextRound, 500);
  } else {
    let rec = capitalsIndex.get(normalizeName(rawInput));
    let usedFuzzy = false;
    if (!rec) {
      let best = null,
        bestDist = 999;
      for (const [norm, val] of capitalsIndex) {
        const d = levenshtein(normalizeName(rawInput), norm);
        if (d < bestDist) {
          bestDist = d;
          best = val;
        }
      }
      if (best && bestDist <= 2) {
        rec = best;
        usedFuzzy = true;
        // show spelling correction only
        showMessage(`Correct spelling: ${best.capital}`, 'spellcheck');
      }
    }
    if (!rec) {
      showMessage(`Invalid input: ${rawInput}`, 'error');
      wrongGuesses++;
      return;
    }
    if (rec.country !== currentCountry.country) {
      showMessage(`Wrong country: ${rec.capital} is the capital of ${rec.country}`, 'public');
      wrongGuesses++;
      return;
    }
    submitSpan.textContent = "check_circle";
    submitSpan.style.fontSize = "36px";
    if (!usedFuzzy) showMessage('Correct!', 'check');
    revealCapital(rec);
    round++;
    setTimeout(nextCitiesRound, 500);
  }
}

function revealCapital(rec) {
  if (revealedCapitals.has(rec.capital)) return;
  revealedCapitals.add(rec.capital);
  capitalDots.forEach(dot => {
    if (dot.attr("data-capital") === rec.capital) {
      dot.classed("capital-dot-grey", false).classed("capital-dot-red", true);
    }
  });
}

function startTimer() {
  startTime = Date.now() - elapsed;
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  elapsed = Date.now() - startTime;
  const totalSec = Math.floor(elapsed / 1000);
  const min = Math.floor(totalSec / 60),
    sec = totalSec % 60;
  document.getElementById("timer").textContent = `${min}:${sec.toString().padStart(2,"0")}`;
}

function pauseTimer() {
  clearInterval(timerInterval);
  paused = true;
  document.getElementById("pause-overlay").style.display = "flex";
}

function resumeTimer() {
  startTimer();
  paused = false;
  document.getElementById("pause-overlay").style.display = "none";
}
// Flags timer (separate so we can pause/resume independently)
let flagsStartTime = null,
  flagsElapsed = 0,
  flagsTimerInterval = null,
  flagsPaused = false;

function startFlagsTimer() {
  flagsStartTime = Date.now() - flagsElapsed;
  if (flagsTimerInterval) clearInterval(flagsTimerInterval);
  flagsTimerInterval = setInterval(() => {
    flagsElapsed = Date.now() - flagsStartTime;
    const s = Math.floor(flagsElapsed / 1000);
    const m = Math.floor(s / 60),
      sec = s % 60;
    document.getElementById('flags-timer').textContent = `${m}:${sec.toString().padStart(2,'0')}`;
  }, 1000);
}

function pauseFlagsTimer() {
  if (flagsTimerInterval) clearInterval(flagsTimerInterval);
  flagsPaused = true;
}

function resumeFlagsTimer() {
  if (flagsPaused) {
    startFlagsTimer();
    flagsPaused = false;
  }
}
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'flags-pause-btn') {
    const pauseBtn = document.getElementById('flags-pause-btn');
    const iconSpan = pauseBtn.querySelector('.material-symbols-rounded');
    if (!flagsPaused) {
      // pause flags game: show overlay and pause timer
      pauseFlagsTimer();
      flagsPaused = true;
      if (iconSpan) iconSpan.textContent = 'play_arrow';
      document.getElementById('pause-overlay').style.display = 'flex';
    } else {
      // resume flags game
      resumeFlagsTimer();
      flagsPaused = false;
      if (iconSpan) iconSpan.textContent = 'pause';
      document.getElementById('pause-overlay').style.display = 'none';
    }
  }
});

function endGame() {
  // If there are skipped countries, revisit them
  if (skippedCountries.length > 0) {
    let revisitIndex = 0;

    function revisitSkipped() {
      if (revisitIndex >= skippedCountries.length) {
        // All skipped done, show results
        finishGame();
        return;
      }
      let item = skippedCountries[revisitIndex];
      if (gameType === "countries") {
        currentContinent = item.continent;
        currentLetter = item.letter;
        let promptText = `SKIPPED: Name a country in ${currentContinent} starting with "${currentLetter}"`;
        document.getElementById("prompt").innerText = promptText;
      } else {
        currentCountry = item;
        let promptText = `SKIPPED: What is the capital of ${currentCountry.country}?`;
        document.getElementById("prompt").innerText = promptText;
      }
      // Wait for user to answer
      let oldSubmit = submitAnswer;
      submitAnswer = function() {
        const rawInput = answerInput.value.trim();
        answerInput.value = "";
        autocompleteList.innerHTML = "";
        if (!rawInput) return;
        if (rawInput.toLowerCase() === "skip") {
          revisitIndex++;
          setTimeout(revisitSkipped, 300);
          return;
        }
        if (gameType === "countries") {
          let rec = nameIndex.get(normalizeName(rawInput));
          if (!rec || rec.name !== item.country.name) {
            showMessage(`Wrong! The answer was ${item.country.name}`, 'error');
            wrongGuesses++;
            revisitIndex++;
            setTimeout(revisitSkipped, 700);
            return;
          }
          showMessage('Correct!', 'check');
          revealCountry(rec);
          revisitIndex++;
          setTimeout(revisitSkipped, 700);
        } else {
          let rec = capitalsIndex.get(normalizeName(rawInput));
          if (!rec || rec.capital !== item.capital) {
            showMessage(`Wrong! The answer was ${item.capital}`, 'error');
            wrongGuesses++;
            revisitIndex++;
            setTimeout(revisitSkipped, 700);
            return;
          }
          showMessage('Correct!', 'check');
          revealCapital(rec);
          revisitIndex++;
          setTimeout(revisitSkipped, 700);
        }
      };
    }
    revisitSkipped();

    function finishGame() {
      clearInterval(timerInterval);
      const totalSec = Math.floor(elapsed / 1000);
      const min = Math.floor(totalSec / 60),
        sec = totalSec % 60;
      const correct = round - 1;
      const total = correct + wrongGuesses;
      const percent = total > 0 ? ((correct / total) * 100).toFixed(1) : 100;
      document.getElementById("results-text").innerHTML = `
            <div>Game Over! (${gameType==="countries"?gameMode+" Countries":"Cities "+gameMode} Mode)</div>
            <div>Time: ${min}:${sec.toString().padStart(2,"0")}</div>
               <div>Wrong Attempts: ${wrongGuesses}</div>
               <div>Accuracy: ${percent}%</div>`;
      document.getElementById("results-screen").style.display = "flex";
      submitAnswer = oldSubmit;
    }
    return;
  }
  // No skipped countries, show results
  clearInterval(timerInterval);
  const totalSec = Math.floor(elapsed / 1000);
  const min = Math.floor(totalSec / 60),
    sec = totalSec % 60;
  const correct = round - 1;
  const total = correct + wrongGuesses;
  const percent = total > 0 ? ((correct / total) * 100).toFixed(1) : 100;
  document.getElementById("results-text").innerHTML = `
      <div>Game Over! (${gameType==="countries"?gameMode+" Countries":"Cities "+gameMode} Mode)</div>
      <div>Time: ${min}:${sec.toString().padStart(2,"0")}</div>
         <div>Wrong Attempts: ${wrongGuesses}</div>
         <div>Accuracy: ${percent}%</div>`;
  document.getElementById("results-screen").style.display = "flex";
}
// Toggle pause/resume when clicking the pause button so it responds immediately
document.getElementById("pause-btn").addEventListener("click", () => {
  if (!paused) {
    pauseTimer();
    // update title to indicate state
    document.getElementById('pause-btn').setAttribute('aria-pressed', 'true');
  } else {
    resumeTimer();
    document.getElementById('pause-btn').setAttribute('aria-pressed', 'false');
  }
});
document.getElementById("resume-btn").addEventListener("click", () => {
  // resume global timer
  resumeTimer();
  // also resume flags timer if we were in flags mode
  if (flagsPaused) {
    resumeFlagsTimer();
    flagsPaused = false;
    const pauseBtn = document.getElementById('flags-pause-btn');
    const iconSpan = pauseBtn.querySelector('.material-symbols-rounded');
    if (iconSpan) iconSpan.textContent = 'pause';
  }
});
document.getElementById("close-results-btn").addEventListener("click", () => {
  document.getElementById("results-screen").style.display = "none";
});
document.addEventListener("keydown", function(e) {
  const answerInput = document.getElementById("answer");
  // Always pause on '[' (case-insensitive)
  if (e.key.toLowerCase() === "[") {
    e.preventDefault();
    if (!paused) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  }
  // If textbox is NOT focused and key is not '[' or 'Enter', focus it
  if (document.activeElement !== answerInput && e.key !== "Enter" && e.key.toLowerCase() !== "[") {
    answerInput.focus();
    e.preventDefault();
  }
});
init();
