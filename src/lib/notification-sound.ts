let audioContext: AudioContext | null = null;
let masterBus: { input: GainNode } | null = null;

// ---------------------------------------------------------------------------
// Tracking log
// Every notification-sound decision is written to the console AND kept in
// localStorage (last 200 entries) so it survives reloads. From devtools:
//   notificationSoundLog()        -> table of the history
//   notificationSoundLog.clear()  -> wipe it
// ---------------------------------------------------------------------------
const LOG_KEY = "limiance-notification-sound-log";
const LOG_MAX = 200;
const LOUDNESS = 0.9; // per-note peak (0-1). Was 0.18 / 0.16.

export type NotificationSoundEvent =
  | "detected" // a new notification showed up in history
  | "played" // chime was started
  | "skipped" // chime intentionally not played (see reason)
  | "blocked" // browser audio is locked until the user interacts
  | "error";

export interface NotificationSoundLogEntry {
  at: string;
  event: NotificationSoundEvent;
  source?: string;
  id?: string;
  title?: string;
  type?: string;
  reason?: string;
  audioState?: string;
}

export function logNotificationSound(entry: Omit<NotificationSoundLogEntry, "at">) {
  if (typeof window === "undefined") return;
  const full: NotificationSoundLogEntry = { at: new Date().toISOString(), ...entry };
  console.log(
    `[notif-sound] ${full.event}${full.reason ? ` (${full.reason})` : ""}`,
    full
  );
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    const list: NotificationSoundLogEntry[] = raw ? JSON.parse(raw) : [];
    list.push(full);
    window.localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(-LOG_MAX)));
  } catch {
    // storage full/blocked: console log above is still there
  }
}

function installLogViewer() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, any>;
  if (w.notificationSoundLog) return;
  const read = () => {
    try {
      return JSON.parse(window.localStorage.getItem(LOG_KEY) ?? "[]");
    } catch {
      return [];
    }
  };
  const viewer: any = () => {
    const list = read();
    console.table(list);
    return list;
  };
  viewer.clear = () => window.localStorage.removeItem(LOG_KEY);
  w.notificationSoundLog = viewer;
}
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
  installLogViewer();

  const resume = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      void ctx
        .resume()
        .then(() => logNotificationSound({ event: "played", reason: "audio unlocked by user interaction", audioState: ctx.state }))
        .catch(() => undefined);
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

  oscillator.type = "triangle"; // richer harmonics, sounds louder than sine at the same level
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(getMasterBus(ctx).input);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

// Shared output stage: a boost + compressor so stacked notes can be loud
// without clipping/distorting.
function getMasterBus(ctx: AudioContext) {
  if (masterBus) return masterBus;
  const input = ctx.createGain();
  input.gain.value = 1.8;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -8;
  compressor.knee.value = 6;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.2;
  input.connect(compressor);
  compressor.connect(ctx.destination);
  masterBus = { input };
  return masterBus;
}

export interface NotificationSoundMeta {
  source?: string;
  id?: string;
  title?: string;
  type?: string;
}

/**
 * Play a loud three-note notification chime. Synthesised with the Web Audio
 * API so no audio asset needs to be bundled or downloaded.
 *
 * @param signature optional key used to suppress duplicate plays when the same
 *   notification arrives through multiple channels (FCM + polling).
 * @param meta only used for the tracking log.
 */
export function playNotificationSound(signature?: string, meta: NotificationSoundMeta = {}) {
  if (typeof window === "undefined") return;
  unlockNotificationAudio();

  if (signature) {
    const now = Date.now();
    const last = recentlyPlayed.get(signature);
    if (last && now - last < DEDUPE_WINDOW_MS) {
      logNotificationSound({ event: "skipped", reason: "duplicate within 5s", ...meta });
      return;
    }

    recentlyPlayed.set(signature, now);
    if (recentlyPlayed.size > 50) {
      for (const [key, timestamp] of recentlyPlayed) {
        if (now - timestamp > DEDUPE_WINDOW_MS) recentlyPlayed.delete(key);
      }
    }
  }

  const ctx = getAudioContext();
  if (!ctx) {
    logNotificationSound({ event: "error", reason: "Web Audio not supported", ...meta });
    return;
  }

  const start = () => {
    const t0 = ctx.currentTime;
    playTone(ctx, 880, t0, 0.18, LOUDNESS);
    playTone(ctx, 1318.5, t0 + 0.15, 0.2, LOUDNESS);
    playTone(ctx, 1760, t0 + 0.32, 0.32, LOUDNESS);
    logNotificationSound({ event: "played", audioState: ctx.state, ...meta });
  };

  if (ctx.state === "suspended") {
    logNotificationSound({
      event: "blocked",
      reason: "audio suspended (no user interaction yet) - trying to resume",
      audioState: ctx.state,
      ...meta,
    });
    void ctx
      .resume()
      .then(start)
      .catch((err) =>
        logNotificationSound({ event: "error", reason: `resume failed: ${String(err)}`, ...meta })
      );
  } else {
    start();
  }
}
