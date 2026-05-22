import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);
const version = process.argv[2] || packageJson.version;
const manifestPath = path.join(__dirname, "..", "CSXS", "manifest.xml");

let manifest = fs.readFileSync(manifestPath, "utf8");
manifest = manifest
  .replace(/ExtensionBundleVersion="[^"]+"/, 'ExtensionBundleVersion="' + version + '"')
  .replace(
    /(<Extension Id="me\.mugisus\.fontcluster\.illustrator\.panel" Version=")[^"]+(" \/>)/,
    "$1" + version + "$2",
  );

fs.writeFileSync(manifestPath, manifest);
