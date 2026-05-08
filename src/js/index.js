 // ─── Configuration ───────────────────────────────────────────

    const NOTES = [
      { note: 'do',  solfege: 'Do',  key: 'a', freq: 261.63 }, // C4
      { note: 're',  solfege: 'Re',  key: 's', freq: 293.66 }, // D4
      { note: 'mi',  solfege: 'Mi',  key: 'd', freq: 329.63 }, // E4
      { note: 'fa',  solfege: 'Fa',  key: 'f', freq: 349.23 }, // F4
      { note: 'sol', solfege: 'Sol', key: 'g', freq: 392.00 }, // G4
      { note: 'la',  solfege: 'La',  key: 'h', freq: 440.00 }, // A4
      { note: 'si',  solfege: 'Si',  key: 'j', freq: 493.88 }, // B4
      { note: 'do2', solfege: 'Do',  key: 'k', freq: 523.25 }, // C5
    ];

    const PRESS_DURATION_MS = 200;

    // ─── State ───────────────────────────────────────────────────

    const keyElements  = new Map();
    const pillElements = new Map();

    // ─── Audio (Web Audio API - no file needed) ───────────────────

    let audioCtx = null;

    function getAudioContext() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return audioCtx;
    }

    function playNote(noteConfig) {
      const ctx = getAudioContext();

      // Resume if suspended (autoplay policy)
      if (ctx.state === 'suspended') ctx.resume();

      const { freq } = noteConfig;
      const now = ctx.currentTime;

      // Oscillator (piano-like: mix of sine + triangle)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const masterGain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now); // harmonic

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.55, now + 0.01);  // quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.25, now + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8); // decay

      masterGain.gain.setValueAtTime(0.8, now);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2);
      osc2.stop(now + 2);
    }

    // ─── Visual Feedback ─────────────────────────────────────────

    function showNoteDisplay(solfege) {
      const el = document.getElementById('currentNote');
      if (!el) return;
      el.textContent = solfege;
      el.classList.remove('ping');
      void el.offsetWidth;
      el.classList.add('ping');
    }

    function pressKey(keyEl) {
      keyEl.classList.add('pressed');
      setTimeout(() => keyEl.classList.remove('pressed'), PRESS_DURATION_MS);
    }

    function activatePill(note) {
      pillElements.forEach(p => p.classList.remove('active'));
      const pill = pillElements.get(note);
      if (pill) pill.classList.add('active');
    }

    // ─── DOM Construction ─────────────────────────────────────────

    function buildScalePills() {
      const container = document.getElementById('scalePills');
      NOTES.forEach(({ note, solfege }, i) => {
        const pill = document.createElement('span');
        pill.classList.add('scale-pill');
        pill.textContent = solfege;
        container.appendChild(pill);
        pillElements.set(note, pill);

        if (i < NOTES.length - 1) {
          const sep = document.createElement('span');
          sep.classList.add('scale-separator');
          sep.textContent = '·';
          container.appendChild(sep);
        }
      });
    }

    function buildKeys() {
      const container = document.getElementById('pianoKeys');

      NOTES.forEach(({ note, solfege, key }) => {
        const button = document.createElement('button');
        button.classList.add('piano-key');
        button.setAttribute('aria-label', `Mainkan nada ${solfege}`);
        button.dataset.note = note;
        button.dataset.key = key;

        button.innerHTML = `
          <span class="key-solfege">${solfege}</span>
          <span class="key-hint">${key.toUpperCase()}</span>
        `;

        button.addEventListener('click', () => handleNotePlay(NOTES.find(n => n.note === note), button));

        container.appendChild(button);
        keyElements.set(note, button);
      });
    }

    // ─── Core Handler ─────────────────────────────────────────────

    function handleNotePlay(noteConfig, keyEl) {
      playNote(noteConfig);
      pressKey(keyEl);
      showNoteDisplay(noteConfig.solfege);
      activatePill(noteConfig.note);
    }

    // ─── Keyboard Support ─────────────────────────────────────────

    const heldKeys = new Set();

    function handleKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (heldKeys.has(key)) return;

      const noteConfig = NOTES.find(n => n.key === key);
      if (!noteConfig) return;

      heldKeys.add(key);
      const keyEl = keyElements.get(noteConfig.note);
      if (keyEl) handleNotePlay(noteConfig, keyEl);
    }

    function handleKeyUp(event) {
      heldKeys.delete(event.key.toLowerCase());
    }

    // ─── Init ─────────────────────────────────────────────────────

    function init() {
      buildScalePills();
      buildKeys();
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }