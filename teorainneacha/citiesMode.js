function nextCitiesRound() {
  if (timedModeActive && gameType === 'cities') {
    // Timed cities: pick a random country (any continent) each round
    const pool = capitalsData.filter(c => !revealedCapitals.has(c.capital));
    if (!pool || pool.length === 0) {
      endGame();
      return;
    }
    currentCountry = pool[Math.floor(Math.random() * pool.length)];
    currentContinent = currentCountry.region;
    // show prompt for timed cities as well
    let promptText = `Round ${round}: What is the capital of ${currentCountry.country}?`;
    document.getElementById("prompt").innerText = promptText;
    return;
  }
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

function revealCapital(rec) {
  if (revealedCapitals.has(rec.capital)) return;
  revealedCapitals.add(rec.capital);
  capitalDots.forEach(dot => {
    if (dot.attr("data-capital") === rec.capital) {
      dot.classed("capital-dot-grey", false).classed("capital-dot-red", true);
    }
  });
  // award points during timed mode (50 points per revealed/answered capital)
  if (timedModeActive && typeof score === 'number') score += 50;
}
