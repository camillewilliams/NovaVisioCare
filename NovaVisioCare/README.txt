The purpose of this file is to document manifest.json

Author: 

Line by line, here is the meaning:

{
  "manifest_version": 3,                    <-- modern Chrome extension (event driven, background logic)
  "name": "NovaVisioCare",                       <-- displayed name
  "version": "1.0",                         <-- version number
  "background": {
    "service_worker": "background.js" <-- Chrome loads this JS as a service worker without a DOM
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],            <-- Inject content.js into every webpage visited
      "js": ["content.js"]         <-- Can access the DOM. Can message the service worker.
    }
  ]
}





