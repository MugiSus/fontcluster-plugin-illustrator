# Fontcluster Apply Illustrator Extension

This CEP extension applies the latest Fontcluster FontItem selection to selected
Illustrator text frames. If no text frame is selected, it creates one and uses
the active Fontcluster session preview text.

## Development

1. Start Fontcluster.
2. Copy this directory to the CEP extensions folder:
   `~/Library/Application Support/Adobe/CEP/extensions/fontcluster-plugin-illustrator`
3. Enable unsigned CEP extensions for the installed CSXS version.
4. Restart Illustrator.
5. Open `Window > Extensions > Fontcluster Apply`.
6. Click a FontItem in Fontcluster.

The panel polls `http://localhost:38653/data` for the selected font metadata
and active session config.

`client/index.js` contains the panel bridge polling implementation.
`host/apply-font.jsx` contains the Illustrator ExtendScript implementation.
