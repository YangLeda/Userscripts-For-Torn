// ==UserScript==
// @name         SimCompanies-Torn
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  None
// @author       bot_7420
// @match        https://www.simcompanies.com/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-start
// ==/UserScript==

(function () {
    "use strict";

    let pageSpecifiedTimersList = [];

    let lastKnownURL = "";
    const mainCheckingURLLoop = () => {
        const currentURL = window.location.href;
        if (currentURL !== lastKnownURL) {
            handleURLChange(currentURL);
            lastKnownURL = currentURL;
        }
    };

    window.onload = () => {
        console.log("SimCompanies-Torn: onload");
        while (pageSpecifiedTimersList.length > 0) {
            clearInterval(pageSpecifiedTimersList.pop());
        }
        global_addCSS();
        global_addNavButtons();
        const currentURL = window.location.href;
        lastKnownURL = currentURL;
        handleURLChange(currentURL);
        setInterval(mainCheckingURLLoop, 1000);
    };

    function handleURLChange(currentURL) {
        console.log("SimCompanies-Torn: handleURLChange " + currentURL);
        while (pageSpecifiedTimersList.length > 0) {
            clearInterval(pageSpecifiedTimersList.pop());
        }
        if (currentURL.includes("/landscape/")) {
            handleLandscape();
        } else if (
            currentURL.includes("/warehouse/") &&
            currentURL !== "https://www.simcompanies.com/zh/headquarters/warehouse/" &&
            !currentURL.includes("/warehouse/incoming-contracts/") &&
            !currentURL.includes("/warehouse/outgoing-contracts/") &&
            !currentURL.includes("/warehouse/stats/") &&
            !currentURL.includes("/warehouse/research/")
        ) {
            handleWarehouseItem();
        }
    }

    function handleWarehouseItem() {
        console.log("SimCompanies-Torn: handleWarehouseItem");
        const checkElementExist = () => {
            const table = document.querySelector(`.css-1vwotq4.e12j7voa6`);
            const input = document.querySelector(`input[name="price"]`);
            if (table && input && !input.classList.contains("script_checked")) {
                console.log("SimCompanies-Torn: handleWarehouseItem check number");
                const exchangePrice = Number(table.querySelector("span.css-rnnx2x").nextSibling.nextSibling.textContent);
                let price = exchangePrice * 0.97;
                price = price.toFixed(3);
                input.classList.add("script_checked");

                let elem = document.createElement("a");
                let linkText = document.createTextNode("MP-3% = $" + price + " 点击复制到剪贴板");
                elem.appendChild(linkText);
                elem.onclick = () => {
                    console.log("SimCompanies-Torn: GM_setClipboard");
                    GM_setClipboard(price, "text");
                };
                input.parentNode.insertBefore(elem, input.nextSibling);
            }
        };
        const tempTimer = setInterval(checkElementExist, 500);
        pageSpecifiedTimersList.push(tempTimer);
    }

    function handleLandscape() {
        console.log("SimCompanies-Torn: handleLandscape");
        const checkElementExist = () => {
            if (document.getElementsByClassName("test-headquarters").length > 0) {
                clearInterval(timer);
                // 移除氪金加速建造按钮
                landscape_removeRush();
                // 高亮闲置建筑
                landscape_highlightIdleBuildings();
                const tempTimer = setInterval(landscape_highlightIdleBuildings, 2000);
                pageSpecifiedTimersList.push(tempTimer);
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }

    function landscape_removeRush() {
        console.log("SimCompanies-Torn: landscape_removeRush");
        const banners = document.querySelectorAll(".link-button.css-lgo4vi");
        for (const elm of banners) {
            elm.style.display = "none";
        }
    }

    function landscape_highlightIdleBuildings() {
        const buildingBlocks = document.querySelector(".css-fgicw8.e1addz3e6").querySelectorAll(`a[href*="/b/"]`);
        for (const building of buildingBlocks) {
            const namePlate = building.querySelector(`span.display-on-hover.css-de40ak.eofzx9a3`);
            if (namePlate.style.display === "block") {
                namePlate.querySelector(`span.css-11ivg5k`).style.background = "#FFC107";
            }
        }
    }

    function global_addCSS() {
        // 交易所 宽屏
        GM_addStyle(`
        .css-fbokx6 {
            width: 100% !important;
        }`);

        // 交易所 左右栏比例1:1
        GM_addStyle(`
        .col-sm-4 {
            width: 50% !important;
        }`);
        GM_addStyle(`
        .col-sm-8 {
            width: 50% !important;
        }`);

        // 交易所 左侧栏显示物品名称
        GM_addStyle(`
        .css-1luaoxw {
            display: block !important;
        }`);

        // 交易所 左侧栏减少空白
        GM_addStyle(`
        h4.css-0 {
            margin-top: 3px !important;
            margin-bottom: 3px !important;
        }`);
        GM_addStyle(`
        h4.css-o7rt0f {
            margin-top: 3px !important;
            margin-bottom: 3px !important;
        }`);

        // 交易所 隐藏最近访问栏
        GM_addStyle(`
        .css-1a75jih {
            display: none !important;
        }`);

        // 顶部自定义导航按钮样式
        GM_addStyle(`
        .script-nav-1 {
            margin-left: 50px;
            font-size: 18px;
            position: absolute;
            top: 50%;
            -ms-transform: translateY(-50%);
            transform: translateY(-50%);
            color: rgb(184,184,184);
        }`);
        GM_addStyle(`
        .script-nav-2 {
            margin-left: 100px;
            font-size: 18px;
            position: absolute;
            top: 50%;
            -ms-transform: translateY(-50%);
            transform: translateY(-50%);
            color: rgb(184,184,184);
        }`);
    }

    function global_addNavButtons() {
        const checkElementExist = () => {
            const selectedElems = document.querySelectorAll(".css-145d0e.e1kr4hqh1");
            if (selectedElems.length > 0) {
                clearInterval(timer);

                let a1 = document.createElement("a");
                let linkText1 = document.createTextNode("文库");
                a1.appendChild(linkText1);
                a1.onclick = () => {
                    let targetButton = document.querySelector(`a[aria-label="文库"]`);
                    if (!targetButton) {
                        document.querySelector(`.css-1ljhlhi`).click();
                        targetButton = document.querySelector(`a[aria-label="文库"]`);
                    }
                    targetButton.click();
                };
                a1.classList.add("script-nav-1");
                selectedElems[0].parentNode.insertBefore(a1, selectedElems[0].nextSibling);

                let a2 = document.createElement("a");
                let linkText2 = document.createTextNode("百科");
                a2.appendChild(linkText2);
                a2.onclick = () => {
                    let targetButton = document.querySelector(`a[aria-label="百科"]`);
                    if (!targetButton) {
                        document.querySelector(`.css-1ljhlhi`).click();
                        targetButton = document.querySelector(`a[aria-label="百科"]`);
                    }
                    targetButton.click();
                };
                a2.classList.add("script-nav-2");
                selectedElems[0].parentNode.insertBefore(a2, selectedElems[0].nextSibling);
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }

    // 交易所 高亮5件最近访问物品
    const recentExchangeItems = localStorage.getItem("recentlyVisitedExchangeResources");
})();
