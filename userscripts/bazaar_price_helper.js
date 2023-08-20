// ==UserScript==
// @name         Bazaar Price Helper
// @namespace    SMTH
// @version      1.1.0
// @description  自动填充bazaar上架价格
// @author       Mirrorhye [2564936], bot_7420 [2937420]
// @match        https://www.torn.com/bazaar.php*
// @connect      api.torn.com
// ==/UserScript==

(function() {
    'use strict';

    // avoid over loading in pda
    try {
        const __win = window.unsafeWindow || window;
        if (__win.BazaarPriceHelper) return;
        __win.BazaarPriceHelper = true;
        window = __win; // fix unsafeWindow
    } catch (err) {
        console.trace(err);
    }

    function mir_get(key, preset) {
        if (window.localStorage === undefined) {
            return preset;
        }
        else if (!window.localStorage.getItem(key)) {
            return preset;
        }
        else {
            return window.localStorage.getItem(key);
        }
    }

    function mir_set(key, value) {
        if (window.localStorage === undefined){
            return;
        }
        else {
            window.localStorage.setItem(key, value);
        }
    }

    function mir_log(s) {
        console.log(`[BPH] ${s}`)
    }

    let positionKey = "bph_position";
    let position = mir_get(positionKey, 0);
    mir_set(positionKey, position);
    let premiumKey = "bph_premium";
    let premium = mir_get(premiumKey, 0.0);
    mir_set(premiumKey, premium);
    let baseKey = "bph_base";
    let base = mir_get(baseKey, '%');
    mir_set(baseKey, base);

    // 抄来的APIKey获取
    function getAPIKey() {
        let key = window.localStorage.getItem("APIKey");
        if (key == null || key == "") {
            console.log('no key...');
            if (window.location.href.indexOf('preferences.php') >= 0) {
                console.log('on setting page');
                const refresher = setInterval(function () {
                    console.log('refreshing');
                    $("input").each(function () {
                        const input_value = $(this).val();
                        if (input_value.length == 16) {
                            key = input_value;
                            window.localStorage.setItem("APIKey", key);
                            console.log("apikey get " + key);
                            clearInterval(refresher);
                            alert('APIKey设置成功，点击确定前往主页');
                            window.location.href = 'https://www.torn.com/index.php';
                        }
                    });
                }, 300);
            }
            else {
                console.log('switch to setting page');
                alert('APIKey未设置或设置错误，点击确定前往设置页面');
                window.location.href = 'https://www.torn.com/preferences.php#tab=api';
            }
        }
        return key;
    }
    var API_KEY = getAPIKey();

    const bingwa_color_pool = {
        'gray': '#adadad',
        'red': '#ff7373',
        'green': '#8fbc8f',
        'blue': '#65a5d1',
        'purple': '#8d6dd7',
        'yellow': '#f39826',
        'yellowgreen': '#83a000',
        'pink': '#e467b3',
        'salmon': '#F9CDAD',
        'orange': '#FFDEAD'
    };

    function formatMoney(num) {
        return num.replace(/,/g, '');
    }
    function formatMoney2(num) {
        return num.toString().replace(/\d{1,3}(?=(\d{3})+$)/g, function(s) { return s + "," }).replace(/^[^\$]\S+/, function(s) { return s });
    }

    const marketValuePos = -10086;
    function prices_choose_strategy(itemPrices, item_value) {
        try {
            let position = parseInt(mir_get(positionKey, 0));
            let price = 0;
            if (position == marketValuePos) {
                price = item_value;
            } else {
                price = itemPrices[Math.max(Math.min(itemPrices.length, position), 0)]
            }
            let premium = parseFloat(mir_get(premiumKey, 0.0));
            let base = mir_get(baseKey, '%');
            if (base === '%') {
                return Math.ceil(price * (1 + (premium / 100.0)));
            } else {
                return Math.ceil(price + premium);
            }
        } catch(err) {
            console.trace(err);
            return 0;
        }
    }

    function mark(item, price) {
        $(item).attr('bph-marked', price);
    }

    function getMarked(item) {
        return $(item).attr('bph-marked');
    }

    function isNeedUpdate(item) {
        return $(item).attr('bph-needUpdate') == 'true';
    }

    function markAllNeedUpdate() {
        $('[bph-marked]').each(function(){
            $(this).attr('bph-needUpdate', 'true');
        });
    }
    function unmarkNeedUpdate(item) {
        $(item).attr('bph-needUpdate', null);
    }

    set_monitor();

    function set_monitor() {
        // 价格位置变更
        function onPositionChange() {
            let position = parseInt($("#bph_position_select").attr('value'));
            $("#bph_position_select").attr('value', position);
            let prev_position = mir_get(positionKey);
            mir_set(positionKey, position);
            mir_log(`[position] change: ${prev_position} -> ${position}`);
            markAllNeedUpdate();
        }
        // 溢价变更
        function onPremiumChange() {
            let premium = parseFloat($("#bph_preInput").attr('value'));
            if (isNaN(premium)) {
                premium = 0.0;
            }
            $("#bph_preInput").attr('value', premium);
            let prev_premium = mir_get(premiumKey);
            mir_set(premiumKey, premium);
            mir_log(`[premium] change: ${prev_premium} -> ${premium}`);
            markAllNeedUpdate();
        }
        // 单位变更
        function onBaseChange() {
            let base = $("#bph_base_select").attr('value');
            $("#bph_base_select").attr('value', base);
            let prev_base = mir_get(baseKey);
            mir_set(baseKey, base);
            mir_log(`[base] change: ${prev_base} -> ${base}`);
            markAllNeedUpdate();
        }

        function updateUI() {
            mir_log(`页面更新`);
            if ($("div[class^=appHeaderWrapper]").length > 0 && $("div[class=bph_header]").length == 0) {
                function positionSelect() {
                    let position = mir_get(positionKey, 0);
                    let html = `<select id="bph_position_select">`;
                    if (position == marketValuePos) {
                        html += `<option value="${marketValuePos}" selected="selected">market value</option>`;
                    } else {
                        html += `<option value="${marketValuePos}">market value</option>`;
                    }
                    for (let i = 0; i < 10; i++) {
                        if (i == position) {
                            html += `<option value="${i}" selected="selected">市场第${i+1}低</option>`;
                        } else {
                            html += `<option value="${i}">市场第${i+1}低</option>`;
                        }
                    }
                    html += `</select>`;
                    return html;
                }

                function baseSelect() {
                    let base = mir_get(baseKey, 0);
                    let html = `<select id="bph_base_select">`;
                    html += `<option value="%" ${base === '%' ?'selected="selected"' :""}>%</option>`;
                    html += `<option value=" " ${base === ' ' ?'selected="selected"' :""}> </option>`;
                    html += `</select>`;
                    return html;
                }

                let premium = mir_get(premiumKey, 0.0);
                $("div[class^=appHeaderWrapper]").append(`<div class="bph_header" style="padding:10px 0 0 0"><div style="background-color:white;padding:10px;border:1px solid black;">以${positionSelect()}的价位为基准&nbsp;&nbsp;溢价+
                <input id="bph_preInput" value="${premium}" style="background-color:lightgray;width:30px;padding: 0 5px 0 5px;font-weight:bold;color:#333;text-align: center;">${baseSelect()}
                </div><hr class="page-head-delimiter m-top10 m-bottom10"></div>`);
                $("#bph_preInput").change(onPremiumChange);
                $("#bph_position_select").change(onPositionChange);
                $("#bph_base_select").change(onBaseChange);
            }

            if (window.location.href.endsWith('add')) {
                let additem_page_items = $('[data-group="child"]:visible');
                clearVannillaPrice(additem_page_items);
                fill_prices_at_additem(additem_page_items);
            }

            if (window.location.href.endsWith('manage')) {
                let manage_page_items = $("div[class^=item]:visible");
                fill_prices_at_manage(manage_page_items);
            }
            setTimeout(() => {
                updateUI();
            }, 100);
        }

        updateUI();
        // let observer_controls = new MutationObserver(function(mutationsList, observer) {
        //     updateUI();
        // });
        // observer_controls.observe(document.getElementById('bazaarRoot'), {childList: true, subtree: true });
    }

    // Fix: remove pre-existing price from vanilla Torn.
    const CLASS_NAME_VANILLA_PRICE_CLEARED = 'vanilla-price-cleared';
    function clearVannillaPrice(eleList) {
        eleList.each(function () {
            const input = $(this).find('[class^=price] input')[0];
            if (input && !input.classList.contains(CLASS_NAME_VANILLA_PRICE_CLEARED)) {
                input.value = '';
                input.classList.add(CLASS_NAME_VANILLA_PRICE_CLEARED);
            }
        });
    }

    $(body).prepend(`
        <style>
            .bph-changed {
                background-color: ${bingwa_color_pool.green}
            }
            .bph-pricepos {
                float: right;
                padding: 0;
                margin: 0 1px;
            }
            .bph-pricetext {
                display:inline-block;
                cursor:pointer;
                padding: 0 5px;
                line-height:20px;
                background-color:rgba(0, 0, 0, 0.7);
                color: #DED7BE;
                text-shadow: -1px 0 2px #795516, 0 1px 2px #795516, 1px 0 2px #795516, 0 -1px 2px #795516;
            }
            .bph-pricepos-wrapper {
                float:right;
            }
        </style>
    `);

    function fill_prices_at_additem(page_items) {
        function insertBtn(item, idx, price, input) {
            const clz = `bph-pricepos-${idx}`
            $(item).find(`.${clz}`).remove();
            if ($(item).find('.bph-pricepos-wrapper').length <= 0) {
                $(item).find('.info-wrap').prepend('<div class="bph-pricepos-wrapper"></div>');
            }
            const style = `"background-color:rgba(0, 0, 0, ${1 - idx*0.1})"`;
            $(item).find('.bph-pricepos-wrapper').append(`<span class="bph-pricepos ${clz}"><span class="bph-pricetext border-round" style=${style}>${formatMoney2(price)}</span></span>`);
            $(item).find(`.${clz}`).bind('click', function(){
                input.value = price;
                input.dispatchEvent(new Event("input"));
            });
        }

        page_items.each(async function(){
            let item_id = (/images\/items\/([0-9]+)\/.*/).exec($(this).find("img").attr('src'))[1];
            let itemInput = $(this).find('[class^=price] input')[0]; // 价格input

            let change = itemInput.value !== '' && itemInput.value !== 'API请求出错' && itemInput.value !== getMarked(this);
            if (change) {
                $(this).find(".price").addClass('bph-changed');
            } else {
                $(this).find(".price").removeClass('bph-changed');
            }

            // Fix: Only update row if has user input amount.
            let hasUserInputAmount = false;
            if (!$(this).find('.amount.choice-container input').length > 0 && $(this).find('.amount input').val()) {
                hasUserInputAmount = true;
            }
            let needUpdate = ((!getMarked(this) || isNeedUpdate(this)) && !change) || ($(this).attr('script-hasFilled') === 'false' && hasUserInputAmount);
            if (!needUpdate) {
                return;
            }
            try {
                let itemPrices = await getItemPrices(item_id);
                let marketValue = await getMarketValue(item_id);
                let targetValue = prices_choose_strategy(itemPrices, marketValue);
                // Fix: Only update row if has user input amount.
                console.log('targetValue update');
                $(this).attr('script-targetValue', targetValue);
                $(this).attr('script-hasFilled', 'false');
                if ($(this).attr('script-hasFilled') === 'false' && hasUserInputAmount) {
                    console.log('fill ' + $(this).attr('script-targetValue'));
                    $(this).attr('script-hasFilled', 'true');
                    itemInput.value = $(this).attr('script-targetValue');
                    itemInput.dispatchEvent(new Event('input'));
                }
                // 插入三个按钮
                for (let i = Math.min(2, itemPrices.length - 1); i >=0; i--) {
                    insertBtn(this, i, itemPrices[i], itemInput);
                }
                mark(this, targetValue);
                unmarkNeedUpdate(this);
            } catch(err) {
                console.trace(err);
                itemInput.value = 'API请求出错';
            }
        });
    }

    function fill_prices_at_manage(page_items) {
        function fill_item_price(itemInput, itemPrices, marketValue, item_detail1, item_detail2, old_price) {
            function insertBtn(idx, price) {
                const clz = `bph-pricepos-${idx}`
                $(item_detail1).find(`.${clz}`).remove();
                const style = `"background-color:rgba(0, 0, 0, ${1 - idx*0.1})"`;
                $(item_detail1).append(`<span class="bph-pricepos ${clz}"><span class="bph-pricetext border-round" style=${style}>${formatMoney2(price)}</span></span>`);
                $(item_detail1).find(`.${clz}`).bind('click', function(){
                    let color = "green";
                    if (price - old_price > 0) {
                        color = "red";
                    } else if (price - old_price == 0) {
                        color = "white";
                    }
                    item_detail2.style.color = color
                    // item_detail2.innerText = `${price - old_price}(${parseFloat((price - old_price)/old_price*100).toFixed(2)}%)`;
                    item_detail2.innerText = `${price - old_price}`;
                    itemInput.value = price + '-';
                });
            }
            // 插入三个按钮
            for (let i = Math.min(2, itemPrices.length - 1); i >=0; i--) {
                insertBtn(i, itemPrices[i]);
            }
            const item_price = prices_choose_strategy(itemPrices, marketValue);
            mir_log(`price: ${item_price}`);
            itemInput.value = item_price + '-';
        }

        page_items.each(async function() {
            let item_id = (/images\/items\/([0-9]+)\/.*/).exec($(this).find("img").attr('src'))[1];
            let itemInput = $(this).find('[class^=price] input')[0]; // 价格input

            let item_detail2 = $(this).find("div[class^=rrp]")[0];
            (() => {
                if (!$(this).attr('bph-curr')) {
                    return;
                }
                let oldPrice = parseInt(formatMoney($(this).attr('bph-curr')));
                let currentPrice = parseInt(formatMoney(itemInput.value));
                let color = "green";
                if (currentPrice - oldPrice > 0) {
                    color = "red";
                } else if (currentPrice - oldPrice == 0) {
                    color = "white";
                }
                item_detail2.style.color = color;
                item_detail2.innerText = `${currentPrice - oldPrice}`;
            })();

            let needUpdate = !getMarked(this) || (isNeedUpdate(this) && (itemInput.value === '' || itemInput.value === 'API请求出错' || itemInput.value === getMarked(this)));
            if (!needUpdate) {
                return;
            }
            if (!$(this).attr('bph-curr')) {
                let old_price = parseInt(formatMoney(itemInput.value));
                $(this).attr('bph-curr', old_price);
            }
            let old_price = parseInt(formatMoney($(this).attr('bph-curr')));
            let item_detail1 = $(this).find("div[class^=bonuses]")[0];
            try {
                let itemPrices = await getItemPrices(item_id);
                let marketValue = await getMarketValue(item_id);
                fill_item_price(itemInput, itemPrices, marketValue, item_detail1, item_detail2, old_price);
                mark(this, itemInput.value);
                unmarkNeedUpdate(this);
            } catch (err) {
                console.trace(err);
                itemInput.value = "API请求出错";
            }
        });
    }

    let request_cache = {};
    async function getItemPrices(item_id) {
        if (request_cache[item_id]) {
            return request_cache[item_id];
        } else {
            // 请求API
            const API = `https://api.torn.com/market/${item_id}?selections=&key=${API_KEY}`;
            mir_log(`请求: ${API}, item id: ${item_id}`);
            request_cache[item_id] = fetch(API).then((res) => {
                return res.json();
            }).then((json_data) => {
                let itemPrices = [];
                json_data.bazaar.forEach(e => {
                    if (typeof(e.cost) == "undefined") {
                        itemPrices.push(0)
                    } else {
                        itemPrices.push(e.cost)
                    }
                });
                itemPrices = itemPrices.sort((x, y) => x - y);
                return itemPrices;
            }).catch((err) => {
                request_cache[item_id] = null;
                throw err;
            });
            return request_cache[item_id];
        };
    }

    const delay = (t) => {
        return new Promise((r) => {
            setTimeout(()=>{
            r();
            }, t*1000)
        })
    }

    function fetchAPI(API, retry=5) {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            while (count < retry) {
                try {
                    let api = API;
                    let r = await (await fetch(api)).json();
                    resolve(r);
                    return;
                } catch {}
                await delay(1);
                count++;
            }
            reject(new Error());
        });
    }

    async function getItemPrices(item_id) {
        if (request_cache[item_id]) {
            return request_cache[item_id];
        } else {
            // 请求API
            const API = `https://api.torn.com/market/${item_id}?selections=&key=${API_KEY}`;
            mir_log(`请求: ${API}, item id: ${item_id}`);
            request_cache[item_id] = fetchAPI(API).then((json_data) => {
                let itemPrices = [];
                json_data.bazaar.forEach(e => {
                    if (typeof(e.cost) == "undefined") {
                        itemPrices.push(0)
                    } else {
                        itemPrices.push(e.cost)
                    }
                });
                itemPrices = itemPrices.sort((x, y) => x - y);
                return itemPrices;
            }).catch((err) => {
                request_cache[item_id] = null;
                throw err;
            });
            return request_cache[item_id];
        };
    }

    let marketValues = new Promise(async (resolve) => {
        const API = `https://api.torn.com/torn/?selections=items&key=${API_KEY}`;
        let r = {};
        while (1) {
            try {
                while (!r.items) {
                    r = await fetchAPI(API);
                }
                break;
            } catch {}
            await delay(1);
        }
        resolve(r.items);
    });

    async function getMarketValue(item_id) {
        let values = await marketValues;
        return values[item_id].market_value;
    }
})();