/**
 * Web Speech API — căutare vocală în română.
 * Suportă toggle start/stop și callback-uri pentru integrare ușoară.
 */

let recunoastere = null;
let ascultaActiv = false;

/**
 * Inițializează sau returnează instanța de voice search.
 * @param {object} callbacks - { onStart, onResult(text), onError }
 * @returns {{ toggle: Function, supported: boolean }}
 */
export function initVoice({ onStart, onResult, onError } = {}) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { toggle: () => {}, supported: false };
  }

  if (!recunoastere) {
    recunoastere = new SpeechRecognition();
    recunoastere.lang = 'ro-RO';
    recunoastere.continuous = false;
    recunoastere.interimResults = false;
    recunoastere.maxAlternatives = 1;
  }

  // Suprascriem handler-ele la fiecare apel (permite re-init cu noi callbacks)
  recunoastere.onstart = () => {
    ascultaActiv = true;
    onStart?.();
  };

  recunoastere.onresult = (event) => {
    ascultaActiv = false;
    const text = event.results[0]?.[0]?.transcript?.trim() ?? '';
    onResult?.(text);
  };

  recunoastere.onerror = (event) => {
    ascultaActiv = false;
    console.warn('Speech recognition error:', event.error);
    onError?.(event.error);
  };

  recunoastere.onend = () => {
    if (ascultaActiv) {
      // A terminat fără rezultat (timeout/fără voce)
      ascultaActiv = false;
      onResult?.('');
    }
  };

  function toggle() {
    if (ascultaActiv) {
      recunoastere.stop();
      ascultaActiv = false;
      onError?.('stopped');
    } else {
      try {
        recunoastere.start();
      } catch (e) {
        // already started — ignorăm
        console.warn('Speech already started:', e.message);
      }
    }
  }

  return { toggle, supported: true };
}

/**
 * Verifică rapid dacă browser-ul suportă voice search.
 */
export function suportaVoice() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
