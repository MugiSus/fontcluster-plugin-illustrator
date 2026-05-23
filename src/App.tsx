import { Show } from 'solid-js';
import type { Component } from 'solid-js';

import { useFontclusterBridge } from './use-fontcluster-bridge';

function openFontcluster(event: MouseEvent) {
  event.preventDefault();
  if (window.cep?.util?.openURLInDefaultBrowser) {
    window.cep.util.openURLInDefaultBrowser('https://fontcluster.mugisus.me/');
    return;
  }
  // window.open('https://fontcluster.mugisus.me/', '_blank', 'noopener,noreferrer');
}

const App: Component = () => {
  const { errorMessage, font, isApplied, isApplying, isConnected } =
    useFontclusterBridge();

  return (
    <main
      class="text-xs size-full text-gray-500 p-4 bg-white"
      role="status"
      aria-live="polite"
    >
      <Show
        when={isConnected()}
        fallback={
          <div class="size-full flex flex-col items-center justify-center text-center">
            <p>No Running Fontcluster App detected.</p>
            <a
              class="underline text-sky-600"
              href="https://fontcluster.mugisus.me/"
              onClick={openFontcluster}
              target="_blank"
              rel="noopener noreferrer"
            >
              What's Fontcluster?
            </a>
          </div>
        }
      >
        <div class="font-semibold text-neutral-900 mb-1">Fontcluster</div>
        <Show when={font()} fallback="Click an item on the List panel.">
          {(currentFont) => (
            <>
              <Show when={isApplying()}>
                Applying {currentFont().font_name}...
              </Show>
              <Show when={isApplied()}>
                Applied {currentFont().font_name}
              </Show>
              <Show when={errorMessage()}>
                {(message) => message()}
              </Show>
            </>
          )}
        </Show>
      </Show>
    </main>
  );
};

export default App;
