/*
  The purpose of this file is to provide the content script for mapd server.

    Authors: Camille Williams, Mahmudul Hasan Hamim, Sahir Amaan
*/

/* --- Global Variables --- */
let globalVoices = [];
let pressTimer = null;

/* --- Global Constants --- */
const LONG_PRESS_MS = 600; // 0.6 sec gives a safe margin of the typical 0.5 sec
const LANGUAGE_NAME = "Google UK English Female"; // client preferred soft female voice

/**
 * The purpose of this function is to get the array of voices available
 * in this version of Google Chrome.
 */
function loadVoices() {
  globalVoices = speechSynthesis.getVoices();
}

/*
  onvoiceschanged is an event listener that activates only when the browser
  is ready to set the globalVoices variable immediately when the line of
  code is executed.
*/
speechSynthesis.onvoiceschanged = loadVoices; // wait for event
loadVoices(); // try right away just in case. But you might get an empty array []

/*
    This event listener acts when an image is "long pressed".

    e - the event object created by the pointertdown event
      - contains field e.target which is the element that was directly pressed
*/
document.addEventListener("pointerdown", (e) => {
  const img = e.target;
  // if img is null or undefined or img.tagName is not IMG return
  if (!img || img.tagName !== "IMG") return;

  pressTimer = setTimeout(async () => {
    // prevents default actions like a picture being a link
    e.preventDefault();
    // prevents propagation that would happen with a nested div being clicked and
    // both the actions associated with the inner div and outer div take place
    e.stopPropagation();

    try {
      const resp = await chrome.runtime.sendMessage({
        type: "ANALYZE_IMAGE_URL",
        url: img.currentSrc || img.src,
      });

      if (!resp?.ok) throw new Error(resp?.error || "Unknown error");

      speak(resp.description);
    } catch (err) {
      console.error("Analyze failed:", err);
    }
  }, LONG_PRESS_MS);
});

/*
  These event listeners work to cancel the long press event.
*/
document.addEventListener("pointerup", () => {
  clearTimeout(pressTimer);
});
document.addEventListener("pointercancel", () => {
  clearTimeout(pressTimer);
});

/*
 * Event listener that stops the context menu appearing due to a long-press.
 */
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

/**
 * This function produces speech of the given text.
 * @param {string} text - The image description
 */
function speak(text) {
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.pitch = 1.0;
  u.volume = 1.0;

  const voice = globalVoices.find((v) => v.name === LANGUAGE_NAME);

  if (voice) {
    u.voice = voice;
  } else {
    console.log("Voice not found, using default");
  }

  speechSynthesis.speak(u);
}


