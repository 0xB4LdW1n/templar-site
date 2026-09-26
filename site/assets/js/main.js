/* Templar Lend landing — theme, language memory, menu, block-clock ruler, delayed nav,
   pinned hero (four words along the scroll), worked-example diagram on a clock, device composition, footer reveal.
   Everything degrades: without JS the page is complete and static. */
(function () {
  "use strict";
  var root = document.documentElement;
  var EN = root.lang === "en";
  var L = EN
    ? { light: "Switch to the light theme", dark: "Switch to the dark theme", offer: "Request", signing: "Signing", active: "Active", repaid: "Repaid", expired: "Expired", claimed: "Claimed", contract: "Contract", step: "Step", of: "of", pause: "Pause", play: "Play", vs: "Compare Templar Lend with", vsq: "Question", next: "Next", again: "Start again" }
    : { light: "Passa al tema chiaro", dark: "Passa al tema scuro", offer: "Richiesta", signing: "In firma", active: "Attivo", repaid: "Rimborsato", expired: "Scaduto", claimed: "Reclamato", contract: "Contratto", step: "Passo", of: "di", pause: "Pausa", play: "Riproduci", vs: "Confronta Templar Lend con", vsq: "Domanda", next: "Avanti", again: "Ricomincia" };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* phones (the same line as .only-phone / .only-desktop in style.css): no scroll-driven blocks, the hero's
     words on a clock, the worked example on four tap stops. Read once: a phone does not change width */
  var PHONE = window.matchMedia("(max-width: 767px)").matches;
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

  /* the worked example (001), the comparison picker (002) and the details on demand need no GSAP:
     they start here, before the guard (all three are function declarations further down, hoisted) */
  initDiagram();
  if (PHONE) initMobDiagram();
  initSchemaPick();
  initDetails();
  initSnaps();
  initNavHere();
  if (PHONE && !reduce) initHeroCycle();

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

  /* ---------- the first screen carries its own brand and buttons: the bar arrives after it ---------- */
  var spec = document.querySelector(".spec");
  if (spec && ST && !reduce) {
    ST.create({
      trigger: spec, start: "top 92%",
      onEnter: function () { root.classList.remove("nav-off"); },
      onLeaveBack: function () { root.classList.add("nav-off"); }
    });
    /* a keyboard user tabbing from the top lands in the bar first: it shows itself while it holds the
       focus, and steps aside again if the focus goes back into the first screen */
    if (nav) {
      nav.addEventListener("focusin", function () { root.classList.remove("nav-off"); });
      nav.addEventListener("focusout", function (e) {
        if (!nav.contains(e.relatedTarget) && spec.getBoundingClientRect().top > window.innerHeight * 0.92) root.classList.add("nav-off");
      });
    }
  }

  /* ---------- hero: the page holds while the block says its four words, one per share of the pin (a
     quarter each). The words come from the markup (#hero-mark: one .mark-txt per word, with its tone), so a
     translation only touches the HTML. Each word is one flat colour (style.css, data-tone); at a cut the next
     layer of the block wipes in over the last and the hairline follows. Pure CSS pin (.has-pin); --p is the
     pin's progress. The arrow at the foot scrolls the whole pin for you, slowly enough to read the words. ---------- */
  var hero = document.querySelector(".hero");
  var heroMark = document.getElementById("hero-mark");
  var heroIntro = [];   /* the load-in tweens (reveals, below): the first cut lands them, so a quick scroll never cuts a half-drawn block */
  /* phones: no pin and no scripted scroll (initHeroCycle, above the GSAP guard, runs the words on a clock;
     the arrow is a plain smooth-scroll link to the band) */
  if (hero && heroMark && ST && !reduce && !PHONE) {
    var heroLayers = Array.prototype.slice.call(heroMark.querySelectorAll(".mark-txt"));
    var nBeats = heroLayers.length;
    var heroProg = hero.querySelector(".hero-prog");
    var heroNotches = [], heroPin = null;
    if (nBeats > 1) {
      root.classList.add("has-pin");
      if (heroProg) heroLayers.forEach(function (layer, i) {
        var notch = document.createElement("b");
        notch.style.left = (i / nBeats * 100) + "%";
        heroProg.appendChild(notch); heroNotches.push(notch);
      });
      var heroBeat = 0, heroWipe = null;
      var dressBeat = function (i) {
        hero.setAttribute("data-tone", heroLayers[i].getAttribute("data-tone") || "");
        hero.setAttribute("data-beat", String(i));
        heroNotches.forEach(function (b, k) { b.classList.toggle("is-on", k <= i); });
      };
      var cutTo = function (i) {
        if (i === heroBeat) return;
        heroIntro.splice(0).forEach(function (tw) { tw.progress(1).kill(); });
        if (heroWipe) heroWipe.progress(1);   /* a cut during a wipe: land that one first */
        var from = heroBeat, layer = heroLayers[i];
        heroBeat = i;
        dressBeat(i);
        layer.classList.add("is-in");
        /* forward the new colour sweeps in from the left, scrolling back it returns from the right */
        heroWipe = gsap.fromTo(layer, { clipPath: i > from ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)" }, {
          clipPath: "inset(0% 0% 0% 0%)", duration: 0.22, ease: "power2.inOut",
          onComplete: function () {
            heroLayers[from].classList.remove("is-on");
            layer.classList.remove("is-in"); layer.classList.add("is-on");
            gsap.set(layer, { clearProps: "clipPath" });
            heroWipe = null;
          }
        });
      };
      heroLayers[0].classList.add("is-on");
      dressBeat(0);
      heroPin = ST.create({
        trigger: hero, start: "top top", end: "bottom bottom",
        onUpdate: function (self) {
          var p = self.progress;
          hero.style.setProperty("--p", p.toFixed(4));
          cutTo(Math.min(nBeats - 1, Math.floor(p * nBeats + 1e-6)));
        }
      });
    }
    /* the arrow: a scripted scroll through the pin to the band below, about 2.6 s so the four words go by;
       the reader's own wheel or finger takes over at once */
    var heroDown = hero.querySelector(".hero-down");
    if (heroDown) heroDown.addEventListener("click", function (e) {
      var target = document.querySelector(heroDown.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      var from = window.scrollY;
      var to = target.getBoundingClientRect().top + from - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      var t0 = performance.now(), D = 2600, live = true;
      var stop = function () { live = false; };
      ["wheel", "touchstart", "keydown"].forEach(function (ev) { window.addEventListener(ev, stop, { once: true, passive: true }); });
      (function step(now) {
        if (!live) return;
        var k = Math.min(1, (now - t0) / D);
        var eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        window.scrollTo({ top: Math.round(from + (to - from) * eased), behavior: "instant" });
        if (k < 1) requestAnimationFrame(step); else stop();
      })(t0);
    });
  }

  /* ---------- the worked example, step by step ----------
     Alice borrows, Bob lends: two people, one contract between them, coins that really move
     from pocket to pocket; above them a big title and one sentence whose words arrive one after
     the other. The moves are the protocol's own: publishing signs nothing, opening is ONE
     transaction both sign (collateral in, dollars out, opening fee out), repaying is ONE
     transaction both sign (dollars and fee out, collateral back), at the deadline Bob signs
     alone. The whole picture is a pure function of one number, the playhead t: frame(t) places
     every coin, fills the blocks, sets state and colours, shows the right words. A clock moves t
     (it runs only while the section is on screen); the dots and the 1/2 chips just set t, so
     a jump, a resize or a loop always lands on the same picture. Nothing here needs GSAP: it is
     started before the GSAP guard, and until it runs the CSS keeps the picture hidden. */
  function initDiagram() {
    var movesSec = document.querySelector(".sec-moves");
    var dg = document.getElementById("diagram");
    var stage = document.getElementById("dg-stage");
    var railsSvg = document.getElementById("rails");
    var stEls = Array.prototype.slice.call(document.querySelectorAll("#story .st"));
    if (!movesSec || !dg || !stage || !railsSvg || !stEls.length) return;

    var SVGNS = "http://www.w3.org/2000/svg";
    var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var easeIO = function (u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; };
    var span = function (t, at, dur) { return clamp01((t - at) / dur); };

    /* the steps come from the markup: data-step names the engine phases a step covers (one or
       more, comma separated), data-d how long each phase lasts, data-r (optional) the share of
       the phases over which its sentence appears. A step then lasts long enough to be read: its
       sentence finishes arriving, then one second for every three words, then 1.2 s more. If
       the phases are shorter than that, the step holds on its last frame (every move is over by
       then) for the difference; the words keep the pace of the phases (d0), not of the hold */
    var SEC = 2.65;                                /* seconds per playhead unit: the pace the story was reviewed at */
    var STEP = {}, END = 0;
    var steps = stEls.map(function (el, n0) {
      var keys = (el.dataset.step || "intro").split(","), ds = (el.dataset.d || "1").split(",");
      var s = { el: el, key: keys[0], a: END, d: 0, r: parseFloat(el.dataset.r) || 0.5,
                k: el.querySelector(".st-k"), p: el.querySelector(".st-p"), words: [], shown: null };
      keys.forEach(function (key, i) {
        var d = parseFloat(ds[i]) || 1;
        STEP[key] = { a: END, d: d }; END += d; s.d += d;
      });
      s.d0 = s.d;
      var n = s.p ? s.p.textContent.split(/[ \t\r\n]+/).filter(Boolean).length : 0;
      /* the opening sentence arrives whole, with its title; the others word by word (see tell) */
      var told = n0 === 0 || !n ? 0 : 0.05 + s.d0 * s.r * (n + 1.4) / n;
      var need = told + (n / 3 + 1.2) / SEC;
      if (need > s.d) { END += need - s.d; s.d = need; }
      return s;
    });
    steps.forEach(function (s, i) {
      var prev = steps[i - 1], next = steps[i + 1];
      s.samePrev = !!prev && prev.k.textContent === s.k.textContent;
      s.sameNext = !!next && next.k.textContent === s.k.textContent;
      s.first = i === 0; s.last = i === steps.length - 1;
    });
    var at = function (key, f) { return STEP[key].a + STEP[key].d * f; };
    /* a step missing from the markup: leave the static story alone rather than half a picture */
    if (["offer", "accept", "time", "repay", "cut", "timeB", "claim", "outro"].some(function (k) { return !STEP[k]; })) return;

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
    var NB = blockEls.length, NB_A = Math.round(NB * 0.6);        /* 30 blocks for 30 days: Alice repays on day 18 */

    /* one move = a coin leaves a pocket at `at`, lands in another `dur` later. kind "bus" rides
       the payment lane under the cards, kind "line" goes straight (collateral in and out). */
    var seg = function (key, f0, f1, from, to, kind) {
      return { at: at(key, f0), dur: STEP[key].d * (f1 - f0), from: from, to: to, kind: kind };
    };
    var jump = function (t, to) { return { at: t, dur: 0, to: to }; };
    var end = function (m) { return m.at + m.dur; };
    var cutMid = at("cut", 0.5);                                  /* the stage is dark: everything rewinds here */
    /* opening, one transaction: the collateral goes in while the dollars ride the lane to Alice;
       the opening fee (bitcoin, Alice to Bob) sets off as the dollars climb out of the lane,
       so the two never cross on it */
    var mLock = seg("accept", 0.26, 0.56, "bA", "cA", "line"), mFund = seg("accept", 0.28, 0.62, "lA", "bA", "bus"),
        mOrig = seg("accept", 0.54, 0.88, "bs", "ls1", "bus");
    /* repaying, one transaction: the 40.000 to Bob, the 1.000 fee behind them with a halt over
       the protocol's slot to drop its share, and the collateral home, all at once */
    var mPay = seg("repay", 0.22, 0.62, "bA", "lA", "bus"), mBack = seg("repay", 0.34, 0.70, "cA", "bA", "line"),
        mFee = seg("repay", 0.31, 0.52, "bs", "C", "bus"), mDrop = seg("repay", 0.52, 0.66, "C", "ps", "line"),
        mFeeOn = seg("repay", 0.66, 0.88, "C", "ls2", "bus");
    var mClaim = seg("claim", 0.28, 0.66, "cA", "lA", "line");   /* the deadline: Bob alone */
    var COINS = [
      { el: document.getElementById("c-btc"), home: "bA", segs: [mLock, mBack, jump(cutMid, "cA"), mClaim] },
      { el: document.getElementById("c-usd"), home: "lA", segs: [mFund, mPay, jump(cutMid, "bA")] },
      { el: document.getElementById("c-orig"), home: "bs", segs: [mOrig] },
      /* the protocol's share: it comes out from under the fee as the fee stops over the toll */
      { el: document.getElementById("c-cut"), home: "C", show: [mDrop.at, cutMid], segs: [mDrop] },
      /* the loan fee: it turns up in Alice's pocket as she repays, halts over the toll, goes on to Bob, lighter */
      { el: document.getElementById("c-fee"), home: "bs", show: [at("repay", 0.02), cutMid], segs: [mFee, mFeeOn],
        scale: function (t) { return 1 - 0.16 * easeIO(span(t, mDrop.at, mDrop.dur)); } }
    ];
    /* who signs what: both open, both repay, Bob alone claims. A badge is lit for its signing
       step only, so the finished frame of each step still shows who signed it */
    var tSign = at("accept", 0.14), tSignR = at("repay", 0.10), tSignC = at("claim", 0.12);
    var tLocked = end(mLock), tOpen = end(mOrig), tRepaid = Math.max(end(mBack), end(mFeeOn)), tClaimed = end(mClaim);
    var tPaid = end(mDrop), tExpired = at("timeB", 0.86);

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

    root.classList.add("has-play");                /* one screen tall, the words share one cell */
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
      /* short screens: the picture shrinks as a whole rather than spilling out of the stage. Its
         labels grow by as much as it shrinks (--fit, read by style.css) so they still read at
         12px or more; bigger labels make the picture a little taller, so the scale is found in
         a few passes */
      stage.style.transform = ""; dg.style.transform = ""; fit = 1;
      dg.style.setProperty("--fit", "1");
      var room = dg.parentNode.clientHeight, tall = stage.offsetHeight;
      for (var pass = 0; pass < 4 && room > 0 && tall * fit > room + 0.5; pass++) {
        fit = Math.max(0.6, room / tall);
        dg.style.setProperty("--fit", fit.toFixed(4));
        tall = stage.offsetHeight;
      }
      if (fit < 1) dg.style.transform = "scale(" + fit.toFixed(4) + ")";
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
        if (run && run.trk && run.len > 0) {       /* a zero-width stage has no route to walk */
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

      /* the offer writes itself: one term after the other, then the margin shows. It is an ad:
         nobody signs it */
      var so = STEP.offer;
      termRows.forEach(function (li, k) {
        var p = easeIO(span(t, so.a + so.d * (0.06 + 0.07 * k), so.d * 0.1));
        li.style.opacity = p.toFixed(3);
        var bar = li.querySelector(".bar"); if (bar) bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
      });
      var both = (t >= tSign && t < STEP.time.a) || (t >= tSignR && t < cutMid);
      sgB.classList.toggle("on", both);
      sgL.classList.toggle("on", both || t >= tSignC);
      nodeC.classList.toggle("is-cover", t >= at("offer", 0.46) && t < STEP.accept.a);
      tollEl.classList.toggle("is-paid", t >= tPaid && t < cutMid);

      /* state, colour, lock */
      var tone = t < tOpen ? "idle" : t < tRepaid ? "live" : t < cutMid ? "ok" : t < tExpired ? "live" : "warn";
      var state = t < tSign ? L.offer : t < tOpen ? L.signing : t < tRepaid ? L.active : t < cutMid ? L.repaid
                : t < tExpired ? L.active : t < tClaimed ? L.expired : L.claimed;
      var closed = (t >= tLocked && t < mBack.at) || (t >= cutMid && t < mClaim.at);
      var scene = t < so.a ? "intro" : t < tSign ? "offer"
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
      var n = t < cutMid ? Math.round(NB_A * span(t, at("time", 0.12), STEP.time.d * 0.7))
                         : Math.round(NB * span(t, at("timeB", 0.1), STEP.timeB.d * 0.7));
      var now = (tone === "live" && n < NB) ? n : -1;
      if (n !== last.n || now !== last.now) {
        last.n = n; last.now = now;
        for (var b = 0; b < NB; b++) { blockEls[b].className = b < n ? "on" : b === now ? "now" : ""; }
      }

      /* the cut: the stage leaves, the swap turns, the stage comes back rewound. It comes back a
         beat after the rewind (the colour transitions are over by then), so the dark stays short.
         The loop's seam is the same kind of cut: the outro fades out, t wraps to -0.3 in the
         dark, the intro fades in. Paused, a step always shows its picture whole */
      var out = span(t, at("cut", 0.06), STEP.cut.d * 0.26), inn = span(t, cutMid + 0.15, 0.25);
      var op = still ? 1 : t < cutMid ? 1 - out : inn;
      if (!still) op *= span(t, -0.3, 0.3) * (1 - span(t, END - 0.3, 0.3));
      stage.style.opacity = op.toFixed(3);
      stage.style.transform = "scale(" + (0.96 + 0.04 * op).toFixed(4) + ")";
      if (cutIc) {
        cutIc.style.opacity = (still || t < STEP.cut.a || t > STEP.timeB.a ? 0 : 1 - op).toFixed(3);
        cutIc.style.transform = "rotate(" + (180 * easeIO(span(t, at("cut", 0.25), STEP.cut.d * 0.6))).toFixed(1) + "deg)";
      }
      if (endWord) endWord.style.opacity = span(t, at("outro", 0.4), STEP.outro.d * 0.25).toFixed(3);
    }

    /* the words: a title per move, a sentence per step, its words arriving one after the other.
       Paused (or resumed mid-step: `whole`), the step's sentence is there in full */
    var whole = null;
    function tell(t) {
      steps.forEach(function (s) {
        var a = s.a, b = s.a + s.d, on = (t >= a || s.first) && (t < b || s.last);
        if (!on) { if (s.shown !== false) { s.shown = false; s.el.style.opacity = 0; s.el.style.visibility = "hidden"; } return; }
        if (s.shown !== true) { s.shown = true; s.el.style.opacity = 1; s.el.style.visibility = "visible"; }
        var full = still || s === whole;
        var fin = s.first ? span(t, -0.3, 0.16) : span(t, a, 0.16), fout = still ? 0 : span(t, b - 0.12, 0.12);
        var kin = s.samePrev || full ? 1 : fin, kout = s.sameNext ? 0 : fout;
        s.k.style.opacity = (easeIO(kin) * (1 - kout)).toFixed(3);
        s.k.style.transform = "translateY(" + ((1 - easeIO(kin)) * 16).toFixed(1) + "px)";
        var n = s.words.length, wd = (s.d0 * s.r) / Math.max(1, n);
        for (var i = 0; i < n; i++) {
          var o = full ? 1 : s.first ? fin : span(t, a + 0.05 + i * wd, wd * 2.4);
          s.words[i].style.opacity = (o * (1 - fout)).toFixed(3);
        }
      });
    }

    function frame(t) { paint(t); tell(t); }
    var cur = 0;
    var redraw = function () { build(); frame(cur); };

    /* one span per word; a no-break space (&nbsp;) stays inside its word, so «1&nbsp;L-BTC» never splits */
    steps.forEach(function (s) {
      var txt = s.p.textContent.split(/[ \t\r\n]+/).filter(Boolean);
      s.p.textContent = "";
      txt.forEach(function (w, i) {
        var e = document.createElement("span"); e.className = "w"; e.textContent = w;
        s.p.appendChild(e); if (i < txt.length - 1) s.p.appendChild(document.createTextNode(" "));
        s.words.push(e);
      });
    });
    redraw();
    /* rebuild when the picture's box really changes (the window, the fonts, the head row); a
       phone's URL bar changes the window's height but not 100svh, so it rebuilds nothing */
    var boxKey = "";
    var refit = function () {
      var k = [dg.parentNode.clientWidth, dg.parentNode.clientHeight, stage.offsetWidth, stage.offsetHeight].join("x");
      if (k !== boxKey) { boxKey = k; redraw(); }
    };
    if ("ResizeObserver" in window) { var ro = new ResizeObserver(refit); ro.observe(dg.parentNode); ro.observe(stage); }
    else window.addEventListener("resize", redraw);
    window.addEventListener("load", redraw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);

    /* the clock. SPEED turns seconds into playhead units (one unit = SEC seconds); it only runs
       while the section is on screen and the tab is visible. Reduced motion: no clock, the dots
       show each step finished. */
    var player = document.getElementById("player"), playBtn = document.getElementById("pl-play");
    var dotsBox = document.getElementById("pl-dots");
    if (player && playBtn && dotsBox) {
      var SPEED = 1 / SEC, wanted = !reduce, inView = false, raf = 0, then = 0;
      var shown = steps.filter(function (s) { return !s.first && !s.last; });
      var tCut = STEP.cut.a;
      shown.forEach(function (s, i) {
        if (s.a === tCut) { var g = document.createElement("span"); g.className = "pl-gap"; dotsBox.appendChild(g); }
        var b = document.createElement("button"); b.type = "button"; b.className = "pl-dot" + (s.a >= tCut ? " is-b" : "");
        /* the dot's name is the title without its marker (01, 1, 2) and without a closing stop */
        var em = s.k.querySelector("em");
        var name = s.k.textContent.slice(em ? em.textContent.length : 0).trim().replace(/\.$/, "");
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
      /* a jump (a dot, a chip, the loop's wrap) repaints in one frame: with the transitions off
         for that frame, no colour trails behind the coins */
      var show = function (t) {
        var jumped = Math.abs(t - cur) > 0.2;
        if (jumped) movesSec.classList.add("dg-jump");
        cur = t;
        if (whole && (t < whole.a || t >= whole.a + whole.d)) whole = null;
        frame(cur); marks();
        if (jumped) { void movesSec.offsetWidth; movesSec.classList.remove("dg-jump"); }
      };
      var go = function (s) { whole = null; show(reduce || !wanted ? s.a + s.d - 0.001 : s.a + 0.001); };
      /* dt is measured from the previous frame, not from the end of the previous tick: the story
         keeps its pace whatever the frame costs */
      var tick = function (now) {
        raf = 0;
        var dt = then ? Math.min(0.1, Math.max(0, (now - then) / 1000)) : 0; then = now;
        var t = cur + dt * SPEED;
        try { show(t >= END ? -0.3 : t); } finally { run(); }
      };
      var run = function () {
        var should = wanted && inView && !document.hidden;
        if (should && !raf) raf = requestAnimationFrame(tick);
        if (!should) { if (raf) cancelAnimationFrame(raf); raf = 0; then = 0; }
      };
      var paintBtn = function () {
        playBtn.setAttribute("aria-label", wanted ? L.pause : L.play);
        playBtn.querySelector("use").setAttribute("href", wanted ? "#i-pause" : "#i-play");
      };
      playBtn.addEventListener("click", function () {
        wanted = !wanted; still = reduce || !wanted;
        /* resuming mid-step keeps the words already on screen instead of typing them again */
        if (wanted) whole = steps.filter(function (s) { return cur >= s.a && cur < s.a + s.d; })[0] || null;
        paintBtn(); show(cur); run();
      });
      /* previous / next: the buttons beside the picture (in the bar on narrow screens) and the
         arrow keys. The story is a loop, so the ends wrap; from the closing line, back is the last step */
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
      /* the keys work wherever the focus is in the section: the side arrows and the chips sit
         outside the player strip */
      movesSec.addEventListener("keydown", function (e) {
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
        /* the ratio check is belt and braces for engines that report isIntersecting below the threshold */
        new IntersectionObserver(function (en) { inView = en[0].isIntersecting && en[0].intersectionRatio >= 0.35; run(); },
          { threshold: [0, 0.35] }).observe(movesSec);
      } else inView = true;
      document.addEventListener("visibilitychange", run);
      paintBtn();
      show(reduce ? shown[0].a + shown[0].d - 0.001 : 0);
      run();
    }
  }

  /* ---------- 001 on phones: four tap stops instead of the clock. The engine above stays as it is; this
     pauses it (the flag sticks even before the section is on screen) and drives it through its own dots
     (#pl-dots, one per step but the intro and the outro: offer 0 · accept 1 · time 2 · repay 3 · cut 4 ·
     timeB 5 · claim 6), so a stop
     always shows that step's finished picture and its whole sentence. The bar and the chips are hidden
     by CSS; the .mob-step control (‹ · «Passo N di 4» · › and the crimson «Avanti») is what you tap ---------- */
  function initMobDiagram() {
    var box = document.querySelector(".mob-step"), playBtn = document.getElementById("pl-play");
    var dots = Array.prototype.slice.call(document.querySelectorAll("#pl-dots .pl-dot"));
    if (!box || !playBtn || dots.length < 7) return;
    var STOPS = [0, 1, 3, 6];                       /* Alice chiede · Bob accetta · Alice restituisce · Bob prende il bitcoin */
    var lbl = box.querySelector(".mob-lbl"), next = box.querySelector(".mob-next"), at = 0;
    var paint = function () {
      lbl.textContent = L.step + " " + (at + 1) + " " + L.of + " " + STOPS.length;
      var last = at === STOPS.length - 1;
      next.querySelector("span").textContent = last ? L.again : L.next;
      next.classList.toggle("is-again", last);
    };
    var goTo = function (i) {
      at = ((i % STOPS.length) + STOPS.length) % STOPS.length;
      dots[STOPS[at]].click(); paint();
    };
    if (playBtn.getAttribute("aria-label") === L.pause) playBtn.click();
    goTo(0);
    box.querySelectorAll("[data-mob]").forEach(function (b) { b.addEventListener("click", function () { goTo(at + (+b.dataset.mob)); }); });
    next.addEventListener("click", function () { goTo(at + 1); });
  }

  /* ---------- the hero on phones: the block says its four words on a clock, 2.2 s each, the next one cutting
     in over the last with the same left-to-right wipe (style.css: mark-cut on .is-in). It runs only while the
     hero is on screen and the tab visible. No GSAP needed ---------- */
  function initHeroCycle() {
    var box = document.querySelector(".hero"), mark = document.getElementById("hero-mark");
    if (!box || !mark) return;
    var layers = Array.prototype.slice.call(mark.querySelectorAll(".mark-txt"));
    if (layers.length < 2) return;
    root.classList.add("has-cycle");
    var beat = 0, timer = 0, swap = 0, inView = true;
    var dress = function (i) { box.setAttribute("data-tone", layers[i].getAttribute("data-tone") || ""); box.setAttribute("data-beat", String(i)); };
    layers[0].classList.add("is-on"); dress(0);
    var cut = function () {
      var from = beat, to = (beat + 1) % layers.length, layer = layers[to];
      if (swap) { clearTimeout(swap); layers.forEach(function (l) { l.classList.remove("is-in"); }); layers[from].classList.add("is-on"); }
      beat = to; dress(to);
      layer.classList.add("is-in");
      swap = setTimeout(function () {
        swap = 0;
        layers[from].classList.remove("is-on");
        layer.classList.remove("is-in"); layer.classList.add("is-on");
      }, 360);
    };
    var run = function () {
      var should = inView && !document.hidden;
      if (should && !timer) timer = setInterval(cut, 2200);
      if (!should && timer) { clearInterval(timer); timer = 0; }
    };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; run(); }, { threshold: 0.15 }).observe(box);
    document.addEventListener("visibilitychange", run);
    run();
  }

  /* ---------- 002 on phones: one rival at a time. Above the table a segmented control, one button
     per rival column (its name read from the header cell, so each language keeps its own); the
     choice lands on the table as data-vs="aave|morpho|bank" (the column order) and style.css shows,
     in every row, our cell beside the chosen one. Above 860px the control is hidden and the table
     keeps its four columns; without JS there is no control and the rows stack as before. ---------- */
  function initSchemaPick() {
    var schema = document.querySelector(".schema");
    if (!schema || schema.previousElementSibling && schema.previousElementSibling.classList.contains("seg-vs")) return;
    var KEYS = ["aave", "morpho", "bank"];
    var heads = Array.prototype.slice.call(schema.querySelectorAll(".sch-heads .sch-head:not(.sch-us) b")).slice(0, KEYS.length);
    if (heads.length !== KEYS.length) return;
    var seg = document.createElement("div");
    seg.className = "seg seg-vs"; seg.setAttribute("role", "group"); seg.setAttribute("aria-label", L.vs);
    var btns = heads.map(function (b, i) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.textContent = b.textContent.trim(); btn.dataset.vs = KEYS[i];
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () { pick(KEYS[i]); });
      seg.appendChild(btn); return btn;
    });
    var pick = function (key) {
      schema.dataset.vs = key;
      btns.forEach(function (btn) { btn.setAttribute("aria-pressed", String(btn.dataset.vs === key)); });
    };
    schema.parentNode.insertBefore(seg, schema);
    pick(KEYS[0]);
    /* phones: the rows become the cards of a strip (one question per card), the table rows step aside */
    if (matchMedia("(max-width: 767px)").matches) {
      var strip = document.createElement("div"); strip.className = "snap sch-strip";
      strip.setAttribute("data-snap-label", L.vsq || "");
      Array.prototype.forEach.call(schema.querySelectorAll(".sch-row"), function (row) {
        var card = document.createElement("div"); card.className = "sch-card";
        Array.prototype.forEach.call(row.children, function (c) { card.appendChild(c.cloneNode(true)); });
        strip.appendChild(card);
      });
      schema.appendChild(strip); schema.classList.add("has-strip");
    }
  }

  /* ---------- phones: the swipe strips get their dots, the bar says which section you are in ---------- */
  function initSnaps() {
    Array.prototype.forEach.call(document.querySelectorAll(".snap"), function (strip) {
      var cards = Array.prototype.slice.call(strip.children);
      if (cards.length < 2 || (strip.nextElementSibling && strip.nextElementSibling.classList.contains("snap-dots"))) return;
      var dots = document.createElement("div"); dots.className = "snap-dots";
      var btns = cards.map(function (c, i) {
        var b = document.createElement("button"); b.type = "button";
        b.setAttribute("aria-label", ((strip.getAttribute("data-snap-label") || "") + " " + (i + 1) + "/" + cards.length).trim());
        b.addEventListener("click", function () { strip.scrollTo({ left: c.offsetLeft - strip.offsetLeft - parseFloat(getComputedStyle(strip).paddingLeft || 0), behavior: "smooth" }); });
        dots.appendChild(b); return b;
      });
      strip.parentNode.insertBefore(dots, strip.nextSibling);
      var mark = function (i) { btns.forEach(function (b, k) { if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); }); };
      mark(0);
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) mark(cards.indexOf(e.target)); }); }, { root: strip, threshold: 0.6 });
        cards.forEach(function (c) { io.observe(c); });
      }
    });
  }
  function initNavHere() {
    var here = document.querySelector(".nav-here");
    var secs = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
    if (!here || !secs.length || !("IntersectionObserver" in window)) return;
    var on = null;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) on = e.target; else if (on === e.target) on = null; });
      here.textContent = on ? on.getAttribute("data-nav") : "";
      here.classList.toggle("is-on", !!on);
    }, { rootMargin: "-38% 0px -57% 0px", threshold: 0 });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ---------- details on demand: the + is only the visible handle. A click anywhere on a row,
     a card or a fee box opens (or closes) its small print; links and text selection still work.
     No GSAP needed: started with the diagram, before the GSAP guard. ---------- */
  function initDetails() {
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
  }

  /* ---------- reveals: short, once, from a visible resting state when JS is off ---------- */
  if (!reduce) {
    var h1 = document.getElementById("h-hero");
    var h1Fix = h1 && h1.querySelector(".h-fix");
    if (h1Fix) {
      /* wrap every word of the visible sentence in a span, keeping the «bitcoin» wrapper (its orange bar)
         intact; the screen-reader sentence and the block are left alone. Only plain spaces split: a
         no-break space keeps «peer to peer» in one piece */
      var wrapWords = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split(/([ \t\r\n]+)/).forEach(function (part) {
              if (!part) return;
              if (/^[ \t\r\n]+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
              var w = document.createElement("span"); w.className = "word"; w.textContent = part; frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) { wrapWords(child); }
        });
      };
      wrapWords(h1Fix);
      /* a quick, clean arrival, readable in about half a second: the words rise into place one after the
         other (no blur), the orange bar draws itself under «bitcoin», the block wipes in from the left,
         then the brand and the arrow settle. All of it goes into heroIntro: the first cut
         lands it at once */
      heroIntro.push(gsap.from(h1Fix.querySelectorAll(".word"), { y: 14, opacity: 0, duration: 0.42, stagger: 0.045, delay: 0.05, ease: "power3.out", clearProps: "transform,opacity" }));
      var uBtc = h1Fix.querySelector(".u-btc");
      if (uBtc) heroIntro.push(gsap.fromTo(uBtc, { "--u": 0 }, { "--u": 1, duration: 0.4, delay: 0.3, ease: "power3.inOut" }));
    }
    if (heroMark && (root.classList.contains("has-pin") || root.classList.contains("has-cycle"))) {
      heroIntro.push(gsap.from(heroMark, { clipPath: "inset(0% 100% 0% 0%)", duration: 0.34, delay: 0.3, ease: "power3.out", clearProps: "clipPath" }));
    }
    var heroRest = gsap.utils.toArray(".hero-top, .hero-down");
    if (heroRest.length) heroIntro.push(gsap.from(heroRest, { y: 10, opacity: 0, duration: 0.4, stagger: 0.05, delay: 0.45, ease: "power2.out", clearProps: "transform,opacity" }));
    /* the fans arrive in CSS alone (style.css: fans-reveal), one clip per fan: no per-stroke animation, no
       scaling of the masked layer, nothing that can flicker or be left half drawn */
    var heroBox = document.querySelector(".hero");
    if (heroBox) {
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
