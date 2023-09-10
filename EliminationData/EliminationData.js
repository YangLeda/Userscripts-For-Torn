"use strict";

import { unlinkSync, writeFileSync } from "fs";
import axios from "axios";

const TO_FILE_PATH = "大逃杀.csv";
const API_KEY = "";
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
  console.log("EliminationData start");

  let membersList = [];
  await fetchMemberList(membersList);
  await fetchElimination(membersList);
  const content = writeContent(membersList);

  try {
    unlinkSync(TO_FILE_PATH);
    console.log("existing file deleted");
  } catch (error) {}

  try {
    writeFileSync(TO_FILE_PATH, content, { flag: "a" });
  } catch (error) {
    console.log(error);
  }

  console.log("EliminationData end");
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

async function fetchElimination(membersList) {
  console.log("");
  let failedList = [];

  for (const member of membersList) {
    let body = null;
    try {
      const response = await axios.get(`https://api.torn.com/user/${member.id}?selections=&key=${API_KEY}`, PROXY);
      body = response.data;
    } catch (error) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " ERROR fetch. Failed " + failedList.length);
      continue;
    }

    if (!body.player_id || parseInt(body.player_id) !== parseInt(member.id)) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " ERROR ID. Failed " + failedList.length);
      continue;
    }

    if (!body.competition || body.competition.name !== "Elimination") {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " ERROR json Elimination. Failed " + failedList.length);
      continue;
    }

    if (body.competition.team) {
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " YES. Failed " + failedList.length);
      member.elimination = {};
      member.elimination.isJoined = true;
      member.elimination.team = body.competition.team;
      member.elimination.attacks = body.competition.attacks;
      member.elimination.score = body.competition.score;
    } else {
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " NO. Failed " + failedList.length);
      member.elimination = {};
      member.elimination.isJoined = false;
    }

    await sleep(300);
  }

  console.log("\nFailed size: " + failedList.length);
  if (failedList.length > 0) {
    await fetchElimination(failedList);
  }
}

function writeContent(membersList) {
  let content = "";
  content += "ID,Name,Level,Faction,Team,Attacks,Score\n";

  for (const member of membersList) {
    if (member.elimination && member.elimination.isJoined === true) {
      content += member.id;
      content += ",";
      content += member.name;
      content += ",";
      content += member.level;
      content += ",";
      content += member.factionTag;
      content += ",";
      content += member.elimination.team;
      content += ",";
      content += member.elimination.attacks;
      content += ",";
      content += member.elimination.score;
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