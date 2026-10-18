/**
 * Web Audio API synthesizer for clean, non-intrusive OTP detection sound.
 * Doesn't rely on external MP3/WAV assets.
 */

export function playOtpChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Pleasant two-tone ascending major chord (F#5 -> B5)
    playTone(739.99, 0, 0.18, 0.15);
    playTone(987.77, 0.12, 0.35, 0.2);
  } catch (err) {
    // AudioContext might be blocked until user gesture; ignore safely
    console.debug('Audio chime could not play:', err);
  }
}
