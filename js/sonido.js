/* ==========================================================================
   sonido.js · efectos de acierto/fallo y música de fondo china
   --------------------------------------------------------------------------
   Todo se sintetiza en el navegador (Web Audio), sin ficheros:
   - efectos: cuerdas punteadas tipo guzheng (Karplus-Strong), gong,
     bloque de madera y campanillas (iguales que en HSK1)
   - música de la portada: erhu (二胡) cantando sobre la pentatónica en
     modo 商 (la-si-re-mi-sol), arpegios de yangqin (扬琴) en trémolo y una
     campana de templo. Distinta de la de HSK1 (guzheng) y HSK2 (flauta).
   La música suena solo en los menús; en los ejercicios, solo los efectos.
   ========================================================================== */
(function (global) {
  "use strict";

  var AC = global.AudioContext || global.webkitAudioContext;
  var ctx = null, master = null, musicBus = null, sfxBus = null, reverb = null;
  var prefs = { music: true, sfx: true, musicVol: 0.5 };
  var mode = "menu";            // "menu" (con música) o "exercise" (sin música)
  var unlocked = false;
  var bufCache = {};

  // Pentatónica en re: D E F# A B  (宫 商 角 徵 羽)
  var BASE = 146.83;            // re3
  var STEPS = [0, 2, 4, 7, 9];
  function pent(i) {            // i-ésima nota de la escala (puede ser negativa)
    var oct = Math.floor(i / 5), deg = ((i % 5) + 5) % 5;
    return BASE * Math.pow(2, oct + STEPS[deg] / 12);
  }

  function init() {
    if (ctx || !AC) return !!ctx;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    // reverberación suave (sala de madera)
    reverb = ctx.createConvolver();
    var len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    reverb.buffer = ir;
    var wet = ctx.createGain(); wet.gain.value = 0.35; reverb.connect(wet); wet.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master); musicBus.connect(reverb);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master); sfxBus.connect(reverb);
    return true;
  }

  // ------------------------------------------------------------ instrumentos
  /** Cuerda punteada (Karplus-Strong), cacheada por frecuencia. */
  function pluckBuffer(freq, bright) {
    var key = Math.round(freq * 10) + (bright ? "b" : "");
    if (bufCache[key]) return bufCache[key];
    var sr = ctx.sampleRate, dur = 3.2, n = Math.floor(sr * dur);
    var buf = ctx.createBuffer(1, n, sr), out = buf.getChannelData(0);
    var period = Math.max(2, Math.round(sr / freq));
    var line = new Float32Array(period);
    for (var i = 0; i < period; i++) line[i] = Math.random() * 2 - 1;
    var damp = bright ? 0.4985 : 0.4975, idx = 0, prev = 0;
    for (var s = 0; s < n; s++) {
      var cur = line[idx];
      var nx = damp * (cur + prev);
      prev = cur;
      line[idx] = nx;
      out[s] = cur;
      idx = (idx + 1) % period;
    }
    // ataque suave
    for (var a = 0; a < 120; a++) out[a] *= a / 120;
    bufCache[key] = buf;
    return buf;
  }
  function pluck(freq, when, vol, bus, bright) {
    var src = ctx.createBufferSource();
    src.buffer = pluckBuffer(freq, bright);
    var g = ctx.createGain(); g.gain.value = vol;
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = bright ? 5200 : 3200;
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(when);
    // ligera vibración de la cuerda, como en el guzheng
    src.playbackRate.setValueAtTime(1, when);
    src.playbackRate.linearRampToValueAtTime(1.004, when + 0.35);
    src.playbackRate.linearRampToValueAtTime(0.998, when + 0.8);
  }
  function tone(freq, when, dur, vol, type, bus, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(bus);
    o.start(when); o.stop(when + dur + 0.05);
  }
  /** Gong: parciales inarmónicos con caída lenta. */
  function gong(when, vol, low) {
    var f0 = low ? 72 : 110;
    [[1, 1], [1.48, 0.6], [2.03, 0.45], [2.76, 0.3], [3.9, 0.18], [5.3, 0.1]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(f0 * p[0] * 1.02, when);
      o.frequency.exponentialRampToValueAtTime(f0 * p[0], when + 1.2);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(vol * p[1], when + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, when + (low ? 3.2 : 2.6));
      o.connect(g); g.connect(sfxBus);
      o.start(when); o.stop(when + 3.4);
    });
  }
  /** Bloque de madera (木鱼). */
  function woodblock(when, vol, freq) {
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = "triangle"; o.frequency.setValueAtTime(freq || 820, when);
    o.frequency.exponentialRampToValueAtTime((freq || 820) * 0.7, when + 0.08);
    f.type = "bandpass"; f.frequency.value = freq || 820; f.Q.value = 4;
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    o.connect(f); f.connect(g); g.connect(sfxBus);
    o.start(when); o.stop(when + 0.2);
  }
  function chime(freq, when, vol, bus) {
    tone(freq, when, 2.2, vol, "sine", bus, 0.005);
    tone(freq * 2.76, when, 0.9, vol * 0.25, "sine", bus, 0.005);
  }

  // ------------------------------------------------------------ efectos
  var SFX = {
    ok: function (t) { pluck(pent(10), t, 0.5, sfxBus, true); pluck(pent(12), t + 0.09, 0.5, sfxBus, true); pluck(pent(14), t + 0.18, 0.55, sfxBus, true); chime(pent(17), t + 0.26, 0.08, sfxBus); },
    mid: function (t) { pluck(pent(10), t, 0.45, sfxBus, true); pluck(pent(11), t + 0.14, 0.4, sfxBus, false); },
    ko: function (t) { woodblock(t, 0.55, 520); woodblock(t + 0.14, 0.45, 430); pluck(pent(3), t + 0.05, 0.35, sfxBus, false); },
    tick: function (t) { woodblock(t, 0.18, 1400); },
    hover: function (t) { chime(pent(15 + Math.floor(Math.random() * 3)), t, 0.035, sfxBus); },
    abrir: function (t) { gong(t, 0.16, false); [10, 12, 14, 15].forEach(function (d, i) { pluck(pent(d), t + 0.05 + i * 0.06, 0.35, sfxBus, true); }); },
    flip: function (t) { pluck(pent(12), t, 0.35, sfxBus, true); pluck(pent(14), t + 0.12, 0.3, sfxBus, true); },
    // resultado final
    excelente: function (t) {
      gong(t, 0.28, false);
      [5, 7, 8, 10, 12, 13, 15, 17].forEach(function (d, i) { pluck(pent(d), t + 0.1 + i * 0.075, 0.45, sfxBus, true); });
      chime(pent(20), t + 0.8, 0.1, sfxBus); chime(pent(22), t + 0.95, 0.08, sfxBus);
    },
    aprobado: function (t) {
      [7, 9, 10, 12].forEach(function (d, i) { pluck(pent(d), t + i * 0.1, 0.45, sfxBus, true); });
      pluck(pent(14), t + 0.45, 0.5, sfxBus, true); chime(pent(17), t + 0.55, 0.07, sfxBus);
    },
    suspenso: function (t) {
      gong(t, 0.22, true);
      [9, 8, 7, 5].forEach(function (d, i) { pluck(pent(d), t + 0.15 + i * 0.2, 0.35, sfxBus, false); });
    }
  };
  function sfx(name) {
    if (!prefs.sfx || !init()) return;
    if (ctx.state === "suspended") ctx.resume();
    var f = SFX[name]; if (f) f(ctx.currentTime + 0.02);
  }

  // ------------------------------------------------------------ música de fondo
  // Modo 商 (shang) sobre la: la si re mi sol.
  var MBASE = 110;              // la2
  var MSTEPS = [0, 2, 5, 7, 10];
  function sh(i) {
    var oct = Math.floor(i / 5), deg = ((i % 5) + 5) % 5;
    return MBASE * Math.pow(2, oct + MSTEPS[deg] / 12);
  }
  /** Erhu: diente de sierra filtrado, arco lento, deslizamientos y vibrato. */
  function erhu(freq, when, dur, vol, from) {
    var o = ctx.createOscillator(); o.type = "sawtooth";
    var f1 = ctx.createBiquadFilter(); f1.type = "lowpass"; f1.frequency.value = freq * 5; f1.Q.value = 0.7;
    var f2 = ctx.createBiquadFilter(); f2.type = "peaking"; f2.frequency.value = 1100; f2.gain.value = 5; f2.Q.value = 1.2;
    var g = ctx.createGain(); g.gain.value = 0;
    o.connect(f1); f1.connect(f2); f2.connect(g); g.connect(musicBus);
    var start = from || freq * 0.97;
    o.frequency.setValueAtTime(start, when);
    o.frequency.exponentialRampToValueAtTime(freq, when + (from ? 0.28 : 0.12));
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, when);
    lg.gain.linearRampToValueAtTime(freq * 0.012, when + Math.min(0.8, dur * 0.5));
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.25);
    g.gain.linearRampToValueAtTime(vol * 0.8, when + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, when + dur);
    [o, lfo].forEach(function (x) { x.start(when); x.stop(when + dur + 0.1); });
  }
  /** Yangqin: golpes brillantes; con trémolo, varias notas repetidas. */
  function yangqin(freq, when, vol, trem) {
    if (!trem) { pluck(freq, when, vol, musicBus, true); return; }
    for (var k = 0; k < 6; k++) pluck(freq, when + k * 0.07, vol * (1 - k * 0.1), musicBus, true);
  }
  /** Campana de templo. */
  function templeBell(when, vol) {
    [[1, 1], [2.02, 0.5], [2.98, 0.3], [4.1, 0.15]].forEach(function (p) {
      tone(sh(5) * p[0], when, 7, vol * p[1], "sine", musicBus, 0.005);
    });
  }

  var timer = null, playing = false, drone = null, pos = 12, beat = 0, nextT = 0, phraseLeft = 0, lastF = 0;
  function startDrone() {
    var g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus);
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 300; f.connect(g);
    var oscs = [MBASE / 2, MBASE * 0.75, MBASE].map(function (fr, i) {
      var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = fr;
      o.detune.value = (i - 1) * 6; o.connect(f); o.start(); return o;
    });
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.06; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    g.gain.setTargetAtTime(0.05, ctx.currentTime, 2.5);
    drone = { g: g, oscs: oscs.concat([lfo]) };
  }
  function stopDrone() {
    if (!drone) return;
    var d = drone; drone = null;
    d.g.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
    setTimeout(function () { d.oscs.forEach(function (o) { try { o.stop(); } catch (e) { /* nada */ } }); }, 3000);
  }
  function schedule() {
    // Frases de erhu; entre frase y frase responde el yangqin con un arpegio
    // (a veces en trémolo) y, de vez en cuando, suena la campana del templo.
    while (nextT < ctx.currentTime + 2.5) {
      var t = nextT;
      if (phraseLeft <= 0) {
        var base = 10 + Math.floor(Math.random() * 3);
        var arp = [0, 2, 4, 5].map(function (d) { return sh(base + d); });
        arp.forEach(function (f, k) { yangqin(f, t + 0.2 + k * 0.26, 0.2, k === 3 && Math.random() < 0.6); });
        if (Math.random() < 0.3) templeBell(t + 1.4, 0.035);
        phraseLeft = 3 + Math.floor(Math.random() * 4);
        pos = 9 + Math.floor(Math.random() * 3);
        lastF = 0;
        nextT += 2.8 + Math.random() * 1.6;
        continue;
      }
      pos += [-2, -1, 1, 1, 2, -1, 0][Math.floor(Math.random() * 7)];
      if (pos < 6) pos = 7; if (pos > 13) pos = 11;
      var last = phraseLeft === 1;
      var dur = last ? 2.8 + Math.random() : [0.8, 1.1, 1.4, 1.8][Math.floor(Math.random() * 4)];
      var f = sh(last ? (Math.random() < 0.5 ? 10 : 5) : pos);
      erhu(f, t, dur, 0.07, lastF && Math.random() < 0.45 ? lastF : 0);
      if (beat % 4 === 0) pluck(sh(Math.random() < 0.5 ? 0 : 3), t, 0.3, musicBus, false);
      if (Math.random() < 0.25) yangqin(sh(pos + 5), t + dur * 0.5, 0.1, false);
      lastF = f; beat++; phraseLeft--;
      nextT += dur * 0.95;
    }
  }
  function musicOn() {
    if (playing || !prefs.music || mode !== "menu" || !unlocked || !init()) return;
    if (ctx.state === "suspended") ctx.resume();
    playing = true;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0.55 * prefs.musicVol, ctx.currentTime, 1.2);
    nextT = ctx.currentTime + 0.3; beat = 0; phraseLeft = 0;
    startDrone();
    timer = setInterval(schedule, 500);
    schedule();
  }
  function musicOff() {
    if (!playing) return;
    playing = false;
    clearInterval(timer); timer = null;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
    stopDrone();
  }
  function refresh() { if (prefs.music && mode === "menu") musicOn(); else musicOff(); }

  // El navegador solo deja sonar audio tras un gesto del usuario.
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (init() && ctx.state === "suspended") ctx.resume();
    refresh();
    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { document.removeEventListener(ev, unlock, true); });
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, unlock, true); });

  global.Sonido = {
    sfx: sfx,
    setMode: function (m) { mode = m; refresh(); },
    setPrefs: function (p) {
      Object.keys(p).forEach(function (k) { prefs[k] = p[k]; });
      if (ctx && playing) musicBus.gain.setTargetAtTime(0.55 * prefs.musicVol, ctx.currentTime, 0.2);
      refresh();
    },
    isPlaying: function () { return playing; },
    available: !!AC
  };
})(window);
