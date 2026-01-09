function showMessage(text, icon = 'info') {
  const modal = document.getElementById("message-modal");
  modal.innerHTML = `<span class="material-symbols-rounded">${icon}</span><span>${text}</span>`;
  modal.style.opacity = "1";
  modal.style.display = "flex";
  modal.setAttribute('aria-hidden', 'false');
  let color = '';
  let duration = 2000;
  if (icon === 'correct') {
    color = '#0f992f';
    duration = 1000;
  } else if (icon === 'continent') {
    color = '#0f992f';
    duration = 3000;
  }
  if (color) modal.style.background = color;
  else modal.style.background = 'rgba(20,20,20,0.98)';
  if (modal._hideTimeout) clearTimeout(modal._hideTimeout);
  modal._hideTimeout = setTimeout(() => {
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
      modal.setAttribute('aria-hidden', 'true');
      modal.style.background = 'rgba(20,20,20,0.98)';
    }, 200);
  }, duration);
}
