/*
  The purpose of this file is to provide background script for mapd server.

  Authors: Camille Williams, Mahmudul Hasan Hamim, Sahir Amaan
*/

/*
  This function (1) fetches the image (2) represents the image as a blob
  (Binary Large Object) (3) sends the image to the server (4) receives a
  textual description from the server (5) sends the textual description
  to the content script.

  - msg is the message sent from the content script
  - sendResponse is a function used to send the textual description to
    the content script. Once sendResponse has executed, the communication
    channel between the content and background scripts is closed.
*/

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "ANALYZE_IMAGE_URL") return;

  (async () => {
    try {
      // 1) Fetch the image in the extension service worker context (background)
      //    rather than the context of the website the user is viewing (content).
      //    This somtimes avoids cross origin resourse sharing (CORS)
      //    limitations.
      const imgRes = await fetch(msg.url);
      // Back ticks are template literal strings. That's why ${...} is necessary
      // ${...} evaluates what is inside.
      // Regular strings using "" are permitted but some find template literals cleaner
      if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);

      // 2) convert the image to a blob.
      //    A blob is not a file but it behaves like a file. It has a type .type.
      //    It has a size .size
      const blobRep = await imgRes.blob();

      // 3) Send blob image to server
      const form = new FormData();
      //           field , content, what the server calls it
      form.append("image", blobRep, "image.jpg");
      // call the endpoint /analyze on the server for processing
      const serverRes = await fetch("http://mapd.cs-smu.ca:3026/analyze", {
        method: "POST",
        body: form,
      });

      // SERVER SIDE FAILURE: example is EADDRINUSE when port is already in use
      // This case is for when a valid reference was returned by the server
      // but the server is reporting another type of error.
      if (!serverRes.ok) {
        const txt = await serverRes.text().catch(() => "");
        throw new Error(`Server failed: ${serverRes.status} ${txt}`);
      }

      // convert JSON text sent from server to JavaScript object
      const data = await serverRes.json();
      sendResponse({
        ok: true,
        // if .description is falsy (null, undefined,...) use (no description)
        description: data.description || "(no description)",
      });
      // NETWORK OR CLIENT SIDE FAILURE: example is status equals 400 or 404
    } catch (err) {
      // .error instead of .log so it shows up as an error with a stack trace
      console.error(err);
      // if err is truthy use .message otherwise use err which will be undefined
      // and make sure both are represented as strings
      sendResponse({ ok: false, error: String(err?.message || err) });
    }
  })();

  // Keeps communication channel to content open.
  // Tells Chrome to wait until sendResponse completes.
  // Then channel closes after sendResponse executes.
  // Without return true; the channel closes right away
  // when it gets to the end of the listener.
  return true;
});


