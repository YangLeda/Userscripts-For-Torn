// ==UserScript==
// @name         PokerMerit
// @namespace    torn
// @version      1.0.0
// @description  Move poker action buttons.
// @author       bot_7420 [2937420]
// @license      GNU GPLv3
// @run-at       document-start
// @match        https://www.torn.com/loader.php?sid=holdem
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  const config = { attributes: true, childList: true, subtree: true };
  const observer = new MutationObserver(() => {
    checkButtons();
  });
  let isObserving = 0;

  const checkForButtonsWrapper = () => {
    const selectedElements = document.querySelectorAll(
      "div.buttonsWrap___kNUd_"
    );
    if (selectedElements.length > 0 && isObserving == 0) {
      console.log("PokerMerit: observer observe");
      observer.observe(selectedElements[0], config);
      isObserving = 1;
      checkButtons();
    } else if (selectedElements.length == 0 && isObserving == 1) {
      console.log("PokerMerit: observer disconnect");
      observer.disconnect();
      isObserving = 0;
    }
  };
  let timer = setInterval(checkForButtonsWrapper, 100);

  function checkButtons() {
    const selectedElements = document.querySelectorAll(
      "div.buttonsWrap___kNUd_"
    );
    if (selectedElements.length <= 0) {
      console.error("PokerMerit: checkButtons can't find buttons wrapper");
      return;
    }
    const buttonsWrapper = selectedElements[0];

    for (const button of buttonsWrapper.children) {
      if (button.classList.contains("btn-scripted-move")) {
        continue;
      }
      const text = button.innerText.toLowerCase();

      /* Strategy below */
      if (text.includes("call $")) {
        if (
          button.classList.contains("queued___WttFA") ||
          button.classList.contains("pressed___d8ZBg")
        ) {
          restoreButton(button);
        } else {
          moveButton(button);
        }
        return;
      }

      if (text === "check") {
        if (
          button.classList.contains("queued___WttFA") ||
          button.classList.contains("pressed___d8ZBg")
        ) {
          restoreButton(button);
        } else {
          moveButton(button);
        }
        return;
      }
      /* Strategy above */
    }
  }

  function moveButton(button) {
    button.classList.add("btn-scripted-move");
    updateCSS(button);
    console.log("PokerMerit: move button");
  }

  function restoreButton(button) {
    if (button.classList.contains("btn-scripted-move")) {
      button.classList.remove("btn-scripted-move");
      console.log("PokerMerit: restore button");
    }
  }

  function updateCSS() {
    GM_addStyle(`button[class$="btn-scripted-move"] {
            position: fixed;
            top: 500px;
            width: 150px;
            height: 80px;
        }`);
  }
})();
