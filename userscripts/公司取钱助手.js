// ==UserScript==
// @name         Company Vault Quick Money Inputs
// @namespace    http://www.torn.com/
// @version      1.0
// @description  Add buttons to set money withdraw amount. Auto fill in deposit value and focus on deposit button.
// @author       bot_7420 [2937420]
// @match        https://www.torn.com/companies.php
// @grant        none
// @license MIT
// ==/UserScript==

(function () {
  "use strict";

  const presetWithDrawValues = [500000, 1000000, 5000000, 10000000, 50000000, 100000000]; // Modify here to change preset withdraw values.

  let pageEle = null;
  let area = null;
  let leftInput = null;
  let rightInput = null;
  let rightButton = null;
  let balanceNum = 0;
  let pendingBalanceUpdate = null;

  const mainTimer = setInterval(() => {
    const currentArea = document.querySelector("div#funds");
    if (!currentArea || currentArea.style.display === "none") {
      // Page not loaded or the funds tab is not in display.
      pageEle = null;
      area = null;
      leftInput = null;
      rightInput = null;
      rightButton = null;
      removeButtons(currentArea);
      return;
    }

    const currentLeftInput = document.querySelector("div.funds-wrap.withdraw input.input-money");
    if (currentLeftInput && currentLeftInput !== leftInput) {
      // Elements appeared or changed.
      removeButtons(currentArea);
      pageEle = document.querySelectorAll("div.company-wrap");
      area = document.querySelector("div#funds");
      leftInput = document.querySelector("div.funds-wrap.withdraw input.input-money");
      rightInput = document.querySelector("div.funds-wrap.deposit input.input-money");
      rightButton = document.querySelector("div.funds-wrap.deposit button.torn-btn");
      addButtons();
      console.log("VaultInput: change balance after adding buttons to " + balanceNum);
      fillInput(rightInput, balanceNum);
      rightButton.focus({ focusVisible: true, preventScroll: true });
    }

    if (pendingBalanceUpdate != null) {
      console.log("VaultInput: change balance on pending update to " + pendingBalanceUpdate);
      fillInput(rightInput, pendingBalanceUpdate);
      rightButton.focus({ focusVisible: true, preventScroll: true });
      pendingBalanceUpdate = null;
    }
  }, 100);

  const balanceObserverConfig = { attributes: true, childList: true, subtree: true };
  const balanceObserver = new MutationObserver(() => {
    handleBalanceChange();
  });
  const balanceObserverTimer = setInterval(() => {
    const selectedElements = document.querySelectorAll("span#user-money");
    if (selectedElements.length > 0) {
      console.log("VaultInput: balanceObserver observe");
      clearInterval(balanceObserverTimer);
      handleBalanceChange();
      balanceObserver.observe(selectedElements[0], balanceObserverConfig);
    }
  }, 100);

  function handleBalanceChange() {
    const balance = document.querySelector("span#user-money");
    if (balance) {
      console.log("VaultInput: handleBalanceChange");
      balanceNum = balance.getAttribute("data-money");
      pendingBalanceUpdate = balance.getAttribute("data-money");
    }
  }

  const fillInput = (input, target) => {
    input.value = target.toString();
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  function addButtons() {
    console.log("VaultInput: addButtons");
    const text = document.createElement("span");
    text.innerHTML = "Withdraw value:&nbsp;&nbsp;&nbsp;&nbsp;";
    text.classList.add("scripted-btn");
    text.classList.add("m-top10");
    text.classList.add("bold");
    area.parentElement.insertBefore(text, area);

    for (const value of presetWithDrawValues) {
      const btn = document.createElement("button");
      btn.innerText = numberFormatter(value.toString());
      btn.classList.add("scripted-btn");
      btn.classList.add("torn-btn");
      btn.onclick = () => {
        fillInput(leftInput, value);
      };
      area.parentElement.insertBefore(btn, area);
    }
  }

  function removeButtons(area) {
    if (!area) {
      return;
    }
    let buttonsList = area.parentElement.querySelectorAll(".scripted-btn");
    if (buttonsList.length > 0) {
      console.log("VaultInput: removeButtons " + buttonsList.length);
    }
    for (const elem of buttonsList) {
      area.parentElement.removeChild(elem);
    }
  }

  function numberFormatter(num, digits = 1) {
    const lookup = [
      { value: 1, symbol: "" },
      { value: 1e3, symbol: "k" },
      { value: 1e6, symbol: "M" },
      { value: 1e9, symbol: "B" },
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup
      .slice()
      .reverse()
      .find(function (item) {
        return num >= item.value;
      });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
  }
})();
