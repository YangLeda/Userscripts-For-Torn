// ==UserScript==
// @name         CartelTools
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Estimates BS when viewing fight logs of successful attacks from yourself. Uploads to and fetch records from CEStats server.
// @author       BOT7420 [3094]
// @match        https://cartelempire.online/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      43.129.194.214
// @connect      simcotools.app
// @run-at       document-start
// ==/UserScript==

(async function () {
    "use strict";

    let API_KEY = "XXXXXXXXXX"; // 这里改成自己的APIKey，改过一次就行，未来更新可能不需要再改

    /* 以下不需要修改 */
    if (API_KEY && API_KEY !== "XXXXXXXXXX") {
        localStorage.setItem("script_api_key", API_KEY);
    } else if (localStorage.getItem("script_api_key")) {
        API_KEY = localStorage.getItem("script_api_key");
    } else {
        console.log("[CartelTools] No API Key!");
    }

    const currentURL = window.location.href.toLowerCase();

    if (currentURL.includes("/fight/")) {
        const urlSplit = currentURL.split("/");
        const id = urlSplit[urlSplit.length - 1];
        await handleFightLogPage(id);
    } else if (currentURL.includes("/user/")) {
        const urlSplit = currentURL.split("/");
        const id = urlSplit[urlSplit.length - 1];
        handleProfilePage(id);
    }

    async function handleFightLogPage(logId) {
        console.log("[CartelTools] handleFightLogPage");
        const selfTotalBS = await getSelfTotalBS();
        const selfId = localStorage.getItem("script_self_id");
        const selfName = localStorage.getItem("script_self_name");

        const checkElementExist = () => {
            const selectedElem = document.querySelector(`div.table-responsive.fightTable`);
            if (selectedElem) {
                clearInterval(timer);
                if (selectedElem.querySelector(`td`).querySelectorAll(`a`).length > 1) {
                    console.log("[CartelTools] handleFightLogPage fight not involving self");
                    return;
                }
                const logElem = selectedElem.querySelector(`td`).querySelector(`a`);
                const hrefSplit = logElem.href.split("/");
                const opponentId = hrefSplit[hrefSplit.length - 1];
                const opponentName = logElem.innerHTML.substring(1);

                const FFElem = document.querySelector(`div.card-body div`).querySelectorAll(`div.card-body div`)[1].querySelector(`span`);
                const FF = Number(FFElem.innerHTML.substring(1));
                let estimateBSString = "Error";
                if (FF > 1 && FF < 3) {
                    estimateBSString = "" + (((FF - 1) / 8) * 3 * selfTotalBS).toFixed(0);
                } else if (FF == 3) {
                    estimateBSString = ">" + (selfTotalBS * 0.75).toFixed(0);
                }
                FFElem.innerHTML += "<br>估计对手总BS " + estimateBSString;

                saveEstimateBS(logId, opponentId, opponentName, estimateBSString);

                const newButton = document.createElement("button");
                newButton.textContent = "上传至CEStats";
                newButton.style.backgroundColor = "green";
                newButton.addEventListener("click", async () => {
                    newButton.disabled = true;
                    newButton.textContent = "正在上传...";
                    const result = await uploadToSES(logId, opponentId, opponentName, estimateBSString, selfId, selfName);
                    console.log(result);
                    newButton.textContent = result;
                    newButton.disabled = false;
                });
                FFElem.parentNode.insertBefore(newButton, FFElem.nextSibling);
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }

    function uploadToSES(logId, opponentId, opponentName, estimateBSString, selfId, selfName) {
        let model = {
            reporterId: selfId,
            reporterName: selfName,
            targetId: opponentId,
            targetName: opponentName,
            bs: estimateBSString,
            logId: logId,
            logTimestamp: null,
            reportTimestamp: Date.now(),
            reportSource: "一键上传",
        };

        console.log(model);

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: `http://43.129.194.214:3000/api/spy/upload/`,
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify(model),
                onload: function (response) {
                    const json = JSON.parse(response.response);
                    console.log(json);
                    if (json.httpStatus === 200 && json.success === true && json.message) {
                        resolve(json.message);
                    } else {
                        resolve(json.message ? json.message : "未知错误");
                    }
                },
                onerror: function (error) {
                    console.log("onerror");
                    console.log(error);
                    resolve("网络错误");
                },
            });
        });
    }

    function fetchSESSpy(opponentId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `http://43.129.194.214:3000/api/spy/?userid=${opponentId}`,
                headers: {
                    "Content-Type": "application/json",
                },
                onload: function (response) {
                    const json = JSON.parse(response.response);
                    console.log(json);
                    if (json.httpStatus === 200 && json.success === true && json.result) {
                        resolve(json.result);
                    } else {
                        resolve(json.message ? json.message : "未知错误");
                    }
                },
                onerror: function (error) {
                    console.log("onerror");
                    console.log(error);
                    resolve("网络错误");
                },
            });
        });
    }

    function getSelfTotalBS() {
        if (
            localStorage.getItem("script_self_total_bs_timestamp") &&
            Date.now() - Number(localStorage.getItem("script_self_total_bs_timestamp")) < 1800000 &&
            Number(localStorage.getItem("script_self_total_bs")) !== 0 &&
            !Number.isNaN(Number(localStorage.getItem("script_self_total_bs")))
        ) {
            return Number(localStorage.getItem("script_self_total_bs"));
        }

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://cartelempire.online/api/user?type=basic,BattleStats&key=${API_KEY}`,
                headers: {
                    "Content-Type": "application/json",
                },
                onload: function (response) {
                    const json = JSON.parse(response.response);
                    console.log(json);
                    let totalBS = json.strength + json.defence + json.agility + json.accuracy;
                    localStorage.setItem("script_self_id", json.userId);
                    localStorage.setItem("script_self_name", json.name);
                    localStorage.setItem("script_self_total_bs", totalBS);
                    localStorage.setItem("script_self_total_bs_timestamp", Date.now());
                    resolve(totalBS);
                },
                onerror: function (error) {
                    reject(error);
                },
            });
        });
    }

    function saveEstimateBS(logId, opponentId, opponentName, estimateBSString) {
        let map = null;
        if (localStorage.getItem("script_estimate_bs_list")) {
            map = new Map(JSON.parse(localStorage.getItem("script_estimate_bs_list")));
        } else {
            map = new Map();
        }
        let obj = map.get(opponentId);
        if (!obj) {
            obj = {};
            obj.playerId = opponentId;
            obj.playerName = opponentName;
            obj.logList = [];
            map.set(opponentId, obj);
        }
        obj.logList = []; // Curretly only keep one record
        let log = {};
        log.logId = logId;
        log.estimateBSString = estimateBSString;
        log.timestamp = Date.now();
        log.isLocalEstimate = true;
        obj.logList.push(log);
        localStorage.setItem("script_estimate_bs_list", JSON.stringify(Array.from(map.entries())));
        console.log(map);
    }

    function readEstimateBS(playerId) {
        let map = null;
        if (localStorage.getItem("script_estimate_bs_list")) {
            map = new Map(JSON.parse(localStorage.getItem("script_estimate_bs_list")));
        } else {
            return null;
        }
        console.log(map);
        return map.get(playerId);
    }

    function handleProfilePage(id) {
        console.log("[CartelTools] handleProfilePage");
        const checkElementExist = async () => {
            const selectedElem = document.querySelector(`div.header-section h2 svg`);
            if (selectedElem) {
                clearInterval(timer);
                const bsString = readEstimateBS(id);
                if (bsString && bsString.logList && bsString.logList[0]) {
                    selectedElem.parentElement.innerHTML += "&nbsp;&nbsp;估计总BS " + bsString.logList[0].estimateBSString;
                }

                const card = document.querySelector(`img.img-thumbnail`).parentElement.parentElement.parentElement;
                const div = document.createElement("div");
                const resultList = await fetchSESSpy(id);
                if (typeof resultList === "string") {
                    div.innerHTML = resultList;
                } else {
                    let html = "";
                    html += "从CEStats查询到 " + resultList.length + " 条记录";
                    html += `<table>
                                        <tr>
                                        <th>估计BS</th>
                                        <th>上传者</th>
                                        <th>上传时间</th>
                                        </tr>`;
                    for (const record of resultList) {
                        html += `<tr>`;
                        html += `
                                        <th>${record.bs}</th>
                                        <th>${record.reporterName} [${record.reporterId}]</th>
                                        <th>${new Date(Number(record.reportTimestamp)).toLocaleDateString()}</th>`;
                        html += `</tr>`;
                    }
                    html += `</table>`;
                    div.innerHTML = html;
                }
                div.setAttribute("class", "row");
                card.appendChild(div);
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }
})();
