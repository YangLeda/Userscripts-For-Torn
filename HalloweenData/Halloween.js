"use strict";

import { unlinkSync, writeFileSync } from "fs";
import axios from "axios";
import { convertCsvToXlsx } from "@aternus/csv-to-xlsx";
import "dotenv/config";

const API_KEY = process.env.API_KEY;
const FACTION_ID_LIST = [20465, 36134, 16335, 10741, 16424, 27902, 11796, 9356, 8509];
const PROXY = {
  proxy: {
    protocol: "http",
    host: "127.0.0.1",
    port: 7890,
  },
};

handle();

async function handle() {
  let membersList = [];
  await fetchMemberList(membersList);
  await fetchHalloween(membersList);

  membersList.sort((a, b) => {
    return b.halloween.treats_collected_total - a.halloween.treats_collected_total;
  });

  const content = writeContent(membersList);

  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let fileName = "万圣节糖果数" + mm + dd;

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

async function fetchHalloween(membersList) {
  console.log("");
  let failedList = [];

  for (const member of membersList) {
    let body = null;
    try {
      const response = await axios.get(`https://api.torn.com/user/${member.id}?selections=basic,profile&key=${API_KEY}`, PROXY);
      body = response.data;
    } catch (error) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [ERROR fetch] " + failedList.length);
      continue;
    }

    if (!body.player_id || parseInt(body.player_id) !== parseInt(member.id)) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [ERROR json ID] " + failedList.length);
      continue;
    }

    if (!body.competition || body.competition.name !== "Halloween") {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [ERROR json Halloween] " + failedList.length);
      continue;
    }

    process.stdout.write("\r\x1b[K");
    process.stdout.write("Progress: " + member.id + " " + body.competition.treats_collected_total + " " + failedList.length);
    member.halloween = {};
    member.halloween.treats_collected_total = body.competition.treats_collected_total;

    await sleep(300);
  }

  console.log("\nFailed size: " + failedList.length);
  if (failedList.length > 0) {
    await fetchHalloween(failedList);
  }
}

function writeContent(membersList) {
  let content = "";
  content += "ID,Name,Level,Faction,Treats\n";

  for (const member of membersList) {
    if (member.halloween && member.halloween.treats_collected_total) {
      content += member.id;
      content += ",";
      content += member.name;
      content += ",";
      content += member.level;
      content += ",";
      content += member.factionTag;
      content += ",";
      content += member.halloween.treats_collected_total;
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
