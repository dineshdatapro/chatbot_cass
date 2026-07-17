/**
 * Agentic RAG embed widget — load from your API origin:
 * <script src="http://localhost:8000/static/embed-widget.js" async></script>
 *
 * window.AGENTIC_RAG_API = "http://localhost:8000";
 * window.AGENTIC_RAG_API_KEY = "arag_...";  // required
 * window.AGENTIC_RAG_BOT_ID = "default";     // optional
 */
(function () {
  "use strict";

  var API = (window.AGENTIC_RAG_API || "").replace(/\/$/, "");
  var API_KEY = window.AGENTIC_RAG_API_KEY || "";
  var BOT_ID = window.AGENTIC_RAG_BOT_ID || "default";
  var SESSION_KEY = "arag_embed_session_" + BOT_ID;

  if (!API || !API_KEY) {
    console.error("[AgenticRAG] Set window.AGENTIC_RAG_API and window.AGENTIC_RAG_API_KEY");
    return;
  }

  var config = {
    name: "Assistant",
    welcome: "Hi! How can I help?",
    primaryColor: "#7c5cff",
    secondaryColor: "#0ea5e9",
    position: "bottom-right",
    borderRadius: 20,
    dark: false,
    suggestions: [],
    statusText: "Online",
  };

  var open = false;
  var typing = false;
  var messages = [];
  var sessionId = null;

  try {
    sessionId = localStorage.getItem(SESSION_KEY);
  } catch (e) {}

  function headers() {
    var h = {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      Accept: "application/json",
    };
    if (API.indexOf("ngrok") !== -1) {
      h["ngrok-skip-browser-warning"] = "true";
    }
    return h;
  }

  function parseSseBlock(block) {
    var event = "message";
    var data = "";
    block.split("\n").forEach(function (line) {
      if (line.indexOf("event:") === 0) event = line.slice(6).trim();
      if (line.indexOf("data:") === 0) data += line.slice(5).trim();
    });
    return data ? { event: event, data: data } : null;
  }

  function extractSources(msgs) {
    var found = {};
    var re = /File Name:\s*([^\n]+)/gi;
    msgs.forEach(function (m) {
      var text = m.content || "";
      var match;
      while ((match = re.exec(text)) !== null) {
        var n = match[1].trim();
        if (n && n !== "unknown" && n !== "n/a") found[n] = true;
      }
    });
    return Object.keys(found).sort();
  }

  function stripSourcesSection(text) {
    return (text || "").replace(/---\s*\n\*\*Sources:\*\*[\s\S]*$/i, "").trimEnd();
  }

  function renderMarkdownHtml(text) {
    var body = stripSourcesSection(text || "");
    var lines = body.split("\n");
    var html = [];
    var inList = false;

    function closeList() {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    }

    function inline(s) {
      return s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    }

    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) {
        closeList();
        return;
      }
      if (/^---+$/.test(trimmed)) {
        closeList();
        html.push("<hr style='border:0;border-top:1px solid rgba(0,0,0,.08);margin:10px 0'>");
        return;
      }
      var heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        closeList();
        var level = heading[1].length;
        var tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
        html.push(
          "<" + tag + " style='margin:8px 0 4px;font-weight:600'>" + inline(heading[2]) + "</" + tag + ">"
        );
        return;
      }
      if (/^[-*]\s+/.test(trimmed)) {
        if (!inList) {
          html.push("<ul style='margin:6px 0 6px 18px;padding:0'>");
          inList = true;
        }
        html.push("<li style='margin:4px 0'>" + inline(trimmed.replace(/^[-*]\s+/, "")) + "</li>");
        return;
      }
      closeList();
      html.push("<p style='margin:6px 0'>" + inline(trimmed) + "</p>");
    });
    closeList();
    return html.join("");
  }

  function displayText(msgs) {
    for (var i = msgs.length - 1; i >= 0; i--) {
      var m = msgs[i];
      if (m.role !== "assistant" || !m.content) continue;
      var meta = m.metadata || {};
      if (meta.node === "clarification") return m.content;
      if (meta.title && meta.title.indexOf("🛠️") === 0) continue;
      if (meta.node === "rewrite_query" || meta.node === "summarize_history" || meta.node === "classify_intent") continue;
      if (!meta.title && !meta.node) return stripSourcesSection(m.content);
    }
    return "";
  }

  function streamChat(message, onUpdate, onDone, onError) {
    fetch(API + "/api/v1/chat", {
      method: "POST",
      headers: Object.assign({}, headers(), { Accept: "text/event-stream" }),
      body: JSON.stringify({ message: message, session_id: sessionId, stream: true }),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (j) {
            throw new Error(j.detail || res.statusText);
          });
        }
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";
        function pump() {
          return reader.read().then(function (result) {
            if (result.done) return;
            buffer += decoder.decode(result.value, { stream: true });
            var parts = buffer.split("\n\n");
            buffer = parts.pop() || "";
            parts.forEach(function (part) {
              var parsed = parseSseBlock(part.trim());
              if (!parsed) return;
              try {
                var json = JSON.parse(parsed.data);
                if (parsed.event === "session" && json.session_id) {
                  sessionId = json.session_id;
                  try {
                    localStorage.setItem(SESSION_KEY, sessionId);
                  } catch (e) {}
                }
                if (parsed.event === "message" && json.messages) {
                  onUpdate(
                    displayText(json.messages),
                    (json.sources && json.sources.length) ? json.sources : extractSources(json.messages)
                  );
                }
                if (parsed.event === "done") {
                  onDone(json.sources || []);
                }
              } catch (e) {}
            });
            return pump();
          });
        }
        return pump();
      })
      .catch(function (err) {
        onError(err.message || "Chat failed");
      });
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var root, panel, msgBox, inputEl, launcher;

  function renderMessages() {
    msgBox.innerHTML = "";
    messages.forEach(function (m) {
      var wrap = el("div", "arag-msg arag-msg-" + m.from);
      var bubble = el("div", "arag-bubble");
      if (m.from === "user") {
        bubble.style.background =
          "linear-gradient(135deg," + config.primaryColor + "," + config.secondaryColor + ")";
        bubble.style.color = "#fff";
        bubble.textContent = m.text;
      } else if (m.from === "bot" && m.text) {
        bubble.innerHTML = renderMarkdownHtml(m.text);
      } else {
        bubble.textContent = m.text;
      }
      wrap.appendChild(bubble);
      msgBox.appendChild(wrap);
    });
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  function send(text) {
    if (!text.trim() || typing) return;
    messages.push({ from: "user", text: text.trim() });
    var bot = { from: "bot", text: "…" };
    messages.push(bot);
    typing = true;
    renderMessages();
    inputEl.value = "";

    streamChat(
      text,
      function (txt) {
        bot.text = stripSourcesSection(txt) || "…";
        renderMessages();
      },
      function () {
        typing = false;
        bot.text = stripSourcesSection(bot.text) || "No response.";
        renderMessages();
      },
      function (err) {
        typing = false;
        bot.text = "Error: " + err;
        renderMessages();
      }
    );
  }

  function injectStyles() {
    var userBg =
      "linear-gradient(135deg," + config.primaryColor + "," + config.secondaryColor + ")";
    var css =
      "#arag-root{position:fixed;z-index:99999;font-family:" +
      (config.fontFamily || "Inter") +
      ",sans-serif}" +
      "#arag-launcher{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;color:#fff;" +
      "box-shadow:0 8px 24px rgba(0,0,0,.2);font-size:22px}" +
      "#arag-panel{width:360px;height:560px;display:flex;flex-direction:column;overflow:hidden;" +
      "box-shadow:0 12px 40px rgba(0,0,0,.18);border:1px solid rgba(0,0,0,.08)}" +
      "#arag-root .arag-header{padding:12px 16px;color:#fff;display:flex;align-items:center;gap:10px}" +
      "#arag-root .arag-header h4{margin:0;font-size:14px;font-weight:600;color:#fff}" +
      "#arag-root .arag-header small{opacity:.85;font-size:11px;color:#fff}" +
      "#arag-root .arag-msgs{flex:1;overflow-y:auto;padding:12px;background:#fafafb}" +
      "#arag-root .arag-msg{margin-bottom:10px;display:flex}" +
      "#arag-root .arag-msg-user{justify-content:flex-end}" +
      "#arag-root .arag-bubble{max-width:85%;padding:10px 14px;font-size:13px;line-height:1.45;border-radius:14px;white-space:pre-wrap}" +
      "#arag-root .arag-msg-user .arag-bubble{background:" +
      userBg +
      ";color:#fff !important}" +
      "#arag-root .arag-msg-bot .arag-bubble{background:#fff;border:1px solid rgba(0,0,0,.06);color:#111 !important}" +
      "#arag-root .arag-sources{margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,.08);font-size:10px;opacity:.75}" +
      "#arag-root .arag-footer{padding:10px;border-top:1px solid rgba(0,0,0,.08);display:flex;gap:8px;background:#fff}" +
      "#arag-root .arag-footer input{flex:1;border:1px solid #ddd;border-radius:8px;padding:8px 10px;font-size:13px;color:#111 !important;background:#fff !important}" +
      "#arag-root .arag-footer button{width:36px;height:36px;border:none;border-radius:50%;color:#fff;cursor:pointer}" +
      "#arag-root .arag-suggestions{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px}" +
      "#arag-root .arag-suggestions button{font-size:11px;padding:6px 10px;border-radius:999px;border:1px solid;cursor:pointer;background:transparent}";
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildUi() {
    injectStyles();
    root = el("div", "");
    root.id = "arag-root";
    root.style[config.position === "bottom-left" ? "left" : "right"] = "24px";
    root.style.bottom = "24px";

    panel = el("div", "");
    panel.id = "arag-panel";
    panel.style.borderRadius = (config.borderRadius || 20) + "px";
    panel.style.display = "none";
    panel.style.background = config.dark ? "#0f0f17" : "#fff";

    var header = el("div", "arag-header");
    header.style.background =
      "linear-gradient(135deg," + config.primaryColor + "," + config.secondaryColor + ")";
    header.appendChild(el("h4", "", config.name));
    var sub = el("small", "", config.statusText);
    header.appendChild(sub);

    msgBox = el("div", "arag-msgs");
    if (config.dark) msgBox.style.background = "#0f0f17";

    var suggestions = el("div", "arag-suggestions");
    (config.suggestions || []).forEach(function (s) {
      var b = el("button", "");
      b.textContent = s;
      b.style.borderColor = config.primaryColor;
      b.style.color = config.primaryColor;
      b.onclick = function () {
        send(s);
      };
      suggestions.appendChild(b);
    });

    var footer = el("div", "arag-footer");
    inputEl = document.createElement("input");
    inputEl.placeholder = "Type your message…";
    inputEl.style.color = config.dark ? "#f5f5f7" : "#111";
    inputEl.style.background = config.dark ? "#1a1a25" : "#fff";
    var sendBtn = el("button", "");
    sendBtn.textContent = "➤";
    sendBtn.style.background =
      "linear-gradient(135deg," + config.primaryColor + "," + config.secondaryColor + ")";
    sendBtn.onclick = function () {
      send(inputEl.value);
    };
    inputEl.onkeydown = function (e) {
      if (e.key === "Enter") send(inputEl.value);
    };
    footer.appendChild(inputEl);
    footer.appendChild(sendBtn);

    panel.appendChild(header);
    panel.appendChild(msgBox);
    if (config.suggestions && config.suggestions.length) panel.appendChild(suggestions);
    panel.appendChild(footer);

    launcher = el("button", "");
    launcher.id = "arag-launcher";
    launcher.textContent = "💬";
    launcher.style.background =
      "linear-gradient(135deg," + config.primaryColor + "," + config.secondaryColor + ")";
    launcher.style.marginTop = "12px";
    launcher.style.float = config.position === "bottom-left" ? "left" : "right";
    launcher.onclick = function () {
      open = !open;
      panel.style.display = open ? "flex" : "none";
    };

    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    messages = [{ from: "bot", text: config.welcome }];
    renderMessages();
  }

  fetch(API + "/api/v1/widget/config?bot_id=" + encodeURIComponent(BOT_ID), {
    headers: headers(),
  })
    .then(function (r) {
      if (!r.ok) throw new Error("Failed to load widget config");
      return r.json();
    })
    .then(function (data) {
      if (data && data.config) {
        Object.keys(data.config).forEach(function (k) {
          config[k] = data.config[k];
        });
      }
      buildUi();
    })
    .catch(function (err) {
      console.error("[AgenticRAG]", err);
      buildUi();
    });
})();
