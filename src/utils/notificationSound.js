// ── Notification Sound Utility ─────────────────────────────────
// Professional sounds using Web Audio API — no external files needed
// Sounds only play for RECEIVERS, never the sender

let audioCtx = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const createEnvelopedTone = (ctx, freq, type, startTime, duration, peakGain = 0.3) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(4000, startTime);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
};

// ── Task notification: quick ascending chirp (A4 → A5, ~0.18s) ──
// Bright and attention-grabbing — "action needed"
export const playTaskSound = (assignerEmail, currentUserEmail) => {
  if (assignerEmail && currentUserEmail && assignerEmail === currentUserEmail) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // A4 (440Hz) — sharp attack
    createEnvelopedTone(ctx, 440, 'sine', now, 0.10, 0.22);
    // A5 (880Hz) — quick rise, brighter
    createEnvelopedTone(ctx, 880, 'sine', now + 0.08, 0.10, 0.18);
  } catch (e) { /* browser blocked audio */ }
};

// ── Chat notification: soft two-tone ding (C5 → E5, ~0.25s) ──
// Gentle and conversation-like — "someone messaged you"
export const playChatSound = (senderEmail, currentUserEmail) => {
  if (senderEmail && currentUserEmail && senderEmail === currentUserEmail) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // C5 (523Hz) — soft first note
    createEnvelopedTone(ctx, 523, 'sine', now, 0.20, 0.14);
    // E5 (659Hz) — gentle resolution, slightly quieter
    createEnvelopedTone(ctx, 659, 'sine', now + 0.13, 0.25, 0.11);
  } catch (e) { /* browser blocked audio */ }
};