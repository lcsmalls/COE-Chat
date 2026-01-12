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
const topoIdMap = {
  AFG: "004",
  ALA: "248",
  ALB: "008",
  DZA: "012",
  ASM: "016",
  AND: "020",
  AGO: "024",
  AIA: "660",
  ATA: "010",
  ATG: "028",
  ARG: "032",
  ARM: "051",
  ABW: "533",
  AUS: "036",
  AUT: "040",
  AZE: "031",
  BHS: "044",
  BHR: "048",
  BGD: "050",
  BRB: "052",
  BLR: "112",
  BEL: "056",
  BLZ: "084",
  BEN: "204",
  BMU: "060",
  BTN: "064",
  BOL: "068",
  BES: "535",
  BIH: "070",
  BWA: "072",
  BVT: "074",
  BRA: "076",
  IOT: "086",
  VGB: "092",
  VIR: "850",
  BRN: "096",
  BGR: "100",
  BFA: "854",
  BDI: "108",
  CPV: "132",
  KHM: "116",
  CMR: "120",
  CAN: "124",
  CYM: "136",
  CAF: "140",
  TCD: "148",
  CHL: "152",
  CHN: "156",
  HKG: "344",
  MAC: "446",
  CXR: "162",
  CCK: "166",
  COL: "170",
  COM: "174",
  COD: "180",
  COG: "178",
  COK: "184",
  CRI: "188",
  CIV: "384",
  HRV: "191",
  CUB: "192",
  CUW: "531",
  CYP: "196",
  CZE: "203",
  DNK: "208",
  DJI: "262",
  DMA: "212",
  DOM: "214",
  ECU: "218",
  EGY: "818",
  SLV: "222",
  GNQ: "226",
  ERI: "232",
  EST: "233",
  SWZ: "748",
  ETH: "231",
  FLK: "238",
  FRO: "234",
  FJI: "242",
  FIN: "246",
  FRA: "250",
  GUF: "254",
  PYF: "258",
  ATF: "260",
  GAB: "266",
  GMB: "270",
  GEO: "268",
  DEU: "276",
  GHA: "288",
  GIB: "292",
  GRC: "300",
  GRL: "304",
  GRD: "308",
  GLP: "312",
  GUM: "316",
  GTM: "320",
  GGY: "831",
  GIN: "324",
  GNB: "624",
  GUY: "328",
  HTI: "332",
  HMD: "334",
  VAT: "336",
  HND: "340",
  HUN: "348",
  ISL: "352",
  IND: "356",
  IDN: "360",
  IRN: "364",
  IRQ: "368",
  IRL: "372",
  IMN: "833",
  ISR: "376",
  ITA: "380",
  JAM: "388",
  JPN: "392",
  JEY: "832",
  JOR: "400",
  KAZ: "398",
  KEN: "404",
  KIR: "296",
  PRK: "408",
  KOR: "410",
  KWT: "414",
  KGZ: "417",
  LAO: "418",
  LVA: "428",
  LBN: "422",
  LSO: "426",
  LBR: "430",
  LBY: "434",
  LIE: "438",
  LTU: "440",
  LUX: "442",
  MDG: "450",
  MWI: "454",
  MYS: "458",
  MDV: "462",
  MLI: "466",
  MLT: "470",
  MHL: "584",
  MTQ: "474",
  MRT: "478",
  MUS: "480",
  MYT: "175",
  MEX: "484",
  FSM: "583",
  MDA: "498",
  MCO: "492",
  MNG: "496",
  MNE: "499",
  MSR: "500",
  MAR: "504",
  MOZ: "508",
  MMR: "104",
  NAM: "516",
  NRU: "520",
  NPL: "524",
  NLD: "528",
  NCL: "540",
  NZL: "554",
  NIC: "558",
  NER: "562",
  NGA: "566",
  NIU: "570",
  NFK: "574",
  MNP: "580",
  NOR: "578",
  OMN: "512",
  PAK: "586",
  PLW: "585",
  PSE: "275",
  PAN: "591",
  PNG: "598",
  PRY: "600",
  PER: "604",
  PHL: "608",
  PCN: "612",
  POL: "616",
  PRT: "620",
  PRI: "630",
  QAT: "634",
  MKD: "807",
  ROU: "642",
  RUS: "643",
  RWA: "646",
  REU: "638",
  BLM: "652",
  SHN: "654",
  KNA: "659",
  LCA: "662",
  MAF: "663",
  SPM: "666",
  VCT: "670",
  WSM: "882",
  SMR: "674",
  STP: "678",
  SAU: "682",
  SEN: "686",
  SRB: "688",
  SYC: "690",
  SLE: "694",
  SGP: "702",
  SXM: "534",
  SVK: "703",
  SVN: "705",
  SLB: "090",
  SOM: "706",
  ZAF: "710",
  SGS: "239",
  SSD: "728",
  ESP: "724",
  LKA: "144",
  SDN: "729",
  SUR: "740",
  SJM: "744",
  SWE: "752",
  CHE: "756",
  SYR: "760",
  TWN: "158",
  TJK: "762",
  TZA: "834",
  THA: "764",
  TLS: "626",
  TGO: "768",
  TKL: "772",
  TON: "776",
  TTO: "780",
  TUN: "788",
  TUR: "792",
  TKM: "795",
  TCA: "796",
  TUV: "798",
  UGA: "800",
  UKR: "804",
  ARE: "784",
  GBR: "826",
  USA: "840",
  UMI: "581",
  URY: "858",
  UZB: "860",
  VUT: "548",
  VEN: "862",
  VNM: "704",
  VIR: "850",
  WLF: "876",
  ESH: "732",
  YEM: "887",
  ZMB: "894",
  ZWE: "716",
};

async function init() {
  svg = d3.select("#map");
  const width = window.innerWidth;
  const height = window.innerHeight * 0.7;
  svg.attr("width", width).attr("height", height);
  // Use Van der Grinten projection
  projection = d3
    .geoWinkel3()
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
