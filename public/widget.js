(function () {
  const currentScript =
    document.currentScript ||
    document.querySelector("script[data-product]");

  if (!currentScript) return;

  const slug = currentScript.getAttribute("data-product");
  const theme = currentScript.getAttribute("data-theme") || "light";
  const containerId = currentScript.getAttribute("data-container");
  const host = new URL(currentScript.src).origin;

  if (!slug) {
    console.error("[Attest] Missing data-product attribute on script tag.");
    return;
  }

  const container = containerId
    ? document.getElementById(containerId)
    : currentScript.parentElement;

  if (!container) return;

  // Mount loading placeholder
  const wrapper = document.createElement("div");
  wrapper.className = "attest-widget-container";
  wrapper.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  container.appendChild(wrapper);

  fetch(`${host}/api/v1/widget/${slug}`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load testimonials");
      return res.json();
    })
    .then((data) => {
      if (!data.testimonials || data.testimonials.length === 0) {
        wrapper.innerHTML = "";
        return;
      }

      const isDark = theme === "dark";
      const bgCard = isDark ? "#18181b" : "#ffffff";
      const borderCard = isDark ? "#27272a" : "#e4e4e7";
      const textPrimary = isDark ? "#f4f4f5" : "#18181b";
      const textSecondary = isDark ? "#a1a1aa" : "#71717a";

      let html = `
        <style>
          .attest-masonry {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
            width: 100%;
          }
          .attest-card {
            background: ${bgCard};
            border: 1px solid ${borderCard};
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .attest-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          .attest-content {
            font-size: 14px;
            line-height: 1.6;
            color: ${textPrimary};
            margin-bottom: 16px;
            flex: 1;
            white-space: pre-line;
          }
          .attest-author {
            display: flex;
            align-items: center;
            gap: 12px;
            border-top: 1px solid ${borderCard};
            padding-top: 14px;
          }
          .attest-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            background: #27272a;
            color: #ffffff;
            display: grid;
            place-items: center;
            font-size: 14px;
            font-weight: 600;
          }
          .attest-name {
            font-size: 13px;
            font-weight: 600;
            color: ${textPrimary};
          }
          .attest-headline {
            font-size: 11px;
            color: ${textSecondary};
          }
          .attest-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            color: #0284c7;
            font-weight: 500;
            margin-top: 2px;
          }
        </style>
        <div class="attest-masonry">
      `;

      data.testimonials.forEach((t) => {
        const initial = (t.author.name || "U")[0].toUpperCase();
        const avatarHtml = t.author.avatarUrl
          ? `<img src="${t.author.avatarUrl}" alt="${t.author.name}" class="attest-avatar" />`
          : `<div class="attest-avatar">${initial}</div>`;

        html += `
          <div class="attest-card">
            <div class="attest-content">"${t.content}"</div>
            <div class="attest-author">
              ${avatarHtml}
              <div>
                <div class="attest-name">${t.author.name}</div>
                ${t.author.headline ? `<div class="attest-headline">${t.author.headline}</div>` : ""}
                ${
                  t.author.identitySource === "linkedin"
                    ? `<div class="attest-badge">✓ Signed in with LinkedIn</div>`
                    : ""
                }
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
      wrapper.innerHTML = html;
    })
    .catch((err) => {
      console.warn("[Attest Widget]", err);
    });
})();
