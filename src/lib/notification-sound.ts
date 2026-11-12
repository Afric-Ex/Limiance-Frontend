let audioContext: AudioContext | null = null;
let unlockAttached = false;
const recentlyPlayed = new Map<string, number>();
const DEDUPE_WINDOW_MS = 5000;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

/**
 * Browsers keep an AudioContext suspended until the user interacts with the
 * page. Attach one-time listeners so the first click/keypress unlocks audio and
 * subsequent notification sounds can play without further interaction.
 */
export function unlockNotificationAudio() {
  if (typeof window === "undefined" || unlockAttached) return;
  unlockAttached = true;

  const resume = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }
  };

  window.addEventListener("pointerdown", resume, { once: true, passive: true });
  window.addEventListener("keydown", resume, { once: true });
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  peak: number
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

/**
 * Play a short WhatsApp-style two-note notification chime. Synthesised with the
 * Web Audio API so no audio asset needs to be bundled or downloaded.
 *
 * @param signature optional key used to suppress duplicate plays when the same
 *   notification arrives through multiple channels (FCM + polling).
 */
export function playNotificationSound(signature?: string) {
  if (typeof window === "undefined") return;
  unlockNotificationAudio();

  if (signature) {
    const now = Date.now();
    const last = recentlyPlayed.get(signature);
    if (last && now - last < DEDUPE_WINDOW_MS) return;

    recentlyPlayed.set(signature, now);
    if (recentlyPlayed.size > 50) {
      for (const [key, timestamp] of recentlyPlayed) {
        if (now - timestamp > DEDUPE_WINDOW_MS) recentlyPlayed.delete(key);
      }
    }
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const start = () => {
    const t0 = ctx.currentTime;
    // Two quick notes, like a WhatsApp "ping"
    playTone(ctx, 880, t0, 0.16, 0.18);
    playTone(ctx, 1318.5, t0 + 0.14, 0.22, 0.16);
  };

  if (ctx.state === "suspended") {
    void ctx.resume().then(start).catch(() => undefined);
  } else {
    start();
  }
}
