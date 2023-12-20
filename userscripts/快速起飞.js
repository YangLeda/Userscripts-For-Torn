// ==UserScript==
// @name         Quick Travel
// @namespace    http://www.torn.com/
// @version      1.0
// @description  Focus on default travel destination, focus on start travel button, and focus on confirmation button. Use Enter or Space to press the buttons.
// @author       bot_7420 [2937420]
// @match        https://www.torn.com/travelagency.php
// @grant        none
// @license MIT
// ==/UserScript==

(function () {
    "use strict";

    const defaultDestination = "switzerland"; // Modify here to change default destination.
    const DESTINATIONS = ["mexico", "cayman", "canada", "hawaii", "uk", "argentina", "switzerland", "japan", "china", "uae", "south-africa"];

    let tabElementId = "";

    const destinationTimer = setInterval(() => {
        if (tabElementId === "") {
            // Check which tab is active, Airstrip then Private.
            const tab2 = document.querySelector("div#tab4-2");
            const tab3 = document.querySelector("div#tab4-3");
            if (tab2 && tab2.style.display !== "hidden" && tab2.style.display !== "none") {
                console.log("QuickTravel: found tab4-2");
                tabElementId = "tab4-2";
            } else if (tab3 && tab3.style.display !== "hidden" && tab3.style.display !== "none") {
                console.log("QuickTravel: found tab4-3");
                tabElementId = "tab4-3";
            } else {
                console.error("QuickTravel: can not find tab");
                tabElementId = "";
                return;
            }
        }

        const targetElement = document.querySelector("div#" + tabElementId).querySelector("button.raceway." + defaultDestination);
        if (targetElement) {
            clearInterval(destinationTimer);
            dispatchDestinationClick(targetElement);
            focusTravelButton();
        } else {
            console.error("QuickTravel: Can not find destination button.");
        }
    }, 100);

    function dispatchDestinationClick(element) {
        console.log("QuickTravel: dispatchDestinationClick");
        element.dispatchEvent(new Event("click", { bubbles: true }));
    }

    let confirmTimer = null;

    function focusTravelButton() {
        const targetElement = document
            .querySelector("div#" + tabElementId)
            .querySelector("div.travel-container.full-map")
            .querySelector("div.travel-info")
            .querySelector("button.torn-btn");
        if (targetElement) {
            console.log("QuickTravel: focusTravelButton");
            targetElement.addEventListener(
                "click",
                () => {
                    confirmTimer = setInterval(() => {
                        focusConfirmButton();
                    }, 100);
                },
                false
            );
            targetElement.focus({ focusVisible: true, preventScroll: true });
        }
    }

    function focusConfirmButton() {
        const targetElement = document
            .querySelector("div#" + tabElementId)
            .querySelector("div.travel-container.full-map")
            .querySelector("div.travel-confirm")
            .querySelector("button.torn-btn");
        if (targetElement) {
            console.log("QuickTravel: focusConfirmButton");
            clearInterval(confirmTimer);
            targetElement.focus({ focusVisible: true, preventScroll: true });
        }
    }
})();
