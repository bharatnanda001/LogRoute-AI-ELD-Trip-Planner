// src/utils/soundEffects.js
// Web Audio API Synthesizer for pencil scratching on paper effect

let audioCtx = null;
let pencilBuffer = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate realistic paper scratching noise buffer
function createPencilScratchBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 0.1; // 100ms burst
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Filtered noise with slight paper texture modulation
    data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
  }
  return buffer;
}

export function playPencilScratch(muted = false) {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (!pencilBuffer) {
      pencilBuffer = createPencilScratchBuffer(ctx);
    }
    const source = ctx.createBufferSource();
    source.buffer = pencilBuffer;

    // Highpass filter to mimic paper texture pitch
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800; // crisp graphite frequency
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
  } catch (e) {
    // Ignore audio context block policies if user hasn't touched DOM
  }
}
