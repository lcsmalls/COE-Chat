// v.1.5.7
function startTimer() {
  startTime = Date.now() - elapsed;
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  // When in timed mode we use a countdown updater; prevent the regular elapsed timer from overwriting it
  if (timedModeActive) return;
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
  // If we're in a timed mode countdown, the main countdown updates `#flags-timer`.
  // Avoid starting a separate flags timer which would conflict and cause flicker.
  if (timedModeActive) return;
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
