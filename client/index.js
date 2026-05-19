(function () {
  var DATA_URL = "http://localhost:38653/data";
  var POLL_INTERVAL_MS = 500;

  var state = {
    modifiedDate: null,
    session: null,
    applying: false,
  };

  var message = document.getElementById("message");

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

  function evalScript(script, callback) {
    if (!window.__adobe_cep__) {
      callback("false: CEP runtime is unavailable");
      return;
    }

    window.__adobe_cep__.evalScript(script, callback);
  }

  function applyFont(font) {
    state.applying = true;
    setMessage("Applying " + font.font_name + "...");

    var fontJson = JSON.stringify(font);
    var sessionJson = JSON.stringify(state.session);
    var script =
      "fontclusterApplyFont(" +
      JSON.stringify(fontJson) +
      "," +
      JSON.stringify(sessionJson) +
      "," +
      JSON.stringify(state.modifiedDate) +
      ")";

    evalScript(script, function (result) {
      state.applying = false;

      if (String(result).indexOf("true:") === 0) {
        setMessage("Applied " + font.font_name);
        return;
      }

      setMessage(String(result).replace(/^false:\s*/, "") || "Failed to apply font.");
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

        if (!response.modified_date || response.modified_date === state.modifiedDate || state.applying) {
          return;
        }

        state.modifiedDate = response.modified_date;
        state.session = response.session || null;
        applyFont(response.font);
      },
      function () {
        setConnected(false);
        setMessage("No Fontcluster App detected.");
      },
    );
  }

  pollData();
  window.setInterval(pollData, POLL_INTERVAL_MS);
})();
