/*
  The purpose of this file is 

    Author: 
*/

/* global variables */
let globalVoices = [];
let pressTimer = null;

/* global constants */
const LONG_PRESS_MS = 600; // 0.6 sec gives a safe margin of the typical 0.5 sec
const LANGUAGE_NAME = "Google UK English Female"; // client preferred soft female voice

/*
  The purpose of this function is to get the array of voices available
  in this version of Google Chrome.
*/
function loadVoices() {
  globalVoices = speechSynthesis.getVoices();
}

/*
  onvoiceschanged is an event listener that activates only when the browser
  is ready to set the globalVoices variable immediately when the line of
  code is executed.

  An important note here is that globalVoices = speechSynthesis.getVoices();
  does not need to execute for the onvoiceschanged event to eventually fire.
  onvoiceschanged happens asynchronously and independent of your code.
*/
speechSynthesis.onvoiceschanged = loadVoices; // wait for event
loadVoices(); // try right away just in case. But you might get an empty array []

/*
    This event listener acts when an image is "long pressed"

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
        // img.currentSrc might contain the actual image being displayed.
        // If it doesn't then it is equal to "" which is falsy.
        // This can be different than img.src which refers to the attribute src.
        // img.src can be differnt when, for example, there are different sized
        // images for different sized devices.
        // url will be currentSrc when currentSrc !== "" , otherwise it will be src
        url: img.currentSrc || img.src,
      });

      // if resp is null or undefined or false
      // then if resp is not null or undefined
      //      then use error description
      //      else use "Unknown error"
      if (!resp?.ok) throw new Error(resp?.error || "Unknown error");

      speak(resp.description);
    } catch (err) {
      console.error("Analyze failed:", err);
    }
  }, LONG_PRESS_MS);
});

/*
  These event listeners work to cancel the long press event
*/
document.addEventListener("pointerup", () => {
  clearTimeout(pressTimer);
});
document.addEventListener("pointercancel", () => {
  clearTimeout(pressTimer);
});

/*
  Stop the context menu appearing due to a long-press.
*/
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

function speak(text) {
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  // u.lang used when you want a voice but you let the browser choose something close
  // It's here only as information, and is not required for the app
  u.lang = "en-GB";
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
