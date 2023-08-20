// ==UserScript==
// @name         BazaarScan
// @namespace    TornExtensions
// @version      2.3.0
// @description
// @author       guoguo
// @match        https://www.torn.com/*
//
// ==/UserScript==

(function() {
        'use strict';

        // avoid over loading in pda
        try {
            const __win = window.unsafeWindow || window;
            if (__win.BazaarScan) return;
            __win.BazaarScan = true;
            window = __win; // fix unsafeWindow
        } catch (err) {
            console.log(err);
        }

        // 加载格式化库
        function tornInputMoneyInject() {;
            (function($, window, document, undefined) {
                'use strict';
                var pluginName = 'tornInputMoney';

                function Plugin(element, options) {
                    var el = element;
                    var $el = $(element);
                    $.fn[pluginName].defaults = { version: "1.0", symbol: '$', showSymbolButton: true, errorClass: 'error', successClass: 'success', groupMoneyClass: 'input-money-group', symbolMoneyClass: 'input-money-symbol', inputMoneyClass: 'input-money', inputHiddenMoneyClass: '', buttonElement: $('.torn-btn'), buttonDisabledClass: 'disabled', buttonDisabledAttribute: 'disabled', moneySourceData: 'data-money', title: "Click here to add the maximum amount, or use shortcuts like <br /> 5k, 1.5m, max, half, quarter, 1/2, 1/3, 1/4, 25%", strictMode: true, ajaxAction: null, disabled: false, disabledAutoCorrect: true, allowNegativeNumbers: false, skipBlurCheck: false, minValue: 'data-minvalue', onInit: function() {}, onDestroy: function() {} };
                    options = $.extend({}, $.fn[pluginName].defaults, options);
                    var reNumsSign = options.allowNegativeNumbers ? '[-]?' : '';
                    var rules = { digit: function(value) { var re = new RegExp('^(' + reNumsSign + '[1-9]\\d*)$', 'i'); var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); return (inputMatch) ? inputMatch[1] : null; }, float: function(value) { var re = new RegExp('^(' + reNumsSign + '[1-9]\\d*(?:[,]\\d{3})*)(?:[.]\\d{10})?$', 'i'); var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); return (inputMatch) ? inputMatch[1] : null; }, all: function(value) { var re = /^(all|max){1}$/i; var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); var moneySourceData = $el.attr(options.moneySourceData); return (inputMatch && moneySourceData) ? moneySourceData : null; }, thousand: function(value) { var re = new RegExp('^(' + reNumsSign + '\\d+[.]?(\\d{1,3})?)k$', 'i'); var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); return (inputMatch) ? Math.round(inputMatch[1] * 1000) : null; }, million: function(value) { var re = new RegExp('^(' + reNumsSign + '\\d+[.]?(\\d{1,6})?)m$', 'i'); var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); return (inputMatch) ? Math.round(inputMatch[1] * 1000000) : null; }, billion: function(value) { var re = new RegExp('^(' + reNumsSign + '\\d+[.]?(\\d{1,9})?)b$', 'i'); var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); return (inputMatch) ? Math.round(inputMatch[1] * 1000000000) : null; }, quarter: function(value) { var re = /^(1\/4|quarter){1}$/i; var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); var moneySourceData = $el.attr(options.moneySourceData); return (inputMatch && moneySourceData) ? Math.round(parseInt(moneySourceData) / 4) : null; }, third: function(value) { var re = /^(1\/3){1}$/i; var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); var moneySourceData = $el.attr(options.moneySourceData); return (inputMatch && moneySourceData) ? Math.round(parseInt(moneySourceData) / 3) : null; }, half: function(value) { var re = /^(1\/2|half){1}$/i; var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); var moneySourceData = $el.attr(options.moneySourceData); return (inputMatch && moneySourceData) ? Math.round(parseInt(moneySourceData) / 2) : null; }, percent: function(value) { var re = /^([1-9][0-9]?|100)%$/i; var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); var moneySourceData = $el.attr(options.moneySourceData); return (inputMatch && moneySourceData) ? Math.round(parseInt(moneySourceData) * inputMatch[1] / 100) : null; }, firstZero: function(value) { var re = /^([0])/i; var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); var limitAttr = $el.attr(options.moneySourceData); var limitValue = limitAttr ? parseInt(limitAttr.replace(/,/g, '')) : null; return (inputMatch && limitValue == 0) ? inputMatch[1] : null; }, zero: function(value) { var re = /^([0])$/i; var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); return (inputMatch && !options.strictMode) ? inputMatch[1] : null; }, fraction: function(value) { var re = /^(([1-9])\/([2-9]|10))$/i; var inputValue = value || $el.val(); var inputMatch = re.exec(inputValue); var moneySourceData = $el.attr(options.moneySourceData); return (inputMatch && moneySourceData && (parseInt(inputMatch[2]) < parseInt(inputMatch[3]))) ? Math.round(parseInt(moneySourceData) * inputMatch[2] / inputMatch[3]) : null; } };

                    function init() {
                        return $el.each(function() {
                            var $input = $(this);
                            var isDisabled = $input.attr('disabled') || options.disabled;
                            $input.attr('disabled', isDisabled);
                            $input.attr('data-lpignore', true);
                            if (isDisabled) { $input.attr('readonly', true); }
                            if (options.disabledAutoCorrect) { $input.attr('autocomplete', 'off');
                                $input.attr('autocorrect', 'off');
                                $input.attr('autocapitalize', 'off');
                                $input.attr('spellcheck', 'false'); }
                            var symbolButton = $('<input/>').attr('type', 'button').addClass('wai-btn').attr('aria-label', options.title).val(options.symbol);
                            var symbolWrapElement = $('<span/>').attr('title', options.title).addClass(options.symbolMoneyClass).append(symbolButton);
                            var groupWrapElement = $('<div/>').addClass(options.groupMoneyClass + (isDisabled ? ' disabled' : ''));
                            var parent = $input.wrap(groupWrapElement).parent();
                            $input.addClass(options.inputMoneyClass);
                            var $hiddenInput = $input.clone();
                            $hiddenInput.attr('type', 'hidden');
                            $input.after($hiddenInput);
                            $hiddenInput.addClass(options.inputHiddenMoneyClass);
                            $input.attr('name', null);
                            var moneySourceDataValue = $input.attr(options.moneySourceData);
                            if (moneySourceDataValue) { $input.attr(options.moneySourceData, moneySourceDataValue.replace(/([,\.])/g, '')); if (options.showSymbolButton) { symbolWrapElement.prependTo(parent); } } else { parent.addClass('no-max-value'); }
                            $input.on('input', function(event) {
                                var val = $el.val();
                                updateButtonElementState();
                                updateErrorState();
                                if (val) { var re = new RegExp('(' + reNumsSign + '[0-9,\\.]*)'); var matches = re.exec(val); var isNumber = matches && matches.input === matches[0]; var intVal = parseInt(val.replace(/,/g, '')); var limitAttr = $el.attr(options.moneySourceData); var limitValue = limitAttr ? parseInt(limitAttr.replace(/,/g, '')) : null; var limitValueIsExceeded = (limitValue && (intVal > limitValue)); if (!isNumber || limitValueIsExceeded) { if (limitValueIsExceeded) { updateDataMoney().then(formatter) } } } else { $el.closest('.' + options.groupMoneyClass).removeClass(options.successClass);
                                    $el.closest('.' + options.groupMoneyClass).removeClass(options.errorClass); }
                                if (val === '0' || val === '') { $el.next().val(val); }
                                formatter();
                                var $groupMoney = $el.closest('.' + options.groupMoneyClass);
                                hook('onAfterChange', { value: $el.val(), error: $groupMoney.hasClass(options.errorClass) });
                                event.preventDefault()
                            });
                            $input.on('keydown', function(event) {
                                if (isForbiddenKey(event)) { return }
                                $.data($el, 'old_position', getCursorPosition());
                                $.data($el, 'old_length', $el.get(0).value.length);
                            });
                            $input.on('select', function(event) {
                                if (isForbiddenKey(event)) { return }
                                $.data($el, 'selection_length', getSelectionLength());
                            });
                            $input.closest('.' + options.groupMoneyClass).find('.' + options.symbolMoneyClass).on('click', function(event) { if (!isDisabled && $input.attr('readonly') === undefined) { updateDataMoney().then(function() { $input.val('max');
                                        formatter();
                                        hook('onAfterMoneyUpdate'); }); } });
                            if ($input.val()) { formatter(); } else { options.buttonElement && options.buttonElement.addClass(options.buttonDisabledClass);
                                options.buttonElement && options.buttonElement.prop(options.buttonDisabledAttribute, true); }
                            checkBrowserTabVisibility();
                            hook('onInit');
                        });
                    }

                    function setCursorPosition(pos) { $el.each(function(index, elem) { if (elem.setSelectionRange) { elem.setSelectionRange(pos, pos); } else if (elem.createTextRange) { var range = elem.createTextRange();
                                range.collapse(true);
                                range.moveEnd('character', pos);
                                range.moveStart('character', pos);
                                range.select(); } }); }

                    function getInsertionPosition() { var offset = $.data($el, 'selection_length') || 0; var oldFromEndPosition = $.data($el, 'old_length') - $.data($el, 'old_position'); return nonNegative($el.get(0).value.length - oldFromEndPosition + offset); }

                    function nonNegative(val) { return val < 0 ? 0 : val }

                    function updateButtonElementState() { if (options.buttonElement) { if ($el.val()) { options.buttonElement.removeClass(options.buttonDisabledClass);
                                options.buttonElement.prop(options.buttonDisabledAttribute, false); } else { options.buttonElement.addClass(options.buttonDisabledClass);
                                options.buttonElement.attr(options.buttonDisabledAttribute, true); } } }

                    function updateErrorState() { var $groupMoney = $el.closest('.' + options.groupMoneyClass); if ($el.val()) { $groupMoney.removeClass(options.errorClass); } }

                    function getCursorPosition() {
                        var pos = 0;
                        var elem = $el.get(0);
                        if (document.selection) { elem.focus(); var Sel = document.selection.createRange(); var SelLength = document.selection.createRange().text.length;
                            Sel.moveStart('character', -elem.value.length);
                            pos = Sel.text.length - SelLength; } else if (elem.selectionStart || elem.selectionStart == '0')
                            pos = elem.selectionStart;
                        return pos;
                    }

                    function getSelectionLength() {
                        var start = 0,
                            end = 0,
                            normalizedValue, range, textInputRange, len, endRange;
                        if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") { start = el.selectionStart;
                            end = el.selectionEnd; } else { range = document.selection.createRange(); if (range && range.parentElement() == el) { len = el.value.length;
                                normalizedValue = el.value.replace(/\r\n/g, "\n");
                                textInputRange = el.createTextRange();
                                textInputRange.moveToBookmark(range.getBookmark());
                                endRange = el.createTextRange();
                                endRange.collapse(false); if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) { start = end = len; } else { start = -textInputRange.moveStart("character", -len);
                                    start += normalizedValue.slice(0, start).split("\n").length - 1; if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) { end = len; } else { end = -textInputRange.moveEnd("character", -len);
                                        end += normalizedValue.slice(0, end).split("\n").length - 1; } } } }
                        return end - start;
                    }

                    function isForbiddenKey(event) { return event.which == 65 || event.which == 17 && !event.ctrlKey || (event.which == 91 || event.which == 224) && !event.metaKey }

                    function checkBrowserTabVisibility() { $(window).focus(function() {}); }

                    function updateDataMoney() {
                        if (options.ajaxAction) { return $.ajax({ method: "POST", url: addRFC(options.ajaxAction), success: function(data) { var formattedData = hook('onMoneyUpdate', data) || data;
                                    $el.attr(options.moneySourceData, formattedData);
                                    $el.next().filter('input[type="hidden"].' + options.inputMoneyClass).attr(options.moneySourceData, formattedData); } }); }
                        return Promise.resolve()
                    }

                    function option(key, val) { if (val) { options[key] = val; } else { return options[key]; } }

                    function destroy() { $el.each(function() { var el = this; var $el = $(this); var $clonedEl = $el.clone(); var $parent = $el.parent();
                            $clonedEl.removeClass(options.inputMoneyClass);
                            $parent.before($clonedEl);
                            $el.parent().remove();
                            hook('onDestroy');
                            $el.removeData('plugin_' + pluginName); }); }

                    function hook(hookName, args) { var arg = args || {}; if (options[hookName] !== undefined) { return options[hookName].call(el, arg); } }

                    function formatter() {
                        var result;
                        var inputValue = $el.val().replace(/,/g, '');
                        $.each(rules, function(rulename, method) {
                            inputValue = $.trim(inputValue);
                            result = method.call(this, inputValue);
                            if (result || result == 0) {
                                var intValue = parseInt(result.toString().replace(/,/g, ''));
                                var limitAttr = $el.attr(options.moneySourceData);
                                var limitValue = limitAttr ? parseInt(limitAttr.replace(/,/g, '')) : null;
                                if ((limitValue || limitValue == 0) && intValue >= limitValue) { intValue = limitValue; }
                                inputValue = intValue.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1,');
                                $el.next().val(intValue);
                                return false;
                            }
                        });
                        if ($el.val() != inputValue) {
                            var input = $el.get(0);
                            var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            nativeInputValueSetter.call(input, inputValue);
                            try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { console.error('Couldn\'t dispatch the event') }
                            setCursorPosition(getInsertionPosition());
                            $.data($el, 'selection_length', 0);
                        }
                        var $groupMoney = $el.closest('.' + options.groupMoneyClass).removeClass(options.successClass).removeClass(options.errorClass);
                        var $button = options.buttonElement;
                        var minLimitAttr = $el.attr(options.minValue);
                        var minValue = minLimitAttr ? parseInt(minLimitAttr.replace(/,/g, '')) : null;
                        const isLowerThenMinValue = (minValue || minValue == 0) && inputValue < minValue
                        if (result && (result != 0 || !options.strictMode) && !isLowerThenMinValue) { $groupMoney.addClass(options.successClass);
                            $button && $button.removeClass(options.buttonDisabledClass);
                            $button && $button.prop(options.buttonDisabledAttribute, false); } else if (inputValue.length > 0) { $groupMoney.addClass(options.errorClass);
                            $button && $button.addClass(options.buttonDisabledClass);
                            $button && $button.prop(options.buttonDisabledAttribute, true); }
                    }

                    function addRules(nameRules, actionRules) { var customRules = {}; var $el = $el;
                        customRules[nameRules] = actionRules;
                        rules = $.extend(rules, customRules); }
                    init();
                    return { option: option, destroy: destroy, format: formatter, addRules: addRules };
                }
                $.fn[pluginName] = function(options) { if (typeof arguments[0] === 'string') { var methodName = arguments[0]; var args = Array.prototype.slice.call(arguments, 1); var returnVal;
                        this.each(function() { if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') { returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args); } else { throw new Error('Method ' + methodName + ' does not exist on jQuery.' + pluginName); } }); if (returnVal !== undefined) { return returnVal; } else { return this; } } else if (typeof options === "object" || !options) { return this.each(function() { if (!$.data(this, 'plugin_' + pluginName)) { $.data(this, 'plugin_' + pluginName, new Plugin(this, options)); } }); } };
            })(jQuery, window, document);
        }
        tornInputMoneyInject();

        // set/get
        function ext_getValue(key, default_value = null) {
            let val = window.localStorage.getItem(key);
            if (val === undefined || val === null) {
                return default_value;
            }
            try {
                val = JSON.parse(val);
                if (val == '[]') {
                    val = []
                }
                return val;
            } catch (err) {
                console.log(err);
                console.log(val);
                return val;
            }
        }

        function ext_setValue(key, val) {
            return window.localStorage.setItem(key, JSON.stringify(val));
        }

        function mlog(s) {
            console.log(`[扫货助手] ${s}`);
        }

        // Fix by bot_7420 [2937420]: Do not override default jQuery.
        //const $ = window.jQuery;

        let API_KEY = '*'
        if (API_KEY == '*') {
            API_KEY = localStorage.getItem("APIKey");
        }

        let watching = false;

        let watchLoop = ext_getValue("shzs-watch-loop", 30);
        let pointPrice = ext_getValue("shzs-pt-price", 0);
        let watchingItems = ext_getValue("shzs-watching-items", {
            "Xanax": {
                "price": 830000,
                "count": 1,
                "watched": true,
            }
        });
        let latestRefresh = ext_getValue('shzs-latest-refresh', 0);

        let tornItems = ext_getValue('shzs-tornItems', {});
        async function updateTornItems() {
            const res = await fetch(`https://api.torn.com/torn/?selections=items&key=${API_KEY}`);
            const fetchItems = (await res.json()).items;
            let dict = {};
            Object.keys(fetchItems).forEach((itemId) => {
                dict[fetchItems[itemId].name] = itemId;
            });
            ext_setValue('shzs-tornItems', dict);
            tornItems = ext_getValue('shzs-tornItems', {});
        }
        if (Object.keys(tornItems).length <= 0) {
            updateTornItems();
        }

        $("head").after(`
        <style>
        .shzs-pointer {
            cursor:pointer;
        }
        .shzs-working {
            animation:shzs-anim-spin 1000ms;
            animation-iteration-count: infinite;
            animation-timing-function: ease-in-out;
        }
        @keyframes shzs-anim-spin {
            from {
                transform: rotate(0turn);
            }
            to {
                transform: rotate(1turn);
            }
        }
        .shzs-dropin {
            animation:shzs-anim-dropin 500ms;
            animation-iteration-count: 1;
            animation-timing-function: ease-in-out;
        }
        .shzs-dropout {
            animation:shzs-anim-dropout 500ms;
            animation-iteration-count: 1;
            animation-timing-function: ease-in-out;
        }
        @keyframes shzs-anim-dropin {
            from {
                transform: rotate(-30deg) translateY(-100%);
                opacity: 0;
            }
            to {
                transform: rotate(0deg) translateY(0%);
                opacity: 1;
            }
        }
        @keyframes shzs-anim-dropout {
            from {
                transform: rotate(0deg) translateY(0%);
                opacity: 1;
            }
            to {
                transform: rotate(-30deg) translateY(-100%);
                opacity: 0;
            }
        }
        </style>
    `);

        function formatMoney(num) {
            return Number(num.replace(/\$|,/g, ''));
        }

        function formatMoney2(num) {
            return num.toString().replace(/\d{1,3}(?=(\d{3})+$)/g, function(s) { return s + "," }).replace(/^[^\$]\S+/, function(s) { return s });
        }

        function formatNumber2(x) {
            if (x < 0) {
                return '-' + formatNumber2(-x);
            } else if (x == 0) {
                return '0';
            } else if (x <= 1) {
                return parseFloat((x * 100).toFixed(2)) + '%'
            } else if (x < 1e3) {
                return '' + parseInt(x);
            } else if (x >= 1e3 && x < 1e6) {
                return parseFloat((x / 1e3).toFixed(2)) + 'k';
            } else if (x >= 1e6 && x < 1e9) {
                return parseFloat((x / 1e6).toFixed(2)) + 'm';
            } else if (x >= 1e9 && x < 1e12) {
                return parseFloat((x / 1e9).toFixed(2)) + 'b';
            } else if (x >= 1e12 && x < 1e15) {
                return parseFloat((x / 1e12).toFixed(2)) + 't';
            } else if (x >= 1e15) {
                return "MAX";
            }
            return 'error';
        }

        async function fetchLowestPoint() {
            return fetch(`https://api.torn.com/market/?selections=pointsmarket&key=${API_KEY}`)
                .then((res) => res.json())
                .then((res) => {
                    let points = res.pointsmarket;
                    let lowest = null;
                    Object.keys(points).forEach((key) => {
                        let info = points[key];
                        let price = parseInt(info.cost);
                        if (!lowest || price < parseInt(lowest.cost)) {
                            lowest = info;
                        }
                    });
                    return lowest;
                })
                .catch(e => console.log("fetch error", e));
        }

        async function fetchLowestItem(itemName) {
            const itemId = tornItems[itemName];
            return fetch(`https://api.torn.com/market/${itemId}?selections=&key=${API_KEY}`)
                .then((res) => res.json())
                .then((res) => {
                    return res.bazaar[0];
                })
                .catch(e => console.log("fetch error", e));
        }
        
        async function fetchItems(itemName) {
            const itemId = tornItems[itemName];
            return fetch(`https://api.torn.com/market/${itemId}?selections=&key=${API_KEY}`)
                .then((res) => res.json())
                .then((res) => {
                    return res.bazaar;
                })
                .catch(e => console.log("fetch error", e));
        }

        // 状态栏图标
        $("[class^=status-icons]").prepend('<li id="shzs-icon-btn" class="icon6___SHZS" title="扫货助手" style="cursor: pointer; background-image:url(/images/v2/editor/emoticons.svg); background-position: -140px -42px;"></li>')
        $('#shzs-icon-btn').click(function() {
                    function makeWrapper() {
                        let wrapperHTML = `
            <div id="shzs-wrapper" style="width: inherit;">
                <div style="margin:10px; border:1px solid darkgray; font-size:14px; text-align:center; background-color: #e5e5e5;">
                    <div style="font-size:18px; font-weight: bold; margin:5px 0px;">扫货助手 - <button id="shzs-item-start" class="border-round shzs-pointer" style="height: 24px;padding: 2px 5px; margin:3px; background-color:#8fbc8f; color:white;">开始</button></div>
                    <div style="background-color: darkgray;height: 1px;"></div>
                    <div style="margin:5px 0px;">
                        监视间隔(s): </span><input id="shzs-watch-loop" type="text" class="border-round" style="height:20px; width:170px; margin: 0 5px; padding: 0 5px;" placeholder="${`当前: ${watchLoop}, 0为不监视`}">
                    </div>
                    <div style="background-color: darkgray;height: 1px;"></div>
                    <div style="margin:5px 0px;">
                        监视PT价格: </span><input id="shzs-pt-input" type="text" class="border-round shzs-price-input" style="height:20px; width:170px; margin: 0 5px; padding: 0 5px;" placeholder="${`当前: ${pointPrice}, 0为不监视`}">
                    </div>
                    <div style="background-color: darkgray;height: 1px;"></div>
                    <div style="margin:5px 0px;">
                        <input id="shzs-item-name" class="border-round shzs-item-addbtn-control" list="shzs-dl-tornitems" placeholder="商品名称" style="height:25px; width:75px; margin: 0 5px; padding: 0 5px;">
                        <input id="shzs-item-price" class="shzs-item-addbtn-control border-round shzs-price-input" title="留空则删除" placeholder="监视价格" style="height:25px; width:80px; margin: 0 5px; padding: 0 5px;">
                        <input id="shzs-item-count" class="shzs-item-addbtn-control border-round" title="留空则删除" placeholder="最低数量" style="height:25px; width:75px; margin: 0 5px; padding: 0 5px;">
                        <button id="shzs-item-add" class="border-round shzs-pointer" style="height: 24px;padding: 2px 5px; margin:3px; background-color:#65a5d1; color:white;">添加</button>
                        <div id="shzs-item-current-price-wrapper" style="display: none; color: darkslategray;font-style: italic;font-size: 12px; margin:5px;"><span id="shzs-item-current-price-text" class="shzs-pointer shzs-item-current-price"></span>
                            <button id="shzs-item-current-price-5" class="border-round shzs-pointer shzs-item-current-price" style="padding: 0 2px; background-color:#8fbc8f; color:white;">-5%</button>
                            <button id="shzs-item-current-price-10" class="border-round shzs-pointer shzs-item-current-price" style="padding: 0 2px; background-color:#8fbc8f; color:white;">-10%</button>
                            <button id="shzs-item-current-price-20" class="border-round shzs-pointer shzs-item-current-price" style="padding: 0 2px; background-color:#8fbc8f; color:white;">-20%</button>
                            <a id="shzs-item-current-bazaar" style="display: inline;" target="_blank"><svg style="margin: 0 5px;width: 15px;vertical-align: bottom;" viewBox="0 0 16 17" xmlns="http://www.w3.org/2000/svg"><path class="cls-3" d="M6.63,0,6,3.31v.74A1.34,1.34,0,0,1,3.33,4V3.31L5.33,0Zm-2,0L2.67,3.31v.74A1.33,1.33,0,0,1,1.33,5.33,1.32,1.32,0,0,1,0,4V3.31L3.25,0ZM16,4a1.32,1.32,0,0,1-1.33,1.29A1.37,1.37,0,0,1,13.33,4V3.27L11.41,0h1.34L16,3.31ZM9.33,3.27V4A1.33,1.33,0,0,1,6.67,4V3.27L7.37,0H8.63ZM10.67,0l2,3.33v.74a1.3,1.3,0,0,1-1.33,1.26A1.36,1.36,0,0,1,10,4V3.27L9.37,0ZM.67,6.67V16H7.33V14.67H2V8H14v8h1.33V6.67Zm12,2.66h-4V16h4Z"></path></svg></a>
                        </div>
                        <datalist id="shzs-dl-tornitems">
                        </datalist>
                    </div>
                    <div id="shzs-watching-wrapper" style="padding:0 0 5px 0">
                        <table id="shzs-watching-tb" style="margin:auto; width:100%; max-width:350px; background-color:white; overflow: hidden; word-break:break-all;">
                        </table>
                        <div id="shzs-api-alert" style="margin: 5px;font-size: 11px;font-style: italic;"></div>
                    <div>
                </div>
            </div>`;

            function makeItemOptions(){
                let options = '';
                Object.keys(tornItems).forEach((key) => {
                    options += `<option value="${key}">`;
                })
                $('#shzs-dl-tornitems').html(options);
            }

            function makeApiAlert(){
                // api使用提示
                if (watchLoop <= 0) {
                    $('#shzs-api-alert').text('');
                } else {
                    let apiUseCountPerLoop = 0;
                    if (pointPrice > 0) apiUseCountPerLoop += 1;
                    Object.keys(watchingItems).forEach((key) => {
                        let info = watchingItems[key];
                        if (info.watched) apiUseCountPerLoop += 1;
                    });
                    const apiUsePerSecond = Math.ceil(apiUseCountPerLoop * 60.0 / watchLoop);
                    $('#shzs-api-alert').text(`预计每分钟api使用次数: ${apiUsePerSecond}`);
                    if (apiUsePerSecond < 25) $('#shzs-api-alert').css('color', 'darkgreen');
                    else if (apiUsePerSecond < 50) $('#shzs-api-alert').css('color', 'darkblue');
                    else if (apiUsePerSecond < 75) $('#shzs-api-alert').css('color', 'darkred');
                    else $('#shzs-api-alert').css('color', 'red');
                }
            }

            function makeWatchingTable(){
                let html = `<tr>
                <th width="50px">监视</th>
                <th>商品名(最低提醒数量)</th>
                <th>价格</th>
                <tr>`;
                Object.keys(watchingItems).forEach((itemName) => {
                    const info = watchingItems[itemName];
                    let count = 1;
                    if (info.count) {
                        count = info.count;
                    }
                    html += `<tr>
                    <td><input type="checkbox" ${info.watched ?'checked="checked"' :''}" class="shzs-watchtb-checkbox" data-name="${itemName}"></td>
                    <td class="shzs-watchtb-name shzs-pointer" data-name="${itemName}">${itemName}(${count})</td>
                    <td class="shzs-watchtb-price shzs-pointer" data-price="${info.price}">${formatMoney2(info.price)}</td>
                    <tr>`
                });

                $('#shzs-watching-tb').html(html);
                $("#shzs-watching-tb th").attr("style", "border: 1px solid darkgray;padding: 5px;background-color: black;color: white;font-weight: bold;text-align:center;");      
                $("#shzs-watching-tb td").attr("style", "border: 1px solid darkgray;padding: 4px 8px;background-color: white;color: black;text-align:center;");      

                makeApiAlert();

                // checkbox事件
                $('.shzs-watchtb-checkbox').bind('change', function(){
                    const itemName = $(this).attr('data-name');
                    watchingItems[itemName].watched = !watchingItems[itemName].watched;
                    mlog(`watch ${itemName}: ${!watchingItems[itemName].watched} -> ${watchingItems[itemName].watched}`);
                    ext_setValue('shzs-watching-items', watchingItems);
                    watchingItems = ext_getValue('shzs-watching-items');
                    makeWatchingTable();
                });

                // name事件
                $('.shzs-watchtb-name').bind('click', function(){
                    const itemName = $(this).attr('data-name');
                    $('#shzs-item-name').val(itemName);
                    $('#shzs-item-name').trigger('input');
                });

                // price事件
                $('.shzs-watchtb-price').bind('click', function(){
                    const itemPrice = parseInt($(this).attr('data-price'));
                    if (itemPrice > 0) {
                        $('#shzs-item-price').val(itemPrice);
                        $('#shzs-item-price').trigger('input');
                    }
                });
            }

            $('.content-wrapper').prepend(wrapperHTML);

            // input格式化
            $('.shzs-price-input').tornInputMoney({
                "groupMoneyClass": null,
            });
            $('.shzs-price-input').parent().css('display', 'inline-block');

            // 添加下拉框
            makeItemOptions();

            makeWatchingTable();

            // start / pause
            $('#shzs-item-start').bind('click', function(){
                if (watching) {
                    $(this).css('background-color', '#8fbc8f');
                    $(this).text('开始');
                    $('#shzs-icon-btn').removeClass('shzs-working');
                    document.title = "[扫货暂停]"
                } else {
                    $(this).css('background-color', '#ff7373');
                    $(this).text('暂停');
                    $('#shzs-icon-btn').addClass('shzs-working');
                }
                watching = !watching;
            });

            // watch loop
            $('#shzs-watch-loop').bind('change', function(){
                let prev = watchLoop;
                let curr = $(this).val();
                if (parseInt(curr) >= 0) {
                    ext_setValue("shzs-watch-loop", curr);
                    watchLoop = ext_getValue("shzs-watch-loop");
                    $(this).val('');
                    $(this).attr('placeholder', `${`当前: ${watchLoop}, 0为不监视`}`);
                    mlog(`watch loop ${prev} -> ${watchLoop}`);
                    makeApiAlert();
                }
            });

            // pt
            $('#shzs-pt-input').bind('change', function(){
                let prev = pointPrice;
                let curr = formatMoney($(this).val());
                if (parseInt(curr) >= 0) {
                    ext_setValue("shzs-pt-price", curr);
                    pointPrice = ext_getValue("shzs-pt-price");
                    $(this).attr('placeholder', `${`当前: ${pointPrice}, 0为不监视`}`);
                    mlog(`price ${prev} -> ${pointPrice}`);
                    makeApiAlert();
                }
            });
            $('#shzs-pt-input').bind('change', function(){
                $(this).val('');
            });

            // 点击当前低价时将价格填入
            $('.shzs-item-current-price').bind('click', function(){
                const itemPrice = parseInt($(this).attr('data-price'));
                $('#shzs-item-price').val(itemPrice);
                $('#shzs-item-price').trigger('input');
            });

            // 输入商品名事件
            $("#shzs-item-name").bind('input', function(){
                const inputName = $(this).val();
                const filtered = Object.keys(tornItems).filter((name) => name.toLowerCase() === inputName.toLowerCase());
                if (filtered.length > 0) {
                    const itemName = filtered[0];
                    fetchLowestItem(itemName).then((lowest) => {
                        if (inputName === $(this).val()) {
                            $('#shzs-item-current-price-wrapper').css('display', 'block');
                            $('#shzs-item-current-price-text').text(`${itemName}当前最低价: ${parseInt(lowest.cost)}`);
                            $('#shzs-item-current-bazaar').attr('href', `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${itemName}`);
                            $('#shzs-item-current-price-text').attr('data-price', `${parseInt(lowest.cost)}`);
                            $('#shzs-item-current-price-5').attr('data-price', `${parseInt(parseInt(lowest.cost) * 0.95)}`);
                            $('#shzs-item-current-price-10').attr('data-price', `${parseInt(parseInt(lowest.cost) * 0.9)}`);
                            $('#shzs-item-current-price-20').attr('data-price', `${parseInt(parseInt(lowest.cost) * 0.8)}`);
                        }
                    });
                } else {
                    $('#shzs-item-current-price-wrapper').css('display', 'none');
                }
            });

            // 输入时改变添加按钮的状态
            $('.shzs-item-addbtn-control').bind('input', function(){
                const priceText = $("#shzs-item-price").val();
                const countText = $("#shzs-item-count").val();
                if (priceText.length == 0 && countText.length == 0) {
                    $('#shzs-item-add').text('删除');  
                    $('#shzs-item-add').css('background-color', '#ff7373');
                } else {
                    $('#shzs-item-add').text('添加');
                    $('#shzs-item-add').css('background-color', '#65a5d1');
                }
            });

            // 提交商品事件
            $("#shzs-item-add").bind('click', function(){
                const inputName = $('#shzs-item-name').val();
                const priceText = $("#shzs-item-price").val();
                const price = formatMoney(priceText);
                const countText = $("#shzs-item-count").val();
                let count = 1;
                if (countText.length > 0) {
                    count = parseInt(countText);
                }

                if (price >= 0) {} else {
                    return;
                }
                if (count >= 0) {} else {
                    return;
                }

                const filtered = Object.keys(tornItems).filter((name) => name.toLowerCase() === inputName.toLowerCase());
                mlog(`add filter: ${filtered}`);
                if (filtered.length > 0) {
                    const itemName = filtered[0];
                    if (priceText.length == 0 && countText.length == 0) {
                        delete watchingItems[itemName];
                        mlog(`delete ${itemName}`);
                    } else {
                        let item = watchingItems[itemName];
                        if (!item) {
                            item = {
                                'price': 0,
                                'count': 1,
                                'watched': true
                            }
                        }
                        if (priceText.length > 0) {
                            item.price = price
                        }
                        if (countText.length > 0) {
                            item.count = count;
                        }
                        watchingItems[itemName] = item
                        mlog(`add ${JSON.stringify(watchingItems[itemName])}`);
                    }
                    ext_setValue('shzs-watching-items', watchingItems);
                    watchingItems = ext_getValue('shzs-watching-items');
                    makeWatchingTable();
                }
            });
        }

        if ($('#shzs-wrapper').length > 0) {
            $('#shzs-wrapper').addClass('shzs-dropout');
            setTimeout(()=> {
                $('#shzs-wrapper').remove();
            }, 500);
        } else {
            makeWrapper();
            $('#shzs-wrapper').addClass('shzs-dropin');
        }
    });

    let dotCount = 0;
    setInterval(function(){
        let currentTimestamp = new Date().getTime() / 1000.0;

        if (watching) {
            dotCount = (dotCount + 1) % 4;
            let title = `[扫货暂停中]`;
            if (watchLoop > 0) {
                let timeLeft = parseInt(watchLoop - (currentTimestamp - latestRefresh));
                title = `[扫货中] (${timeLeft > 0 ?`${timeLeft}s` :'更新中'})`;
            }
            for (let i = 0; i < dotCount; ++i) title += '.';
            document.title = title;
            window.onbeforeunload = function(){
                return "正在扫货, 确定要离开吗QAQ";
            };
        } else {
            window.onbeforeunload = null;
        }

        if (watching && watchLoop > 0 && currentTimestamp - latestRefresh > watchLoop) {
            mlog(`refresh ${latestRefresh} -> ${currentTimestamp}`);
            ext_setValue('shzs-latest-refresh', currentTimestamp);
            latestRefresh = ext_getValue('shzs-latest-refresh');

            // pt
            if (pointPrice > 0) {
                fetchLowestPoint().then((lowest) => {
                    mlog(`pt watch: ${lowest.cost} - ${pointPrice}`);
                    if (lowest.cost <= pointPrice) {
                        NotificationComm(`[扫货助手] PT ${lowest.cost}`, `${formatMoney2(lowest.cost)} x${lowest.quantity} | 总价: ${formatNumber2(parseInt(lowest.total_cost))}`, 'https://www.torn.com/pmarket.php');
                    }
                });
            }

            // items
            Object.keys(watchingItems).forEach((itemName) => {
                let info = watchingItems[itemName];
                let count = 1;
                if (info.count) {
                    count = info.count;
                }
                if (info.watched) {
                    fetchItems(itemName).then((items) => {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (item.cost > info.price) {
                                break;
                            }
                            if (item.quantity >= count) {
                                mlog(`${itemName} watch: ${item.cost} - ${info.price} count: ${item.quantity}`);
                                NotificationComm(`[扫货助手] ${itemName} ${formatNumber2(item.cost)}`, `${formatMoney2(item.cost)} x${item.quantity} | 总价: ${formatNumber2(item.quantity * item.cost)}`, `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${itemName}`);
                                break;
                            }
                        }
                    });
                }
            });
        }
    }, 500); 

    function NotificationComm(title, body, url, option) {
        if ('Notification' in window) { // 判断浏览器是否兼容Notification消息通知
            window.Notification.requestPermission(function(res) { // 获取用户是否允许通知权限
                if (res === 'granted') { // 允许
                    let notification = new Notification(title || '这是一条新消息', Object.assign({}, {
                        dir: "auto", // 字体排版,auto,lt,rt
                        icon: '', // 通知图标
                        body: body || '请尽快处理该消息', // 主体内容
                        renotify: false // 当有新消息提示时，是否一直关闭上一条提示
                    }, option || {}));
                    notification.onerror = function(err) { // error事件处理函数
                        throw err;
                    }
                    notification.onshow = function(ev) { // show事件处理函数
                    }
                    notification.onclick = function(ev) { // click事件处理函数
                        window.open(url);
                        notification.close();
                    }
                    notification.onclose = function(ev) { // close事件处理函数
                    }
                } else {
                    alert('该网站通知已被禁用，请在设置中允许');
                }
            });
        } else { // 兼容当前浏览器不支持Notification的情况
            const documentTitle = document.title,
                index = 0;
            const time = setInterval(function() {
                index++;
                if (index % 2) {
                    document.title = '【　　　】' + documentTitle;
                } else {
                    document.title = '【新消息】' + documentTitle;
                }
            }, 1000);
            const fn = function() {
                if (!document.hidden && document.visibilityState === 'visible') {
                    clearInterval(time);
                    document.title = documentTitle;
                }
            }
            fn();
            document.addEventListener('visibilitychange', fn, false);
        }
    }
})();