// v.1.5.6
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
const continentOrder = [
  "Europe",
  "Oceania",
  "Americas",
  "Asia",
  "Africa",
  "Antarctic",
];
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
let flagsContinent = "all";
let flagsQuestionIndex = 0;
let flagsQuestionList = [];
let flagsCurrentQuestion = null;
// Timed mode state
let timedModeActive = false;
let timedTimeout = null;
const TIMED_DURATION_MS = 3 * 60 * 1000; // 3 minutes
let score = 0;
let countdownEnd = null;
let resultsShown = false;
// TopoJSON id mapping for problematic countries
let topoIdMap = {};

async function init() {
  // Fetch TopoJSON ID map from external JSON file
  try {
    const topoMapResponse = await fetch('https://teorainneacha.vercel.app/TopoJsonIdMap.json');
    topoIdMap = await topoMapResponse.json();
  } catch (err) {
    console.error('Failed to load TopoJSON ID map', err);
    topoIdMap = {};
  }
  
  svg = d3.select("#map");
  const width = window.innerWidth;
  const height = window.innerHeight * 0.7;
  svg.attr("width", width).attr("height", height);
  // Use Van der Grinten projection
  projection = d3
    .geoVanDerGrinten()
    .scale(Math.min(width / 6, height / 3.2))
    .translate([width / 2, height / 2])
    .precision(0.1);
  path = d3.geoPath().projection(projection);
  mapGroup = svg.append("g").attr("class", "map-content");
  svg.call(
    d3
      .zoom()
      .scaleExtent([1, 4000])
      .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
      })
  );
  const rc = await fetch(
    "https://restcountries.com/v3.1/all?fields=cca2,cca3,name,region,altSpellings"
  ).then((r) => r.json());
  rc.forEach((c) => {
    const cca3 = c.cca3 || "",
      cca2 = c.cca2 || "",
      common = c.name.common,
      region = c.region || "Other";
    const rec = {
      name: common,
      cca2,
      cca3,
      region,
    };
    countriesData.push(rec);
    nameIndex.set(normalizeName(common), rec);
  });
  let topoJSONLink = "https://unpkg.com/world-atlas@2/countries-50m.json";
  const topo = await fetch(topoJSONLink).then((r) => r.json());
  const objKey = Object.keys(topo.objects)[0];
  features = topojson.feature(topo, topo.objects[objKey]).features;
  features.forEach((f) => {
    const props = f.properties || {};
    const iso = props.iso_a3 || props.ISO_A3 || props.ADM0_A3 || "";
    const pname = props.name || props.NAME || props.ADMIN || "";
    if (iso) featureByCCA3.set(iso, f);
    if (pname) featureByName.set(normalizeName(pname), f);
  });
  projection.fitSize([width, height], {
    type: "FeatureCollection",
    features: features,
  });
  mapGroup
    .selectAll("path")
    .data(features)
    .join("path")
    .attr("d", path)
    .attr("class", "country");
  document.getElementById("main-menu").style.display = "flex";
  document.getElementById("start-screen").style.display = "none";
  const capitalsRaw = await fetch(
    "https://restcountries.com/v3.1/all?fields=cca2,cca3,name,region,capital,capitalInfo"
  ).then((r) => r.json());
  capitalsData = [];
  capitalsByCountry.clear();
  capitalsIndex.clear();
  capitalsOrder = [];
  capitalsRaw.forEach((c) => {
    if (
      !c.capital ||
      !c.capital.length ||
      !c.capitalInfo ||
      !c.capitalInfo.latlng
    )
      return;
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
      latlng,
    };
    capitalsData.push(rec);
    capitalsByCountry.set(common, rec);
    capitalsIndex.set(normalizeName(capital), rec);
  });
  capitalsOrder = continentOrder.flatMap((cont) =>
    capitalsData
      .filter((c) => c.region === cont)
      .sort((a, b) => a.country.localeCompare(b.country))
  );
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

init();
