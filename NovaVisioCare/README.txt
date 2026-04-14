The purpose of this file is to document manifest.json

Team Members: Mahmudul Hasan Hamim, Camille Williams, Sahir Amaan

Line by line, here is the meaning:

{
  "manifest_version": 3,                    <-- Modern Chrome extension (event driven, background logic)
  "name": "Nova VisioCare",                 <-- Displayed name
  "version": "1.0",                         <-- Version number
  "description": "Project for CSCI 2356",
  "permissions": ["activeTab"],             <-- Grants the extension temporary access to the currently active tab
  "host_permissions": [
    "<all_urls>",                           <-- Allows the extension to fetch images from any website
    "http://mapd.cs-smu.ca:3111/*"          <-- Allows extension to send image data to mapd server
  ],
  "background": {
    "service_worker": "background.js"       <-- Chrome loads this JS as a service worker without a DOM
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],            <-- Inject content.js into every webpage visited
      "js": ["content.js"]                  <-- Can access the DOM. Can message the service worker.
    }
  ]
}





