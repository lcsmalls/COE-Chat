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

function normalizeName(s) {
  return (s || "").toLowerCase().replace(/[^a-z]+/g, '');
}

function normalizedTokens(s) {
  if (!s) return [];
  return (s || '').split(/[^A-Za-z]+/).map(t => normalizeName(t)).filter(Boolean);
}
// Unicode-aware capitalize: handles characters like Å correctly
function capitalizeWords(s) {
  if (!s) return '';
  return s.split(' ').map(w => {
    if (!w) return w;
    return w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase();
  }).join(' ');
}
function getFeature(rec) {
  // Special-case: British Indian Ocean Territory should not resolve to India
  if (rec && rec.cca3 === 'IOT') {
    const key = normalizeName('British Indian Ocean Territory');
    if (featureByName.has(key)) return featureByName.get(key);
    for (let f of features) {
      const props = f.properties || {};
      const fname = normalizeName(props.name || props.NAME || props.ADMIN || '');
      if (fname && fname.includes('britishindianocean')) return f;
    }
    // if not found continue with normal resolution (but prefer not to match India)
  }
  const key = normalizeName(rec.name);
  const topoId = topoIdMap[rec.cca3];
  // Try TopoJSON id match
  if (topoId) {
    const foundFeature = features.find(f => String(f.id) === topoId || f.id === topoId);
    if (foundFeature) return foundFeature;
  }

  // Try direct cca3 match
  if (featureByCCA3.has(rec.cca3)) return featureByCCA3.get(rec.cca3);
  // Try name match
  if (featureByName.has(key)) return featureByName.get(key);
  // Try aliases
  for (let alias of rec.aliases) {
    const aliasKey = normalizeName(alias);

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
  // Try matching by normalized name tokens in feature properties (avoid substring collisions like 'oman' in 'romania')
  for (let f of features) {
    const props = f.properties || {};
    const raw = props.name || props.NAME || props.ADMIN || "";
    const tokens = normalizedTokens(raw);
    if (tokens.includes(key)) return f;
  }
  // Try exact key match in featureByName as a last resort
  if (featureByName.has(key)) return featureByName.get(key);
  return null;
}

const answerInput = document.getElementById("answer"),
  autocompleteList = document.getElementById("autocomplete-list");
let autocompleteHighlightIndex = 0;
answerInput.addEventListener("input", function() {
  autocompleteList.innerHTML = "";
  if (gameMode === "Extreme") return; // No autocomplete in Extreme mode
  if (timedModeActive) return; // Timed modes have no suggestion box
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

