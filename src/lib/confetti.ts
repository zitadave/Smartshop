/**
 * Confetti burst effect — lightweight, no library needed.
 * Creates and animates colored particles.
 */

const COLORS = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#ed64a6', '#0bc5ea'];
const SHAPES = ['circle', 'square'];

interface ConfettiOptions {
  count?: number;
  duration?: number;
}

export function burstConfetti({ count = 40, duration = 3000 }: ConfettiOptions = {}) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const size = 4 + Math.random() * 8;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const rotate = Math.random() * 720;
    const xDrift = (Math.random() - 0.5) * 200;

    el.style.cssText = `
      position:absolute;
      left:${left}%;
      top:-10px;
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:${shape === 'circle' ? '50%' : '2px'};
      animation:confettiFall ${2 + Math.random() * 2}s ease-out ${delay}s forwards;
      --x-drift:${xDrift}px;
      --rotate:${rotate}deg;
    `;
    container.appendChild(el);
  }

  // Add keyframes if not already added
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes confettiFall {
        0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) translateX(var(--x-drift)) rotate(var(--rotate)); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => container.remove(), duration + 1000);
}

/**
 * Telegram haptic feedback (works inside Telegram Mini App)
 */
export function haptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'medium') {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (style === 'success' || style === 'error') {
        tg.HapticFeedback.notificationOccurred(style);
      } else {
        tg.HapticFeedback.impactOccurred(style);
      }
    }
  } catch {}
}
