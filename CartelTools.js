// ==UserScript==
// @name         CartelTools
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  None.
// @author       BOT7420 [3094]
// @match        https://cartelempire.online/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(async function () {
    "use strict";

    let API_KEY = "XXXXXXXXXX"; // 这里改成自己的APIKey

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
        await handleFightLogPage();
    } else if (currentURL.includes("/user/")) {
        const urlSplit = currentURL.split("/");
        const id = urlSplit[urlSplit.length - 1];
        handleProfilePage(id);
    }

    async function handleFightLogPage() {
        console.log("[CartelTools] handleFightLogPage");
        const selfTotalBS = await getSelfTotalBS();
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

                saveEstimateBS(opponentId, opponentName, estimateBSString);
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }

    function getSelfTotalBS() {
        if (
            localStorage.getItem("script_self_total_bs_timestamp") &&
            Date.now() - Number(localStorage.getItem("script_self_total_bs_timestamp")) < 1800000 &&
            Number.isNaN(localStorage.getItem("script_self_total_bs"))
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

    function saveEstimateBS(opponentId, opponentName, estimateBSString) {
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
            obj.recordList = [];
            map.set(opponentId, obj);
        }
        obj.recordList = []; // Curretly only keep one record
        obj.recordList.push(estimateBSString);
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
        return map.get(playerId)?.recordList[0];
    }

    function handleProfilePage(id) {
        console.log("[CartelTools] handleProfilePage");
        const checkElementExist = () => {
            const selectedElem = document.querySelector(`div.header-section h2 svg`);
            if (selectedElem) {
                clearInterval(timer);
                const bsString = readEstimateBS(id);
                if (bsString) {
                    selectedElem.parentElement.innerHTML += "&nbsp;&nbsp;估计总BS " + bsString;
                }
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }
})();
