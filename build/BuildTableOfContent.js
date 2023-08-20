"use strict";

const fs = require("fs");

const FROM_FILE_PATH = "UserscriptList.json";
const TO_FILE_PATH = "../README.md";
const EXTENTION_URL = "userscripts/";

console.log("BuildTableOfContent start");

// Delete existing TO_FILE_PATH
try {
  fs.unlinkSync(TO_FILE_PATH);
  console.log("existing file deleted");
} catch (error) {}

// Read JSON from FROM_FILE_PATH
let json = [];
try {
  const raw = fs.readFileSync(FROM_FILE_PATH);
  json = JSON.parse(raw);
} catch (error) {
  console.log(error);
}

// Construct Markdown
let content = "# 插件列表\n";
let index = 0;

for (const script of json) {
  index++;
  content += `## ${index}. [${script.name}](${EXTENTION_URL + script.path}) ${script.version}&emsp;&emsp;${script.author} \n${script.description}\n>${script.detail}  \n`;
}

// Create TO_FILE_PATH
try {
  fs.writeFileSync(TO_FILE_PATH, content, { flag: "a" });
} catch (error) {
  console.log(error);
}

console.log("BuildTableOfContent end " + index + " scripts");
