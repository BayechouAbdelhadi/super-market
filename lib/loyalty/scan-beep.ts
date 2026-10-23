import { LOYALTY_CONFIG } from "./config";

/** Browser only. Shared context: iOS allows audio only once a context was started by a tap. */
let audioContext: AudioContext | null = null;

/**
 * Prepares the beep. Call it from a tap handler (e.g. the button opening the scanner):
 * iOS Safari keeps an AudioContext muted unless it was created or resumed during a user gesture.
 */
export function unlockScanBeep(): void {
  if (typeof window === "undefined" || !window.AudioContext) return;
  audioContext ??= new AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
}

/** Plays the short confirmation beep of a successful scan. */
export function playScanBeep(): void {
  if (!audioContext) return;
  const { frequencyHz, durationMs, volume } = LOYALTY_CONFIG.card.scanBeep;
  const now = audioContext.currentTime;
  const end = now + durationMs / 1000;

  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequencyHz, now);

  // Fast attack and release: a clean beep without clicks
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.005);
  gain.gain.setValueAtTime(volume, end - 0.02);
  gain.gain.linearRampToValueAtTime(0, end);

  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(end);
}
