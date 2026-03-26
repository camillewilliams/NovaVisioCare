/*
  The purpose of this file is to act as the mapd server. It receives image data, 
  communicates with Google Gemini, and returns image descriptions.

  Authors: Camille Williams, Mahmudul Hasan Hamim, Sahir Amaan
*/

import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* global constants */
const PORT = 3026;
const MODEL_NAME = "gemini-1.5-flash";

/* global variables */
const app = express();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 15 * 1024 * 1024 },
});

app.use(cors());

const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

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
    // convert image into a Base64-encoded data URL string
    // that can be sent directly to Google Gemini
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    // core Google Gemini API call goes here
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const imageParts = [{
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: mime
      }
    }];

    const prompt = "Describe this image for a visually impaired person.";
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
  console.log("✅ Server running at http://mapd.cs-smu.ca:3026"),
);

