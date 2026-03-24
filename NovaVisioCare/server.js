/*
  The purpose of this file is to 

  Author:
*/

import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import OpenAI from "openai";

const PORT = 3026;
const app = express();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 15 * 1024 * 1024 },
});

app.use(cors());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/*
  The purpose of this endpoint is to supply OpenAI with the
  image to analyze and then get a textual description of the image,
  and then send the description to the background script.

  upload.single(image) instructs the endpoint to:
  - upload exactly one image found at the form field "image"

  req - request object
  res - result object
*/
app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    // when req.file is null or undefined
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // get file from disk and store in buffer
    const buffer = fs.readFileSync(req.file.path);
    // get the type and if it is missing set the type to image/jpeg
    const mime = req.file.mimetype || "image/jpeg";
    // convert image into a Base64-encoded data URL string
    // that can be sent directly to OpenAI
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    // core OpenAI API call goes here

    // delete uploaded file from server's disk
    fs.unlinkSync(req.file.path);

    res.json({ description: response.output_text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/*
  The purpose of this function is to listen to PORT.
*/
app.listen(PORT, () =>
  console.log("✅ Server running at http://mapd.cs-smu.ca:3026"),
);

