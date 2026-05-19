function fontclusterParseJson(json) {
  return JSON.parse(json);
}

function fontclusterValues(record) {
  var values = [];

  if (!record) {
    return values;
  }

  for (var key in record) {
    if (record.hasOwnProperty(key)) {
      values.push(record[key]);
    }
  }

  return values;
}

function fontclusterContains(values, value) {
  for (var i = 0; i < values.length; i += 1) {
    if (values[i] === value) {
      return true;
    }
  }

  return false;
}

function fontclusterGetFont(font) {
  var familyCandidates = [font.family_name, font.font_name]
    .concat(fontclusterValues(font.preferred_family_names))
    .concat(fontclusterValues(font.family_names));
  var styleCandidates = [font.style_name]
    .concat(fontclusterValues(font.preferred_style_names))
    .concat(fontclusterValues(font.style_names));

  for (var i = 0; i < app.textFonts.length; i += 1) {
    var textFont = app.textFonts[i];
    var family = textFont.family || "";
    var style = textFont.style || "";
    var name = textFont.name || "";

    if (
      (fontclusterContains(familyCandidates, family) &&
        (!font.style_name || fontclusterContains(styleCandidates, style))) ||
      fontclusterContains(familyCandidates, name)
    ) {
      return textFont;
    }
  }

  return null;
}

function fontclusterSelectedTextFrames() {
  var frames = [];

  if (!app.selection) {
    return frames;
  }

  for (var i = 0; i < app.selection.length; i += 1) {
    var item = app.selection[i];

    if (item.typename === "TextFrame") {
      frames.push(item);
    }
  }

  return frames;
}

function fontclusterApplyTextFont(textFrame, textFont) {
  textFrame.textRange.characterAttributes.textFont = textFont;
}

function fontclusterApplyFont(fontJson, sessionJson, modifiedDate) {
  try {
    var font = fontclusterParseJson(fontJson);
    var session = fontclusterParseJson(sessionJson);
    var textFont = fontclusterGetFont(font);

    if (!textFont) {
      return "false: Font not available in Illustrator: " + font.family_name;
    }

    var document = app.documents.length > 0 ? app.activeDocument : app.documents.add();
    var frames = fontclusterSelectedTextFrames();

    if (frames.length === 0) {
      var textFrame = document.textFrames.add();
      textFrame.contents =
        (session && session.preview_text) || font.font_name || font.family_name;
      textFrame.textRange.characterAttributes.size = 16;
      frames.push(textFrame);
    }

    for (var i = 0; i < frames.length; i += 1) {
      fontclusterApplyTextFont(frames[i], textFont);
    }

    app.redraw();

    return "true: " + modifiedDate;
  } catch (error) {
    return "false: " + error;
  }
}
