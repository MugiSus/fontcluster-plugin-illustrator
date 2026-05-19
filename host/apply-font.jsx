function fontclusterContains(values, value) {
  for (var i = 0; i < values.length; i += 1) {
    if (values[i] === value) {
      return true;
    }
  }

  return false;
}

function fontclusterGetFont(
  familyName,
  fontName,
  styleName,
  preferredFamilyNames,
  familyNames,
  preferredStyleNames,
  styleNames
) {
  var familyCandidates = [familyName, fontName]
    .concat(preferredFamilyNames || [])
    .concat(familyNames || []);
  var styleCandidates = [styleName]
    .concat(preferredStyleNames || [])
    .concat(styleNames || []);

  for (var i = 0; i < app.textFonts.length; i += 1) {
    var textFont = app.textFonts[i];
    var family = textFont.family || "";
    var style = textFont.style || "";
    var name = textFont.name || "";

    if (
      (fontclusterContains(familyCandidates, family) &&
        (!styleName || fontclusterContains(styleCandidates, style))) ||
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

function fontclusterApplyFont(
  familyName,
  fontName,
  styleName,
  preferredFamilyNames,
  familyNames,
  preferredStyleNames,
  styleNames,
  previewText,
  modifiedDate
) {
  try {
    var textFont = fontclusterGetFont(
      familyName,
      fontName,
      styleName,
      preferredFamilyNames,
      familyNames,
      preferredStyleNames,
      styleNames
    );

    if (!textFont) {
      return "false: Font not available in Illustrator: " + familyName;
    }

    var document = app.documents.length > 0 ? app.activeDocument : app.documents.add();
    var frames = fontclusterSelectedTextFrames();

    if (frames.length === 0) {
      var textFrame = document.textFrames.add();
      textFrame.contents = previewText || fontName || familyName;
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
