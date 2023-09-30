// ==UserScript==
// @name         ItemMarketPin
// @namespace    http://www.torn.com/
// @version      1.0
// @description  Pin specific categories in Item Market to top.
// @author       bot_7420 [2937420]
// @match        https://www.torn.com/imarket.php
// @run-at       document-end
// @grant        none
// @license MIT
// ==/UserScript==

(function () {
  "use strict";

  const pinMap = new Map([
    ["supply-packs", 1],
    ["special-items", 2],
    ["drugs", 3],
    ["other-boosters", 4],
    ["flowers", 5],
    ["plushies", 6],
  ]);

  let $list = [];
  let $items = [];

  const timer = setInterval(() => {
    $list = $("ul.market-tabs");
    $items = $("ul.market-tabs li");

    if ($list.length > 0 && $items.length > 0) {
      clearInterval(timer);
      console.log("ItemMarketPin: Found elements " + $list.length + " " + $items.length);
      prepareList();
    } else {
      console.log("ItemMarketPin: Looking for elements");
    }
  }, 500);

  function prepareList() {
    $list.css({ display: "flex", "flex-direction": "column" });

    $items.each(function () {
      let orderNum = pinMap.get($(this).attr("data-cat"));
      if (!orderNum) {
        orderNum = 100;
      }
      console.log("ItemMarketPin: order" + orderNum);
      $(this).attr("style", "order: " + orderNum);
    });
  }
})();
