(function () {
  var DATA_URL = "http://localhost:38653/data";
  var HEARTBEAT_URL = "http://localhost:38653/heartbeat";
  var FONTCLUSTER_URL = "https://fontcluster.mugisus.me/";
  var POLL_INTERVAL_MS = 500;
  var HEARTBEAT_INTERVAL_MS = 1000;
  var pluginId =
    window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : String(new Date().getTime()) + "-" + String(Math.random()).slice(2);

  var state = {
    modifiedDate: null,
    previewText: null,
    applying: false,
  };

  var message = document.getElementById("message");
  var link = document.getElementById("link");

  function setMessage(text) {
    message.textContent = text;
  }

  function setConnected(isConnected) {
    document.body.className = isConnected ? "" : "disconnected";
  }

  function requestJson(url, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      if (xhr.status < 200 || xhr.status >= 300) {
        onError();
        return;
      }

      try {
        onSuccess(JSON.parse(xhr.responseText));
      } catch (error) {
        onError(error);
      }
    };
    xhr.onerror = onError;
    xhr.send();
  }

  function postHeartbeat(documentName) {
    if (!pluginId) return;

    var xhr = new XMLHttpRequest();
    xhr.open("POST", HEARTBEAT_URL, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onerror = function () {};

    try {
      xhr.send(
        JSON.stringify({
          plugin_id: pluginId,
          plugin_name: "FontCluster Apply",
          host: "illustrator",
          document_name: documentName || null
        })
      );
    } catch (error) {}
  }

  function evalScript(script, callback) {
    if (!window.__adobe_cep__) {
      callback("CEP runtime is unavailable");
      return;
    }

    window.__adobe_cep__.evalScript(script, callback);
  }

  function sendHeartbeat() {
    if (!window.__adobe_cep__) {
      postHeartbeat(null);
      return;
    }

    evalScript(
      'app.documents.length > 0 ? app.activeDocument.name : ""',
      function (documentName) {
        postHeartbeat(documentName);
      }
    );
  }

  function values(record) {
    var result = [];

    if (!record) {
      return result;
    }

    for (var key in record) {
      if (record.hasOwnProperty(key)) {
        result.push(record[key]);
      }
    }

    return result;
  }

  function stringLiteral(value) {
    return JSON.stringify(value == null ? "" : String(value));
  }

  function stringArrayLiteral(items) {
    return "[" + items.map(stringLiteral).join(",") + "]";
  }

  function applyFont(font) {
    state.applying = true;
    setMessage("Applying " + font.font_name + "...");

    var script =
      "fontclusterApplyFont(" +
      stringLiteral(font.family_name) +
      "," +
      stringLiteral(font.font_name) +
      "," +
      stringLiteral(font.style_name) +
      "," +
      stringArrayLiteral(values(font.preferred_family_names)) +
      "," +
      stringArrayLiteral(values(font.family_names)) +
      "," +
      stringArrayLiteral(values(font.preferred_style_names)) +
      "," +
      stringArrayLiteral(values(font.style_names)) +
      "," +
      stringLiteral((state.previewText || "").trim()) +
      "," +
      stringLiteral((font.sample_text || "").trim()) +
      "," +
      JSON.stringify(state.modifiedDate) +
      ")";

    evalScript(script, function (result) {
      state.applying = false;

      if (String(result) === "ok") {
        setMessage("Applied " + font.font_name);
        return;
      }

      setMessage(String(result) || "Failed to apply font.");
    });
  }

  function pollData() {
    requestJson(
      DATA_URL,
      function (response) {
        setConnected(true);

        if (!response.font) {
          setMessage("Click an item on the List panel.");
          return;
        }

        if (
          !response.modified_date ||
          response.modified_date === state.modifiedDate ||
          state.applying
        ) {
          return;
        }

        state.modifiedDate = response.modified_date;
        state.previewText = response.preview_text || null;
        applyFont(response.font);
      },
      function () {
        setConnected(false);
        setMessage("No FontCluster app running.");
      }
    );
  }

  function openFontcluster(event) {
    event.preventDefault();

    if (window.cep && window.cep.util && window.cep.util.openURLInDefaultBrowser) {
      window.cep.util.openURLInDefaultBrowser(FONTCLUSTER_URL);
      return;
    }

    window.open(FONTCLUSTER_URL, "_blank");
  }

  link.onclick = openFontcluster;
  pollData();
  sendHeartbeat();
  window.setInterval(pollData, POLL_INTERVAL_MS);
  window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
})();
