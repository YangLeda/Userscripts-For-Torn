// ==UserScript==
// @name         NoPageRefreshWhenHosped
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  No page refresh when hospitalized.
// @author       bot_7420 [2937420]
// @match        https://www.torn.com/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  const dataProperty = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data");
  const oriGet = dataProperty.get;

  dataProperty.get = hookedGet;
  Object.defineProperty(MessageEvent.prototype, "data", dataProperty);

  function hookedGet() {
    const socket = this.currentTarget;
    if (!(socket instanceof WebSocket)) {
      return oriGet.call(this); // Invalid WebSocket
    }
    if (socket.url.indexOf("ws-centrifugo.torn.com") <= -1) {
      return oriGet.call(this); // Wrong WebSocket
    }

    const message = oriGet.call(this);
    Object.defineProperty(this, "data", { value: message }); // Anti-loop

    return handleMessage(message);
  }

  function handleMessage(message) {
    console.log("NoPageRefreshWhenHosped: " + message);
    let resultMessage = message;

    if (resultMessage.indexOf(`"onHospital":[],`) > -1) {
      resultMessage = resultMessage.replace(`"onHospital":[],`, "");
      console.log("NoPageRefreshWhenHosped Modified: " + resultMessage);
    }

    return resultMessage;
  }
})();
