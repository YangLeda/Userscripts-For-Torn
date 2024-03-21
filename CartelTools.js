// ==UserScript==
// @name         CartelTools
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  None.
// @author       BOT7420 [3094]
// @match        https://cartelempire.online/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(async function () {
    "use strict";

    let API_KEY = "XXXXXXXXXX"; // 填写自己的APIKey

    if (API_KEY && API_KEY !== "XXXXXXXXXX") {
        localStorage.setItem("script_api_key", API_KEY);
    } else if (localStorage.getItem("script_api_key")) {
        API_KEY = localStorage.getItem("script_api_key");
    } else {
        console.log("[CartelTools] No API Key!");
    }

    const currentURL = window.location.href;

    if (currentURL.includes("/Fight/")) {
        await handleFightLogPage();
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
                    //return;
                }
                const FFElem = document.querySelector(`div.card-body div`).querySelectorAll(`div.card-body div`)[1].querySelector(`span`);
                const FF = Number(FFElem.innerHTML.substring(1));
                let resultString = "Error";
                if (FF > 1 && FF < 3) {
                    let estimateBS = ((FF - 1) / 8) * 3 * selfTotalBS;
                    resultString = "估计对手总BS = " + estimateBS.toFixed(0);
                } else if (FF == 3) {
                    resultString = "估计对手总BS > " + (selfTotalBS * 0.75).toFixed(0);
                }
                FFElem.innerHTML += "<br>" + resultString;
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }

    function getSelfTotalBS() {
        if (localStorage.getItem("script_self_total_bs_timestamp") && Date.now() - Number(localStorage.getItem("script_self_total_bs_timestamp")) < 1800000) {
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
})();
