/*
  The purpose of this file is to act as the mapd server. It receives image data, 
  communicates with Google Gemini, and returns image descriptions.

  Authors: Camille Williams, Mahmudul Hasan Hamim, Sahir Amaan
*/


import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
// import Nodejs file system module
import fs from "fs";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* global constants */
const PORT = 3111;
const MODEL_NAME = "gemini-3-flash-preview";

/* global variables */
const app = express();

// set the destination folder for the image
// and set a file size limit of 15MB
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 15 * 1024 * 1024 },
});


app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/*
  The purpose of this endpoint is to supply Google Gemini with the
  image to analyze and then get a textual description of the image,
  and then send the description to the background script.

  upload.single(image) instructs the endpoint to:
  - upload exactly one image found at the form field "image"

  reqObj - request object
  resObj - result object
*/
app.post("/analyze", upload.single("image"), async (reqObj, resObj) => {
  try {
    // when reqObj.file is null or undefined
    if (!reqObj.file) {
      return resObj.status(400).json({ error: "No image uploaded" });
    }

    // get file from disk and store in buffer
    const buffer = fs.readFileSync(reqObj.file.path);
    // get the type and if it is missing set the type to image/jpeg
    const mime = reqObj.file.mimetype || "image/jpeg";

    // core Google Gemini API call goes here
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Create an array to hold image data parts (can support multiple images if needed)
    const imageParts = [{
      inlineData: {
        // Convert the binary buffer into a Base64-encoded string
        // This is required because many APIs expect image data in Base64 format
        data: buffer.toString("base64"),
        // Specify the MIME type of the image (e.g., "image/png", "image/jpeg")
        // This helps the API understand how to decode and process the image
        mimeType: mime
      }
    }];

    // Define a text prompt asking the model what to do with the image
    // In this case, we want a detailed description for accessibility purposes
    const prompt = "Describe this image for a visually impaired person in 50 words or less.";

    // Send the prompt along with the image data to the model
    // The spread operator (...imageParts) adds the image content to the request
    // so the model receives both text and image together (multimodal input)
    const result = await model.generateContent([prompt, ...imageParts]);
    // get the text from the result
    const responseText = result.response.text();

    // delete uploaded file from server's disk
    fs.unlinkSync(reqObj.file.path);

    resObj.json({ description: responseText });

  } catch (e) {
    if (reqObj.file) fs.unlinkSync(reqObj.file.path);
    console.error(e);
    resObj.status(500).json({ error: e.message });
  }
});

/*
  The purpose of this function is to listen to PORT.
*/
app.listen(PORT, () =>
  console.log("✅ Server running at http://mapd.cs-smu.ca:3111"),
);



