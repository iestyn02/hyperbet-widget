/** */

document.addEventListener('htmx:afterSwap', function (evt) {
  if (evt.detail?.target?.id === 'betsBody') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/** @note ~ SSE Events Listener to dismiss toast notification */
document.getElementById('sse-events').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-toast-action]');
  if (!btn) return;

  const toast = btn.closest('.toast');

  toast.classList.remove('toast--visible');

  setTimeout(() => toast.remove(), 200);
});

/** @note ~ Only one toastr at a time since we
 *  replace content everytime so no need to loop */
document.addEventListener('htmx:sseMessage', () => {
  setTimeout(() => {
    document.getElementById('bet-toast').classList.add('toast--visible');
  }, 200);
});
