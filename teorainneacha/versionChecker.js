(function() {
  // === CONFIG ===
  const CURRENT_VERSION = '1.5.5';
  const VERSION_URL = 'version.json';
  // 'page'  => dismiss only for the current page load (will reappear after reload)
  // 'session' => dismiss for the browser tab session (survives reloads, cleared when tab closes)
  const DISMISS_PERSISTENCE = 'page'; // choose 'page' or 'session'
  const CHECK_INTERVAL_MS = 1000;
  // ==============

  const DISMISS_KEY = 'teorainneacha_update_dismissed';
  let intervalId = null;
  let bannerShown = false;
  let dismissed = false; // in-memory flag (cleared on reload)

  // If persistence is 'session', read sessionStorage at start
  function initDismissStateFromStorage() {
    if (DISMISS_PERSISTENCE === 'session') {
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === '1') {
          dismissed = true;
        }
      } catch (e) {
        // ignore storage errors
      }
    }
  }

  async function checkVersion() {
    if (dismissed) {
      // If dismissed, stop checks for this run
      stopChecking();
      return;
    }

    try {
      const res = await fetch(VERSION_URL, {
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json();
      const remoteVersion = data && typeof data.version === 'string' ? data.version : null;
      if (!remoteVersion) return;

      if (remoteVersion !== CURRENT_VERSION && !bannerShown) {
        showBanner(remoteVersion);
      }
    } catch (err) {
      // silent fail; could log for debugging if desired
      // console.error('Version check failed', err);
    }
  }

  function showBanner(newVersion) {
    bannerShown = true;

    if (document.getElementById('update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'update-banner';

    // Modern CSS styling for the banner 
    banner.style.cssText = `      
      position: fixed;
      top: 20px;
      right: 20px;
      background: #222;
      color: #fff;
      padding: 20px;
      border-radius: 25px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      font-family: 'Geologica', sans-serif;
      max-width: 300px;
    `;

    // Insert HTML; we'll attach the dismiss handler programmatically so we can control behavior
    banner.innerHTML = `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.4;">
        A new version of Teorainneacha is available (${newVersion}). Any issues you may have encountered may have been fixed.
      </p>
      <div style="display: flex; gap: 15px; align-items: center; justify-content: flex-start;">
        <button id="update-banner-reload" style="
            font-family: 'Geologica', sans-serif; 
            background: #007acc; 
            color: white; 
            border: none; 
            padding: 8px 20px; 
            border-radius: 35px; 
            cursor: pointer; 
            font-weight: bold; 
            min-width: 100px;
            white-space: nowrap;">
            Reload
        </button>
        <button id="update-banner-dismiss" style="
            font-family: 'Geologica', sans-serif; 
            background: none; 
            color: #007acc; 
            border: none; 
            cursor: pointer; 
            text-decoration: underline; 
            font-size: 13px;
            white-space: nowrap;">
            Dismiss
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    // Attach listeners
    const reloadBtn = document.getElementById('update-banner-reload');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function() {
        window.location.reload();
      });
    }

    const dismissBtn = document.getElementById('update-banner-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function() {
        dismissBanner();
      });
    }

    // Expose the dismiss function globally too
    window.__teorainneacha_dismiss = dismissBanner;
  }

  function dismissBanner() {
    // Set in-memory flag so this load will stop checking
    dismissed = true;

    // Persist if configured
    if (DISMISS_PERSISTENCE === 'session') {
      try {
        sessionStorage.setItem(DISMISS_KEY, '1');
      } catch (e) {
        // ignore storage errors
      }
    }

    // Remove banner if present
    const b = document.getElementById('update-banner');
    if (b) b.remove();

    // Stop periodic checking for this run
    stopChecking();
  }

  function stopChecking() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Start automatically on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function() {
    initDismissStateFromStorage();

    // If already dismissed for this run, don't start checks
    if (dismissed) return;

    // Run an immediate check, then every CHECK_INTERVAL_MS
    checkVersion();
    intervalId = setInterval(checkVersion, CHECK_INTERVAL_MS);
  });


  window.__teorainneacha_clear_session_dismiss = function() {
    try {
      sessionStorage.removeItem(DISMISS_KEY);
    } catch (e) {}
  };
})();
