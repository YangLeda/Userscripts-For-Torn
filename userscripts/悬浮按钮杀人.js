// ==UserScript==
// @name         一键杀人 GoCrazy
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Spam click to finish the fight, even when enemy is in hospital or travelling.
// @author       bot_7420 [2937420]
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  const SCRIPTED_MOVE_CLASSNAME = "scripted-move";
  const removeQueryList = ["div#tt-page-status", "div#header-root", "div.log___HL_LJ", "div#chatRoot"];
  const removeQueryListAgressive = [
    "div#tt-page-status",
    "div#header-root",
    "div#chatRoot",
    "div.backdrops-container",
    "a.wai",
    "div.logStatsWrap___ujaj_",
    "noscript",
    "div.appHeaderWrapper___uyPti",
    "div.log___HL_LJ",
    "div#lower-layer",
    "div.allLayers___cXY5i",
    "div.stealthBarWrap___FOWTF",
    "div.d.cookie-notif-panel",
  ];

  /* Remove unnecessary elements */
  let bodyElement = null;
  let removeTargets = [];

  // Observe body element.
  const bodyObserverConfig = { attributes: false, childList: true, subtree: true };
  const bodyObserver = new MutationObserver(() => {
    handleBodyChange();
  });
  tryObserveBody();

  function tryObserveBody() {
    const selectedElement = document.querySelector("body");
    if (selectedElement) {
      // inits
      initLocalStorage();
      updateStyleSheets();
      console.log("GoCrazy: bodyObserver observe");
      bodyElement = selectedElement;
      bodyObserver.observe(selectedElement, bodyObserverConfig);
      handleBodyChange();
    } else {
      setTimeout(tryObserveBody, 20);
    }
  }

  function handleBodyChange() {
    if (localStorage.getItem("goCrazy_pageStyle") === "0") {
      removeTargets = removeQueryListAgressive;
    } else if (localStorage.getItem("goCrazy_pageStyle") === "1") {
      removeTargets = removeQueryListAgressive;
    } else if (localStorage.getItem("goCrazy_pageStyle") === "2") {
      removeTargets = removeQueryList;
    }

    // Remove elements.
    let failedQueryList = [];
    let selectedElements = null;
    for (const query of removeTargets) {
      selectedElements = bodyElement.querySelectorAll(query);
      if (selectedElements.length > 0) {
        for (const ele of selectedElements) {
          ele.remove();
        }
      } else {
        failedQueryList.push(query);
      }
    }
    removeTargets = failedQueryList;

    // Disconnect bodyObserver when all elements are removed.
    if (removeTargets.length === 0) {
      console.log("GoCrazy: bodyObserver disconnect");
      bodyObserver.disconnect();
    }
  }

  function updateStyleSheets() {
    // Remove existing style sheets.
    if (localStorage.getItem("goCrazy_pageStyle") === "0") {
      const styleSheets = document.styleSheets;
      for (const style of styleSheets) {
        style.disabled = true;
      }
    }

    // Create placeholder div at top.
    const div = document.createElement("div");
    div.id = "scripted-top-div";
    div.style.width = "800px";
    div.style.height = "100px";
    document.body.insertBefore(div, document.body.firstChild);

    // Create control panel div at top.
    const controlPanelDiv = document.createElement("div");
    controlPanelDiv.id = "scripted-control-div";
    controlPanelDiv.style.width = "390px";
    controlPanelDiv.style.height = "90px";
    controlPanelDiv.style.marginLeft = "410px";
    controlPanelDiv.style.fontSize = "10px";
    controlPanelDiv.style.padding = "5px";
    div.insertBefore(controlPanelDiv, div.firstChild);
    createControlPanel(controlPanelDiv);

    // Add custom style for moved elements
    GM_addStyle(`
      .scripted-move {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 400px !important;
          height: 100px !important;
          margin: 0px !important;
          border: 5px solid red !important;
          z-index: 1000 !important;
      }
      .scripted-move-disabled {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 400px !important;
        height: 100px !important;
        margin: 0px !important;
        border: none !important;
        z-index: 1000 !important;
    }
    `);
  }

  /* Add a refresh button when enemy is in hospital. */
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
          if (response.url.indexOf("?sid=attackData") != -1) {
            if (data.DB.error?.includes("in hospital") || data.DB.error?.includes("in another country")) {
              if (localStorage.getItem("goCrazy_useAttackInHosp") === "true") {
                if (data.DB.error?.includes("in hospital")) {
                  data.DB.defenderUser.playername += " [In Hospital]";
                  delete data.DB.error;
                  delete data.startErrorTitle;
                } else if (data.DB.error?.includes("in another country")) {
                  data.DB.defenderUser.playername += " [Travelling]";
                  delete data.DB.error;
                  delete data.startErrorTitle;
                }
              } else {
                addRefreshBtn();
              }
            }
          }
          return data;
        });
    response.json = json;
    response.text = async () => JSON.stringify(await json());
    return response;
  };

  function addRefreshBtn() {
    console.log("GoCrazy: addRefreshBtn");
    const btn = document.createElement("button");
    btn.id = "scripted-refresh-btn";
    btn.innerText = "刷新";
    btn.classList.add(SCRIPTED_MOVE_CLASSNAME);
    btn.style.fontSize = "30px";
    btn.style.background = "#c30";
    btn.onclick = () => {
      const selectedElement = document.querySelector("button#scripted-refresh-btn");
      if (selectedElement) {
        selectedElement.disabled = true;
        btn.innerText = "刷新中";
        selectedElement.style.background = "#5dbea3";
        selectedElement.classList.remove(SCRIPTED_MOVE_CLASSNAME);
        selectedElement.classList.add("scripted-move-disabled");
        location.reload();
      }
    };
    document.body.insertBefore(btn, document.body.firstChild);
  }

  /* Sequence move fighting action buttons */
  const areaObserverConfig = { attributes: true, childList: true, subtree: true };
  const areaObserver = new MutationObserver(() => {
    handleAreaChange();
  });
  tryObserveArea();

  function tryObserveArea() {
    const area = document.querySelector("div.players___WPQ05");
    if (area) {
      console.log("GoCrazy: areaObserver observe");
      areaObserver.observe(area, areaObserverConfig);
      handleAreaChange();
    } else {
      setTimeout(tryObserveArea, 100);
    }
  }

  function handleAreaChange() {
    const scriptedRefreshButton = document.querySelector("button#scripted-refresh-btn");
    if (scriptedRefreshButton) {
      return;
    }

    const weaponsWrapper = document.querySelector("div#attacker div.weaponList___raakm");
    const primaryWeapon = weaponsWrapper.querySelector("div#weapon_main img");
    const meleeWeapon = weaponsWrapper.querySelector("div#weapon_melee img");
    const tempWeapon = weaponsWrapper.querySelector("div#weapon_temp img");
    let isOutOfFight = false;

    // Move start and end fight buttons
    const buttonsWrapper = document.querySelector("div#defender div.dialogButtons___nX4Bz");
    if (buttonsWrapper) {
      for (const button of buttonsWrapper.children) {
        const innerText = button.innerText.toLowerCase();
        if (innerText.includes("start fight")) {
          if (!button.classList.contains(SCRIPTED_MOVE_CLASSNAME)) {
            console.log("GoCrazy: move start");
            button.classList.add(SCRIPTED_MOVE_CLASSNAME);
          }
          isOutOfFight = true;
        } else if (innerText.includes(localStorage.getItem("goCrazy_leaveChoice"))) {
          if (!button.classList.contains(SCRIPTED_MOVE_CLASSNAME)) {
            console.log("GoCrazy: move choice " + localStorage.getItem("goCrazy_leaveChoice"));
            button.classList.add(SCRIPTED_MOVE_CLASSNAME);
          }
          isOutOfFight = true;
        } else if (innerText.includes("continue")) {
          if (!button.classList.contains(SCRIPTED_MOVE_CLASSNAME)) {
            console.log("GoCrazy: move continue");
            button.classList.add(SCRIPTED_MOVE_CLASSNAME);
            button.onclick = () => {
              button.disabled = true;
            };
          }
          isOutOfFight = true;
        }
      }
    }
    if (document.querySelector("div#defender div.preloader___xhmsX")) {
      isOutOfFight = true;
    }

    if (isOutOfFight) {
      if (weaponsWrapper && primaryWeapon && meleeWeapon && tempWeapon) {
        if (tempWeapon.classList.contains(SCRIPTED_MOVE_CLASSNAME)) {
          tempWeapon.classList.remove(SCRIPTED_MOVE_CLASSNAME);
        }
        if (primaryWeapon.classList.contains(SCRIPTED_MOVE_CLASSNAME)) {
          primaryWeapon.classList.remove(SCRIPTED_MOVE_CLASSNAME);
        }
        if (meleeWeapon.classList.contains(SCRIPTED_MOVE_CLASSNAME)) {
          meleeWeapon.classList.remove(SCRIPTED_MOVE_CLASSNAME);
        }
      }
      return;
    }

    // Move weapon buttons
    if (!(weaponsWrapper && primaryWeapon && meleeWeapon && tempWeapon)) {
      return;
    }
    if (localStorage.getItem("goCrazy_useTempWeapon") === "true" && hasTempAmmo()) {
      if (!tempWeapon.classList.contains(SCRIPTED_MOVE_CLASSNAME)) {
        console.log("GoCrazy: move tempWeapon");
        tempWeapon.classList.add(SCRIPTED_MOVE_CLASSNAME);
        primaryWeapon.classList.remove(SCRIPTED_MOVE_CLASSNAME);
        meleeWeapon.classList.remove(SCRIPTED_MOVE_CLASSNAME);
      }
    } else if (localStorage.getItem("goCrazy_useMeleeWeapon") === "true" || (localStorage.getItem("goCrazy_useMeleeWeapon") === "false" && !hasPrimaryAmmo())) {
      if (!meleeWeapon.classList.contains(SCRIPTED_MOVE_CLASSNAME)) {
        console.log("GoCrazy: move meleeWeapon");
        meleeWeapon.classList.add(SCRIPTED_MOVE_CLASSNAME);
        primaryWeapon.classList.remove(SCRIPTED_MOVE_CLASSNAME);
        tempWeapon.classList.remove(SCRIPTED_MOVE_CLASSNAME);
      }
    } else if (localStorage.getItem("goCrazy_useMeleeWeapon") === "false" && hasPrimaryAmmo()) {
      if (!primaryWeapon.classList.contains(SCRIPTED_MOVE_CLASSNAME)) {
        console.log("GoCrazy: move primaryWeapon");
        primaryWeapon.classList.add(SCRIPTED_MOVE_CLASSNAME);
        meleeWeapon.classList.remove(SCRIPTED_MOVE_CLASSNAME);
        tempWeapon.classList.remove(SCRIPTED_MOVE_CLASSNAME);
      }
    }
  }

  function hasTempAmmo() {
    const ammoEle = document.querySelector("div#attacker div#weapon_temp span.ammo-status");
    if (!ammoEle) {
      console.error("GoCrazy: hasTempAmmo can not find element");
      return false;
    }
    return ammoEle.innerText === "1";
  }

  function hasPrimaryAmmo() {
    const ammoEle = document.querySelector("div#attacker div#weapon_main span.ammo-status");
    if (!ammoEle) {
      console.error("GoCrazy: hasPrimaryAmmo can not find element");
      return false;
    }
    return !ammoEle.innerText.includes("No");
  }

  // Control panel UI
  function createControlPanel(div) {
    console.log("GoCrazy: createControlPanel");
    div.innerHTML += `
    <span>如果敌人正在住院： </span>
    <label><input type="radio" name="useAttackInHosp" value="false" id="useAttackInHosp-false"/>显示刷新按钮</label>
    <label><input type="radio" name="useAttackInHosp" value="true" id="useAttackInHosp-true"/>显示提前进攻按钮</label>
    <br>
    <span>精简页面： </span>
    <label><input type="radio" name="pageStyle" value="minimal" id="pageStyle-minimal"/>极简</label>
    <label><input type="radio" name="pageStyle" value="default" id="pageStyle-simple"/>简单</label>
    <label><input type="radio" name="pageStyle" value="default" id="pageStyle-default"/>默认</label>
    <br>
    <span>结束选项： </span>
    <label><input type="radio" name="leaveChoice" value="leave" id="leaveChoice-leave"/>Leave</label>
    <label><input type="radio" name="leaveChoice" value="mug" id="leaveChoice-mug"/>Mug</label>
    <label><input type="radio" name="leaveChoice" value="hospitalize" id="leaveChoice-hospitalize"/>Hospitalize</label>
    <br>
    <span>使用Temp武器： </span>
    <label><input type="radio" name="useTempWeapon" value="true" id="useTempWeapon-true"/>是</label>
    <label><input type="radio" name="useTempWeapon" value="false" id="useTempWeapon-false"/>否</label>
    <br>
    <span>默认武器： </span>
    <label><input type="radio" name="useMeleeWeapon" value="true" id="useMeleeWeapon-true"/>Melee</label>
    <label><input type="radio" name="useMeleeWeapon" value="false" id="useMeleeWeapon-false"/>Primary</label>
    `;

    if (localStorage.getItem("goCrazy_useAttackInHosp") === "true") {
      div.querySelector("input#useAttackInHosp-true").checked = true;
    } else if (localStorage.getItem("goCrazy_useAttackInHosp") === "false") {
      div.querySelector("input#useAttackInHosp-false").checked = true;
    }

    if (localStorage.getItem("goCrazy_pageStyle") === "0") {
      div.querySelector("input#pageStyle-minimal").checked = true;
    } else if (localStorage.getItem("goCrazy_pageStyle") === "1") {
      div.querySelector("input#pageStyle-simple").checked = true;
    } else if (localStorage.getItem("goCrazy_pageStyle") === "2") {
      div.querySelector("input#pageStyle-default").checked = true;
    }

    if (localStorage.getItem("goCrazy_leaveChoice") === "leave") {
      div.querySelector("input#leaveChoice-leave").checked = true;
    } else if (localStorage.getItem("goCrazy_leaveChoice") === "mug") {
      div.querySelector("input#leaveChoice-mug").checked = true;
    } else if (localStorage.getItem("goCrazy_leaveChoice") === "hospitalize") {
      div.querySelector("input#leaveChoice-hospitalize").checked = true;
    }

    if (localStorage.getItem("goCrazy_useTempWeapon") === "true") {
      div.querySelector("input#useTempWeapon-true").checked = true;
    } else if (localStorage.getItem("goCrazy_useTempWeapon") === "false") {
      div.querySelector("input#useTempWeapon-false").checked = true;
    }

    if (localStorage.getItem("goCrazy_useMeleeWeapon") === "true") {
      div.querySelector("input#useMeleeWeapon-true").checked = true;
    } else if (localStorage.getItem("goCrazy_useMeleeWeapon") === "false") {
      div.querySelector("input#useMeleeWeapon-false").checked = true;
    }

    div.querySelector("input#useAttackInHosp-false").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("goCrazy_useAttackInHosp", false);
      }
    });
    div.querySelector("input#useAttackInHosp-true").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("goCrazy_useAttackInHosp", true);
      }
    });

    div.querySelector("input#pageStyle-minimal").addEventListener("change", (event) => {
      if (event.target.checked) {
        // Remove styleSheets, remove all divs.
        localStorage.setItem("goCrazy_pageStyle", 0);
      }
    });
    div.querySelector("input#pageStyle-simple").addEventListener("change", (event) => {
      if (event.target.checked) {
        // Keep styleSheets, remove all divs.
        localStorage.setItem("goCrazy_pageStyle", 1);
      }
    });
    div.querySelector("input#pageStyle-default").addEventListener("change", (event) => {
      if (event.target.checked) {
        // Keep styleSheets, remove header divs.
        localStorage.setItem("goCrazy_pageStyle", 2);
      }
    });

    div.querySelector("input#leaveChoice-leave").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("goCrazy_leaveChoice", "leave");
      }
    });
    div.querySelector("input#leaveChoice-mug").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("goCrazy_leaveChoice", "mug");
      }
    });
    div.querySelector("input#leaveChoice-hospitalize").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("goCrazy_leaveChoice", "hospitalize");
      }
    });

    div.querySelector("input#useTempWeapon-true").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("goCrazy_useTempWeapon", true);
      }
    });
    div.querySelector("input#useTempWeapon-false").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("goCrazy_useTempWeapon", false);
      }
    });

    div.querySelector("input#useMeleeWeapon-true").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("goCrazy_useMeleeWeapon", true);
      }
    });
    div.querySelector("input#useMeleeWeapon-false").addEventListener("change", (event) => {
      if (event.target.checked) {
        localStorage.setItem("goCrazy_useMeleeWeapon", false);
      }
    });
  }

  function initLocalStorage() {
    if (!localStorage.getItem("goCrazy_useAttackInHosp")) {
      localStorage.setItem("goCrazy_useAttackInHosp", false);
    }
    if (!localStorage.getItem("goCrazy_pageStyle")) {
      localStorage.setItem("goCrazy_pageStyle", 2);
    }
    if (!localStorage.getItem("goCrazy_leaveChoice")) {
      localStorage.setItem("goCrazy_leaveChoice", "leave");
    }
    if (!localStorage.getItem("goCrazy_useTempWeapon")) {
      localStorage.setItem("goCrazy_useTempWeapon", true);
    }
    if (!localStorage.getItem("goCrazy_useMeleeWeapon")) {
      localStorage.setItem("goCrazy_useMeleeWeapon", true);
    }
  }
})();
