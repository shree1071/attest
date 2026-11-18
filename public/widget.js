(function () {
  const currentScript =
    document.currentScript ||
    document.querySelector("script[data-product]");

  if (!currentScript) return;

  const slug = currentScript.getAttribute("data-product");
  const theme = currentScript.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const containerId = currentScript.getAttribute("data-container");
  const rawLayout = currentScript.getAttribute("data-layout") || "wall";
  const layout = rawLayout === "masonry" ? "wall" : rawLayout;
  const rawAccent = currentScript.getAttribute("data-accent") || "";
  const accent = /^#[0-9a-fA-F]{6}$/.test(rawAccent) ? rawAccent : "#2563eb";
  const rawAnimation = currentScript.getAttribute("data-animation") || "up";
  const animation = ["none", "fade", "up", "zoom", "slide", "flip"].includes(rawAnimation)
    ? rawAnimation
    : "up";
  const parsedLimit = parseInt(currentScript.getAttribute("data-limit") || "", 10);
  const limit = isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 0;
  const host = new URL(currentScript.src).origin;

  if (!slug) {
    console.error("[Attest] Missing data-product attribute on script tag.");
    return;
  }

  const container =
    layout === "float"
      ? document.body
      : containerId
        ? document.getElementById(containerId)
        : currentScript.parentElement;

  if (!container) return;

  const isDark = theme === "dark";
  const bgCard = isDark ? "#18181b" : "#ffffff";
  const textPrimary = isDark ? "#f4f4f5" : "#18181b";
  const textSecondary = isDark ? "#a1a1aa" : "#71717a";
  const canvas = isDark ? "#09090b" : "transparent";

  const wrapper = document.createElement("div");
  wrapper.className = "attest-widget-container";
  wrapper.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  container.appendChild(wrapper);

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initials(name) {
    return String(name || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 1)
      .map(function (part) {
        return part[0].toUpperCase();
      })
      .join("");
  }

  function stars(rating) {
    var out = '<div class="attest-stars" aria-label="' + rating + ' out of 5 stars">';
    for (var i = 0; i < 5; i++) {
      out +=
        '<svg viewBox="0 0 20 20" class="attest-star' +
        (i < rating ? "" : " attest-star-empty") +
        '"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
    }
    return out + "</div>";
  }

  function avatar(t) {
    if (t.author.avatarUrl) {
      return (
        '<img src="' +
        escapeHtml(t.author.avatarUrl) +
        '" alt="' +
        escapeHtml(t.author.name) +
        '" class="attest-avatar" loading="lazy" referrerpolicy="no-referrer" />'
      );
    }
    return '<div class="attest-avatar">' + escapeHtml(initials(t.author.name)) + "</div>";
  }

  function card(t, index) {
    var meta = t.author.headline || (t.sourceType === "exchange" ? "Community exchange" : "Verified customer");
    var animAttrs =
      animation === "none"
        ? ""
        : ' data-anim="' + animation + '" style="--i:' + (index || 0) + '"';
    return (
      '<figure class="attest-card"' +
      animAttrs +
      ">" +
      stars(t.rating || 5) +
      '<blockquote class="attest-content">\u201c' +
      escapeHtml(t.content) +
      "\u201d</blockquote>" +
      '<figcaption class="attest-author">' +
      avatar(t) +
      "<div>" +
      '<div class="attest-name">' +
      escapeHtml(t.author.name) +
      "</div>" +
      '<div class="attest-headline">' +
      escapeHtml(meta) +
      "</div>" +
      (t.author.identitySource === "linkedin"
        ? '<div class="attest-badge">\u2713 Signed in with LinkedIn</div>'
        : "") +
      "</div></figcaption></figure>"
    );
  }

  // Cards are appended to the currently shortest column, so an uneven number of
  // reviews always fills every column instead of leaving a trailing gap.
  function columnCountFor(width) {
    if (width >= 1000) return 3;
    if (width >= 620) return 2;
    return 1;
  }

  function distributeMasonry(host) {
    if (!host) return;
    var cards = Array.prototype.slice.call(host.children);
    if (!cards.length) return;
    var currentCols = 0;

    function layout(cols) {
      currentCols = cols;
      host.innerHTML = "";
      var columns = [];
      for (var i = 0; i < cols; i++) {
        var column = document.createElement("div");
        column.className = "attest-col";
        host.appendChild(column);
        columns.push(column);
      }
      cards.forEach(function (node) {
        var target = columns[0];
        for (var i = 1; i < columns.length; i++) {
          if (columns[i].offsetHeight < target.offsetHeight) target = columns[i];
        }
        target.appendChild(node);
      });
    }

    function columnCountNow() {
      var width =
        host.clientWidth || document.documentElement.clientWidth || window.innerWidth || 1024;
      return columnCountFor(width);
    }

    function refresh() {
      var cols = columnCountNow();
      if (cols !== currentCols) layout(cols);
    }

    layout(columnCountNow());

    // The script can execute before the container has a measurable width (async load,
    // hidden tab). requestAnimationFrame is suspended in background tabs, so also retry
    // on timers and on window load. Timers are safe here: refresh() only relayouts when
    // the column count actually changes, so it cannot loop.
    if (window.requestAnimationFrame) window.requestAnimationFrame(refresh);
    setTimeout(refresh, 0);
    setTimeout(refresh, 250);
    window.addEventListener("load", refresh);

    var timer;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(refresh, 150);
    });
  }

  // Reveals cards as they scroll into view; falls back to showing everything at once.
  function revealCards(scope, immediate) {
    var nodes = scope.querySelectorAll(".attest-card[data-anim]");
    if (!nodes.length) return;
    if (immediate || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, function (node) {
        node.classList.add("attest-in");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("attest-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.12 },
    );
    Array.prototype.forEach.call(nodes, function (node) {
      observer.observe(node);
    });
  }

  // Guarantees content is readable even if animations never advance (paused tab,
  // reduced-motion quirks, older embeds). Content always wins over the effect.
  function forceVisible(scope) {
    var nodes = scope.querySelectorAll(".attest-card[data-anim]");
    Array.prototype.forEach.call(nodes, function (node) {
      node.classList.add("attest-in");
      if (window.getComputedStyle(node).opacity === "0") {
        node.style.animation = "none";
        node.style.opacity = "1";
      }
    });
  }

  var avgRating = "5.0";

  var styles =
    "<style>" +
    ".attest-widget-container{--attest-accent:" +
    accent +
    ";}" +
    ".attest-widget-container *{box-sizing:border-box;}" +
    ".attest-card{background:" +
    bgCard +
    ";border-radius:24px;padding:26px;display:flex;flex-direction:column;box-shadow:0 20px 45px -32px rgba(15,23,42,.5),0 0 0 1px rgba(15,23,42,.04);margin:0 0 18px;text-align:left;}" +
    // Shortest-column-first masonry (JS distributed) instead of CSS column-count,
    // which leaves an empty trailing column whenever the card count is uneven.
    ".attest-wall{display:flex;align-items:flex-start;gap:18px;}" +
    ".attest-wall .attest-col{display:flex;flex-direction:column;gap:18px;flex:1 1 0;min-width:0;}" +
    ".attest-wall .attest-card{margin:0;width:100%;}" +
    ".attest-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;}" +
    ".attest-grid .attest-card{margin:0;}" +
    ".attest-track{display:flex;gap:18px;overflow-x:auto;padding:4px 2px 16px;scroll-snap-type:x mandatory;-ms-overflow-style:none;scrollbar-width:none;}" +
    ".attest-track::-webkit-scrollbar{display:none;}" +
    ".attest-track .attest-card{flex:0 0 320px;max-width:320px;scroll-snap-align:start;margin:0;}" +
    ".attest-stars{display:flex;gap:2px;margin-bottom:12px;}" +
    ".attest-star{width:17px;height:17px;fill:#f5b942;}" +
    ".attest-star-empty{fill:" +
    (isDark ? "#3f3f46" : "#e4e4e7") +
    ";}" +
    ".attest-content{font-size:16.5px;line-height:1.65;color:" +
    (isDark ? "#e4e4e7" : "#3f3f46") +
    ";margin:0 0 22px;flex:1;white-space:pre-line;}" +
    ".attest-author{display:flex;align-items:center;gap:12px;margin:0;}" +
    ".attest-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:" +
    accent +
    ";color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;flex:0 0 auto;}" +
    ".attest-name{font-size:14px;font-weight:600;color:" +
    textPrimary +
    ";}" +
    ".attest-headline{font-size:13px;color:" +
    textSecondary +
    ";}" +
    ".attest-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#0284c7;font-weight:500;margin-top:2px;}" +
    ".attest-badge-compact{display:inline-flex;align-items:center;gap:10px;background:" +
    bgCard +
    ";border-radius:999px;padding:8px 18px 8px 10px;box-shadow:0 14px 34px -22px rgba(15,23,42,.55),0 0 0 1px rgba(15,23,42,.06);cursor:pointer;text-decoration:none;color:" +
    textPrimary +
    ";}" +
    ".attest-badge-compact .attest-stars{margin:0;}" +
    ".attest-badge-compact .attest-star{width:14px;height:14px;}" +
    ".attest-avatar-stack{display:flex;}" +
    ".attest-avatar-stack .attest-avatar{width:26px;height:26px;font-size:11px;margin-left:-8px;box-shadow:0 0 0 2px " +
    bgCard +
    ";}" +
    ".attest-avatar-stack .attest-avatar:first-child{margin-left:0;}" +
    ".attest-average{font-size:13px;font-weight:600;color:" +
    textPrimary +
    ";}" +
    ".attest-count{font-size:12px;color:" +
    textSecondary +
    ";}" +
    ".attest-float{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;flex-direction:column;align-items:flex-end;gap:12px;}" +
    ".attest-float-panel{display:none;width:340px;max-width:calc(100vw - 40px);max-height:min(70vh,520px);overflow-y:auto;background:" +
    canvas +
    ";border-radius:24px;padding:14px;box-shadow:0 30px 70px -30px rgba(15,23,42,.55),0 0 0 1px rgba(15,23,42,.08);}" +
    ".attest-float-panel.attest-open{display:block;}" +
    ".attest-float-panel .attest-card{padding:18px;border-radius:18px;margin-bottom:12px;}" +
    ".attest-float-panel .attest-content{font-size:14px;margin-bottom:14px;}" +
    ".attest-float-panel .attest-avatar{width:32px;height:32px;font-size:12px;}" +
    ".attest-float-bubble{display:inline-flex;align-items:center;gap:10px;border:0;border-radius:999px;padding:10px 16px 10px 10px;background:" +
    accent +
    ";color:#fff;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;box-shadow:0 18px 40px -18px " +
    accent +
    ";transition:transform .15s ease,filter .15s ease;}" +
    ".attest-float-bubble:hover{transform:translateY(-2px);filter:brightness(1.06);}" +
    ".attest-float-bubble .attest-avatar-stack .attest-avatar{background:rgba(255,255,255,.28);box-shadow:0 0 0 2px " +
    accent +
    ";}" +
    ".attest-float-bubble .attest-star{fill:#fff;}" +
    ".attest-float-bubble .attest-stars{margin:0;}" +
    ".attest-float-bubble .attest-star-empty{fill:rgba(255,255,255,.45);}" +
    "@media(max-width:480px){.attest-float{right:12px;bottom:12px}}" +
    // Scroll-in animations. Cards start hidden, then reveal when they enter the viewport.
    "@keyframes attestw-fade{from{opacity:0}to{opacity:1}}" +
    "@keyframes attestw-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}" +
    "@keyframes attestw-zoom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}" +
    "@keyframes attestw-slide{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}" +
    "@keyframes attestw-flip{from{opacity:0;transform:perspective(700px) rotateX(-14deg) translateY(10px)}to{opacity:1;transform:none}}" +
    ".attest-card[data-anim]{opacity:0;}" +
    ".attest-card.attest-in{animation-duration:620ms;animation-timing-function:cubic-bezier(.22,1,.36,1);animation-fill-mode:both;animation-delay:calc(var(--i,0) * 70ms);opacity:1;}" +
    ".attest-card.attest-in[data-anim=fade]{animation-name:attestw-fade;}" +
    ".attest-card.attest-in[data-anim=up]{animation-name:attestw-up;}" +
    ".attest-card.attest-in[data-anim=zoom]{animation-name:attestw-zoom;}" +
    ".attest-card.attest-in[data-anim=slide]{animation-name:attestw-slide;}" +
    ".attest-card.attest-in[data-anim=flip]{animation-name:attestw-flip;}" +
    "@media (prefers-reduced-motion: reduce){.attest-card[data-anim]{opacity:1;}.attest-card.attest-in{animation:none;}}" +
    "</style>";

  fetch(host + "/api/v1/widget/" + encodeURIComponent(slug))
    .then(function (res) {
      if (!res.ok) throw new Error("Failed to load testimonials");
      return res.json();
    })
    .then(function (data) {
      var all = data.testimonials || [];
      var items = limit ? all.slice(0, limit) : all;

      if (items.length === 0) {
        wrapper.innerHTML = "";
        return;
      }

      var total = all.length;
      avgRating =
        total > 0
          ? (all.reduce(function (acc, t) {
              return acc + (t.rating || 5);
            }, 0) / total).toFixed(1)
          : "5.0";

      if (layout === "badge" || layout === "float") {
        var stack = items
          .slice(0, 4)
          .map(function (t) {
            return avatar(t);
          })
          .join("");
        var summary =
          '<div class="attest-avatar-stack">' +
          stack +
          "</div>" +
          stars(Math.round(Number(avgRating))) +
          '<span class="attest-average">' +
          avgRating +
          '</span><span class="attest-count">(' +
          total +
          " reviews)</span>";

        if (layout === "badge") {
          wrapper.innerHTML =
            styles +
            '<a class="attest-badge-compact" href="' +
            host +
            "/wall/" +
            encodeURIComponent(slug) +
            '" target="_blank" rel="noreferrer">' +
            summary +
            "</a>";
          return;
        }

        wrapper.innerHTML =
          styles +
          '<div class="attest-float">' +
          '<div class="attest-float-panel">' +
          items.map(card).join("") +
          "</div>" +
          '<button type="button" class="attest-float-bubble" aria-expanded="false">' +
          summary +
          "</button>" +
          "</div>";

        var bubble = wrapper.querySelector(".attest-float-bubble");
        var panel = wrapper.querySelector(".attest-float-panel");
        if (bubble && panel) {
          bubble.addEventListener("click", function () {
            var open = panel.classList.toggle("attest-open");
            bubble.setAttribute("aria-expanded", open ? "true" : "false");
          });
        }
        // The panel starts hidden, so intersections are never observed — reveal instantly.
        revealCards(wrapper, true);
        return;
      }

      var body =
        layout === "carousel"
          ? '<div class="attest-track">' + items.map(card).join("") + "</div>"
          : layout === "grid"
            ? '<div class="attest-grid">' + items.map(card).join("") + "</div>"
            : '<div class="attest-wall">' + items.map(card).join("") + "</div>";

      wrapper.innerHTML = styles + body;

      if (layout !== "carousel" && layout !== "grid") {
        distributeMasonry(wrapper.querySelector(".attest-wall"));
      }

      revealCards(wrapper);

      // Safety net: if intersections never resolve (hidden tab, lazy iframes, very old
      // browsers), show everything after a moment instead of leaving cards invisible.
      setTimeout(function () {
        revealCards(wrapper, true);
      }, 1200);
      setTimeout(function () {
        forceVisible(wrapper);
      }, 3000);
    })
    .catch(function (err) {
      console.warn("[Attest Widget]", err);
    });
})();
