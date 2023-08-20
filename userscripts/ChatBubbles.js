// ==UserScript==
// @name          Chat Bubbles for Torn
// @namespace     https://github.com/Pi77Bull
// @match         https://www.torn.com/*
// @grant         GM_addStyle
// @grant         GM_getValue
// @grant         GM_setValue
// @version       2.1.0
// @author        Pi77Bull [2082618], bot_7420 [2937420]
// @run-at        document-start
// @inject-into   content
// ==/UserScript==

// https://www.torn.com/forums.php#/p=threads&f=67&t=16113520&b=0&a=0&start=0&to=0

/* Change false to true in the line below to edit the settings: */
const edit = false;
/* Don't forget to reset it to false again after you're finished. */

/* Change the values below to your preferences. */
if (edit) {
    GM_setValue('config', {
        bubbleColor: '#dddddd',
        bubbleColorDarkMode: '#454545',

        meBubbleColor: '#2162a7',
        meBubbleColorDarkMode: '#37464f',

        fontSize: '1.3em',
        fontFamily: 'Ubuntu, Segoe UI',
    });
}

const WAIT_FOR = (selector, config = { attributes: true, childList: true, subtree: true }, parent = document) => {
    return new Promise((resolve) =>
        new MutationObserver((mutations, observer) => {
            let selectedNode = parent.querySelector(selector);
            if (selectedNode) {
                resolve(selectedNode);
                observer.disconnect;
            }
        }).observe(document.documentElement, config)
    );
};

const config = { childList: true, subtree: true };

const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
        for (let node of mutation.addedNodes) {
            const classList = [...node.classList];
            if (classList.some((className) => className.startsWith('_message_'))) {
                // new message
                classifyMessages([node]);
            } else if (classList.some((className) => className.startsWith('_chat-box-content_')) && ![...mutation.target.classList].some((className) => className.startsWith('_chat-box-settings_'))) {
                // chat maximized
                classifyMessages(node.querySelectorAll('[class^="_message_"], [class*=" _message_"]'));
                break;
            }
        }
    });
});

let userid;
let username;
WAIT_FOR('[class^="_chat-box-wrap_"], [class*=" _chat-box-wrap_"]', config).then((element) => {
    const userElement = document.body.querySelector('script[uid]');
    userid = userElement.getAttribute('uid');
    username = userElement.getAttribute('name');
    classifyMessages(document.querySelectorAll('[class^="_message_"], [class*=" _message_"]'));
    observer.observe(element, config);
});

function classifyMessages(messageElements) {
    messageElements.forEach((messageElement) => {
        messageElement.classList.add('bubbleend');
        messageElement.querySelector('a').textContent = messageElement.querySelector('a').textContent.replace(':', '');

        if (messageElement.querySelector('a').href.endsWith(userid)) {
            messageElement.classList.add('me');
        } else if (messageElement.querySelector('span').innerText.includes(username)) {
            messageElement.classList.add('mention');
        }

        if (messageElement.previousElementSibling?.querySelector('a').href === messageElement.querySelector('a').href) {
            messageElement.previousElementSibling.classList.remove('bubbleend');
            messageElement.classList.add('samesender');
        }
    });
}

const settings = GM_getValue('config', {
    bubbleColor: '#dddddd',
    bubbleColorDarkMode: '#454545',

    meBubbleColor: '#2162a7',
    meBubbleColorDarkMode: '#37464f',

    fontSize: '1.3em',
    fontFamily: 'Ubuntu, Segoe UI',
});

const lightColor = '#ffffff';
const darkColor = '#333333';

const fontColor = getBrightness(settings.bubbleColor) > 127.5 ? darkColor : lightColor;
const fontColorDarkMode = getBrightness(settings.bubbleColorDarkMode) > 127.5 ? darkColor : lightColor;
const meFontColor = getBrightness(settings.meBubbleColor) > 127.5 ? darkColor : lightColor;
const meFontColorDarkMode = getBrightness(settings.meBubbleColorDarkMode) > 127.5 ? darkColor : lightColor;

