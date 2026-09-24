/* Templar Wallet docs — the chapter you are reading (scrollspy), a «Copia» button on every command, wide tables
   that stack on phones, the phone table of contents that closes itself. No dependencies. wallet.js, loaded
   before this file, already does the theme toggle, the mobile menu and .reveal. */
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var EN = (root.lang || "").toLowerCase().indexOf("en") === 0;
  var T = EN
    ? { copy: "Copy", copied: "Copied", label: "Copy the command", done: "Copied to the clipboard", fail: "Could not copy: select the text by hand" }
    : { copy: "Copia", copied: "Copiato", label: "Copia il comando", done: "Copiato negli appunti", fail: "Non riesco a copiare: seleziona il testo a mano" };

  /* one polite live region for everything this file says out loud */
  var live = document.createElement("p");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);
  var say = function (msg) { live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 50); };

  /* ---------- (a) scrollspy: the chapter under a line at 30% of the screen is the current one ---------- */
  var links = $$(".toc a[href^='#']");
  var side = $(".docs-side");
  var toc = $(".docs-toc");
  var now = $("[data-toc-now]");
  var known = {};
  links.forEach(function (a) { known[a.getAttribute("href").slice(1)] = true; });
  var sections = $$("section.doc[id]").filter(function (s) { return known[s.id]; });
  var current = null;

  function keepVisible(a) {
    /* scroll the sidebar itself (never the page) so the marked link stays in view */
    if (!side || !side.clientHeight || side.scrollHeight <= side.clientHeight) return;
    var r = a.getBoundingClientRect(), sr = side.getBoundingClientRect();
    if (r.top < sr.top + 48 || r.bottom > sr.bottom - 48) side.scrollTop += (r.top - sr.top) - sr.height / 2 + r.height / 2;
  }
  function mark(id) {
    if (id === current) return;
    current = id;
    var first = null;
    links.forEach(function (a) {
      if (id && a.getAttribute("href") === "#" + id) {
        a.setAttribute("aria-current", "true");
        if (side && side.contains(a)) keepVisible(a);
        if (!first) first = a;
      } else a.removeAttribute("aria-current");
    });
    if (now) {
      var t = first && (first.querySelector("span") || first);
      now.textContent = t ? t.textContent : "";
    }
  }

  if (sections.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) mark(en.target.id);
        /* back above the first chapter (the hero): nothing is current */
        else if (en.target === sections[0] && en.target.id === current && en.boundingClientRect.top > 0) mark(null);
      });
    }, { rootMargin: "-30% 0px -69% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });

    /* a short last chapter may never reach the line: at the very bottom it is the current one */
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var last = sections[sections.length - 1];
        if (window.innerHeight + window.pageYOffset >= root.scrollHeight - 4 && last.getBoundingClientRect().top < window.innerHeight) mark(last.id);
      });
    }, { passive: true });
  }

  /* ---------- (b) copy buttons on every pre.code ---------- */
  function copyText(text, ok, ko) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) {
      navigator.clipboard.writeText(text).then(ok, function () { fallback(text, ok, ko); });
    } else fallback(text, ok, ko);
  }
  function fallback(text, ok, ko) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.top = "0"; ta.style.left = "-9999px"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var done = false;
    try { done = document.execCommand("copy"); } catch (e) { done = false; }
    document.body.removeChild(ta);
    if (done) ok(); else ko();
  }
  $$("pre.code").forEach(function (pre) {
    if (pre.parentNode && pre.parentNode.classList && pre.parentNode.classList.contains("code-box")) return;
    var box = document.createElement("div");
    box.className = "code-box";
    pre.parentNode.insertBefore(box, pre);
    box.appendChild(pre);
    var head = document.createElement("div");
    head.className = "code-head";
    var lab = pre.getAttribute("data-label");
    if (lab) { var k = document.createElement("span"); k.className = "code-k"; k.textContent = lab; head.appendChild(k); }
    var b = document.createElement("button");
    b.type = "button"; b.className = "code-copy"; b.textContent = T.copy; b.setAttribute("aria-label", T.label + (lab ? " (" + lab + ")" : ""));
    head.appendChild(b);
    box.insertBefore(head, pre);
    var timer = null;
    b.addEventListener("click", function () {
      var src = pre.querySelector("code") || pre;
      var text = (src.textContent || "").replace(/\s+$/, "");
      copyText(text, function () {
        b.textContent = T.copied; b.classList.add("is-done"); say(T.done);
        clearTimeout(timer);
        timer = setTimeout(function () { b.textContent = T.copy; b.classList.remove("is-done"); }, 1500);
      }, function () { say(T.fail); });
    });
  });

  /* ---------- (c) tables with three or more columns: each cell learns the name of its column, so docs.css can
     stack a row into a block on phones; explicit roles keep the table readable to screen readers once stacked ---------- */
  $$("table.dtable").forEach(function (t) {
    var heads = $$("thead th", t).map(function (th) { return (th.textContent || "").replace(/\s+/g, " ").trim(); });
    if (heads.length < 3) return;
    t.classList.add("is-stack");
    t.setAttribute("role", "table");
    $$("thead, tbody", t).forEach(function (g) { g.setAttribute("role", "rowgroup"); });
    $$("tr", t).forEach(function (tr) { tr.setAttribute("role", "row"); });
    $$("thead th", t).forEach(function (th) { th.setAttribute("role", "columnheader"); });
    $$("tbody tr", t).forEach(function (tr) {
      for (var i = 0; i < tr.cells.length; i++) {
        tr.cells[i].setAttribute("role", "cell");
        if (heads[i]) tr.cells[i].setAttribute("data-th", heads[i]);
      }
    });
  });

  /* ---------- (d) the phone table of contents closes after a pick, on Escape and on a tap elsewhere ---------- */
  if (toc) {
    $$("a", toc).forEach(function (a) { a.addEventListener("click", function () { toc.open = false; }); });
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Escape" || e.key === "Esc") && toc.open) {
        toc.open = false;
        var s = $("summary", toc); if (s) s.focus();
      }
    });
    document.addEventListener("click", function (e) { if (toc.open && !toc.contains(e.target)) toc.open = false; });
  }
})();

/* third review round (2026-09-24): paths in tables break after a separator, never mid-name; code blocks that run
   past their edge fade out until scrolled to the end; the phone chapter list closes when the page scrolls away */
(function () {
  "use strict";
  var all = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  all(".dtable td code").forEach(function (c) {
    if (c.children.length) return;
    var t = c.textContent;
    if (!/[\/\\]/.test(t)) return;
    c.textContent = "";
    t.split(/([\/\\])/).forEach(function (part) {
      if (!part) return;
      c.appendChild(document.createTextNode(part));
      if (part === "/" || part === "\\") c.appendChild(document.createElement("wbr"));
    });
  });
  var pres = all("pre.code");
  var mark = function () {
    pres.forEach(function (p) {
      var cut = p.scrollWidth > p.clientWidth + 1;
      p.classList.toggle("is-cut", cut);
      p.classList.toggle("is-end", cut && p.scrollLeft + p.clientWidth >= p.scrollWidth - 2);
    });
  };
  pres.forEach(function (p) { p.addEventListener("scroll", mark, { passive: true }); });
  window.addEventListener("resize", mark);
  mark();
  var toc = document.querySelector("details.docs-toc");
  if (toc) {
    var y0 = 0;
    toc.addEventListener("toggle", function () { if (toc.open) y0 = window.scrollY; });
    window.addEventListener("scroll", function () { if (toc.open && Math.abs(window.scrollY - y0) > 48) toc.open = false; }, { passive: true });
  }
})();
