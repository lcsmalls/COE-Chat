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
  // allow results for this fresh flags run
  resultsShown = false;
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
  if (resultsShown) return;
  resultsShown = true;
  // detect whether this run should be treated as a timed run
  const wasTimed = timedModeActive || (countdownEnd && (Date.now() <= (countdownEnd + 1000)));
  // clear any main countdown interval used for timed flags
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  // ensure any scheduled timed end won't reopen results
  if (timedTimeout) {
    clearTimeout(timedTimeout);
    timedTimeout = null;
  }
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
  if (wasTimed) {
    // Timed flags: show total points
    const correct = flagsCorrect || 0;
    const pts = correct * 50;
    const displayed = (typeof score === 'number' && score >= 0) ? score : pts;
    document.getElementById('results-text').innerHTML = `
      <div>Flags Game Over (${flagsGameMode === 'flag-to-country' ? 'Assign flag to country' : 'Assign country to flag'})</div>
      <div>Questions Right: <strong>${correct}</strong></div>
      <div>Total Points: <strong>${displayed}</strong></div>`;
  } else {
    // Non-timed flags: show time, wrong attempts, accuracy
    const total = (flagsCorrect || 0) + (flagsWrong || 0);
    const percent = total > 0 ? (((flagsCorrect || 0) / total) * 100).toFixed(1) : 100;
    const minutes = Math.floor((flagsElapsed || 0) / 60000);
    const seconds = Math.floor(((flagsElapsed || 0) / 1000) % 60).toString().padStart(2, '0');
    document.getElementById('results-text').innerHTML = `
      <div>Flags Game Over (${flagsGameMode === 'flag-to-country' ? 'Assign flag to country' : 'Assign country to flag'})</div>
      <div>Time: ${minutes}:${seconds}</div>
      <div>Wrong Attempts: ${flagsWrong||0}</div>
      <div>Accuracy: ${percent}%</div>`;
  }
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
    // Award points in timed mode: each answered flags question = 50 points
    if (timedModeActive && typeof score === 'number') score += 50;
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

const flagCache = new Map();
countriesData.forEach(c => {
  const img = new Image();
  img.src = `https://teorainneacha.vercel.app/bratai/${normalizeName(c.name)}.svg`;
  flagCache.set(c.cca2, img);
});
