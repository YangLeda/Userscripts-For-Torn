// ==UserScript==
// @name         Chain提醒 ChainWatcher
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Customizable Chain alerts. Shows a chain bar for RW enemy. Open control panel at title bar.
// @author       bot_7420 [2937420], inspired by uygnaix [2536677]
// @match        https://www.torn.com/*
// @run-at       document-end
// @grant        GM_addStyle
// @grant        GM.xmlHttpRequest
// @connect      api.torn.com
// ==/UserScript==

(function () {
  "use strict";

  let API_KEY = ""; // Insert API key here

  if (!API_KEY && localStorage.getItem("APIKey")) {
    API_KEY = localStorage.getItem("APIKey");
  }

  const MIN_VOICE_INTERVAL = 1 * 1 * 1000;

  const oscillatorBeep = (function () {
    var ctxClass = window.audioContext || window.AudioContext || window.AudioContext || window.webkitAudioContext;
    var ctx = new ctxClass();
    return function (duration, type, finishedCallback, volume) {
      duration = +duration;
      if (typeof finishedCallback != "function") {
        finishedCallback = function () {};
      }
      let osc = ctx.createOscillator();
      let u = ctx.createGain();
      osc.connect(u);
      u.connect(ctx.destination);
      u.gain.value = volume * 0.01;
      if (osc.noteOn) osc.noteOn(0);
      if (osc.start) osc.start();
      setTimeout(function () {
        if (osc.noteOff) osc.noteOff(0);
        if (osc.stop) osc.stop();
        finishedCallback();
      }, duration);
    };
  })();

  let isDarkmode = false;
  let customHighlightDiv = null;
  let customEnemyChainDiv = null;
  let $fixedTimerCount = null;
  let $fixedTimerTime = null;
  let isAlertingTimeoutOverlay = false;
  let isAlertingBonusOverlay = false;

  console.log("ChainWatch: start");
  initLocalStorage();
  initCSS();
  initControlPanel();
  initBackgroundAlertDivs();
  checkSideBarChain();
  update();
  setInterval(update, 1000);

  function initLocalStorage() {
    if (!localStorage.getItem("chainWatcher_isEnabled")) {
      localStorage.setItem("chainWatcher_isEnabled", "true");
    }
    if (!localStorage.getItem("chainWatcher_minChainLength")) {
      localStorage.setItem("chainWatcher_minChainLength", "50");
    }
    if (!localStorage.getItem("chainWatcher_timeoutThreshold")) {
      localStorage.setItem("chainWatcher_timeoutThreshold", "60");
    }
    if (!localStorage.getItem("chainWatcher_bonusThreshold")) {
      localStorage.setItem("chainWatcher_bonusThreshold", "20");
    }
    if (!localStorage.getItem("chainWatcher_timeoutAlertType")) {
      localStorage.setItem("chainWatcher_timeoutAlertType", "0");
    }
    if (!localStorage.getItem("chainWatcher_bonusAlertType")) {
      localStorage.setItem("chainWatcher_bonusAlertType", "0");
    }
    if (!localStorage.getItem("chainWatcher_isShowFloatingTimer")) {
      localStorage.setItem("chainWatcher_isShowFloatingTimer", "true");
    }
    if (!localStorage.getItem("chainWatcher_volume")) {
      localStorage.setItem("chainWatcher_volume", "75");
    }
    if (!localStorage.getItem("chainWatcher_isEnglish")) {
      localStorage.setItem("chainWatcher_isEnglish", "false");
    }
    if (!localStorage.getItem("chainWatcher_isShowEnemyChain")) {
      localStorage.setItem("chainWatcher_isShowEnemyChain", "true");
    }

    if (!localStorage.getItem("chainWatcher_lastVoiceTimeout")) {
      localStorage.setItem("chainWatcher_lastVoiceTimeout", "0");
    }
    if (!localStorage.getItem("chainWatcher_lastVoiceBonus")) {
      localStorage.setItem("chainWatcher_lastVoiceBonus", "0");
    }
  }

  function initCSS() {
    isDarkmode = $("body").hasClass("dark-mode");
    GM_addStyle(`.scripted-chain-highlight-bonus {
                    animation: blinking-bonus 1.5s infinite;
                  }

                  .scripted-chain-highlight-timeleft {
                    animation: blinking-timeleft 1s infinite;
                  }

                  .scripted-control-panel-popup {
                    position: fixed;
                    top: 15%;
                    left: 50%;
                    width: 400px;
                    border-radius: 10px;
                    padding: 10px;
                    background: ${isDarkmode ? "#282828" : "#F0F0F0"};
                    z-index: 1000;
                    display: none;
                  }

                  .scripted-control-panel-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    background: ${isDarkmode ? "#404040" : "#B0B0B0"};
                    width: 100%;
                    height: 100%;
                    opacity: 0.7;
                    z-index: 900;
                    display: none;
                  }

                  .scripted-control-panel-item {
                    display: inline-block;
                    margin: 2px 2px 2px 2px;
                  }

                  @keyframes flash {
                    0% {
                      opacity: 0;
                    }
                    50% {
                      opacity: 1;
                    }
                    100% {
                      opacity: 0;
                    }
                  }

                  @keyframes blinking-bonus {
                    0% {
                      background: rgba(100, 149, 237, 0.6);
                    }
                    100% {
                    }
                  }

                  @keyframes blinking-timeleft {
                    0% {
                      background: rgba(220, 20, 60, 0.6);
                    }
                    100% {
                    }
                  }`);
  }

  function initControlPanel() {
    const $title = $("div#top-page-links-list");
    if ($title.length === 0) {
      console.log("ChainWatch: nowhere to put control panel button");
    }
    const isEnglish = localStorage.getItem("chainWatcher_isEnglish") === "true";
    const $controlBtn = $(`<a class="t-clear h c-pointer right last">
                                    <span class="icon-wrap svg-icon-wrap">
                                      <span class="link-icon-svg">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10.33"><defs><style>.cls-1{opacity:0.35;}.cls-2{fill:#fff;}.cls-3{fill:#777;}</style></defs><g id="Слой_2" data-name="Слой 2"><g id="icons"><g class="cls-1"><path class="cls-2" d="M10,5.67a2,2,0,0,1-4,0,1.61,1.61,0,0,1,0-.39A1.24,1.24,0,0,0,7.64,3.7a2.19,2.19,0,0,1,.36,0A2,2,0,0,1,10,5.67ZM8,1C3,1,0,5.37,0,5.37s3.22,5,8,5c5.16,0,8-5,8-5S13.14,1,8,1ZM8,9a3.34,3.34,0,1,1,3.33-3.33A3.33,3.33,0,0,1,8,9Z"></path></g><path class="cls-3" d="M10,4.67a2,2,0,0,1-4,0,1.61,1.61,0,0,1,0-.39A1.24,1.24,0,0,0,7.64,2.7a2.19,2.19,0,0,1,.36,0A2,2,0,0,1,10,4.67ZM8,0C3,0,0,4.37,0,4.37s3.22,5,8,5c5.16,0,8-5,8-5S13.14,0,8,0ZM8,8a3.34,3.34,0,1,1,3.33-3.33A3.33,3.33,0,0,1,8,8Z"></path></g></g></svg>
                                      </span>
                                    </span>
                                    <span>${isEnglish ? "Chain Watcher" : "Chain监测"}</span>
                                  </a>`);
    $title.append($controlBtn);

    const $controlPanelDiv = $(`<div id="scriptedControlPanel" class="scripted-control-panel-popup">control</div>`);
    const $controlPanelOverlayDiv = $(`<div id="scriptedControlOverlayPanel" class="scripted-control-panel-overlay"></div>`);
    $controlPanelDiv.html(`
                          <span class="scripted-control-panel-item">${isEnglish ? "Watch Chain: " : "监测Chain："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="isEnabled" value="true" id="spam-isEnabled-true"/>${isEnglish ? "Enabled" : "启用"}</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="isEnabled" value="false" id="spam-isEnabled-false"/>${isEnglish ? "Disabled" : "禁用"}</label><br>
                          <br>
                          <span class="scripted-control-panel-item">${isEnglish ? "Only alert chain bonus no shorter than: " : "仅提醒Chain Bonus不短于："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="minChainLength" value="25" id="spam-targetPage-pi"/>25</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="minChainLength" value="50" id="spam-targetPage-company"/>50</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="minChainLength" value="100" id="spam-targetPage-trade"/>100</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="minChainLength" value="250" id="spam-targetPage-pi"/>250</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="minChainLength" value="500" id="spam-targetPage-company"/>500</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="minChainLength" value="1000" id="spam-targetPage-trade"/>1000</label><br>
                          <br>
                          <span class="scripted-control-panel-item">${isEnglish ? "Timeout alert threshold seconds: " : "续Chain警报提前秒数："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="timeoutThreshold" value="20" id="spam-targetPage-pi"/>20</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="timeoutThreshold" value="30" id="spam-targetPage-company"/>30</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="timeoutThreshold" value="60" id="spam-targetPage-trade"/>60</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="timeoutThreshold" value="120" id="spam-targetPage-pi"/>120</label><br>
                          <br>
                          <span class="scripted-control-panel-item">${isEnglish ? "Bonus hit alert threshold hits: " : "停止打野警报提前枪数："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="bonusThreshold" value="5" id="spam-targetPage-pi"/>5</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="bonusThreshold" value="10" id="spam-targetPage-company"/>10</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="bonusThreshold" value="20" id="spam-targetPage-trade"/>20</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="bonusThreshold" value="30" id="spam-targetPage-pi"/>30</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="bonusThreshold" value="50" id="spam-targetPage-company"/>50</label><br>
                          <br>
                          <span class="scripted-control-panel-item">${isEnglish ? "Timeout alert level: " : "续Chain警报等级："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="timeoutAlertType" value="0" id="spam-targetPage-pi"/>${isEnglish ? "Sidebar flash" : "侧边栏闪烁"}</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="timeoutAlertType" value="1" id="spam-targetPage-company"/>${isEnglish ? "Page flash" : "整页闪烁"}</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="timeoutAlertType" value="2" id="spam-targetPage-trade"/>${isEnglish ? "Alert sound" : "提示音"}</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="timeoutAlertType" value="3" id="spam-targetPage-pi"/>${isEnglish ? "Text-to-speech voice" : "语音播报"}</label><br>
                          <br>
                          <span class="scripted-control-panel-item">${isEnglish ? "Bonus hit alert level: " : "停止打野警报等级："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="bonusAlertType" value="0" id="spam-targetPage-pi"/>${isEnglish ? "Sidebar flash" : "侧边栏闪烁"}</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="bonusAlertType" value="1" id="spam-targetPage-company"/>${isEnglish ? "Page flash" : "整页闪烁"}</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="bonusAlertType" value="2" id="spam-targetPage-trade"/>${isEnglish ? "Alert sound" : "提示音"}</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="bonusAlertType" value="3" id="spam-targetPage-pi"/>${isEnglish ? "Text-to-speech voice" : "语音播报"}</label><br>
                          <br>
                          <span class="scripted-control-panel-item">${isEnglish ? "Volume: " : "音量："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="volume" value="0" id="spam-volume-pi"/>0</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="volume" value="25" id="spam-volume-pi"/>25</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="volume" value="50" id="spam-volume-pi"/>50</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="volume" value="75" id="spam-volume-pi"/>75</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="volume" value="100" id="spam-volume-pi"/>100</label><br>
                          <br>
                          <span class="scripted-control-panel-item">${isEnglish ? "Show enemy chain during RW: " : "RW时显示敌方Chain："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="isShowEnemyChain" value="true" id="spam-isShowEnemyChain-true"/>${isEnglish ? "Enabled" : "启用"}</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="isShowEnemyChain" value="false" id="spam-isShowEnemyChain-false"/>${isEnglish ? "Disabled" : "禁用"}</label><br>
                          <br>
                          <span class="scripted-control-panel-item">${isEnglish ? "Show a floating timer: " : "显示悬浮时钟："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="isShowFloatingTimer" value="true" id="spam-isShowFloatingTimer-true"/>${isEnglish ? "Enabled" : "启用"}</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="isShowFloatingTimer" value="false" id="spam-isShowFloatingTimer-false"/>${isEnglish ? "Disabled" : "禁用"}</label><br>
                          <br>
                          <span class="scripted-control-panel-item">${isEnglish ? "Language: " : "语言："}</span><br>
                          <label class="scripted-control-panel-item"><input type="radio" name="isEnglish" value="false" id="spam-isEnabled-true"/>中文</label>
                          <label class="scripted-control-panel-item"><input type="radio" name="isEnglish" value="true" id="spam-isEnabled-false"/>English</label><br>
                          <br>
                          <button id="scripted-test-sound" class="scripted-control-panel-item" style="cursor: pointer;">${isEnglish ? "[Test alert sound]" : "[测试提示音]"}</button><br>
                          <button id="scripted-test-tts" class="scripted-control-panel-item" style="cursor: pointer;">${isEnglish ? "[Test text-to-speech voice]" : "[测试语音播报]"}</button><br>
                          `);

    // Control panel initial selections
    $controlPanelDiv.find(`input[type=radio][name=isEnabled][value=${localStorage.getItem("chainWatcher_isEnabled")}]`).prop("checked", true);
    $controlPanelDiv.find(`input[type=radio][name=minChainLength][value=${localStorage.getItem("chainWatcher_minChainLength")}]`).prop("checked", true);
    $controlPanelDiv.find(`input[type=radio][name=timeoutThreshold][value=${localStorage.getItem("chainWatcher_timeoutThreshold")}]`).prop("checked", true);
    $controlPanelDiv.find(`input[type=radio][name=bonusThreshold][value=${localStorage.getItem("chainWatcher_bonusThreshold")}]`).prop("checked", true);
    $controlPanelDiv.find(`input[type=radio][name=timeoutAlertType][value=${localStorage.getItem("chainWatcher_timeoutAlertType")}]`).prop("checked", true);
    $controlPanelDiv.find(`input[type=radio][name=bonusAlertType][value=${localStorage.getItem("chainWatcher_bonusAlertType")}]`).prop("checked", true);
    $controlPanelDiv.find(`input[type=radio][name=volume][value=${localStorage.getItem("chainWatcher_volume")}]`).prop("checked", true);
    $controlPanelDiv.find(`input[type=radio][name=isShowEnemyChain][value=${localStorage.getItem("chainWatcher_isShowEnemyChain")}]`).prop("checked", true);
    $controlPanelDiv.find(`input[type=radio][name=isShowFloatingTimer][value=${localStorage.getItem("chainWatcher_isShowFloatingTimer")}]`).prop("checked", true);
    $controlPanelDiv.find(`input[type=radio][name=isEnglish][value=${localStorage.getItem("chainWatcher_isEnglish")}]`).prop("checked", true);

    // Control panel onClick listeners
    $controlPanelDiv.find("input[type=radio][name=isEnabled]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_isEnabled", $(this).prop("value"));
          location.reload();
        }
      });
    });
    $controlPanelDiv.find("input[type=radio][name=minChainLength]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_minChainLength", $(this).prop("value"));
        }
      });
    });
    $controlPanelDiv.find("input[type=radio][name=timeoutThreshold]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_timeoutThreshold", $(this).prop("value"));
        }
      });
    });
    $controlPanelDiv.find("input[type=radio][name=bonusThreshold]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_bonusThreshold", $(this).prop("value"));
        }
      });
    });
    $controlPanelDiv.find("input[type=radio][name=timeoutAlertType]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_timeoutAlertType", $(this).prop("value"));
        }
      });
    });
    $controlPanelDiv.find("input[type=radio][name=bonusAlertType]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_bonusAlertType", $(this).prop("value"));
        }
      });
    });
    $controlPanelDiv.find("input[type=radio][name=volume]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_volume", $(this).prop("value"));
        }
      });
    });
    $controlPanelDiv.find("input[type=radio][name=isShowEnemyChain]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_isShowEnemyChain", $(this).prop("value"));
          location.reload();
        }
      });
    });
    $controlPanelDiv.find("input[type=radio][name=isShowFloatingTimer]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_isShowFloatingTimer", $(this).prop("value"));
        }
      });
    });
    $controlPanelDiv.find("input[type=radio][name=isEnglish]").each(function () {
      $(this).change(function () {
        if ($(this).prop("checked")) {
          localStorage.setItem("chainWatcher_isEnglish", $(this).prop("value"));
          location.reload();
        }
      });
    });
    $controlPanelDiv.find("button#scripted-test-sound").click(function () {
      let button = this;
      button.disabled = true;
      setTimeout(function () {
        button.disabled = false;
      }, 500);
      makeSound(`${isEnglish ? "Chain timeout in 60 seconds" : "Chain还有60秒"}`, false, false);
      makeSound(`${isEnglish ? "Next bonus in " : "到bonus还有"}20${isEnglish ? " hits" : "枪"}`, false, false);
    });
    $controlPanelDiv.find("button#scripted-test-tts").click(function () {
      let button = this;
      button.disabled = true;
      setTimeout(function () {
        button.disabled = false;
      }, 5000);
      makeSound(`${isEnglish ? "Chain timeout in 60 seconds" : "Chain还有60秒"}`, true, false);
      makeSound(`${isEnglish ? "Next bonus in " : "到bonus还有"}20${isEnglish ? " hits" : "枪"}`, true, false);
    });

    $title.append($controlPanelDiv);
    $title.append($controlPanelOverlayDiv);
    $controlBtn.click(function () {
      $controlPanelDiv.fadeToggle(200);
      $controlPanelOverlayDiv.fadeToggle(200);
    });
    $controlPanelOverlayDiv.click(function () {
      $controlPanelDiv.fadeOut(200);
      $controlPanelOverlayDiv.fadeOut(200);
    });
  }

  function initBackgroundAlertDivs() {
    // Fixed floating timer
    const $fixedTimerDiv = $('<div class="fixed-timer-div" style="height: 100px; pointer-events: none; display: flex; position: fixed; bottom: 25px; left: 25px; opacity: 1; z-index: 2000; justify-content: center; font-size: 100px; color: #de5e5ea8; align-items: center;"></div>');
    $fixedTimerCount = $('<span class="fixed-timer-count fixed-timer-handle" style="cursor: move; pointer-events: auto; font-size: 36px; text-shadow: 2px 2px 5px green; color: #066b58;">10/100</span>');
    $fixedTimerTime = $('<span class="fixed-timer-time" style="font-size: 100px; text-shadow: 2px 2px 5px #803b00; color: #e4510b;">22:22</span>');
    $fixedTimerDiv.draggable({
      handle: ".fixed-timer-handle",
      cursor: "move",
      containment: "window",
      scroll: false,
    });
    $fixedTimerDiv.append($fixedTimerCount).append($fixedTimerTime);
    $("body").append($fixedTimerDiv);

    // Chain timeout flash alert overlay
    const $timeoutOverlay = $('<div class="timeout-overlay" style="position: fixed; width: 100vw; top: 0; height: 100vh; left: 0; background: #ff7a7a38; pointer-events: none; opacity: 0; z-index: 999"></div>');
    $("body").append($timeoutOverlay);

    // Chain bonus flash alert overlay
    const $bonusOverlay = $('<div class="bonus-overlay" style="position: fixed; width: 100vw; top: 0; height: 100vh; left: 0; background: rgb(255 251 122 / 8%); pointer-events: none; opacity: 0; z-index: 999"></div>');
    $("body").append($bonusOverlay);
  }

  async function checkSideBarChain() {
    const sideBarRootEle = document.querySelector("div#sidebarroot a.chain-bar___vjdPL");
    const timeLeftEle = document.querySelector("div#sidebarroot a.chain-bar___vjdPL p.bar-timeleft___B9RGV");
    const progressLineEle = document.querySelector("div#sidebarroot a.chain-bar___vjdPL div.progress-line-wrap___Alp6b");
    if (!(sideBarRootEle && timeLeftEle && progressLineEle)) {
      setTimeout(checkSideBarChain, 1000);
      return;
    } else if (!customHighlightDiv || !customEnemyChainDiv) {
      customHighlightDiv = document.createElement("div");
      customHighlightDiv.id = "custom-highlight-div";
      sideBarRootEle.after(customHighlightDiv);
      customEnemyChainDiv = document.createElement("div");
      customEnemyChainDiv.id = "custom-enemychain-div";
      customEnemyChainDiv.textContent = "";
      customHighlightDiv.after(customEnemyChainDiv);
      checkEnemyChain();
      setInterval(checkEnemyChain, 10000);
    }
    if (localStorage.getItem("chainWatcher_isEnabled") === "false") {
      setTimeout(checkSideBarChain, 1000);
      return;
    }

    const ls_minChainLength = parseInt(localStorage.getItem("chainWatcher_minChainLength"));
    const ls_timeoutThreshold = parseInt(localStorage.getItem("chainWatcher_timeoutThreshold"));
    const ls_bonusThreshold = parseInt(localStorage.getItem("chainWatcher_bonusThreshold"));
    const ls_isEnglish = localStorage.getItem("chainWatcher_isEnglish") === "true" ? true : false;
    const currentHitNum = parseInt(getChainDataFromSession().amount);
    const targetHitNum = parseInt(getChainDataFromSession().max);
    const timeLeftSeconds = parseInt(timeLeftEle.innerHTML.split(":")[0]) * 60 + parseInt(timeLeftEle.innerHTML.split(":")[1]);
    const isInCooldown = parseInt(getChainDataFromSession().coolDown) !== 0;
    //console.log("ChainWatch: " + currentHitNum + " " + targetHitNum + " " + timeLeftSeconds + " " + isInCooldown);

    if (targetHitNum >= ls_minChainLength && timeLeftSeconds > 0 && timeLeftSeconds <= ls_timeoutThreshold && !isInCooldown && parseInt(localStorage.getItem("chainWatcher_timeoutAlertType")) >= 0) {
      customHighlightDiv.textContent = `${ls_isEnglish ? "Chain near break!" : "注意续Chain！"}`;
      if (!sideBarRootEle.classList.contains("scripted-chain-highlight-timeleft")) {
        console.log("ChainWatch: sidebar highlight timeleft");
        sideBarRootEle.classList.add("scripted-chain-highlight-timeleft");
      }
      if (sideBarRootEle.classList.contains("scripted-chain-highlight-bonus")) {
        console.log("ChainWatch: remove highlight bonus");
        sideBarRootEle.classList.remove("scripted-chain-highlight-bonus");
      }
    } else if (targetHitNum >= ls_minChainLength && targetHitNum - currentHitNum <= ls_bonusThreshold && !isInCooldown && parseInt(localStorage.getItem("chainWatcher_bonusAlertType")) >= 0) {
      customHighlightDiv.textContent = `${ls_isEnglish ? "Bonus hit is close!" : "注意停止打野！"}`;
      if (!sideBarRootEle.classList.contains("scripted-chain-highlight-bonus")) {
        console.log("ChainWatch: sidebar highlight bonus");
        sideBarRootEle.classList.add("scripted-chain-highlight-bonus");
      }
      if (sideBarRootEle.classList.contains("scripted-chain-highlight-timeleft")) {
        console.log("ChainWatch: remove highlight timeleft");
        sideBarRootEle.classList.remove("scripted-chain-highlight-timeleft");
      }
    } else {
      customHighlightDiv.textContent = "";
      if (sideBarRootEle.classList.contains("scripted-chain-highlight-bonus")) {
        console.log("ChainWatch: remove highlight bonus");
        sideBarRootEle.classList.remove("scripted-chain-highlight-bonus");
      }
      if (sideBarRootEle.classList.contains("scripted-chain-highlight-timeleft")) {
        console.log("ChainWatch: remove highlight timeleft");
        sideBarRootEle.classList.remove("scripted-chain-highlight-timeleft");
      }
    }
    setTimeout(checkSideBarChain, 1000);
  }

  async function checkEnemyChain() {
    if (!customEnemyChainDiv) {
      return;
    }
    if (localStorage.getItem("chainWatcher_isShowEnemyChain") === "false" || localStorage.getItem("chainWatcher_isShowEnemyChain") === "false") {
      customEnemyChainDiv.textContent = "";
      return;
    }
    let selfFactionJson = await fetchFactionAPI();
    if (!selfFactionJson) {
      customEnemyChainDiv.textContent = "API error";
      return;
    }
    if (Object.keys(selfFactionJson.ranked_wars).length === 0) {
      customEnemyChainDiv.textContent = "Not in RW";
      return;
    }
    const SelfFactionId = selfFactionJson.ID;
    const war = selfFactionJson.ranked_wars[Object.keys(selfFactionJson.ranked_wars)[0]];
    const currentTimestamp = new Date().getTime() / 1000;
    const startTimestamp = war.war.start;
    const isFinished = parseInt(war.war.end) > 0;
    if (isFinished || startTimestamp > currentTimestamp) {
      customEnemyChainDiv.textContent = "Not in RW";
      return;
    }
    let enemyFactionId = "0";
    for (const id of Object.keys(war.factions)) {
      if (id != SelfFactionId) {
        enemyFactionId = id;
      }
    }

    let enemyFactionJson = await fetchFactionAPI(enemyFactionId);
    if (!enemyFactionJson) {
      customEnemyChainDiv.textContent = "API error";
      return;
    }
    const enemyChainCurrent = enemyFactionJson.chain.current;
    const enemyChainMax = enemyFactionJson.chain.max;
    const enemyChainTimeout = enemyFactionJson.chain.timeout;
    const enemyChainCoolDown = enemyFactionJson.chain.cooldown;
    let timeLeftStr = new Date(enemyChainTimeout * 1000).toISOString().slice(14, 19);
    let cooldownStr = enemyChainCoolDown !== 0 ? "In cooldown" : timeLeftStr;
    let str = "<b>Enemy: </b>" + enemyChainCurrent + "/" + enemyChainMax + " " + cooldownStr;
    customEnemyChainDiv.innerHTML = str;
  }

  function update() {
    let chainData = getChainDataFromSession();
    if (!chainData || localStorage.getItem("chainWatcher_isEnabled") === "false") {
      alertTimeoutOverlay(false);
      alertBonusOverlay(false);
      fixedTimerTick(0, 0, 0, 0, false);
      return;
    }
    fixedTimerTick(chainData.amount, chainData.max, chainData.timestampToUpdate, chainData.coolDown);
    checkTimeout(chainData.amount, chainData.max, chainData.timestampToUpdate, chainData.coolDown);
    checkBonus(chainData.amount, chainData.max, chainData.timestampToUpdate, chainData.coolDown);
  }

  function fixedTimerTick(current = 0, max = 10, timestamp = 0, cooldown = 0, isShow = true) {
    let timeoutInSeconds = timestamp - Math.floor(new Date().getTime() / 1000);
    if (timeoutInSeconds < 0) {
      timeoutInSeconds = 0;
    }
    let timeOutStr = new Date(timeoutInSeconds * 1000).toISOString().slice(14, 19);
    let isInCooldown = parseInt(cooldown) !== 0;
    //console.log("ChainWatch: fixedTimerTick " + current + " " + max + " " + timeoutInSeconds + " " + timeOutStr + " " + isInCooldown);

    if (!isShow || localStorage.getItem("chainWatcher_isEnabled") === "false" || localStorage.getItem("chainWatcher_isShowFloatingTimer") === "false" || max < parseInt(localStorage.getItem("chainWatcher_minChainLength")) || isInCooldown) {
      $(".fixed-timer-div").css("opacity", "0");
    } else {
      $(".fixed-timer-div").css("opacity", "0.9");
    }

    $fixedTimerCount.text(current + "/" + max);
    $fixedTimerTime.text(timeOutStr);
  }

  function checkTimeout(current = 0, max = 10, timestamp = 0, cooldown = 0) {
    let timeoutInSeconds = timestamp - Math.floor(new Date().getTime() / 1000);
    if (timeoutInSeconds < 0) {
      timeoutInSeconds = 0;
    }
    let isInCooldown = parseInt(cooldown) !== 0;

    if (
      localStorage.getItem("chainWatcher_isEnabled") === "true" &&
      max >= parseInt(localStorage.getItem("chainWatcher_minChainLength")) &&
      parseInt(localStorage.getItem("chainWatcher_timeoutAlertType")) > 0 &&
      timeoutInSeconds > 0 &&
      timeoutInSeconds <= parseInt(localStorage.getItem("chainWatcher_timeoutThreshold")) &&
      !isInCooldown
    ) {
      alertTimeoutOverlay(true, timeoutInSeconds);
    } else {
      alertTimeoutOverlay(false);
    }
  }

  function checkBonus(current = 0, max = 10, timestamp = 0, cooldown = 0) {
    let remainingHits = max - current;
    let isInCooldown = parseInt(cooldown) !== 0;

    if (
      localStorage.getItem("chainWatcher_isEnabled") === "true" &&
      max >= parseInt(localStorage.getItem("chainWatcher_minChainLength")) &&
      parseInt(localStorage.getItem("chainWatcher_bonusAlertType")) > 0 &&
      remainingHits > 0 &&
      remainingHits <= parseInt(localStorage.getItem("chainWatcher_bonusThreshold")) &&
      !isInCooldown
    ) {
      alertBonusOverlay(true, remainingHits);
    } else {
      alertBonusOverlay(false);
    }
  }

  function fetchFactionAPI(factionId = 0) {
    //console.log("ChainWatch: fetchFactionAPI id = " + factionId);
    return new Promise((resolve) => {
      GM.xmlHttpRequest({
        url: `https://api.torn.com/faction/${factionId}?selections=chain,basic&key=${API_KEY}`,
        method: "POST",
        synchronous: true,
        onload: (response) => {
          if (response.status == 200) {
            const body = JSON.parse(response.responseText);
            if (body && body.chain && body.ranked_wars) {
              resolve(body);
            } else {
              console.error("ChainWatch: fetchFaction API invalid response json");
              resolve(null);
            }
          } else {
            console.error("ChainWatch: fetchFaction API fetch onload with HTTP error status " + response.status);
            resolve(null);
          }
        },
        onabort: () => {
          console.error("ChainWatch: fetchFaction API fetch onabort");
          resolve(null);
        },
        onerror: () => {
          console.error("ChainWatch: fetchFaction API fetch onerror");
          resolve(null);
        },
        ontimeout: () => {
          console.error("ChainWatch: fetchFaction API fetch ontimeout");
          resolve(null);
        },
      });
    });
  }

  function getChainDataFromSession() {
    // Example session data
    // "chain": {
    //   "name": "Chain",
    //   "timestampToUpdate": 0, // Chain timeout timestamp
    //   "timeToUpdate": 0,
    //   "amount": 0, // Current hit number
    //   "max": 10, // Target bonus hit number
    //   "step": 0,
    //   "coolDown": 0, // Check if chain is in cooldown after breaking
    //   "endCoolDownTimestamp": 0,
    //   "bonuses": 1,
    //   "link": "#"
    // }
    let index = Object.keys(sessionStorage).findIndex((item) => item.startsWith("sidebarData"));
    if (index >= 0) {
      let sidebarData = JSON.parse(sessionStorage.getItem(sessionStorage.key(index)));
      let chainData = sidebarData.bars.chain;
      if (chainData) {
        return chainData;
      }
    }
    console.error("ChainWatch: getChainDataFromSession failed");
    return null;
  }

  async function makeSound(text, isTTS, isMuted) {
    if (isMuted) {
      return;
    }
    const volume = parseInt(localStorage.getItem("chainWatcher_volume"));
    console.log("ChainWatch: makeSound " + text + " " + isTTS + " " + volume);

    oscillatorBeep(100, 2, null, volume * 0.25);

    if (isTTS) {
      const msg = new SpeechSynthesisUtterance();
      msg.lang = `${localStorage.getItem("chainWatcher_isEnglish") === "true" ? "en-US" : "zh-CN"}`;
      msg.rate = localStorage.getItem("chainWatcher_isEnglish") === "true" ? 1 : 1.6;
      msg.pitch = localStorage.getItem("chainWatcher_isEnglish") === "true" ? 1 : 0.9;
      msg.volume = volume * 0.01;
      msg.text = text;
      window.speechSynthesis.speak(msg);
    }
  }

  function alertTimeoutOverlay(isAlert, timeoutInSeconds) {
    const $overlay = $("div.timeout-overlay");
    const isEnglish = localStorage.getItem("chainWatcher_isEnglish") === "true";
    if (isAlert && !isAlertingTimeoutOverlay) {
      isAlertingTimeoutOverlay = true;
      console.log("ChainWatch: alertTimeoutOverlay start");
      $overlay.css("animation", "flash 2s infinite");
      if (parseInt(localStorage.getItem("chainWatcher_timeoutAlertType")) > 1 && new Date().getTime() - parseInt(localStorage.getItem("chainWatcher_lastVoiceTimeout")) > MIN_VOICE_INTERVAL) {
        localStorage.setItem("chainWatcher_lastVoiceTimeout", new Date().getTime());
        makeSound(`${isEnglish ? "Chain timeout in " : "Chain还有"}${timeoutInSeconds}${isEnglish ? " seconds" : "秒"}`, localStorage.getItem("chainWatcher_timeoutAlertType") === "3", false);
      }
    } else if (!isAlert && isAlertingTimeoutOverlay) {
      isAlertingTimeoutOverlay = false;
      console.log("ChainWatch: alertTimeoutOverlay end");
      $overlay.css("animation", "");
    }
  }

  function alertBonusOverlay(isAlert, remainingHits) {
    const $overlay = $("div.bonus-overlay");
    const isEnglish = localStorage.getItem("chainWatcher_isEnglish") === "true";
    if (isAlert && !isAlertingBonusOverlay) {
      isAlertingBonusOverlay = true;
      console.log("ChainWatch: alertBonusOverlay start");
      $overlay.css("animation", "flash 2s infinite");
      console.log("ChainWatch: alertBonusOverlay 0000000000000" + (new Date().getTime() - parseInt(localStorage.getItem("chainWatcher_lastVoiceBonus")) > MIN_VOICE_INTERVAL));
      if (parseInt(localStorage.getItem("chainWatcher_bonusAlertType")) > 1 && new Date().getTime() - parseInt(localStorage.getItem("chainWatcher_lastVoiceBonus")) > MIN_VOICE_INTERVAL) {
        localStorage.setItem("chainWatcher_lastVoiceBonus", new Date().getTime());
        makeSound(`${isEnglish ? "Next bonus in " : "到bonus还有"}${remainingHits}${isEnglish ? " hits" : "枪"}`, localStorage.getItem("chainWatcher_bonusAlertType") === "3", false);
      }
    } else if (!isAlert && isAlertingBonusOverlay) {
      isAlertingBonusOverlay = false;
      console.log("ChainWatch: alertBonusOverlay end");
      $overlay.css("animation", "");
    }
  }
})();

