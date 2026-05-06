import { env } from "@/lib/env";

export const dynamic = "force-static";

export async function GET() {
  const origin = env.appUrl;

  const script = `(function () {
  if (window.__realtimeChatLoaded) return;
  window.__realtimeChatLoaded = true;

  var APP = ${JSON.stringify(origin)};
  var current = document.currentScript;
  var tenant = current && current.getAttribute("data-tenant");
  if (!tenant) {
    console.warn("[realtime-chat] Missing data-tenant on <script>");
    return;
  }

  function inject(config) {
    var brand = (config && config.primary_color) || "#4f46e5";
    var fg = readableFg(brand);
    var pos = (config && config.position) === "left" ? "left" : "right";

    // Wrapper
    var root = document.createElement("div");
    root.style.cssText = "position:fixed;bottom:20px;" + pos + ":20px;z-index:2147483647;font-family:system-ui,sans-serif;";

    // Floating button
    var btn = document.createElement("button");
    btn.setAttribute("aria-label", "Open chat");
    btn.style.cssText = [
      "all:unset", "cursor:pointer", "width:56px", "height:56px",
      "border-radius:9999px",
      "background:" + brand,
      "color:" + fg,
      "display:flex","align-items:center","justify-content:center",
      "box-shadow:0 10px 30px rgba(0,0,0,.15)",
      "transition:transform .15s ease",
    ].join(";");
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    btn.onmouseenter = function () { btn.style.transform = "scale(1.05)"; };
    btn.onmouseleave = function () { btn.style.transform = "scale(1)"; };

    // Iframe
    var frame = document.createElement("iframe");
    frame.src = APP + "/widget/" + encodeURIComponent(tenant) + "?embedded=1";
    frame.title = "Chat";
    frame.allow = "clipboard-write";
    frame.style.cssText = [
      "border:0",
      "width:380px","height:600px","max-height:80vh",
      "background:transparent",
      "border-radius:16px",
      "box-shadow:0 25px 50px -12px rgba(0,0,0,.25)",
      "display:none",
      "position:absolute",
      "bottom:72px",
      pos + ":0",
    ].join(";");

    var open = false;
    function toggle() {
      open = !open;
      frame.style.display = open ? "block" : "none";
      btn.innerHTML = open
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    }
    btn.addEventListener("click", toggle);

    // Mobile: full-screen sheet
    if (window.matchMedia("(max-width: 480px)").matches) {
      frame.style.position = "fixed";
      frame.style.inset = "0";
      frame.style.width = "100vw";
      frame.style.height = "100vh";
      frame.style.maxHeight = "100vh";
      frame.style.borderRadius = "0";
      frame.style.bottom = "auto";
      frame.style[pos] = "auto";
    }

    root.appendChild(frame);
    root.appendChild(btn);
    document.body.appendChild(root);
  }

  function readableFg(hex) {
    var c = hex.replace("#","");
    if (c.length !== 6) return "#fff";
    var r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
    return ((0.299*r + 0.587*g + 0.114*b)/255) > 0.6 ? "#111827" : "#ffffff";
  }

  fetch(APP + "/api/widget/config/" + encodeURIComponent(tenant))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (cfg) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { inject(cfg); });
      } else {
        inject(cfg);
      }
    })
    .catch(function () { inject(null); });
})();`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
