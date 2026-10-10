const picker = document.getElementById('day-select');
function revealDay() {
  const match = /^#day-(\d{1,2})$/.exec(location.hash);
  if (!match) { picker.value = ''; return; }
  const day = document.getElementById(`day-${Number(match[1])}`);
  if (!day) return;
  day.open = true;
  picker.value = String(Number(match[1]));
  document.querySelectorAll('.itinerary-row').forEach(link => {
    if (link.hash === location.hash) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
  requestAnimationFrame(() => day.scrollIntoView({block:'start'}));
}
picker.addEventListener('change', () => { if (picker.value !== '') location.hash = `day-${picker.value}`; });
window.addEventListener('hashchange',revealDay);
window.addEventListener('pageshow',revealDay);
// Re-open a collapsed day even if the URL already points to it.
document.addEventListener('click',event => {
  const link=event.target.closest('a[href^="#day-"]');
  if(link && link.hash===location.hash) revealDay();
});
revealDay();
