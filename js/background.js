let historyMap = {};
let smoothStatus = false;
let storageData = {
  historyMap: {},
  smoothStatus: {},
};
let nowDefaultUrl = '' // 当前页url,未转码
let nowUrl = ''; // 当前页面url,已转码
let isRemeberNowPage = false;
let isBookmark = false; // 当前页面是否是书签也面
let nowTabId = ''; // 当前tab页面id
let DYNAMIC_SCRIPT_ID = ''; // 注入脚本id

// 获取当前tab页面
async function getNowUrl() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  nowUrl = encodeURIComponent(tab.url);
}

// 更新 action 图标
function changeIcon() {
  let path = '../images/icon-gray.png';
  if ((historyMap[nowUrl] !== undefined && historyMap[nowUrl] !== -1)) {
    path = '../images/icon-128.png';
  }
  chrome.action.setIcon({
    path
  });
}

function init (tabInfo) {
  isRemeberNowPage = false;
  isBookmark = false;
  DYNAMIC_SCRIPT_ID = '';

  nowTabId = tabInfo.tabId;
  DYNAMIC_SCRIPT_ID = `remeber-position-script-${nowTabId}`
  nowDefaultUrl = tabInfo.url;
  nowUrl = encodeURIComponent(tabInfo.url);
  if (historyMap[nowUrl] !== undefined && historyMap[nowUrl] !== -1) {
    registerContent();
  }
  changeIcon();
}

// 判断当前页面是否已注入content
async function isDynamicContentScriptRegistered() {
  const scripts = await chrome.scripting.getRegisteredContentScripts({ids: [DYNAMIC_SCRIPT_ID]});
  return scripts.some((s) => s.id === DYNAMIC_SCRIPT_ID);
}

// 注入content.js
async function registerContent() {
  console.log('zl-注入content,js');
  const hasJnject = await isDynamicContentScriptRegistered();
  if (hasJnject) return;
  if (historyMap[nowUrl] !== undefined && historyMap[nowUrl] !== -1) {
    chrome.scripting
      .registerContentScripts([{
        id: DYNAMIC_SCRIPT_ID,
        js: ['./js/content.js'],
        matches: [nowDefaultUrl],
        runAt: 'document_start',
      }], () => {console.log('zl-射进去了', nowDefaultUrl)});
  }
}
// 注销content.js
async function unregisterContent(id) {
  chrome.scripting.unregisterContentScripts({ids: [id]});
}

// 快捷键操作
chrome.commands.onCommand.addListener(async (command) => {
  const isRemeberNowPage = historyMap[nowUrl] !== undefined && historyMap[nowUrl] >= 0;
  let isBookmark = false;
  chrome.bookmarks.search(nowUrl, async (res) => {
    if (res.length) isBookmark = true;
  })
  if (command === 'remeber-now') {
    // 记录本页面
    if (!isRemeberNowPage) {
      historyMap = {
        ...historyMap,
        [nowUrl]: 0,
      };
    } else { // 取消记录本页面
      if (isBookmark) { // 当前页面是书签页面
        historyMap[nowUrl] = -1;
      } else { // 当前页面不是书签页面
        delete historyMap[nowUrl];
      }
    }
    await chrome.storage.sync.set({ historyMap });

    chrome.action.setBadgeText(
      {
        text: ' ✌🏻'
      },
      () => {
        setTimeout(() => {
          chrome.action.setBadgeText({text: ''});
        }, 800);
      }
    )
  }
});
chrome.runtime.onInstalled.addListener(async () => {
  chrome.action.setBadgeBackgroundColor({
    color: '#f082ac',
  });
  ({ historyMap } = await chrome.storage.sync.get('historyMap') || {});
  ({ smoothStatus } = await chrome.storage.sync.get('smoothStatus') || {});
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const msg = JSON.parse(message);
  switch (msg.name) {
    case 'beforeunload_message':
      const { url, scrollTop } = msg;
      if (historyMap[url] !== undefined && historyMap[url] !== -1) {
        historyMap[url] = Math.ceil(scrollTop);
        chrome.storage.sync.set({ historyMap });
      }
      break;
    case 'load_message':
      sendResponse({historyMap, smoothStatus});
    default: () => {};
      break;
  }
});

chrome.storage.onChanged.addListener((detail) => {
  if (detail.historyMap) {
    historyMap = detail.historyMap.newValue;
    if ((historyMap[nowUrl] !== undefined && historyMap[nowUrl] !== -1)) {
      registerContent();
    }
    changeIcon();
  }
  if (detail.smoothStatus) smoothStatus = detail.smoothStatus.newValue;
})

chrome.webNavigation.onBeforeNavigate.addListener((res) => {
  if (res.frameType !== "outermost_frame") return;
  init(res);
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (res) => {
    if (res.url) {
      init(res);
    }
  });
})

chrome.tabs.onRemoved.addListener((tabId, info) => {
  // unregisterContent(`remeber-position-script-${tabId}`);
})