function getBrightness(colorString) {
    // https://awik.io/determine-color-bright-dark-using-javascript/
    // https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color
    const el = document.createElement('xyz');
    el.style.backgroundColor = colorString;
    const [, r, g, b, a] = el.style.backgroundColor.match(/^rgba?\((\d+), (\d+), (\d+)(?:, (\d+(?:\.\d+)))?\)$/);
    const brightness = Math.sqrt(0.299 * r ** 2 + 0.587 * g ** 2 + 0.114 * b ** 2);
    el.remove();
    return brightness;
}

GM_addStyle(`
	#chatRoot {
		--bubbleColor: ${settings.bubbleColor};
		--bubbleColorDarkMode: ${settings.bubbleColorDarkMode};

		--meBubbleColor: ${settings.meBubbleColor};
		--meBubbleColorDarkMode: ${settings.meBubbleColorDarkMode};

		--fontSize: ${settings.fontSize};
		--fontFamily: ${settings.fontFamily};

		--fontColor: ${fontColor};
		--fontColorDarkMode: ${fontColorDarkMode};
		--meFontColor: ${meFontColor};
		--meFontColorDarkMode: ${meFontColorDarkMode};
	}
`);

GM_addStyle(`
	[class^='_overview_'],
	[class*=' _overview_'] {
		display: flex !important;
		flex-direction: column !important;
		box-sizing: border-box;
	}

	[class^='_message_'],
	[class*=' _message_'] {
		border-top-left-radius: 0.25em;
		border-bottom-left-radius: 0.25em;
		border-top-right-radius: 1em;
		border-bottom-right-radius: 1em;
		background-color: var(--bubbleColor);
		border: 1px solid transparent;
		padding: 4px 6px 6px 6px !important;
		margin: 4px;
		width: max-content;
		max-width: calc(100% - 22px);
		box-shadow: 0px 2px 2px 0px rgba(50, 50, 50, 0.3);
		line-height: 1em !important;
		font-size: var(--fontSize);
		font-family: var(--fontFamily);
	}

	.dark-mode [class^='_message_'],
	.dark-mode [class*=' _message_'] {
		background-color: var(--bubbleColorDarkMode);
	}

	[class^='_message_']:first-of-type,
	[class*=' _message_']:first-of-type {
		margin-top: 0;
	}

	[class^='_message_'] > a,
	[class*=' _message_'] > a {
		width: max-content;
	}

	[class^='_message_'] a,
	[class*=' _message_'] a {
		color: inherit !important;
	}

	[class^='_message_'].me,
	[class*=' _message_'].me {
		align-self: flex-end;
		border-top-left-radius: 1em;
		border-bottom-left-radius: 1em;
		border-top-right-radius: 0.25em;
		border-bottom-right-radius: 0.25em;
		background-color: var(--meBubbleColor);
		color: var(--meFontColor);
	}

	[class^='_message_'].me > a,
	[class*=' _message_'].me > a {
		display: none;
	}

	.dark-mode [class^='_message_'].me,
	.dark-mode [class*=' _message_'].me {
		background-color: var(--meBubbleColorDarkMode);
		color: var(--meFontColorDarkMode);
	}

	[class^='_message_'].bubbleend,
	[class*=' _message_'].bubbleend {
		border-bottom-left-radius: 1em;
		border-bottom-right-radius: 1em;
	}

	[class^='_message_'].samesender,
	[class*=' _message_'].samesender {
		margin-top: 0;
	}

	[class^='_message_'].samesender > a,
	[class*=' _message_'].samesender > a {
		display: none;
	}

	[class^='_message_'].mention,
	[class*=' _message_'].mention {
		border: 1px solid;
	}

	[class^='_chat-box-content_'],
	[class*=' _chat-box-content_'] {
		color: var(--fontColor) !important;
	}

	.dark-mode [class^='_chat-box-content_'],
	.dark-mode [class*=' _chat-box-content_'] {
		color: var(--fontColorDarkMode) !important;
	}

	[class^='_chat-last-message-label_'],
	[class*=' _chat-last-message-label_'] {
		margin-top: auto !important;
	}
`);
