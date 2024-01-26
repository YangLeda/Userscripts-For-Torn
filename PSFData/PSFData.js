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

const COMPANY_TYPE_MAP = new Map();
COMPANY_TYPE_MAP.set(37, "PSF");
COMPANY_TYPE_MAP.set(38, "Mining");
COMPANY_TYPE_MAP.set(28, "Oil");
COMPANY_TYPE_MAP.set(16, "TV");
COMPANY_TYPE_MAP.set(33, "Meat");
COMPANY_TYPE_MAP.set(8, "Candle");

const COMPANY_TYPE_SORTING_MAP = new Map();
COMPANY_TYPE_SORTING_MAP.set(37, 1);
COMPANY_TYPE_SORTING_MAP.set(38, 2);
COMPANY_TYPE_SORTING_MAP.set(28, 3);
COMPANY_TYPE_SORTING_MAP.set(16, 4);

handle();

async function handle() {
  let membersList = [];
  await fetchMemberList(membersList);

  // for test only
  //membersList = membersList.slice(0, 20);

  await fetchMember(membersList);
  await fetchCompany(membersList);
  await fetchEmployee(membersList);

  membersList = membersList.filter(member => member.company);

  membersList.sort((a, b) => {
    let sortingIndexA = COMPANY_TYPE_SORTING_MAP.get(a.company.company_type) ? COMPANY_TYPE_SORTING_MAP.get(a.company.company_type) : (a.company.company_type + 100);
    let sortingIndexB = COMPANY_TYPE_SORTING_MAP.get(b.company.company_type) ? COMPANY_TYPE_SORTING_MAP.get(b.company.company_type) : (b.company.company_type + 100);
    if (sortingIndexA !== sortingIndexB) {
      return sortingIndexA - sortingIndexB;
    }

    if (a.company.rating !== b.company.rating) {
      return b.company.rating - a.company.rating;
    }

    return b.company.weekly_income - a.company.weekly_income;
  });

  const content = writeContent(membersList);

  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let fileName = "老板榜" + mm + dd;

  try {
    unlinkSync(fileName + ".csv");
    console.log("csv file deleted");
  } catch (error) { }

  try {
    unlinkSync(fileName + ".xlsx");
    console.log("xlsx file deleted");
  } catch (error) { }

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
  } catch (error) { }
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
    member.factionTag = factionTag;
    list.push(member);
  }

  console.log("fetchFactionMemberList " + factionId + " " + factionTag + " " + list.length);
  return list;
}

async function fetchMember(membersList) {
  console.log("fetchMember start");
  let failedList = [];

  for (const member of membersList) {
    let body = null;
    try {
      const response = await axios.get(`https://api.torn.com/user/${member.id}?selections=basic,profile&key=${API_KEY}`, PROXY);
      body = response.data;
    } catch (error) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [ERROR fetch error] " + failedList.length);
      continue;
    }

    if (!body.player_id || parseInt(body.player_id) !== parseInt(member.id)) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [ERROR mismatch player ID in json] " + failedList.length);
      continue;
    }

    if (!body.job || body.job.job !== "Director") {
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [IGNORE not a director] " + failedList.length);
      continue;
    }

    process.stdout.write("\r\x1b[K");
    process.stdout.write("Progress: " + member.id + "[FOUND] " + failedList.length);
    member.company = {};
    member.company.company_type = body.job.company_type;
    member.company.company_id = body.job.company_id;

    await sleep(300);
  }

  console.log("\nFailed size: " + failedList.length);
  if (failedList.length > 0) {
    await fetchMember(failedList);
  }
}

