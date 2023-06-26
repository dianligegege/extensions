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
// async function getNowUrl() {
//   let queryOptions = { active: true, lastFocusedWindow: true };
//   let [tab] = await chrome.tabs.query(queryOptions);
//   nowUrl = encodeURIComponent(tab.url);
// }

function init () {
  nowDefaultUrl = '';
  nowUrl = '';
  isRemeberNowPage = false;
  isBookmark = false;
  nowTabId = '';
  DYNAMIC_SCRIPT_ID = '';
}

async function changeNowPage() {
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
  await chrome.storage.sync.set({ historyMap: historyMap });
}

// 判断当前页面是否已注入content
async function isDynamicContentScriptRegistered() {
  console.log('zl-DYNAMIC_SCRIPT_ID', DYNAMIC_SCRIPT_ID);
  const scripts = await chrome.scripting.getRegisteredContentScripts({ids: [DYNAMIC_SCRIPT_ID]});
  return scripts.some((s) => s.id === DYNAMIC_SCRIPT_ID);
}

// 注入content.js
async function registerContent() {
  const hasJnject = await isDynamicContentScriptRegistered();
  if (hasJnject) return;
  if (historyMap[nowUrl] !== undefined && historyMap[nowUrl] !== -1) {
    chrome.scripting
      .registerContentScripts([{
        id: DYNAMIC_SCRIPT_ID,
        js: ['./js/content.js'],
        matches: [nowDefaultUrl],
        runAt: 'document_start',
      }], () => {});
  }
}
// 注销content.js
async function unregisterContent() {
  chrome.scripting.unregisterContentScripts({ids: [DYNAMIC_SCRIPT_ID]}, () => {
    console.log('zl-unregisterContent');
  });
}

// 快捷键操作
chrome.commands.onCommand.addListener(async (command) => {
  const isRemeberNowPage = historyMap[nowUrl] !== undefined && historyMap[nowUrl] >= 0;
  let isBookmark = false;
  chrome.bookmarks.search(nowUrl, async (res) => {
    if (res.length) isBookmark = true;
  })
  console.log('url', nowUrl);
  console.log('zl-command', command);
  if (command === 'remeber-now') {
    // await changeNowPage();
    // 记录本页面
    if (!isRemeberNowPage) {
      console.log('记录本页面zl-isRemeberNowPage', isRemeberNowPage);
      historyMap = {
        ...historyMap,
        [nowUrl]: 0,
      };
      console.log('记录', historyMap);
    } else { // 取消记录本页面
      console.log('取消记录本页面');
      if (isBookmark) { // 当前页面是书签页面
        historyMap[nowUrl] = -1;
      } else { // 当前页面不是书签页面
        delete historyMap[nowUrl];
      }
    }
    console.log('historyMap', historyMap);
    console.log('historyMap-nowurl', historyMap[nowUrl]);
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
  console.log('msg', msg);
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
  console.log('zl-detial', detail);
  if (detail.historyMap) historyMap = detail.historyMap.newValue;
  if (detail.smoothStatus) smoothStatus = detail.smoothStatus.newValue;
  if (detail.historyMap && (historyMap[nowUrl] !== undefined && historyMap[nowUrl] !== -1)) {
    registerContent()
  } else {
    // unregisterContent();
  }
})

chrome.webNavigation.onBeforeNavigate.addListener((res) => {
  console.log('onBeforeNavigate', res);
  if (res.frameType !== "outermost_frame") return;
  init();
  nowTabId = res.tabId;
  DYNAMIC_SCRIPT_ID = `remeber-position-script-${nowTabId}`
  nowDefaultUrl = res.url;
  nowUrl = encodeURIComponent(res.url);
  if (historyMap[nowUrl] !== undefined && historyMap[nowUrl] !== -1) {
    registerContent();
  }
})