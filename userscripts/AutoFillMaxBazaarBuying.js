// ==UserScript==
// @name         Auto Fill Max Bazaar Buying
// @namespace    http://www.torn.com/
// @version      1.0
// @description  Use with TornTools's "fill max" button.
// @author       bot_7420 [2937420]
// @match        https://www.torn.com/bazaar.php*
// @grant        none
// @license MIT
// ==/UserScript==

(function() {
  "use strict";

  console.log("Auto Fill Max Bazaar Buying");

  const observer = new MutationObserver((mutationList) => {

    for (const mutation of mutationList) {
      for (const elem of mutation.addedNodes) {
        if (elem.classList && elem.classList.contains("tt-max-buy")) {
          console.log("Auto Fill Max Bazaar Buying: found fill max button");
          let clickEvent = new Event("click");
          elem.dispatchEvent(clickEvent);
        }
      }
    }
  });

  const timer = setInterval(() => {
    const targetElement = document.querySelector(".segment___WhZ5E.noPadding___pvSVH.itemsContainner___tVzIR");
    if (targetElement) {
      clearInterval(timer);
      console.log("Auto Fill Max Bazaar Buying: found observing element");
      observer.observe(targetElement, {
        subtree: true,
        childList: true,
      });
    }
  }, 100);

})();
