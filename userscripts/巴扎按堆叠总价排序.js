// ==UserScript==
// @name         巴扎增强 BazarEnhanced
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sorts bazar items by stack total value.
// @author       bot_7420 [2937420]
// @match        https://www.torn.com/bazaar.php?userId*
// @run-at       document-body
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

  initLocalStorage();

  // Hook fetch
  const { fetch: originalFetch } = unsafeWindow;
  unsafeWindow.fetch = async (...args) => {
    let [resource, config] = args;
    let response = await originalFetch(resource, config);
    const json = () =>
      response
        .clone()
        .json()
        .then((data) => {
          data = { ...data };
          if (response.url.indexOf("?sid=bazaarData") != -1 && data.list) {
            handleFetchHooked(data);
          }
          return data;
        });
    response.json = json;
    response.text = async () => JSON.stringify(await json());
    return response;
  };

  function handleFetchHooked(data) {
    console.log("BazarEnhanced: handleFetchHooked start=" + data.start + " item num=" + data.list.length);
    let isDescending = 1;
    if (localStorage.getItem("bazarEnhanced_isDescending") === "true") {
      isDescending = 1;
    } else if (localStorage.getItem("bazarEnhanced_isDescending") === "false") {
      isDescending = -1;
    }

    if (isDescending != 0) {
      let sortedList = data.list.sort((a, b) => {
        return parseInt(a.amount) * parseInt(a.price) > parseInt(b.amount) * parseInt(b.price) ? -1 * isDescending : 1 * isDescending;
      });
      data.list = sortedList;
    }

    return data;
  }

  const listObserverConfig = { attributes: false, childList: true, subtree: true };
  const listObserver = new MutationObserver(() => {
    handleListChange();
  });
  tryObserveList();

  function tryObserveList() {
    const selectedElement = document.body.querySelector("div.ReactVirtualized__Grid__innerScrollContainer");
    if (selectedElement) {
      console.log("BazarEnhanced: listObserver observe");
      listObserver.observe(selectedElement, listObserverConfig);
      handleListChange();
    } else {
      setTimeout(tryObserveList, 100);
    }
  }

  function tryAddControlBottons() {
    const selectedElement = document.body.querySelector("div.searchBar___jRttH");
    if (selectedElement) {
      console.log("BazarEnhanced: add control bttons");
      initLocalStorage();
      addControlBottons(selectedElement);
    } else {
      setTimeout(tryAddControlBottons, 100);
    }
  }
  tryAddControlBottons();

  // Control panel UI
  function addControlBottons(div) {
    let controlPanelDiv = document.createElement("div");
    controlPanelDiv.innerHTML += `
    <span>按堆叠总价排序： </span>
    <label><input type="radio" name="sortByStackTotalValue" value="none" id="sortByStackTotalValue-none"/>默认</label>
    <label><input type="radio" name="sortByStackTotalValue" value="true" id="sortByStackTotalValue-true"/>降序</label>
    <label><input type="radio" name="sortByStackTotalValue" value="fales" id="sortByStackTotalValue-fales"/>升序</label>
    `;

    if (localStorage.getItem("bazarEnhanced_isDescending") === "none") {
      controlPanelDiv.querySelector("input#sortByStackTotalValue-none").checked = true;
    } else if (localStorage.getItem("bazarEnhanced_isDescending") === "true") {
      controlPanelDiv.querySelector("input#sortByStackTotalValue-true").checked = true;
    } else if (localStorage.getItem("bazarEnhanced_isDescending") === "false") {
      controlPanelDiv.querySelector("input#sortByStackTotalValue-fales").checked = true;
    }

    controlPanelDiv.querySelector("input#sortByStackTotalValue-none").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("bazarEnhanced_isDescending", "none");
        location.reload();
      }
    });
    controlPanelDiv.querySelector("input#sortByStackTotalValue-true").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("bazarEnhanced_isDescending", "true");
        location.reload();
      }
    });
    controlPanelDiv.querySelector("input#sortByStackTotalValue-fales").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("bazarEnhanced_isDescending", "false");
        location.reload();
      }
    });

    div.after(controlPanelDiv);
  }

  function initLocalStorage() {
    if (!localStorage.getItem("bazarEnhanced_isDescending")) {
      localStorage.setItem("bazarEnhanced_isDescending", "true");
    }
  }

  function handleListChange() {
    //let list = document.body.querySelectorAll("div.ReactVirtualized__Grid__innerScrollContainer div.rowItems___Q0PRl");
  }
})();
