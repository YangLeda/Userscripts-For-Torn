// ==UserScript==
// @name         SimCompanies-Torn
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  None
// @author       bot_7420
// @match        https://www.simcompanies.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function () {
    "use strict";

    // 交易所页面自定义输入价格
    const CustomExchangeInputPrices = [10, 100, 1000, 10000];

    let pageSpecifiedTimersList = [];
    let notesElement = null;

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
        } else if (currentURL.includes("/b/")) {
            handleCustomHourInput();
        } else if (currentURL.includes("/market/resource/")) {
            // 交易所 高亮6件最近访问物品
            handleExchangeHighlightRecent();
            // 交易所 自定义输入价格
            handleExchangeCustomInputPrices();
        }
    }

    function handleExchangeHighlightRecent() {
        const checkElementExist = () => {
            const selectedElems = document.querySelectorAll(`a.hover-effect.css-k8l72z`);
            if (selectedElems.length > 50) {
                const recentExchangeItemsString = localStorage.getItem("recentlyVisitedExchangeResources");
                const recentExchangeItems = JSON.parse(recentExchangeItemsString);
                for (const elem of selectedElems) {
                    elem.classList.remove("script-highlighted");
                }
                let markedNum = 0;
                for (const itemId of recentExchangeItems) {
                    if (markedNum < 6) {
                        markedNum++;
                        const target = document.querySelector(`div.css-hf83mx a.hover-effect.css-k8l72z[href*="/resource/${itemId}/"]`);
                        target.classList.add("script-highlighted");
                    }
                }
            }
        };
        const tempTimer = setInterval(checkElementExist, 1000);
        pageSpecifiedTimersList.push(tempTimer);
    }

    function handleExchangeCustomInputPrices() {
        const checkElementExist = () => {
            const selectedElem = document.querySelector(`input.css-1whp23o.form-control[name="quantity"]`);
            if (selectedElem) {
                clearInterval(timer);
                for (const price of CustomExchangeInputPrices) {
                    let a = document.createElement("a");
                    let linkText = document.createTextNode(" " + price + " ");
                    a.style.padding = "10px 5px";
                    a.appendChild(linkText);
                    a.onclick = () => {
                        setInput(selectedElem, price);
                    };
                    selectedElem.parentNode.parentNode.parentNode.appendChild(a);
                }
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }

    function setInput(inputNode, value) {
        let lastValue = inputNode.value;
        inputNode.value = value;
        let event = new Event("input", { bubbles: true });
        event.simulated = true;
        if (inputNode._valueTracker) inputNode._valueTracker.setValue(lastValue);
        inputNode.dispatchEvent(event);
    }

    function handleCustomHourInput() {
        const checkElementExist = () => {
            const selectedElems = document.querySelectorAll("h3 > svg");
            let isReady = selectedElems.length > 0;
            if (isReady) {
                selectedElems.forEach((node) => {
                    isReady = isReady && node?.parentElement?.parentElement?.querySelector("div > button")?.parentElement;
                });
            }
            if (isReady) {
                clearInterval(timer);
                selectedElems.forEach((node) => {
                    let targetNode = node.parentElement.parentElement.querySelector("div > button").parentElement;

                    let newNode = document.createElement("button");
                    newNode.className = "script_custom_hour_button";
                    Object.assign(newNode, { type: "button", role: "button" });
                    newNode.onclick = (e) => {
                        let target_node = e.target.parentElement.parentElement.querySelector("input");
                        let target_text = e.target.innerText;
                        target_node.click();
                        setInput(target_node, target_text);
                        e.preventDefault();
                    };
                    let commonClass = targetNode.querySelector("button").className;
                    newNode.className += ` ${commonClass}`;
                    newNode.innerText = "12hr";
                    targetNode.prepend(newNode);

                    let newNode2 = document.createElement("button");
                    newNode2.className = "script_custom_hour_button";
                    Object.assign(newNode2, { type: "button", role: "button" });
                    newNode2.onclick = (e) => {
                        let target_node = e.target.parentElement.parentElement.querySelector("input");
                        let target_text = e.target.innerText;
                        target_node.click();
                        setInput(target_node, target_text);
                        e.preventDefault();
                    };
                    let commonClass2 = targetNode.querySelector("button").className;
                    newNode2.className += ` ${commonClass2}`;
                    newNode2.innerText = "6hr";
                    targetNode.prepend(newNode2);
                });
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }

    function handleWarehouseItem() {
        const checkElementExist = () => {
            const table = document.querySelector(`.css-1vwotq4.e12j7voa6`);
            const input = document.querySelector(`input[name="price"]`);
            if (table && input && !input.classList.contains("script_checked")) {
                let exchangePrice = Number(table.querySelector("span.css-rnnx2x").nextSibling.nextSibling.textContent.replace(",", ""));
                let discountedPrice = exchangePrice * 0.97;
                exchangePrice = exchangePrice.toFixed(3);
                discountedPrice = discountedPrice.toFixed(3);
                input.classList.add("script_checked");

                let elem = document.createElement("a");
                let linkText = document.createTextNode("MP = $" + exchangePrice);
                elem.appendChild(linkText);
                elem.onclick = () => {
                    setInput(input, exchangePrice);
                };
                elem.style.display = "block";
                input.parentNode.insertBefore(elem, input.nextSibling);

                let elem2 = document.createElement("a");
                let linkText2 = document.createTextNode("MP-3% = $" + discountedPrice);
                elem2.appendChild(linkText2);
                elem2.onclick = () => {
                    setInput(input, discountedPrice);
                };
                elem2.style.display = "block";
                elem.parentNode.insertBefore(elem2, elem.nextSibling);

                if (document.querySelector(`h3.css-bi2xxi.e1bf4c272`).innerText === "收件方") {
                    setInput(input, discountedPrice);
                    elem2.style.background = "#FFC107";
                } else {
                    setInput(input, exchangePrice);
                    elem.style.background = "#FFC107";
                }
            }
        };
        const tempTimer = setInterval(checkElementExist, 500);
        pageSpecifiedTimersList.push(tempTimer);
    }

    function handleLandscape() {
        const checkElementExist = () => {
            if (document.getElementsByClassName("test-headquarters").length > 0) {
                clearInterval(timer);
                // 移除氪金加速建造按钮
                landscape_removeRush();
                // 高亮闲置建筑
                landscape_highlightIdleBuildings();
                const tempTimer = setInterval(landscape_highlightIdleBuildings, 2000);
                pageSpecifiedTimersList.push(tempTimer);
                // 移动收菜图标至右上角
                landscape_moveGatheringIcons();
                const tempTimer2 = setInterval(landscape_moveGatheringIcons, 2000);
                pageSpecifiedTimersList.push(tempTimer2);
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }

    function landscape_moveGatheringIcons() {
        const icons = document.querySelectorAll("img.css-hqao0z.ejaaut33");
        for (const icon of icons) {
            if (!icon.classList.contains("script_moved_to_top_right")) {
                icon.classList.add("script_moved_to_top_right");
            }
        }
    }

    function landscape_removeRush() {
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
        // 百科 宽屏
        GM_addStyle(`
        div.container.css-q9fi5t.ef8ljhx0 {
            width: 100% !important;
        }`);

        // 百科 左右栏比例1:1
        GM_addStyle(`
        div.container.css-q9fi5t.ef8ljhx0 .col-md-4 {
            width: 50% !important;
        }`);
        GM_addStyle(`
        div.container.css-q9fi5t.ef8ljhx0 .col-md-8 {
            width: 50% !important;
        }`);

        // 百科 左侧栏减少空白
        GM_addStyle(`
        div.css-1pbe8e5 div.col-xs-3.css-d2zl4q{
            width: 63px !important;
            padding-right: 2px !important;
            padding-left: 2px !important;
        }`);

        // 交易所 宽屏
        GM_addStyle(`
        .css-fbokx6 {
            width: 100% !important;
        }`);

        // 交易所 左右栏比例1:1
        GM_addStyle(`
        div.css-fbokx6.container .col-sm-4 {
            width: 50% !important;
        }`);
        GM_addStyle(`
        div.css-fbokx6.container .col-sm-8 {
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

        // 收菜图标移至右上角
        GM_addStyle(`
        .script_moved_to_top_right {
            position:fixed !important;
            top:6% !important;
            border:1px solid black !important;
        }`);

        // 聊天弹窗
        GM_addStyle(`
        .css-1tvnvpv {
            left: 5px !important;
            bottom: 5px !important;
            max-width: 300px !important;
            width: 100% !important;
            z-index: 300 !important;
        }`);
        GM_addStyle(`
        .css-lwisbd {
            height: 43px !important;
            margin-top: 2px !important;
        }`);
        GM_addStyle(`
        .chat-notifications .chat-notification img.logo {
            height: 33px !important;
            width: 33px !important;
        }`);

        // 高亮
        GM_addStyle(`
        .script-highlighted {
            background-color: #FFC107 !important;
        }`);

        // 记事本
        GM_addStyle(`
        .script-nav-3 {
            margin-left: 150px;
            font-size: 18px;
            position: absolute;
            top: 50%;
            -ms-transform: translateY(-50%);
            transform: translateY(-50%);
            color: rgb(184,184,184);
        }`);
        GM_addStyle(`
        textarea.script_notes {
            position:fixed;
            bottom:1%;
            right:1%;
            z-index: 200;
            font-size: 18px;
            background-color: #DCDCDC;
            max-width: 400px;
            max-height: 500px;
        }`);
    }

    function global_addNavButtons() {
        const checkElementExist = () => {
            if (document.querySelector(".css-145d0e.e1kr4hqh1")) {
                clearInterval(timer);
                setTimeout(function () {
                    const selectedElem = document.querySelector(".css-145d0e.e1kr4hqh1");
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
                    selectedElem.parentNode.insertBefore(a1, selectedElem.nextSibling);

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
                    selectedElem.parentNode.insertBefore(a2, selectedElem.nextSibling);

                    let a3 = document.createElement("a");
                    let linkText3 = document.createTextNode("[笔记]");
                    a3.appendChild(linkText3);
                    a3.onclick = () => {
                        handleNotes();
                    };
                    a3.classList.add("script-nav-3");
                    selectedElem.parentNode.insertBefore(a3, selectedElem.nextSibling);
                }, 500);
            }
        };
        let timer = setInterval(checkElementExist, 100);
    }

    function handleNotes() {
        if (!notesElement) {
            const notesString = localStorage.getItem("script_notes");
            notesElement = document.createElement("textarea");
            notesElement.classList.add("script_notes");
            notesElement.setAttribute("cols", "40");
            notesElement.setAttribute("rows", "10");
            notesElement.setAttribute("placeholder", "笔记内容本地保存，重要信息请另行备份");
            notesElement.style.display = "block";
            notesElement.innerHTML = notesString;
            notesElement.addEventListener(
                "input",
                () => {
                    localStorage.setItem("script_notes", notesElement.value);
                },
                false
            );
            document.body.appendChild(notesElement);
        } else if (notesElement.style.display === "none") {
            notesElement.style.display = "block";
        } else {
            notesElement.style.display = "none";
        }
    }
})();
