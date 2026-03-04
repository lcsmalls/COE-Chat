(function() {
  const STATUS_URL = 'https://raw.githubusercontent.com/lcsmalls/COE-Chat/refs/heads/main/teorainneacha/status.json';
  
  async function checkStatus() {
    try {
      // Use a timestamp to bypass GitHub's cache for instant updates
      const res = await fetch(`${STATUS_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      
      const data = await res.json();
      
      // If the status is "down", redirect immediately
      if (data.status === 'down') {
        window.location.href = 'down.html';
      }
    } catch (err) {
      // If the check fails, we assume the site is up to avoid false alarms
      console.error("Status check failed:", err);
    }
  }

  // Run the check as soon as the script loads
  checkStatus();
})();
