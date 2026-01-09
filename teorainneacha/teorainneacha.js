function revealCountry(rec) {
  if (revealedCountries.has(rec.name)) return;
  revealedCountries.add(rec.name);
  // award points only during timed mode (50 points per revealed country)
  if (timedModeActive && typeof score === 'number') score += 50;
  const forceStretch = new Set(["RUS", "IRL", "TCD", "CIV"]);
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
  let flagSrc = `https://bratai.vercel.app/${brataiKey(rec.name, rec.cca3)}.svg`;
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
  } else if (["USA", "FRA", "NLD", "PRT", "ESP", "TWN", "MLT", "AUS", "NZL", "GNQ"].includes(rec.cca3) && feature.geometry.type === "MultiPolygon") processMultiPolygon(feature, rec);
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
  if (timedModeActive && gameType === 'countries') {
    // In timed countries mode: pick a random continent per question
    const contChoices = continentOrder.filter(c => c !== 'Antarctic');
    const cont = contChoices[Math.floor(Math.random() * contChoices.length)];
    remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region === cont);
    if (!remaining || remaining.length === 0) {
      // fallback to any non-Antarctic
      remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region !== 'Antarctic');
    }
  } else if (gameMode === "Normal" || gameMode === "Hard") {
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
      if (timedModeActive) {
        // Timed mode: show points total
        document.getElementById("results-text").innerHTML = `
              <div>Game Over! (${gameType==="countries"?gameMode+" Countries":"Cities "+gameMode} Mode)</div>
              <div>Total Points: <strong>${score}</strong></div>`;
      } else {
        // Non-timed: show time, wrong attempts, accuracy
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
      }
      resultsShown = true;
      document.getElementById("results-screen").style.display = "flex";
      submitAnswer = oldSubmit;
    }
    return;
  }
  // No skipped countries, show results
  clearInterval(timerInterval);
  if (timedModeActive) {
    document.getElementById("results-text").innerHTML = `
      <div>Game Over! (${gameType==="countries"?gameMode+" Countries":"Cities "+gameMode} Mode)</div>
      <div>Total Points: <strong>${score}</strong></div>`;
  } else {
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
  }
  document.getElementById("results-screen").style.display = "flex";
  resultsShown = true;
}

function startGame(mode) {
  gameMode = mode;
  // Ensure any timed mode is cancelled when starting a regular game
  timedModeActive = false;
  // fresh run: ensure results overlay can appear later
  resultsShown = false;
  if (timedTimeout) {
    clearTimeout(timedTimeout);
    timedTimeout = null;
  }
  const ac = document.getElementById('autocomplete-list');
  if (ac) ac.style.display = '';
  // reset score for a fresh game
  score = 0;
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