async function fetchCompany(membersList) {
  console.log("fetchCompany start");

  let failedList = [];

  for (const member of membersList) {
    if (!member.company || !member.company.company_id || !member.company.company_type) {
      continue;
    }

    let body = null;
    try {
      const response = await axios.get(`https://api.torn.com/company/${member.company.company_id}?selections=&key=${API_KEY}`, PROXY);
      body = response.data;
    } catch (error) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [ERROR fetch error] " + failedList.length);
      continue;
    }

    if (!body.company.ID || parseInt(body.company.ID) !== parseInt(member.company.company_id)) {
      failedList.push(member);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + member.id + " [ERROR mismatch company ID in json] " + failedList.length);
      continue;
    }

    process.stdout.write("\r\x1b[K");
    process.stdout.write("Progress: " + member.id + "[SUCCESS] " + failedList.length);
    member.company.rating = body.company.rating;
    member.company.employees_hired = body.company.employees_hired;
    member.company.employees_capacity = body.company.employees_capacity;
    member.company.daily_income = body.company.daily_income;
    member.company.weekly_income = body.company.weekly_income;

    member.company.inactiveEmployeeNum = 0;
    let employees = [];
    for (const key of Object.keys(body.company.employees)) {
      let employee = {};
      employee.id = key;
      employee.last_action = body.company.employees[key].last_action.relative;
      employees.push(employee);

      if (employee.last_action.includes("day")) {
        member.company.inactiveEmployeeNum += 1;
      }
    }
    member.company.employees = employees;

    await sleep(300);
  }

  console.log("\nFailed size: " + failedList.length);
  if (failedList.length > 0) {
    await fetchCompany(failedList);
  }
}

async function fetchEmployee(membersList) {
  console.log("fetchEmployee start");

  let failedList = [];

  for (const member of membersList) {
    if (!member.company || !member.company.employees) {
      continue;
    }

    let employeeWSList = [];

    for (const employee of member.company.employees) {
      if (employee.id === member.id) {
        continue; // Is the director
      }

      let body = null;
      try {
        const response = await axios.get(`https://api.torn.com/user/${employee.id}?selections=basic,profile,personalstats&key=${API_KEY}`, PROXY);
        body = response.data;
      } catch (error) {
        failedList.push(member);
        process.stdout.write("\r\x1b[K");
        process.stdout.write("Progress: " + employee.id + " [ERROR fetch error] " + failedList.length);
        break;
      }

      if (!body.player_id || parseInt(body.player_id) !== parseInt(employee.id)) {
        failedList.push(member);
        process.stdout.write("\r\x1b[K");
        process.stdout.write("Progress: " + employee.id + " [ERROR mismatch player ID in json] " + failedList.length);
        break;
      }

      process.stdout.write("\r\x1b[K");
      process.stdout.write("Progress: " + employee.id + "[SUCCESS] " + failedList.length);
      employeeWSList.push(parseInt(70 * body.age + 75 * body.personalstats.trainsreceived));

      await sleep(300);
    }

    if (employeeWSList.length = member.company.employees_hired) {
      member.company.highestWS = Math.max(...employeeWSList);
      member.company.lowestWS = Math.min(...employeeWSList);
      let total = 0;
      employeeWSList.forEach(ws => {
        total += ws;
      });
      member.company.averageWS = parseInt(total / employeeWSList.length - 1);
    }
  }

  console.log("\nFailed size: " + failedList.length);
  if (failedList.length > 0) {
    await fetchEmployee(failedList);
  }
}

function writeContent(membersList) {
  let content = "";
  content += "玩家,帮派,公司类型,星级,员工数,日收入,周收入,去除2M工资后平均日收入,超一天不上线员工数,员工最高ws,员工最低ws,员工平均ws\n";

  for (const member of membersList) {
    if (member.company && member.company.company_id) {
      content += member.name + " [" + member.id + "]";
      content += ",";
      content += member.factionTag;
      content += ",";
      content += COMPANY_TYPE_MAP.get(member.company.company_type) ? COMPANY_TYPE_MAP.get(member.company.company_type) : member.company.company_type;
      content += ",";
      content += member.company.rating + "*";
      content += ",";
      content += member.company.employees_hired + " / " + member.company.employees_capacity;
      content += ",";
      content += member.company.daily_income;
      content += ",";
      content += member.company.weekly_income;
      content += ",";
      content += parseInt(member.company.weekly_income / 7 - member.company.employees_hired * 2000000);
      content += ",";
      content += member.company.inactiveEmployeeNum;
      content += ",";
      content += member.company.highestWS;
      content += ",";
      content += member.company.lowestWS;
      content += ",";
      content += member.company.averageWS;
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