// // ==UserScript==
// // @name         测试Chain Sidebar
// // @namespace    http://tampermonkey.net/
// // @version      0.1
// // @description
// // @author       bot_7420 [2937420]
// // @match      https://www.torn.com/*
// // @run-at       document-start
// // @grant        GM_addStyle
// // @grant        unsafeWindow
// // ==/UserScript==

// (function () {
//   "use strict";

//   if (!localStorage.getItem("chainTestStr")) {
//     localStorage.setItem("chainTestStr", "1000 2000 60 0");
//   }

//   unsafeWindow.onload = function () {
//     addInput();
//   };

//   function addInput() {
//     const input = document.createElement("input");
//     input.type = "text";
//     input.value = localStorage.getItem("chainTestStr");
//     input.classList.add("scripted-move");
//     input.onchange = function () {
//       localStorage.setItem("chainTestStr", input.value);
//     };
//     document.body.append(input);
//   }

//   const { fetch: originalFetch } = unsafeWindow;
//   unsafeWindow.fetch = async (...args) => {
//     let [resource, config] = args;
//     let response = await originalFetch(resource, config);

//     const json = () =>
//       response
//         .clone()
//         .json()
//         .then((data) => {
//           data = { ...data };

//           if (response.url.indexOf("sidebarAjaxAction.php") != -1) {
//             let textList = localStorage.getItem("chainTestStr").split(" ");
//             if (textList.length === 4) {
//               data.bars.chain.amount = parseInt(textList[0]);
//               data.bars.chain.max = parseInt(textList[1]);
//               data.bars.chain.timestampToUpdate = Math.floor(new Date().getTime() / 1000) + parseInt(textList[2]);
//               data.bars.chain.coolDown = parseInt(textList[3]);
//             }
//           }

//           return data;
//         });

//     response.json = json;
//     response.text = async () => JSON.stringify(await json());
//     return response;
//   };

//   // Add custom style for moved elements
//   GM_addStyle(`
//       .scripted-move {
//           position: fixed !important;
//           top: 20% !important;
//           left: 20% !important;
//           width: 150px !important;
//           height: 20px !important;
//           margin: 0px !important;
//           border: 5px solid red !important;
//           z-index: 2000 !important;
//       }
//     `);
// })();
