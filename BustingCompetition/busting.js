"use strict";

import { unlinkSync, writeFileSync } from "fs";
import axios from "axios";
import { convertCsvToXlsx } from "@aternus/csv-to-xlsx";
import "dotenv/config";

const API_KEY = process.env.API_KEY;
const FACTION_ID_LIST = [36134, 9356, 8509];
const PROXY = {
  proxy: {
    protocol: "http",
    host: "127.0.0.1",
    port: 7890,
  },
};
const TIMESTAMP_START = 1693756800; // 2023-09-4 00:00:00 Beijing Time
const TIMESTAMP_END = 1696089600; // 2023-09-31 00:00:00 Beijing Time

let scoreMap = new Map();

handle();

async function handle() {
  let membersList = [];
  await fetchMemberList(membersList);
  await fetchBusting(membersList);
  membersList.sort((a, b) => {
    return b.bustNum - a.bustNum;
  });
  const content = writeContent(membersList);

  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let fileName = "BUST大赛" + mm + dd;

  try {
    unlinkSync(fileName + ".csv");
    console.log("csv file deleted");
  } catch (error) {}

  try {
    unlinkSync(fileName + ".xlsx");
    console.log("xlsx file deleted");
  } catch (error) {}

  try {
    writeFileSync(fileName + ".csv", content, { flag: "a" });
  } catch (error) {
    console.log(error);
  }

  try {
    convertCsvToXlsx(fileName + ".csv", fileName + ".xlsx");
  } catch (error) {
    console.log(error);
  }

  try {
    unlinkSync(fileName + ".csv");
    console.log("csv file deleted");
  } catch (error) {}
}

async function fetchMemberList(membersList) {
  for (const factionId of FACTION_ID_LIST) {
    membersList.push.apply(membersList, await fetchFactionMemberList(factionId));
  }
  console.log("fetchMemberList done " + membersList.length);
}

async function fetchFactionMemberList(factionId) {
  const response = await axios.get(`https://api.torn.com/faction/${factionId}?selections=&key=${API_KEY}`, PROXY);
  const body = response.data;

  const factionTag = body.tag;
  scoreMap.set(factionTag, 0);

  let list = [];
  for (const key of Object.keys(body.members)) {
    let member = {};
    member.id = key;
    member.name = body.members[key].name;
    member.level = body.members[key].level;
    member.factionTag = factionTag;
    list.push(member);
  }

  console.log("fetchFactionMemberList " + factionId + " " + factionTag + " " + list.length);
  return list;
}

async function fetchBusting(membersList) {
  console.log("");
  let failedList = [];

  for (const member of membersList) {
    let body1 = null;
    let body2 = null;
    try {
      const response1 = await axios.get(`https://api.torn.com/user/${member.id}?selections=basic,personalstats&stat=peoplebusted&timestamp=${TIMESTAMP_START}&key=${API_KEY}`, PROXY);
      const response2 = await axios.get(`https://api.torn.com/user/${member.id}?selections=basic,personalstats&stat=peoplebusted&timestamp=${TIMESTAMP_END}&key=${API_KEY}`, PROXY);
      body1 = response1.data;
      body2 = response2.data;
    } catch (error) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [ERROR fetch] " + failedList.length);
      continue;
    }

    if (!body1.player_id || parseInt(body1.player_id) !== parseInt(member.id) || !body2.player_id || parseInt(body2.player_id) !== parseInt(member.id)) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [ERROR json ID] " + failedList.length);
      continue;
    }

    const bustNum = body2.personalstats.peoplebusted - body1.personalstats.peoplebusted;
    process.stdout.write("\r\x1b[K");
    process.stdout.write("Progress: " + member.id + " [" + bustNum + "] " + failedList.length);

    member.bustNum = bustNum;

    await sleep(500);
  }

  console.log("\nFailed size: " + failedList.length);
  if (failedList.length > 0) {
    await fetchBusting(failedList);
  }
}

function writeContent(membersList) {
  let content = "";
  content += "ID,Name,Level,Faction,Bust,Score\n";

  let score = 50;
  for (const member of membersList) {
    if (member.bustNum > 0) {
      member.score = score;
      scoreMap.set(member.factionTag, scoreMap.get(member.factionTag) + score);
    }
    if (score > 0) {
      score--;
    }
  }

  scoreMap.forEach((value, key) => {
    content += "";
    content += ",";
    content += "";
    content += ",";
    content += "";
    content += ",";
    content += key;
    content += ",";
    content += "";
    content += ",";
    content += value;
    content += "\n";
  });
  content += ",,,,,\n";

  for (const member of membersList) {
    if (member.bustNum > 0) {
      content += member.id;
      content += ",";
      content += member.name;
      content += ",";
      content += member.level;
      content += ",";
      content += member.factionTag;
      content += ",";
      content += member.bustNum;
      content += ",";
      content += member.score;
      content += "\n";
    }
  }

  return content;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
