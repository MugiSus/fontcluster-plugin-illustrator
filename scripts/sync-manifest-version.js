const fs = require("node:fs");
const path = require("node:path");

const version = process.argv[2] || require("../package.json").version;
const manifestPath = path.join(__dirname, "..", "CSXS", "manifest.xml");

let manifest = fs.readFileSync(manifestPath, "utf8");
manifest = manifest
  .replace(/ExtensionBundleVersion="[^"]+"/, 'ExtensionBundleVersion="' + version + '"')
  .replace(
    /(<Extension Id="me\.mugisus\.fontcluster\.illustrator\.panel" Version=")[^"]+(" \/>)/,
    "$1" + version + "$2",
  );

fs.writeFileSync(manifestPath, manifest);
