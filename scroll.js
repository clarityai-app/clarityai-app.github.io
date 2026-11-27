// Smooth scrolling for links within the home and privacy pages (the nav, the "Get ClarityAI" buttons,
// the policy's contents). Browsers turn CSS smooth scrolling off when the system asks for reduced
// motion (Windows' "Animation effects", for one), and ClarityAI's pages animate for everyone, so this
// glides the page itself, a frame at a time.
//
// The page is already on screen and moves, so the glide eases in and out; longer trips take a little
// longer, from 400 ms to 800 ms. A wheel, touch or key press hands control straight back. Links used
// with the keyboard, and the "Skip to content" link, jump at once.

const easeInOutCubic = progress => (progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2);
let frame = 0;

function glideTo(top) {
  cancelAnimationFrame(frame);
  const start = window.scrollY;
  const distance = top - start;
  if (Math.abs(distance) < 2) return;
  const duration = Math.min(800, 400 + Math.abs(distance) * 0.15);
  const began = performance.now();
  const step = now => {
    const progress = Math.min(1, (now - began) / duration);
    window.scrollTo({ top: start + distance * easeInOutCubic(progress), behavior: 'instant' });
    if (progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
}

for (const type of ['wheel', 'touchstart', 'keydown']) {
  addEventListener(type, () => cancelAnimationFrame(frame), { passive: true });
}

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (event.detail === 0) return; // pressed with the keyboard
  const link = event.target.closest('a[href^="#"]');
  if (!link || link.classList.contains('skip')) return;
  const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
  if (!target) return;
  event.preventDefault();

  // Stop where the browser would: the section's top, less the page's scroll padding.
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const furthest = document.documentElement.scrollHeight - window.innerHeight;
  const top = Math.max(0, Math.min(target.getBoundingClientRect().top + window.scrollY - padding, furthest));
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  glideTo(top);

  // Screen readers follow along: the section takes focus without jumping the page.
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});
