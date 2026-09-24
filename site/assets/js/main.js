/* Templar Lend landing — theme, language memory, menu, block-clock ruler, delayed nav,
   pinned hero phrases, worked-example diagram on a clock, device composition, footer reveal.
   Everything degrades: without JS the page is complete and static. */
(function () {
  "use strict";
  var root = document.documentElement;
  var EN = root.lang === "en";
  var L = EN
    ? { light: "Switch to the light theme", dark: "Switch to the dark theme", offer: "Offer", accepted: "Accepted", active: "Active", repaid: "Repaid", expired: "Expired", claimed: "Claimed", contract: "Contract", step: "Step", of: "of", pause: "Pause", play: "Play" }
    : { light: "Passa al tema chiaro", dark: "Passa al tema scuro", offer: "Offerta", accepted: "Accettata", active: "Attivo", repaid: "Rimborsato", expired: "Scaduto", claimed: "Riscattato", contract: "Contratto", step: "Passo", of: "di", pause: "Pausa", play: "Riproduci" };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* the bar starts hidden (set in the head, so there is no flash); it only stays hidden if we
     are actually able to bring it back on scroll */
  if (reduce || !window.gsap || !window.ScrollTrigger) root.classList.remove("nav-off");

  /* ---------- theme: one toggle, remembers the choice ---------- */
  var osDark = window.matchMedia("(prefers-color-scheme: dark)");
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    return t || (osDark.matches ? "dark" : "light");
  }
  function paintTheme() {
    var cur = currentTheme();
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-label", cur === "dark" ? L.light : L.dark);
    });
  }
  document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("sp-theme", next);
      paintTheme();
    });
  });
  paintTheme();
  if (osDark.addEventListener) osDark.addEventListener("change", paintTheme);

  /* ---------- language memory ---------- */
  var langLinks = document.querySelectorAll("[data-lang-set]");
  langLinks.forEach(function (a) {
    a.addEventListener("click", function () {
      store.set("sp-lang", a.dataset.langSet);
      try { sessionStorage.setItem("sp-nav", "1"); } catch (e) {}
    });
  });
  (function rememberLanguage() {
    var want = store.get("sp-lang");
    var have = root.lang;
    var navigated = false;
    try { navigated = !!sessionStorage.getItem("sp-nav"); } catch (e) {}
    if (!want || want === have || navigated) return;
    var target = document.querySelector('[data-lang-set="' + want + '"]');
    if (target && target.getAttribute("href")) {
      try { sessionStorage.setItem("sp-nav", "1"); } catch (e) {}
      location.replace(target.getAttribute("href"));
    }
  })();

  /* ---------- mobile menu ---------- */
  var nav = document.querySelector(".nav");
  var menuBtn = document.querySelector(".menu-btn");
  if (nav && menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = nav.dataset.open === "true";
      nav.dataset.open = String(!open);
      menuBtn.setAttribute("aria-expanded", String(!open));
    });
    nav.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.dataset.open = "false";
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- scroll ruler: page progress as block height ---------- */
  var TERM = 43200;
  function pad6(n) { return String(Math.round(n)).padStart(6, "0"); }
  var rule = document.querySelector(".rule");
  if (rule) {
    var ruleFill = rule.querySelector(".line i");
    var ruleTxt = rule.querySelector(".txt");
    var ticking = false;
    var updateRule = function () {
      var max = root.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      ruleFill.style.height = (p * 100) + "%";
      ruleTxt.textContent = "BLK " + pad6(p * TERM) + " / 043200";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(updateRule); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", updateRule);
    updateRule();
  }

  /* ---------- GSAP ---------- */
  if (!window.gsap) return;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  if (ST) {
    gsap.registerPlugin(ST);
    /* fonts and images change section heights after the first layout: recompute trigger positions */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    window.addEventListener("load", function () { ST.refresh(); });
  }

  /* ---------- the first screen is the sentence and nothing else: the bar arrives after it ---------- */
  var spec = document.querySelector(".spec");
  if (spec && ST && !reduce) {
    ST.create({
      trigger: spec, start: "top 92%",
      onEnter: function () { root.classList.remove("nav-off"); },
      onLeaveBack: function () { root.classList.add("nav-off"); }
    });
  }

  /* ---------- hero: the page holds while the highlighted block says one thing after another.
     The phrase changes at a hard cut; the colour is the CSS's business (style.css reads --p and
     data-phrase: crimson darkening with the scroll, Liquid green snapping in on the last phrase).
     Pure CSS pin (.has-pin); --p is the pin's progress. ---------- */
  var hero = document.querySelector(".hero");
  var mark = document.getElementById("hero-mark");
  var markTxt = mark && mark.querySelector(".mark-txt");
  if (hero && mark && markTxt && ST && !reduce) {
    var PHRASES = document.documentElement.lang === "en"
      ? ["Keep the keys.", "No custodian.", "No oracle.", "Keep the keys."]
      : ["Tieni le chiavi.", "Nessun custode.", "Nessun oracolo.", "Tieni le chiavi."];
    var PHRASE_AT = [0, 0.18, 0.45, 0.72];
    root.classList.add("has-pin");
    var shownPhrase = 0;
    var setPhrase = function (i) {
      if (i === shownPhrase) return;
      shownPhrase = i;
      markTxt.textContent = PHRASES[i];   /* a hard cut, no wipe */
      hero.setAttribute("data-phrase", String(i));
    };
    hero.setAttribute("data-phrase", "0");
    ST.create({
      trigger: hero, start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: function (self) {
        var p = self.progress, i = 0;
        hero.style.setProperty("--p", p.toFixed(4));
        for (var k = 0; k < PHRASE_AT.length; k++) if (p >= PHRASE_AT[k]) i = k;
        setPhrase(i);
      }
    });
  }

  /* ---------- the worked example, step by step ----------
     Three actors, one contract, coins that really move from pocket to pocket; above them a big
     title and one sentence whose words arrive one after the other. No figures anywhere.
     The whole picture is a pure function of one number, the playhead t: frame(t) places every
     coin, fills the blocks, sets state and colours, shows the right words. A clock moves t
     (it runs only while the section is on screen); the dots and the A/B chips just set t, so
     a jump, a resize or a loop always lands on the same picture. */
  var movesSec = document.querySelector(".sec-moves");
  var dg = document.getElementById("diagram");
  var stage = document.getElementById("dg-stage");
  var railsSvg = document.getElementById("rails");
  var stEls = Array.prototype.slice.call(document.querySelectorAll("#story .st"));

  if (dg && stage && railsSvg && stEls.length) {
    var SVGNS = "http://www.w3.org/2000/svg";
    var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var easeIO = function (u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; };
    var span = function (t, at, dur) { return clamp01((t - at) / dur); };

    /* the steps come from the markup: data-step names the engine phases a step covers (one or
       more, comma separated), data-d how long each phase lasts, data-r (optional) the share of
       the step over which its sentence appears */
    var STEP = {}, END = 0;
    var steps = stEls.map(function (el) {
      var keys = (el.dataset.step || "intro").split(","), ds = (el.dataset.d || "1").split(",");
      var s = { el: el, key: keys[0], a: END, d: 0, r: parseFloat(el.dataset.r) || 0.5,
                k: el.querySelector(".st-k"), p: el.querySelector(".st-p"), words: [], shown: null };
      keys.forEach(function (key, i) {
        var d = parseFloat(ds[i]) || 1;
        STEP[key] = { a: END, d: d }; END += d; s.d += d;
      });
      return s;
    });
    steps.forEach(function (s, i) {
      var prev = steps[i - 1], next = steps[i + 1];
      s.samePrev = !!prev && prev.k.textContent === s.k.textContent;
      s.sameNext = !!next && next.k.textContent === s.k.textContent;
      s.first = i === 0; s.last = i === steps.length - 1;
    });
    var at = function (key, f) { return STEP[key].a + STEP[key].d * f; };

    var slotEl = {};
    dg.querySelectorAll("[data-slot]").forEach(function (e) { slotEl[e.dataset.slot] = e; });
    var tollEl = document.getElementById("toll");
    var lockUse = dg.querySelector(".ic-lk use"), dealK = document.getElementById("deal-k");
    var nodeC = document.getElementById("node-c");
    var stateEl = document.getElementById("dg-state"), toneEl = document.getElementById("dg-tone");
    var forksEl = document.getElementById("forks");
    var sgB = document.getElementById("sg-b"), sgL = document.getElementById("sg-l");
    var termRows = Array.prototype.slice.call(dg.querySelectorAll("#terms li"));
    var blockEls = Array.prototype.slice.call(dg.querySelectorAll("#blocks i"));
    var cutIc = document.getElementById("cut-ic");
    var endWord = document.getElementById("h-moves-end");
    var NB = blockEls.length, NB_A = Math.round(NB * 0.6);

    /* one move = a coin leaves a pocket at `at`, lands in another `dur` later. kind "bus" rides
       the payment lane under the cards, kind "line" goes straight (collateral in and out). */
    var seg = function (key, f0, f1, from, to, kind) {
      return { at: at(key, f0), dur: STEP[key].d * (f1 - f0), from: from, to: to, kind: kind };
    };
    var jump = function (t, to) { return { at: t, dur: 0, to: to }; };
    var cutMid = at("cut", 0.5);                                  /* the stage is dark: everything rewinds here */
    var mLock = seg("lock", 0.36, 0.80, "bA", "cA", "line"),   mBack = seg("back", 0.30, 0.72, "cA", "bA", "line"),
        mClaim = seg("claim", 0.26, 0.64, "cA", "lA", "line"), mDrop = seg("fee", 0.46, 0.66, "C", "ps", "line");
    var COINS = [
      { el: document.getElementById("c-btc"), home: "bA", segs: [mLock, mBack, jump(cutMid, "cA"), mClaim] },
      { el: document.getElementById("c-usd"), home: "lA",
        segs: [seg("fund", 0.10, 0.50, "lA", "bA", "bus"), seg("repay", 0.30, 0.78, "bA", "lA", "bus"), jump(cutMid, "bA")] },
      { el: document.getElementById("c-orig"), home: "bs", segs: [seg("fund", 0.58, 0.92, "bs", "ls1", "bus")] },
      /* the protocol's share: it comes out from under the fee as the fee stops over the toll */
      { el: document.getElementById("c-cut"), home: "C", show: [mDrop.at, cutMid], segs: [mDrop] },
      /* the loan fee: out of the borrower's pocket, a halt over the toll, then on to the lender, lighter */
      { el: document.getElementById("c-fee"), home: "bs", show: [at("fee", 0.05), cutMid],
        segs: [seg("fee", 0.13, 0.44, "bs", "C", "bus"), seg("fee", 0.66, 0.93, "C", "ls2", "bus")],
        scale: function (t) { return 1 - 0.16 * easeIO(span(t, mDrop.at, mDrop.dur)); } }
    ];
    var tSignB = at("offer", 0.36), tSignL = at("lock", 0.2);
    var tLocked = mLock.at + mLock.dur, tRepaid = mBack.at + mBack.dur, tClaimed = mClaim.at + mClaim.dur;
    var tPaid = mDrop.at + mDrop.dur, tExpired = at("timeB", 0.9);

    /* the fixed drawing: collateral line in, collateral line out, the payment lane with a drop to
       every pocket that uses it, and the plumb line from the lane into the protocol's coin slot */
    var RAILS = ["coll", "claim", "bus", "toll"], railEl = {};
    RAILS.forEach(function (k) {
      var e = document.createElementNS(SVGNS, "path"); e.setAttribute("class", "rail"); railsSvg.appendChild(e); railEl[k] = e;
    });
    COINS.forEach(function (c) { c.segs.forEach(function (s) {
      if (!s.kind) return;
      s.trk = document.createElementNS(SVGNS, "path"); s.trk.setAttribute("class", "trk " + (c.el.classList.contains("is-btc") ? "is-btc" : "is-usd"));
      s.trk.setAttribute("pathLength", "1"); railsSvg.appendChild(s.trk);
    }); });

    var pinned = !!movesSec;                       /* one screen tall, the words share one cell */
    if (pinned) root.classList.add("has-play");
    var pos = {}, laneY = 0, fit = 1;
    var ROUND = { bs: 1, ls2: 1 };                 /* the two ends of the lane turn up with a curve, the rest are T drops */
    function center(el, r) { var b = el.getBoundingClientRect(); return { x: (b.left - r.left + b.width / 2) / fit, y: (b.top - r.top + b.height / 2) / fit }; }
    function busPath(ka, kb) {
      var a = pos[ka], b = pos[kb], R = 14, dir = b.x > a.x ? 1 : -1, d;
      if (ka === "C") d = "M" + a.x + " " + laneY;
      else if (ROUND[ka]) d = "M" + a.x + " " + a.y + "V" + (laneY - R) + "Q" + a.x + " " + laneY + " " + (a.x + dir * R) + " " + laneY;
      else d = "M" + a.x + " " + a.y + "V" + laneY;
      if (kb === "C") return d + "H" + b.x;
      if (ROUND[kb]) return d + "H" + (b.x - dir * R) + "Q" + b.x + " " + laneY + " " + b.x + " " + (laneY - R) + "V" + b.y;
      return d + "H" + b.x + "V" + b.y;
    }
    function build() {
      /* short screens: the picture shrinks as a whole rather than spilling out of the stage */
      stage.style.transform = ""; dg.style.transform = ""; fit = 1;
      var room = dg.parentNode.clientHeight, tall = stage.offsetHeight;
      if (pinned && room > 0 && tall > room) { fit = Math.max(0.6, room / tall); dg.style.transform = "scale(" + fit.toFixed(4) + ")"; }
      /* a scaled-down picture leaves air on both sides: the previous/next buttons follow it in */
      var body = dg.parentNode, side = body.querySelector(".pl-side");
      body.style.setProperty("--nav-shift", (dg.offsetWidth * (1 - fit) / 2).toFixed(1) + "px");
      body.style.setProperty("--nav-dy", "0px");
      if (side && side.offsetParent) {               /* level with the actor cards, wherever the scale put them */
        var nb = document.getElementById("node-b").getBoundingClientRect(), sb = side.getBoundingClientRect();
        body.style.setProperty("--nav-dy", ((nb.top + nb.height / 2) - (sb.top + sb.height / 2)).toFixed(1) + "px");
      }
      var r = stage.getBoundingClientRect();
      if (!r.width) return;
      railsSvg.setAttribute("viewBox", "0 0 " + stage.offsetWidth + " " + stage.offsetHeight);
      Object.keys(slotEl).forEach(function (k) { pos[k] = center(slotEl[k], r); });
      /* the protocol's slot sits on the top edge of its box; the lane runs one big coin above it */
      var big = slotEl.bA.offsetWidth, xs = slotEl.ps.offsetWidth;
      laneY = pos.ps.y - xs / 2 - 6 - big / 2;
      pos.C = { x: pos.ps.x, y: laneY };
      COINS.forEach(function (c) { c.segs.forEach(function (s) {
        if (!s.trk) return;
        var a = pos[s.from], b = pos[s.to];
        s.trk.setAttribute("d", s.kind === "bus" ? busPath(s.from, s.to) : "M" + a.x + " " + a.y + "L" + b.x + " " + b.y);
        s.len = s.trk.getTotalLength();
      }); });
      railEl.coll.setAttribute("d", "M" + pos.bA.x + " " + pos.bA.y + "H" + pos.cA.x);
      railEl.claim.setAttribute("d", "M" + pos.cA.x + " " + pos.cA.y + "H" + pos.lA.x);
      railEl.bus.setAttribute("d", busPath("bs", "ls2") + ["bA", "lA", "ls1"].map(function (k) {
        return "M" + pos[k].x + " " + pos[k].y + "V" + laneY; }).join(""));
      railEl.toll.setAttribute("d", "M" + pos.C.x + " " + laneY + "V" + (pos.ps.y - xs / 2));
    }

    var still = reduce;                            /* paused: a step's sentence stays, whole, to its end */
    var last = { tone: null, scene: null, branch: null, state: null, lock: null, deal: null, n: -1, now: -2 };
    function paint(t) {
      /* coins: the last finished move says where a coin rests, a running one carries it and
         draws its route behind it */
      COINS.forEach(function (c) {
        var where = c.home, run = null, i, s;
        for (i = 0; i < c.segs.length; i++) if (c.segs[i].trk) c.segs[i].trk.style.strokeDasharray = "0 1";
        for (i = 0; i < c.segs.length; i++) {
          s = c.segs[i];
          if (t >= s.at + s.dur) where = s.to; else { if (t > s.at) run = s; break; }
        }
        var pt = pos[where];
        if (run && run.trk) {
          var u = easeIO(span(t, run.at, run.dur));
          pt = run.trk.getPointAtLength(u * run.len);
          run.trk.style.strokeDasharray = u.toFixed(4) + " 1";
        }
        if (!pt) return;
        var vis = !c.show || (t >= c.show[0] && t < c.show[1]);
        var k = (vis ? (c.show ? easeIO(span(t, c.show[0], 0.12)) : 1) : 0) * (c.scale ? c.scale(t) : 1);
        var w = c.el.offsetWidth / 2;
        c.el.style.transform = "translate(" + (pt.x - w).toFixed(1) + "px," + (pt.y - w).toFixed(1) + "px) scale(" + k.toFixed(3) + ")";
        c.el.classList.toggle("is-held", !run && where === "cA");
      });

      /* the offer writes itself: one term after the other, the signature, then the margin shows */
      var so = STEP.offer;
      termRows.forEach(function (li, k) {
        var p = easeIO(span(t, so.a + so.d * (0.06 + 0.07 * k), so.d * 0.1));
        li.style.opacity = p.toFixed(3);
        var bar = li.querySelector(".bar"); if (bar) bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
      });
      sgB.classList.toggle("on", t >= tSignB);
      sgL.classList.toggle("on", t >= tSignL);
      nodeC.classList.toggle("is-cover", t >= at("offer", 0.46) && t < at("offer", 1));
      tollEl.classList.toggle("is-paid", t >= tPaid && t < cutMid);

      /* state, colour, lock */
      var tone = t < tLocked ? "idle" : t < tRepaid ? "live" : t < cutMid ? "ok" : t < tExpired ? "live" : "warn";
      var state = t < tSignL ? L.offer : t < tLocked ? L.accepted : t < tRepaid ? L.active : t < cutMid ? L.repaid
                : t < tExpired ? L.active : t < tClaimed ? L.expired : L.claimed;
      var closed = (t >= tLocked && t < mBack.at) || (t >= cutMid && t < mClaim.at);
      var scene = t < so.a ? "intro" : t < tSignL ? "offer"
                : (t >= tRepaid && t < cutMid) ? "endA" : t >= tClaimed ? "endB" : "run";
      var branch = t < STEP.repay.a ? "" : t < cutMid ? "a" : "b";
      if (tone !== last.tone) { last.tone = tone; dg.dataset.tone = tone; toneEl.dataset.tone = tone; }
      if (state !== last.state) { last.state = state; stateEl.textContent = state; }
      if (closed !== last.lock) { last.lock = closed; lockUse.setAttribute("href", closed ? "#i-lock" : "#i-lock-open"); }
      if (scene !== last.scene) { last.scene = scene; dg.dataset.scene = scene; }
      if (branch !== last.branch) { last.branch = branch; dg.dataset.branch = branch; forksEl.dataset.branch = branch; }
      var deal = t < tLocked ? L.offer : L.contract;
      if (deal !== last.deal) { last.deal = deal; dealK.textContent = deal; }

      /* blocks: A stops part-way (repaid early); after the cut they start again from zero and run out */
      var n = t < cutMid ? Math.round(NB_A * span(t, at("time", 0.18), STEP.time.d * 0.7))
                         : Math.round(NB * span(t, at("timeB", 0.2), STEP.timeB.d * 0.7));
      var now = (tone === "live" && n < NB) ? n : -1;
      if (n !== last.n || now !== last.now) {
        last.n = n; last.now = now;
        for (var b = 0; b < NB; b++) { blockEls[b].className = b < n ? "on" : b === now ? "now" : ""; }
      }

      /* the cut: the stage leaves, the swap turns, the stage comes back rewound */
      var out = span(t, at("cut", 0.06), STEP.cut.d * 0.26), inn = span(t, STEP.timeB.a, STEP.timeB.d * 0.18);
      var op = t < cutMid ? 1 - out : inn;
      stage.style.opacity = op.toFixed(3);
      stage.style.transform = "scale(" + (0.96 + 0.04 * op).toFixed(4) + ")";
      if (cutIc) {
        cutIc.style.opacity = (t < STEP.cut.a || t > at("timeB", 0.2) ? 0 : 1 - op).toFixed(3);
        cutIc.style.transform = "rotate(" + (180 * easeIO(span(t, at("cut", 0.25), STEP.cut.d * 0.6))).toFixed(1) + "deg)";
      }
      if (endWord) endWord.style.opacity = span(t, at("outro", 0.4), STEP.outro.d * 0.25).toFixed(3);
    }

    /* the words: a title per move, a sentence per step; the further you scroll the more of it is there */
    function tell(t) {
      steps.forEach(function (s) {
        var a = s.a, b = s.a + s.d, on = (t >= a || s.first) && (t < b || s.last);
        if (!on) { if (s.shown !== false) { s.shown = false; s.el.style.opacity = 0; s.el.style.visibility = "hidden"; } return; }
        if (s.shown !== true) { s.shown = true; s.el.style.opacity = 1; s.el.style.visibility = "visible"; }
        var fin = s.first ? 1 : span(t, a, 0.16), fout = s.last || still ? 0 : span(t, b - 0.12, 0.12);
        var kin = s.samePrev ? 1 : fin, kout = s.sameNext ? 0 : fout;
        s.k.style.opacity = (easeIO(kin) * (1 - kout)).toFixed(3);
        s.k.style.transform = "translateY(" + ((1 - easeIO(kin)) * 16).toFixed(1) + "px)";
        var n = s.words.length, wd = (s.d * s.r) / Math.max(1, n);
        for (var i = 0; i < n; i++) {
          var o = s.first ? 1 : span(t, a + 0.05 + i * wd, wd * 2.4);
          s.words[i].style.opacity = (o * (1 - fout)).toFixed(3);
        }
      });
    }

    function frame(t) { paint(t); if (pinned) tell(t); }
    var cur = pinned ? 0 : at("time", 0.95);          /* unpinned: one still of the active loan */
    var redraw = function () { build(); frame(cur); };

    if (pinned) {
      steps.forEach(function (s) {
        var txt = s.p.textContent.split(/\s+/).filter(Boolean);
        s.p.textContent = "";
        txt.forEach(function (w, i) {
          var e = document.createElement("span"); e.className = "w"; e.textContent = w;
          s.p.appendChild(e); if (i < txt.length - 1) s.p.appendChild(document.createTextNode(" "));
          s.words.push(e);
        });
      });
    }
    redraw();
    window.addEventListener("resize", redraw);
    window.addEventListener("load", redraw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);

    /* the clock. SPEED turns seconds into playhead units; it only runs while the section is on
       screen and the tab is visible. Reduced motion: no clock, the dots show each step finished. */
    var player = document.getElementById("player"), playBtn = document.getElementById("pl-play");
    var dotsBox = document.getElementById("pl-dots");
    if (pinned && player && playBtn && dotsBox) {
      var SPEED = 1 / 2.3, wanted = !reduce, inView = false, raf = 0, then = 0;
      var shown = steps.filter(function (s) { return !s.first && !s.last; });
      var tCut = STEP.cut.a;
      shown.forEach(function (s, i) {
        if (s.a === tCut) { var g = document.createElement("span"); g.className = "pl-gap"; dotsBox.appendChild(g); }
        var b = document.createElement("button"); b.type = "button"; b.className = "pl-dot" + (s.a >= tCut ? " is-b" : "");
        var name = s.k.textContent.replace(/^\d+/, "").trim();
        b.setAttribute("aria-label", L.step + " " + (i + 1) + " " + L.of + " " + shown.length + ": " + name);
        b.title = name;
        s.fill = document.createElement("i"); b.appendChild(s.fill); s.dot = b;
        b.addEventListener("click", function () { go(s); });
        dotsBox.appendChild(b);
      });
      var marks = function () {
        shown.forEach(function (s) {
          s.fill.style.transform = "scaleX(" + clamp01((cur - s.a) / s.d).toFixed(3) + ")";
          var on = cur >= s.a && cur < s.a + s.d;
          if (on !== s.cur) { s.cur = on; if (on) s.dot.setAttribute("aria-current", "step"); else s.dot.removeAttribute("aria-current"); }
        });
      };
      var show = function (t) { cur = t; frame(cur); marks(); };
      var go = function (s) { show(reduce || !wanted ? s.a + s.d - 0.001 : s.a + 0.001); };
      var tick = function (now) {
        raf = 0;
        var dt = Math.min(0.1, (now - then) / 1000); then = now;
        var t = cur + dt * SPEED;
        show(t >= END ? 0 : t);
        run();
      };
      var run = function () {
        var should = wanted && inView && !document.hidden;
        if (should && !raf) { then = performance.now(); raf = requestAnimationFrame(tick); }
        if (!should && raf) { cancelAnimationFrame(raf); raf = 0; }
      };
      var paintBtn = function () {
        playBtn.setAttribute("aria-label", wanted ? L.pause : L.play);
        playBtn.querySelector("use").setAttribute("href", wanted ? "#i-pause" : "#i-play");
      };
      playBtn.addEventListener("click", function () { wanted = !wanted; still = reduce || !wanted; paintBtn(); show(cur); run(); });
      /* previous / next: the buttons beside the picture (in the bar on narrow screens) and the
         arrow keys. The story is a loop, so the ends wrap; from the closing line, back is step 8 */
      var stepBy = function (dir) {
        var n = shown.length, i = -1;
        shown.forEach(function (s, k) { if (cur >= s.a) i = k; });
        var past = cur >= shown[n - 1].a + shown[n - 1].d;
        var k = i < 0 ? (dir > 0 ? 0 : n - 1) : past && dir < 0 ? n - 1 : ((i + dir) % n + n) % n;
        go(shown[k]); return shown[k];
      };
      movesSec.querySelectorAll("[data-by]").forEach(function (b) {
        b.addEventListener("click", function () { stepBy(+b.dataset.by); });
      });
      player.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var onDot = document.activeElement && document.activeElement.classList.contains("pl-dot");
        var to = stepBy(e.key === "ArrowRight" ? 1 : -1);
        if (onDot) to.dot.focus();
        e.preventDefault();
      });
      forksEl.querySelectorAll("[data-go]").forEach(function (b) {
        b.addEventListener("click", function () {
          var key = b.dataset.go;
          go(shown.filter(function (s) { return s.a === STEP[key].a; })[0]);
        });
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) { inView = en[0].isIntersecting; run(); }, { threshold: 0.35 }).observe(movesSec);
      } else inView = true;
      document.addEventListener("visibilitychange", run);
      paintBtn();
      show(reduce ? shown[0].a + shown[0].d - 0.001 : 0);
      run();
    }
  }

  /* ---------- details on demand: the + is only the visible handle. A click anywhere on a row,
     a card or a fee box opens (or closes) its small print; links and text selection still work. ---------- */
  var refreshSoon = function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); };
  var plainClick = function (e) {
    if (e.target.closest("a, summary")) return false;
    var sel = window.getSelection ? String(window.getSelection()) : "";
    return !sel;
  };
  document.querySelectorAll(".card, .fee").forEach(function (box) {
    var more = box.querySelector("details.more");
    if (!more) return;
    box.classList.add("is-tap");
    box.addEventListener("click", function (e) { if (plainClick(e)) more.open = !more.open; });
    more.addEventListener("toggle", function () { box.classList.toggle("is-open", more.open); refreshSoon(); });
  });
  document.querySelectorAll("details.more-wide").forEach(function (more) { more.addEventListener("toggle", refreshSoon); });

  /* ---------- 007 · the sneak peek: three real screens, one every 3.2 s while on screen ---------- */
  var peek = document.querySelector("[data-peek]");
  if (peek && !reduce) {
    var pkShots = Array.prototype.slice.call(peek.querySelectorAll(".pk-shot")), pkCap = peek.querySelector("[data-peek-cap]");
    var pkI = 0, pkT = null;
    var pkShow = function (i) {
      pkI = (i + pkShots.length) % pkShots.length;
      pkShots.forEach(function (sh, k) { sh.classList.toggle("is-on", k === pkI); });
      if (pkCap) pkCap.textContent = pkShots[pkI].querySelector("img").alt.split(":")[0] + " · testnet";
    };
    var pkStart = function () { if (!pkT) pkT = setInterval(function () { pkShow(pkI + 1); }, 3200); };
    var pkStop = function () { if (pkT) { clearInterval(pkT); pkT = null; } };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { if (en[0].isIntersecting) pkStart(); else pkStop(); }, { threshold: 0.3 }).observe(peek);
    else pkStart();
    document.addEventListener("visibilitychange", function () { if (document.hidden) pkStop(); else if (pkT === null && peek.getBoundingClientRect().top < innerHeight) pkStart(); });
  }

  /* ---------- reveals: short, once, from a visible resting state when JS is off ---------- */
  if (!reduce) {
    var h1 = document.getElementById("h-hero");
    if (h1) {
      /* wrap every word in a span, keeping the orange .mark wrapper intact */
      var wrapWords = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
              var w = document.createElement("span"); w.className = "word"; w.textContent = part; frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) { wrapWords(child); }
        });
      };
      wrapWords(h1);
      /* the sentence comes into focus, word by word, a beat after the lines have started */
      var words = h1.querySelectorAll(".word");
      gsap.from(words, { y: 40, opacity: 0, filter: "blur(12px)", duration: 1.1, stagger: 0.08, delay: 0.55, ease: "power3.out", clearProps: "filter" });
      /* the orange block wipes in from the left when its first word arrives */
      var mark = h1.querySelector(".mark");
      if (mark) {
        var first = Array.prototype.indexOf.call(words, mark.querySelector(".word"));
        gsap.from(mark, { clipPath: "inset(0 100% 0 0)", duration: 0.8, delay: 0.55 + Math.max(0, first) * 0.08, ease: "power3.out" });
      }
    }
    /* the first seconds: both fans shoot in from the screen edges and curve down to the floor,
       the long inner sweep first, while the camera settles from slightly too close (--z, read by
       style.css); the travelling dashes join once the lines are there */
    var heroBox = document.querySelector(".hero");
    gsap.utils.toArray(".paths-layer").forEach(function (layer) {
      var bases = layer.querySelectorAll(".base"), flows = layer.querySelectorAll(".flow");
      gsap.set(bases, { strokeDasharray: "1 1" });
      gsap.fromTo(bases, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut",
        stagger: { each: 0.028, from: "start" }, clearProps: "strokeDasharray,strokeDashoffset" });
      gsap.from(flows, { opacity: 0, duration: 1.4, delay: 1.0, ease: "power1.out", clearProps: "opacity" });
    });
    if (heroBox) {
      gsap.fromTo(heroBox, { "--z": 1.14 }, { "--z": 1, duration: 3, ease: "power3.out" });
      /* depth: with a mouse, the two fans and the sentence sit on different planes and drift
         against the pointer (--mx / --my, eased here, applied in style.css) */
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        var aimX = 0, aimY = 0, nowX = 0, nowY = 0;
        window.addEventListener("pointermove", function (e) {
          aimX = e.clientX / window.innerWidth * 2 - 1; aimY = e.clientY / window.innerHeight * 2 - 1;
        }, { passive: true });
        gsap.ticker.add(function () {
          if (window.scrollY > heroBox.offsetHeight) return;
          if (Math.abs(aimX - nowX) < 0.0015 && Math.abs(aimY - nowY) < 0.0015) return;
          nowX += (aimX - nowX) * 0.06; nowY += (aimY - nowY) * 0.06;
          heroBox.style.setProperty("--mx", nowX.toFixed(4)); heroBox.style.setProperty("--my", nowY.toFixed(4));
        });
      }
    }
    if (ST) {
      gsap.utils.toArray(".reveal").forEach(function (el) {
        gsap.from(el, { y: 14, opacity: 0, duration: 0.55, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true } });
      });
      /* footer: blur-in columns, one after the other (port of the AnimatedContainer) */
      var foot = document.querySelector(".foot");
      var footParts = gsap.utils.toArray(".foot-anim");
      if (foot && footParts.length) {
        gsap.from(footParts, { filter: "blur(4px)", y: -8, opacity: 0, duration: 0.8, stagger: 0.1, delay: 0.1, ease: "power2.out", clearProps: "filter",
          scrollTrigger: { trigger: foot, start: "top 90%", once: true } });
      }
    }
  }
})();
