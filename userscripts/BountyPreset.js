// ==UserScript==
// @name         BountyPreset
// @namespace    torn
// @version      1.0.0
// @description  Fills in default bounty reward price.
// @author       bot_7420 [2937420]
// @license      GNU GPLv3
// @run-at       document-body
// @match        https://www.torn.com/bounties.php?p=add*
// ==/UserScript==

(function () {
  "use strict";

  const PRICE = 1; // Input bounty price here.

  const checkForInputElement = () => {
    const $inputDiv = $("div.add-bounties-wrap div.input-money-group");

    if ($inputDiv.length > 0) {
      console.log("BountyPreset: fill in price");
      const input = $inputDiv.find("input.input-money")[0];
      input.value = PRICE;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      setTimeout(checkForInputElement, 100);
    }
  };

  checkForInputElement();
})();
