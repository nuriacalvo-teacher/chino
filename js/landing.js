/* ==========================================================================
   landing.js · 中文 — animaciones, paralaje, sonido e interacción
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(pointer: fine)").matches;
  var SND = window.Sonido || { sfx: function () {}, setMode: function () {}, setPrefs: function () {} };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ------------------------------------------------------------ sonido
  var KEY = "chino-landing-v1";
  var prefs = { music: true };
  try { prefs = Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* nada */ }
  var mBtn = $(".music-btn");
  function paintMusic() {
    mBtn.classList.toggle("off", !prefs.music);
    mBtn.setAttribute("aria-pressed", prefs.music ? "true" : "false");
    mBtn.title = prefs.music ? "Quitar la música de fondo" : "Poner música de fondo";
    mBtn.setAttribute("aria-label", mBtn.title);
  }
  mBtn.addEventListener("click", function () {
    prefs.music = !prefs.music;
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* nada */ }
    SND.setPrefs({ music: prefs.music, sfx: true, musicVol: 0.55 });
    paintMusic();
  });
  SND.setMode("menu");
  SND.setPrefs({ music: prefs.music, sfx: true, musicVol: 0.55 });
  paintMusic();

  // Enlaces con sonido: suena el gong y se entra en la app un instante después.
  $$("[data-sfx]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      SND.sfx(a.getAttribute("data-sfx"));
      if (a.href && !e.metaKey && !e.ctrlKey && !e.shiftKey && a.target !== "_blank") {
        e.preventDefault();
        var href = a.href;
        document.body.style.transition = "opacity .45s ease";
        document.body.style.opacity = "0.25";
        setTimeout(function () { location.href = href; }, 420);
      }
    });
  });
  window.addEventListener("pageshow", function () { document.body.style.opacity = ""; });
  var lastHover = 0;
  $$(".scroll, .feat, .tone, .stop").forEach(function (el) {
    el.addEventListener("mouseenter", function () {
      var now = Date.now();
      if (now - lastHover > 350) { lastHover = now; SND.sfx("hover"); }
    });
  });

  // ------------------------------------------------------------ cielo
  (function stars() {
    var box = $(".stars"), n = window.innerWidth < 700 ? 45 : 90;
    for (var i = 0; i < n; i++) {
      var s = document.createElement("i");
      s.style.left = rnd(0, 100) + "%"; s.style.top = rnd(0, 100) + "%";
      s.style.animationDelay = -rnd(0, 3) + "s"; s.style.animationDuration = rnd(2, 5) + "s";
      var z = rnd(1, 2.6); s.style.width = s.style.height = z + "px";
      box.appendChild(s);
    }
  })();

  var CRANE = '<svg viewBox="0 0 60 30"><path d="M4 18 Q20 14 34 16 L50 12 L56 13 L50 15 L36 20 Q20 22 4 18Z" fill="#f2ecdf"/>' +
    '<circle cx="53" cy="12.6" r="1.4" fill="#c8412f"/><path d="M26 17 L20 26 M30 17 L27 27" stroke="#f2ecdf" stroke-width="1"/>' +
    '<path class="wing" d="M18 16 Q24 0 40 2 Q30 8 30 16Z" fill="#e9e2d2"/><path class="wing" d="M20 16 Q22 4 34 4 Q28 10 28 16Z" fill="#1a2740" opacity=".5"/></svg>';
  if (!reduce) {
    var cr = $(".cranes");
    [[16, 38, 0], [22, 46, -14], [11, 30, -26]].forEach(function (c, i) {
      var d = document.createElement("div");
      d.className = "crane"; d.innerHTML = CRANE;
      d.style.top = c[0] + "%"; d.style.animationDuration = c[1] + "s"; d.style.animationDelay = c[2] + "s";
      d.style.width = (46 - i * 8) + "px";
      cr.appendChild(d);
    });
    var sl = $(".sky-lanterns"), nl = window.innerWidth < 700 ? 8 : 16;
    for (var k = 0; k < nl; k++) {
      var l = document.createElement("i");
      l.className = "kl";
      l.style.left = rnd(4, 96) + "%";
      l.style.animationDuration = rnd(16, 30) + "s";
      l.style.animationDelay = -rnd(0, 30) + "s";
      l.style.setProperty("--dx", rnd(-80, 80) + "px");
      var sc = rnd(0.6, 1.3); l.style.width = 16 * sc + "px"; l.style.height = 22 * sc + "px";
      sl.appendChild(l);
    }
  }

  // ------------------------------------------------------------ 学中文 trazo a trazo
  function hanzi() {
    if (!window.HanziWriter || reduce) return;
    var els = $$(".hz"), writers = [];
    els.forEach(function (el) {
      var size = el.getBoundingClientRect().width;
      var w = HanziWriter.create(el, el.getAttribute("data-char"), {
        width: size, height: size, padding: 4, showOutline: false, showCharacter: false,
        strokeColor: "#ffd98a", radicalColor: "#e8b04b", strokeAnimationSpeed: 1.4, delayBetweenStrokes: 90,
        charDataLoader: function (ch, ok, fail) { if (window.HZ_DATA && HZ_DATA[ch]) ok(HZ_DATA[ch]); else fail(); },
        onLoadCharDataSuccess: function () { el.classList.add("hw"); },
        onLoadCharDataError: function () { el.classList.remove("hw"); }
      });
      writers.push(w);
    });
    var i = 0;
    function next() {
      if (i >= writers.length) return;
      var w = writers[i++];
      w.animateCharacter({ onComplete: function () { setTimeout(next, 150); } });
    }
    setTimeout(next, 500);
  }
  if (document.readyState === "complete") hanzi(); else window.addEventListener("load", hanzi);

  // ------------------------------------------------------------ paralaje
  var par = $$("[data-speed]"), depth = $$("[data-depth]");
  var mx = 0, my = 0, tx = 0, ty = 0;
  var top = $(".top"), bar = $(".progress i");
  var trail = $(".trail"), trailLen = trail ? trail.getTotalLength() : 0, camino = $("#camino");
  if (trail) { trail.style.strokeDasharray = trailLen; trail.style.strokeDashoffset = trailLen; }
  function frame() {
    var y = window.scrollY, vh = window.innerHeight;
    tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;
    par.forEach(function (el) {
      var sp = +el.getAttribute("data-speed");
      var d = +(el.getAttribute("data-depth") || 0);
      var base = el.closest(".hero") ? y : (y - (el.parentElement.offsetTop - vh));
      if (el.closest(".hero") && y > vh * 1.2) return;
      el.style.transform = "translate3d(" + (-tx * d).toFixed(1) + "px," + (base * sp).toFixed(1) + "px,0)";
    });
    top.classList.toggle("solid", y > 40);
    var h = document.documentElement.scrollHeight - vh;
    bar.style.width = (h > 0 ? y / h * 100 : 0) + "%";
    if (trail && camino) {
      var r = camino.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh * 0.2)));
      trail.style.strokeDashoffset = (trailLen * (1 - p)).toFixed(1);
    }
    requestAnimationFrame(frame);
  }
  if (!reduce) {
    if (fine) window.addEventListener("mousemove", function (e) {
      mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5;
    });
    requestAnimationFrame(frame);
  } else {
    window.addEventListener("scroll", function () { top.classList.toggle("solid", window.scrollY > 40); });
    if (trail) trail.style.strokeDashoffset = 0;
  }

  // ------------------------------------------------------------ aparición y contadores
  function countUp(el) {
    var target = +el.getAttribute("data-count"), t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add("in");
      $$("[data-count]", el).forEach(countUp);
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }) : null;
  $$(".reveal").forEach(function (el, i) {
    if (!el.closest(".hero")) el.style.transitionDelay = (i % 3) * 0.08 + "s";
    if (io && !reduce) io.observe(el);
    else { el.classList.add("in"); $$("[data-count]", el).forEach(function (c) { c.textContent = c.getAttribute("data-count"); }); }
  });
  // el héroe aparece solo
  setTimeout(function () { $$(".hero .reveal").forEach(function (el, i) { setTimeout(function () { el.classList.add("in"); }, 250 + i * 160); }); }, 200);

  // ------------------------------------------------------------ rollos con inclinación 3D
  if (fine && !reduce) $$("[data-tilt]").forEach(function (el) {
    var paper = $(".paper", el);
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      paper.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
      paper.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
    });
    el.addEventListener("mouseleave", function () { paper.style.setProperty("--ry", "0deg"); paper.style.setProperty("--rx", "0deg"); });
  });

  // ------------------------------------------------------------ voz china del navegador
  function say(txt) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(txt);
    u.lang = "zh-CN"; u.rate = 0.7;
    var v = speechSynthesis.getVoices().filter(function (x) { return /^zh[-_]CN/i.test(x.lang); })[0];
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  // ------------------------------------------------------------ tonos
  $$(".tone").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".tone").forEach(function (x) { x.classList.remove("on"); });
      var path = $("path", b);
      path.style.transition = "none"; path.style.strokeDashoffset = 140;
      path.getBoundingClientRect();
      path.style.transition = ""; path.style.strokeDashoffset = "";
      b.classList.add("on");
      say(b.getAttribute("data-say"));
    });
  });

  // ------------------------------------------------------------ palabra del día
  var WORDS = [
    ["你好", "nǐ hǎo", "hola", 1], ["谢谢", "xièxie", "gracias", 1], ["朋友", "péngyou", "amigo, amiga", 1], ["老师", "lǎoshī", "profesor, profesora", 1],
    ["学生", "xuésheng", "estudiante", 1], ["喜欢", "xǐhuan", "gustar", 1], ["中国", "Zhōngguó", "China", 1], ["汉语", "Hànyǔ", "chino (idioma)", 1],
    ["天气", "tiānqì", "tiempo (clima)", 1], ["米饭", "mǐfàn", "arroz", 1], ["苹果", "píngguǒ", "manzana", 1], ["飞机", "fēijī", "avión", 1],
    ["电影", "diànyǐng", "película", 1], ["明天", "míngtiān", "mañana", 1], ["漂亮", "piàoliang", "bonito, guapa", 1], ["高兴", "gāoxìng", "contento", 1],
    ["认识", "rènshi", "conocer", 1], ["再见", "zàijiàn", "adiós", 1], ["水果", "shuǐguǒ", "fruta", 1], ["睡觉", "shuì jiào", "dormir", 1],
    ["旅游", "lǚyóu", "viajar", 2], ["运动", "yùndòng", "hacer deporte", 2], ["咖啡", "kāfēi", "café", 2], ["生日", "shēngrì", "cumpleaños", 2],
    ["快乐", "kuàilè", "feliz", 2], ["希望", "xīwàng", "esperar, desear", 2], ["便宜", "piányi", "barato", 2], ["手机", "shǒujī", "móvil", 2],
    ["唱歌", "chàng gē", "cantar", 2], ["跳舞", "tiào wǔ", "bailar", 2], ["颜色", "yánsè", "color", 2], ["眼睛", "yǎnjing", "ojo", 2],
    ["西瓜", "xīguā", "sandía", 2], ["新年", "xīnnián", "Año Nuevo", 2], ["欢迎", "huānyíng", "bienvenido", 2], ["休息", "xiūxi", "descansar", 2],
    ["游泳", "yóu yǒng", "nadar", 2], ["告诉", "gàosu", "decir, contar", 2], ["准备", "zhǔnbèi", "preparar", 2], ["虽然", "suīrán", "aunque", 2]
  ];
  var dayIdx = Math.floor(Date.now() / 86400000) % WORDS.length, cur = dayIdx;
  var flip = $(".flip");
  function showWord(i) {
    var w = WORDS[i];
    $(".w-zh").textContent = w[0]; $(".w-py").textContent = w[1]; $(".w-es").textContent = w[2];
    $(".w-lv").textContent = "HSK " + w[3];
    $(".lbl").textContent = i === dayIdx ? "Palabra del día · 每日一词" : "Otra palabra · 一个词";
  }
  function toggleFlip() { flip.classList.toggle("flipped"); SND.sfx("flip"); if (flip.classList.contains("flipped")) say(WORDS[cur][0]); }
  flip.addEventListener("click", toggleFlip);
  flip.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFlip(); } });
  $("#wd-say").addEventListener("click", function () { say(WORDS[cur][0]); });
  $("#wd-next").addEventListener("click", function () {
    var n; do { n = Math.floor(Math.random() * WORDS.length); } while (n === cur);
    cur = n;
    flip.classList.remove("flipped");
    setTimeout(function () { showWord(cur); }, 300);
    SND.sfx("tick");
  });
  showWord(cur);

  // ------------------------------------------------------------ destellos del ratón
  if (fine && !reduce) {
    var lastSpark = 0;
    window.addEventListener("mousemove", function (e) {
      var now = Date.now();
      if (now - lastSpark < 45 || window.scrollY > window.innerHeight) return;
      lastSpark = now;
      var s = document.createElement("span");
      s.className = "spark";
      s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
      s.style.setProperty("--sx", rnd(-20, 20) + "px"); s.style.setProperty("--sy", rnd(10, 40) + "px");
      document.body.appendChild(s);
      setTimeout(function () { s.remove(); }, 800);
    });
  }
})();
