// v.1.5.7
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
