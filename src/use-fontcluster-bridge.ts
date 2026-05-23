import { createSignal, onCleanup, onMount } from 'solid-js';
import type { Accessor } from 'solid-js';
import { v7 as uuidv7 } from 'uuid';

import type {
  FontclusterBridgeData,
  FontclusterFontMetadata,
  FontclusterSessionConfig,
} from './types';

const BRIDGE_DATA_URL = 'http://localhost:38653/data';
const BRIDGE_HEARTBEAT_URL = 'http://localhost:38653/heartbeat';
const POLL_INTERVAL_MS = 500;
const HEARTBEAT_INTERVAL_MS = 1000;

interface AdobeCepApi {
  evalScript(script: string, callback: (result: string) => void): void;
}

interface CepRuntime {
  util?: {
    openURLInDefaultBrowser(url: string): void;
  };
}

declare global {
  interface Window {
    __adobe_cep__?: AdobeCepApi;
    cep?: CepRuntime;
  }
}

export interface FontclusterBridge {
  isConnected: Accessor<boolean>;
  isApplying: Accessor<boolean>;
  isApplied: Accessor<boolean>;
  errorMessage: Accessor<string | null>;
  font: Accessor<FontclusterFontMetadata | null>;
}

function evalScript(script: string, callback: (result: string) => void) {
  if (!window.__adobe_cep__) {
    callback('CEP runtime is unavailable');
    return;
  }

  window.__adobe_cep__.evalScript(script, callback);
}

function createPluginId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  try {
    return uuidv7();
  } catch {
    return '';
  }
}

function values(record: Record<string, string> | null | undefined) {
  return record ? Object.values(record) : [];
}

function stringLiteral(value: unknown) {
  return JSON.stringify(value == null ? '' : String(value));
}

function stringArrayLiteral(items: string[]) {
  return `[${items.map(stringLiteral).join(',')}]`;
}

function createApplyScript(
  font: FontclusterFontMetadata,
  session: FontclusterSessionConfig | null,
  modifiedDate: string,
) {
  return (
    'fontclusterApplyFont(' +
    stringLiteral(font.family_name) +
    ',' +
    stringLiteral(font.font_name) +
    ',' +
    stringLiteral(font.style_name) +
    ',' +
    stringArrayLiteral(values(font.preferred_family_names)) +
    ',' +
    stringArrayLiteral(values(font.family_names)) +
    ',' +
    stringArrayLiteral(values(font.preferred_style_names)) +
    ',' +
    stringArrayLiteral(values(font.style_names)) +
    ',' +
    stringLiteral(session?.preview_text) +
    ',' +
    JSON.stringify(modifiedDate) +
    ')'
  );
}

export function useFontclusterBridge(): FontclusterBridge {
  const [isConnected, setIsConnected] = createSignal(false);
  const [isApplying, setIsApplying] = createSignal(false);
  const [isApplied, setIsApplied] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [font, setFont] = createSignal<FontclusterFontMetadata | null>(null);
  const [modifiedDate, setModifiedDate] = createSignal<string | null>(null);
  const pluginId = createPluginId();

  onMount(() => {
    let disposed = false;

    function applyFont(
      nextFont: FontclusterFontMetadata,
      session: FontclusterSessionConfig | null,
      nextModifiedDate: string,
    ) {
      setIsApplying(true);
      setIsApplied(false);
      setErrorMessage(null);

      evalScript(
        createApplyScript(nextFont, session, nextModifiedDate),
        (result) => {
          if (disposed) return;

          setIsApplying(false);

          if (String(result) === 'ok') {
            setIsApplied(true);
            setErrorMessage(null);
            return;
          }

          setIsApplied(false);
          setErrorMessage(String(result) || 'Failed to apply font.');
        },
      );
    }

    async function pollBridge() {
      try {
        const response = await fetch(BRIDGE_DATA_URL, { cache: 'no-store' });

        if (!response.ok) {
          setIsConnected(false);
          setIsApplying(false);
          setErrorMessage('No Fontcluster App detected.');
          return;
        }

        const bridgeState = (await response.json()) as FontclusterBridgeData;
        setIsConnected(true);

        if (!bridgeState.font) {
          setErrorMessage(null);
          return;
        }

        if (
          !bridgeState.modified_date ||
          bridgeState.modified_date === modifiedDate() ||
          isApplying()
        ) {
          return;
        }

        setModifiedDate(bridgeState.modified_date);
        setFont(bridgeState.font);
        applyFont(
          bridgeState.font,
          bridgeState.session ?? null,
          bridgeState.modified_date,
        );
      } catch {
        setIsConnected(false);
        setIsApplying(false);
        setErrorMessage('No Fontcluster App detected.');
      }
    }

    async function postHeartbeat(documentName: string | null) {
      if (!pluginId) return;

      try {
        await fetch(BRIDGE_HEARTBEAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plugin_id: pluginId,
            plugin_name: 'Fontcluster Apply',
            host: 'illustrator',
            document_name: documentName,
          }),
        });
      } catch {
        return;
      }
    }

    function sendHeartbeat() {
      if (!window.__adobe_cep__) {
        void postHeartbeat(null);
        return;
      }

      evalScript(
        'app.documents.length > 0 ? app.activeDocument.name : ""',
        (documentName) => {
          void postHeartbeat(documentName || null);
        },
      );
    }

    void pollBridge();
    sendHeartbeat();

    const pollIntervalId = window.setInterval(() => {
      if (!disposed) {
        void pollBridge();
      }
    }, POLL_INTERVAL_MS);
    const heartbeatIntervalId = window.setInterval(() => {
      if (!disposed) {
        sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL_MS);

    onCleanup(() => {
      disposed = true;
      window.clearInterval(pollIntervalId);
      window.clearInterval(heartbeatIntervalId);
    });
  });

  return {
    isConnected,
    isApplying,
    isApplied,
    errorMessage,
    font,
  };
}
