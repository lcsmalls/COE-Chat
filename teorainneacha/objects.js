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
  // clear timed mode state
  timedModeActive = false;
  if (timedTimeout) {
    clearTimeout(timedTimeout);
    timedTimeout = null;
  }
  resultsShown = false;
  const ac = document.getElementById('autocomplete-list');
  if (ac) ac.style.display = '';
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
  // clear timed mode state
  timedModeActive = false;
  if (timedTimeout) {
    clearTimeout(timedTimeout);
    timedTimeout = null;
  }
  resultsShown = false;
  const ac = document.getElementById('autocomplete-list');
  if (ac) ac.style.display = '';
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
  // clear timed mode state
  timedModeActive = false;
  if (timedTimeout) {
    clearTimeout(timedTimeout);
    timedTimeout = null;
  }
  resultsShown = false;
  const ac = document.getElementById('autocomplete-list');
  if (ac) ac.style.display = '';
});


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
  // Hide results and clear any scheduled timers so it doesn't reopen
  document.getElementById("results-screen").style.display = "none";
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (flagsTimerInterval) {
    clearInterval(flagsTimerInterval);
    flagsTimerInterval = null;
  }
  if (timedTimeout) {
    clearTimeout(timedTimeout);
    timedTimeout = null;
  }
  timedModeActive = false;
});
