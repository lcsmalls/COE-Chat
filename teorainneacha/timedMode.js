// v.1.5.7
function startTimedGame(submode) {
  // submode: 'countries' | 'cities' | 'flags'
  // allow results for this new timed run
  resultsShown = false;
  timedModeActive = true;
  // hide autocomplete suggestions for timed mode
  const ac = document.getElementById('autocomplete-list');
  if (ac) ac.style.display = 'none';
  // Close menus/screens then start respective flow
  document.getElementById('timed-mode-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('flags-start-screen').style.display = 'none';
  // Reset game state
  round = 1;
  wrongGuesses = 0;
  revealedCountries.clear();
  revealedCapitals.clear();
  skippedCountries = [];
  mapGroup.selectAll('image').remove();
  mapGroup.selectAll('path.country').classed('revealed', false).attr('fill', null);
  if (submode === 'flags') {
    // start flags game for whole world and enforce 60s end
    ensureFlagsData().then(() => {
      score = 0;
      // start a countdown timer shown in the main timer element
      countdownEnd = Date.now() + TIMED_DURATION_MS;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const remaining = Math.max(0, countdownEnd - Date.now());
        const totalSec = Math.ceil(remaining / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = `${min}:${sec.toString().padStart(2,'0')}`;
        const flagsTimerEl = document.getElementById('flags-timer');
        if (flagsTimerEl) flagsTimerEl.textContent = `${min}:${sec.toString().padStart(2,'0')}`;
        if (remaining <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          // finish timed flags game
          endFlagsGame();
          timedModeActive = false;
        }
      }, 250);
      // also ensure a fallback timeout
      if (timedTimeout) clearTimeout(timedTimeout);
      timedTimeout = setTimeout(() => {
        endFlagsGame();
        timedModeActive = false;
      }, TIMED_DURATION_MS + 250);
      startFlagsGame('all');
    });
    return;
  }
  // For countries and cities, set game type then start
  gameType = submode === 'cities' ? 'cities' : 'countries';
  // start countdown timer and rounds
  score = 0;
  countdownEnd = Date.now() + TIMED_DURATION_MS;
  // clear any previous interval
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const remaining = Math.max(0, countdownEnd - Date.now());
    const totalSec = Math.ceil(remaining / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    document.getElementById('timer').textContent = `${min}:${sec.toString().padStart(2,'0')}`;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      // finish timed game
      endTimedGame();
    }
  }, 250);
  // enforce 60s stop
  if (timedTimeout) clearTimeout(timedTimeout);
  timedTimeout = setTimeout(() => {
    endTimedGame();
  }, TIMED_DURATION_MS);
  // initialize first prompt
  if (gameType === 'countries') {
    nextRound();
  } else {
    // Timed cities: show capital dots like regular Cities mode
    mapGroup.selectAll('path.country').classed('revealed', true);
    capitalDots.forEach(dot => dot.remove());
    capitalDots = [];
    capitalsOrder.forEach((rec, i) => {
      const coords = projection([rec.latlng[1], rec.latlng[0]]);
      const dot = mapGroup.append('circle')
        .attr('cx', coords[0]).attr('cy', coords[1])
        .attr('r', 2)
        .attr('class', 'capital-dot capital-dot-grey')
        .attr('data-capital', rec.capital)
        .attr('data-country', rec.country);
      capitalDots.push(dot);
    });
    nextCitiesRound();
  }
}

function endTimedGame() {
  if (resultsShown) return;
  resultsShown = true;
  // Stop timers
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  // mark timed mode finished and clear scheduled timeouts
  timedModeActive = false;
  if (timedTimeout) {
    clearTimeout(timedTimeout);
    timedTimeout = null;
  }
  // bring up results screen
  // Show questions-right and total points (50 points per item)
  let correctCount = 0;
  if (gameType === 'countries') correctCount = revealedCountries.size || 0;
  else if (gameType === 'cities') correctCount = revealedCapitals.size || 0;
  else correctCount = 0;
  const points = (correctCount || 0) * 50;
  // prefer authoritative score if present, but compute from counts for clarity
  const displayedPoints = (typeof score === 'number' && score >= 0) ? score : points;
  document.getElementById('results-text').innerHTML = `
      <div>Timed Mode Over (${gameType === 'countries' ? 'Countries' : (gameType === 'cities' ? 'Cities' : 'Flags')})</div>
      <div>Questions Right: <strong>${correctCount}</strong></div>
      <div>Total Points: <strong>${displayedPoints}</strong></div>`;
  document.getElementById('results-screen').style.display = 'flex';
  // restore autocomplete visibility
  const ac = document.getElementById('autocomplete-list');
  if (ac) ac.style.display = '';
}
