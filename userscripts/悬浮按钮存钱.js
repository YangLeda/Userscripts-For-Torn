// ==UserScript==
// @name         悬浮按钮存钱
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Spam click to secure money. Choose from PI vault, company vault, faction vault, and ghost trade.
// @author       bot_7420 [2937420]
// @match        https://www.torn.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM.xmlHttpRequest
// @connect      api.torn.com
// ==/UserScript==

(async function () {
  "use strict";

  let API_KEY = localStorage.getItem("APIKey");

  initLocalStorage();

  const piObserverConfig = { attributes: true, childList: true, subtree: true };
  const piObserver = new MutationObserver(() => {
    handleObservePi();
  });
  const companyObserverConfig = { attributes: true, childList: true, subtree: true };
  const companyObserver = new MutationObserver(() => {
    handleObserveCompany();
  });
  const tradeObserverConfig = { attributes: true, childList: true, subtree: true };
  const tradeObserver = new MutationObserver(() => {
    handleObserveTrade();
  });
  const balanceObserverConfig = { attributes: true, childList: true, subtree: true };
  const balanceObserver = new MutationObserver(() => {
    handleObserveBalance();
  });
  const factionObserverConfig = { attributes: true, childList: true, subtree: true };
  const factionObserver = new MutationObserver(() => {
    handleObserveFaction();
  });

  function tryObservePages() {
    const body = document.querySelector("body");
    if (body) {
      if (window.location.href.indexOf("properties.php") >= 0 && localStorage.getItem("spam_targetPage") === "pi") {
        const piObserverTimer = setInterval(() => {
          const selectedElements = document.querySelectorAll("div#properties-page-wrap");
          if (selectedElements.length > 0) {
            console.log("SpamSecureMoney: piObserver observe");
            clearInterval(piObserverTimer);
            piObserver.observe(selectedElements[0], piObserverConfig);
            handleObservePi();
          }
        }, 50);
      } else if (window.location.href.indexOf("companies.php") >= 0 && localStorage.getItem("spam_targetPage") === "company") {
        const companyObserverTimer = setInterval(() => {
          const selectedElements = document.querySelectorAll("div#funds");
          if (selectedElements.length > 0) {
            console.log("SpamSecureMoney: companyObserver observe");
            clearInterval(companyObserverTimer);
            companyObserver.observe(selectedElements[0], companyObserverConfig);
            handleObserveCompany();
          }
        }, 50);
      } else if (window.location.href.indexOf("tab=armoury") >= 0 && localStorage.getItem("spam_targetPage") === "faction") {
        const factionObserverTimer = setInterval(() => {
          const selectedElements = document.querySelectorAll("div#armoury-donate");
          if (selectedElements.length > 0) {
            console.log("SpamSecureMoney: factionObserver observe");
            clearInterval(factionObserverTimer);
            factionObserver.observe(selectedElements[0], factionObserverConfig);
            handleObserveFaction();
          }
        }, 50);
      } else if (window.location.href.indexOf("trade.php") >= 0 && localStorage.getItem("spam_targetPage") === "trade") {
        const tradeObserverTimer = setInterval(() => {
          let selectedElements = document.querySelectorAll("div#trade-container");
          if (selectedElements.length > 0) {
            console.log("SpamSecureMoney: tradeObserver observe");
            clearInterval(tradeObserverTimer);
            tradeObserver.observe(selectedElements[0], tradeObserverConfig);
            handleObserveTrade();
          }

          selectedElements = document.querySelectorAll("span#user-money");
          if (selectedElements.length > 0) {
            console.log("SpamSecureMoney: balanceObserver observe");
            balanceObserver.observe(selectedElements[0], balanceObserverConfig);
          }
        }, 50);
      }
    } else {
      setTimeout(tryObservePages, 50);
    }
  }
  tryObservePages();

  function handleObservePi() {
    let balance = 0;
    const balanceEle = document.querySelector("span#user-money");
    if (balanceEle) {
      balance = balanceEle.getAttribute("data-money");
    }

    const fillMoneyButton = document.querySelector("form.vault-cont.right.deposit-box div.input-money-group input.wai-btn");
    const depositButton = document.querySelector("form.vault-cont.right.deposit-box input.torn-btn");
    const depositDisabledButton = document.querySelector("form.vault-cont.right.deposit-box input.torn-btn.disabled");
    if (!depositButton) {
      return;
    }

    if (fillMoneyButton && depositDisabledButton && balance > 0) {
      if (!fillMoneyButton.classList.contains("scripted-moved")) {
        console.log("SpamSecureMoney: move fill max money button");
        fillMoneyButton.classList.add("scripted-moved");
      }
    } else if (!depositButton.classList.contains("scripted-moved")) {
      console.log("SpamSecureMoney: move PI deposit button");
      depositButton.classList.add("scripted-moved");
    }
  }

  function handleObserveCompany() {
    let balance = 0;
    const balanceEle = document.querySelector("span#user-money");
    if (balanceEle) {
      balance = balanceEle.getAttribute("data-money");
    }

    const fillMoneyButton = document.querySelector("div.funds-wrap.deposit div.input-money-group input.wai-btn");
    const depositButton = document.querySelector("div.funds-wrap.deposit button.torn-btn");
    const depositDisabledButton = document.querySelector("div.funds-wrap.deposit button.torn-btn.disabled");
    if (!depositButton) {
      return;
    }

    if (fillMoneyButton && depositDisabledButton && balance > 0) {
      if (!fillMoneyButton.classList.contains("scripted-moved")) {
        console.log("SpamSecureMoney: move fill max money button");
        fillMoneyButton.classList.add("scripted-moved");
      }
    } else if (!depositButton.classList.contains("scripted-moved")) {
      console.log("SpamSecureMoney: move company deposit button");
      depositButton.classList.add("scripted-moved");
    }
  }

  function handleObserveTrade() {
    let balance = 0;
    const balanceEle = document.querySelector("span#user-money");
    if (balanceEle) {
      balance = balanceEle.getAttribute("data-money");
    }

    // Check if has existing trade with the same player.
    let hasSameTrade = false;
    let sameTradeDetailButton = null;

    let userIdIndex = window.location.href.indexOf("userID=");
    if (userIdIndex > -1) {
      let userId = window.location.href.substring(userIdIndex + 7);
      const existingTradesListElm = document.querySelector("ul.trades-cont.current");
      if (existingTradesListElm) {
        for (const li of existingTradesListElm.children) {
          const viewElem = li.querySelector("div.view a");
          const nameElem = li.querySelector("div.name a");
          if (nameElem && nameElem.getAttribute("href").indexOf(userId) > -1) {
            hasSameTrade = true;
            sameTradeDetailButton = viewElem;
            break;
          }
        }
      }
    }

    const textArea = document.querySelector("textarea#description");
    const initiateTradeButton = document.querySelector("div.init-trade input.torn-btn");
    const plusButton = document.querySelector("div.trade-cont div.user.left div.add a");
    const fillMoneyButton = document.querySelector("div.init-trade.add-money div.input-money-group input.wai-btn");
    const changeMoneyButton = document.querySelector("div.init-trade.add-money span.btn-wrap input.torn-btn");

    if (initiateTradeButton && textArea) {
      if (hasSameTrade && balance > 0) {
        // Step 1 initiate trade - Condition 1: Has existing trade with this player.
        console.log("SpamSecureMoney: trade already exist");
        if (sameTradeDetailButton && !sameTradeDetailButton.classList.contains("scripted-moved")) {
          console.log("SpamSecureMoney: move view existing trade");
          sameTradeDetailButton.classList.add("scripted-moved");
        }
      } else {
        // Step 1 initiate trade - Condition 2: No existing trade with this player.
        if (!textArea.value) {
          console.log("SpamSecureMoney: edit trade textArea");
          textArea.value = "Ghost Trade";
          textArea.dispatchEvent(new Event("keyup"), { bubbles: true });
        }
        if (!initiateTradeButton.classList.contains("scripted-moved")) {
          console.log("SpamSecureMoney: move initiate trade button");
          initiateTradeButton.classList.add("scripted-moved");
        }
      }
    } else if (plusButton && balance > 0) {
      // Step 2 plus button add money to trade
      if (!plusButton.classList.contains("scripted-moved")) {
        console.log("SpamSecureMoney: move plus button");
        plusButton.classList.add("scripted-moved");
      }
    } else if (fillMoneyButton && !fillMoneyButton.classList.contains("scripted-maxed")) {
      // Step 3-1 fill max money
      fillMoneyButton.onclick = function () {
        console.log("SpamSecureMoney: max button clicked");
        if (!this.classList.contains("scripted-maxed")) {
          this.classList.add("scripted-maxed");
        }
      };
      if (!fillMoneyButton.classList.contains("scripted-moved")) {
        console.log("SpamSecureMoney: move fill max money button");
        fillMoneyButton.classList.add("scripted-moved");
      }
    } else if (fillMoneyButton && fillMoneyButton.classList.contains("scripted-maxed") && changeMoneyButton) {
      // Step 3-2 change money
      if (!changeMoneyButton.classList.contains("scripted-moved")) {
        console.log("SpamSecureMoney: move fill max money button");
        changeMoneyButton.classList.add("scripted-moved");
      }
    }
  }

  function handleObserveBalance() {
    console.log("SpamSecureMoney: handleObserveBalance");
    handleObserveTrade();
  }

  function handleObserveFaction() {
    let balance = 0;
    const balanceEle = document.querySelector("span#user-money");
    if (balanceEle) {
      balance = balanceEle.getAttribute("data-money");
    }

    const fillMoneyButton = document.querySelector("div#armoury-donate div.input-money-group input.wai-btn");
    const depositButton = document.querySelector("div#armoury-donate div.cash button.torn-btn");
    const depositDisabledButton = document.querySelector("div#armoury-donate div.cash button.torn-btn.disabled");
    const confirmButton = document.querySelector("div#armoury-donate div.cash-confirm a.yes");
    if (!depositButton) {
      return;
    }
    if (confirmButton.style.display !== "none") {
      if (!confirmButton.classList.contains("scripted-moved")) {
        console.log("SpamSecureMoney: move confirm button");
        confirmButton.classList.add("scripted-moved");
      }
    }
    if (fillMoneyButton && depositDisabledButton && balance > 0) {
      if (!fillMoneyButton.classList.contains("scripted-moved")) {
        console.log("SpamSecureMoney: move fill max money button");
        fillMoneyButton.classList.add("scripted-moved");
      }
    } else if (!depositButton.classList.contains("scripted-moved")) {
      console.log("SpamSecureMoney: move faction deposit button");
      depositButton.classList.add("scripted-moved");
    }
  }

  function tryAddControlPanel() {
    const selectedElement = document.querySelector("body");
    if (selectedElement) {
      addControlPanel(selectedElement);
    } else {
      setTimeout(tryAddControlPanel, 50);
    }
  }
  tryAddControlPanel();

  function addControlPanel(parentEle) {
    console.log("SpamSecureMoney: addControlPanel");
    if (
      (window.location.href.indexOf("properties.php") >= 0 && localStorage.getItem("spam_targetPage") !== "pi") ||
      (window.location.href.indexOf("companies.php") >= 0 && localStorage.getItem("spam_targetPage") !== "company") ||
      (window.location.href.indexOf("trade.php") >= 0 && localStorage.getItem("spam_targetPage") !== "trade") ||
      (window.location.href.indexOf("tab=armoury") >= 0 && localStorage.getItem("spam_targetPage") !== "faction") ||
      (window.location.href.indexOf("properties.php") < 0 && window.location.href.indexOf("companies.php") < 0 && window.location.href.indexOf("trade.php") < 0 && window.location.href.indexOf("tab=armoury") < 0)
    ) {
      addLinkBtn();
    }

    const backgroundColor = document.body.classList.contains("dark-mode") ? "#505050" : "#B0B0B0";
    const placeHolderDiv = document.createElement("div");
    placeHolderDiv.id = "scripted-placeholder-div";
    placeHolderDiv.classList.add("scripted-placeholder");
    placeHolderDiv.style.background = backgroundColor;
    parentEle.insertBefore(placeHolderDiv, parentEle.firstChild);

    const controlPanelDiv = document.createElement("div");
    controlPanelDiv.id = "scripted-control-div";
    controlPanelDiv.classList.add("scripted-control");
    placeHolderDiv.append(controlPanelDiv);

    controlPanelDiv.innerHTML += `
      <span>悬浮存钱: </span><br>
      <label><input type="radio" name="spam_isEnabled" value="true" id="spam-isEnabled-true"/>启用</label><br>
      <label><input type="radio" name="spam_isEnabled" value="false" id="spam-isEnabled-false"/>禁用</label><br>
      <br>
      <div id="spam-all-setting-div">
        <span>存至： </span><br>
        <label><input type="radio" name="spam_targetPage" value="pi" id="spam-targetPage-pi"/>PI</label><br>
        <label><input type="radio" name="spam_targetPage" value="company" id="spam-targetPage-company"/>Company</label><br>
        <label><input type="radio" name="spam_targetPage" value="faction" id="spam-targetPage-faction"/>Faction</label><br>
        <label><input type="radio" name="spam_targetPage" value="trade" id="spam-targetPage-trade"/>Ghost Trade</label><br>
        <br>
        <div id="spam-trade-settings-div">
          <span class="tooltip">交易对象：<span class="tooltiptext">每行一个ID，<br>仅纯数字，<br>优先级从上到下</span></span><br>
          <textarea rows="3" cols="10" name="spam_tradeTarget" placeholder="" value="" id="spam-tradeTarget-text"></textarea><br>
          <br>
          <span class="tooltip">检查最近在线： <span class="tooltiptext">检查最近6小时是否在线，</br>需要时间访问API，</br>API无法访问时选择否</span></span><br>
          <label><input type="radio" name="spam_isCheckRecentOnline" value="true" id="spam-isCheckRecentOnline-true"/>是</label><br>
          <label><input type="radio" name="spam_isCheckRecentOnline" value="false" id="spam-isCheckRecentOnline-false"/>否</label><br>
          <br>
        </div>
      </div>
      `;

    // Add event listeners
    controlPanelDiv.querySelector("input#spam-isEnabled-true").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("spam_isEnabled", "true");
        controlPanelDiv.querySelector("div#spam-all-setting-div").style.display = "block";
        const selectedElement = document.querySelector("button#scripted-link-btn");
        if (selectedElement) {
          selectedElement.style.display = "block";
        }
      }
    });
    controlPanelDiv.querySelector("input#spam-isEnabled-false").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("spam_isEnabled", "false");
        controlPanelDiv.querySelector("div#spam-all-setting-div").style.display = "none";
        const selectedElement = document.querySelector("button#scripted-link-btn");
        if (selectedElement) {
          selectedElement.style.display = "none";
        }
      }
    });

    controlPanelDiv.querySelector("input#spam-targetPage-pi").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("spam_targetPage", "pi");
        controlPanelDiv.querySelector("div#spam-trade-settings-div").style.display = "none";
        location.reload();
      }
    });
    controlPanelDiv.querySelector("input#spam-targetPage-company").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("spam_targetPage", "company");
        controlPanelDiv.querySelector("div#spam-trade-settings-div").style.display = "none";
        location.reload();
      }
    });
    controlPanelDiv.querySelector("input#spam-targetPage-faction").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("spam_targetPage", "faction");
        controlPanelDiv.querySelector("div#spam-trade-settings-div").style.display = "none";
        location.reload();
      }
    });
    controlPanelDiv.querySelector("input#spam-targetPage-trade").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("spam_targetPage", "trade");
        controlPanelDiv.querySelector("div#spam-trade-settings-div").style.display = "block";
        location.reload();
      }
    });

    controlPanelDiv.querySelector("textarea#spam-tradeTarget-text").addEventListener("input", (event) => {
      if (event.target.value) {
        localStorage.setItem("spam_tradeTarget", event.target.value);
      }
    });

    controlPanelDiv.querySelector("input#spam-isCheckRecentOnline-true").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("spam_isCheckRecentOnline", "true");
      }
    });
    controlPanelDiv.querySelector("input#spam-isCheckRecentOnline-false").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("spam_isCheckRecentOnline", "false");
      }
    });

    // Set init status
    if (localStorage.getItem("spam_isEnabled") === "true") {
      controlPanelDiv.querySelector("input#spam-isEnabled-true").checked = true;
      controlPanelDiv.querySelector("div#spam-all-setting-div").style.display = "block";
      const selectedElement = document.querySelector("button#scripted-link-btn");
      if (selectedElement) {
        selectedElement.style.display = "block";
      }
    } else if (localStorage.getItem("spam_isEnabled") === "false") {
      controlPanelDiv.querySelector("input#spam-isEnabled-false").checked = true;
      controlPanelDiv.querySelector("div#spam-all-setting-div").style.display = "none";
      const selectedElement = document.querySelector("button#scripted-link-btn");
      if (selectedElement) {
        selectedElement.style.display = "none";
      }
    }

    if (localStorage.getItem("spam_targetPage") === "pi") {
      controlPanelDiv.querySelector("input#spam-targetPage-pi").checked = true;
      controlPanelDiv.querySelector("div#spam-trade-settings-div").style.display = "none";
    } else if (localStorage.getItem("spam_targetPage") === "company") {
      controlPanelDiv.querySelector("input#spam-targetPage-company").checked = true;
      controlPanelDiv.querySelector("div#spam-trade-settings-div").style.display = "none";
    } else if (localStorage.getItem("spam_targetPage") === "faction") {
      controlPanelDiv.querySelector("input#spam-targetPage-faction").checked = true;
      controlPanelDiv.querySelector("div#spam-trade-settings-div").style.display = "none";
    } else if (localStorage.getItem("spam_targetPage") === "trade") {
      controlPanelDiv.querySelector("input#spam-targetPage-trade").checked = true;
      controlPanelDiv.querySelector("div#spam-trade-settings-div").style.display = "block";
    }

    controlPanelDiv.querySelector("textarea#spam-tradeTarget-text").value = localStorage.getItem("spam_tradeTarget");

    if (localStorage.getItem("spam_isCheckRecentOnline") === "true") {
      controlPanelDiv.querySelector("input#spam-isCheckRecentOnline-true").checked = true;
    } else if (localStorage.getItem("spam_isCheckRecentOnline") === "false") {
      controlPanelDiv.querySelector("input#spam-isCheckRecentOnline-false").checked = true;
    }

    // Add custom style for moved elements
    GM_addStyle(`
        .scripted-placeholder {
          position: fixed;
          top: 20%;
          left: 0;
          margin: 0px;
          z-index: 1000;
        }
        .scripted-control {
          margin-top: 55px;
          width: 100px;
          fontSize: 10px;
          z-index: 1000;
        }
        .scripted-moved {
            position: fixed !important;
            top: 20% !important;
            left: 0 !important;
            width: 100px !important;
            height: 50px !important;
            margin: 0px !important;
            z-index: 1000 !important;
            border: 2px solid !important;
            border-color: red !important;
        }
        .scripted-moved-noborder {
          position: fixed !important;
          top: 20% !important;
          left: 0 !important;
          width: 100px !important;
          height: 50px !important;
          margin: 0px !important;
          z-index: 1000 !important;
          border: none !important;
        }
        .tooltip {
          position: relative;
          display: inline-block;
        }
        .tooltip .tooltiptext {
          visibility: hidden;
          color: #fff;
          width: 150px;
          background-color: black;
          text-align: center;
          border-radius: 6px;
          padding: 5px 0;
          position: absolute;
          z-index: 1;
          opacity: 0.6;
        }
        .tooltip:hover .tooltiptext {
          visibility: visible;
        }
      `);
  }

  function addLinkBtn() {
    console.log("SpamSecureMoney: addLinkBtn");
    const btn = document.createElement("button");
    btn.id = "scripted-link-btn";
    btn.innerText = "存钱";
    btn.classList.add("scripted-moved-noborder");
    btn.style.fontSize = "20px";
    btn.style.background = "#006400";
    btn.onclick = async () => {
      const selectedElement = document.querySelector("button#scripted-link-btn");
      if (selectedElement) {
        selectedElement.disabled = true;
        btn.innerText = "跳转中";
        selectedElement.style.background = "#696969";
      }

      let targetUrl = null;
      if (localStorage.getItem("spam_targetPage") === "pi") {
        targetUrl = "https://www.torn.com/properties.php#/p=options&tab=vault";
      } else if (localStorage.getItem("spam_targetPage") === "company") {
        targetUrl = "https://www.torn.com/companies.php#/option=funds";
      } else if (localStorage.getItem("spam_targetPage") === "faction") {
        targetUrl = "https://www.torn.com/factions.php?step=your#/tab=armoury";
      } else if (localStorage.getItem("spam_targetPage") === "trade") {
        targetUrl = "https://www.torn.com/trade.php#step=start&userID=" + (await getValidTradeTargetId());
      }

      window.location.href = targetUrl;
    };
    document.body.insertBefore(btn, document.body.firstChild);
  }

  async function getValidTradeTargetId() {
    const text = localStorage.getItem("spam_tradeTarget");
    let idList = text.split(/\r?\n/);
    if (idList.length === 0) {
      console.log("SpamSecureMoney: getValidTradeTargetId no id input");
      return "";
    }
    for (const id of idList) {
      console.log("SpamSecureMoney: id = [" + id + "]");
      if (await isRecentOnline(id)) {
        console.log("SpamSecureMoney: getValidTradeTargetId " + id);
        return id;
      }
    }
    console.log("SpamSecureMoney: getValidTradeTargetId no id is recently online");
    return "";
  }

  async function isRecentOnline(id) {
    if (localStorage.getItem("spam_isCheckRecentOnline") !== "true") {
      return true;
    }
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        url: `https://api.torn.com/user/${id}?selections=&key=${API_KEY}`,
        method: "POST",
        synchronous: true,
        onload: (response) => {
          if (response.status == 200) {
            const body = JSON.parse(response.responseText);
            const lastActionTimeStamp = body.last_action.timestamp;
            const timestamp = currentTimestamp - lastActionTimeStamp;
            resolve(timestamp <= 21000 ? true : false);
          } else {
            console.error("SpamSecureMoney: isRecentOnline API fetch onload with HTTP status " + response.status);
            resolve(false);
          }
        },
        onabort: () => {
          console.error("SpamSecureMoney: isRecentOnline API fetch onabort");
          resolve(false);
        },
        onerror: () => {
          console.error("SpamSecureMoney: isRecentOnline API fetch onerror");
          resolve(false);
        },
        ontimeout: () => {
          console.error("SpamSecureMoney: isRecentOnline API fetch ontimeout");
          resolve(false);
        },
      });
    });
  }

  function initLocalStorage() {
    if (!localStorage.getItem("spam_isEnabled")) {
      localStorage.setItem("spam_isEnabled", "true");
    }
    if (!localStorage.getItem("spam_targetPage")) {
      localStorage.setItem("spam_targetPage", "trade");
    }
    if (!localStorage.getItem("spam_tradeTarget")) {
      localStorage.setItem("spam_tradeTarget", "");
    }
    if (!localStorage.getItem("spam_isCheckRecentOnline")) {
      localStorage.setItem("spam_isCheckRecentOnline", "false");
    }
  }
})();
