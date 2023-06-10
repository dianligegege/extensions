let historyMap = {};
let nowUrl = ''; // 当前页面url,已转码
let isRemeberNowPage = false;
let isBookmark = false; // 当前页面是否是书签也面

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

chrome.commands.onCommand.addListener(async (command) => {
  // 获取当前tab页面
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  nowUrl = encodeURIComponent(tab.url);

  ({ historyMap } = await chrome.storage.sync.get('historyMap') || {});
  isRemeberNowPage = historyMap[nowUrl] !== undefined && historyMap[nowUrl] >= 0;
  
  chrome.bookmarks.search(tab.url, async (res) => {
    if (res.length) isBookmark = true;
  })
  if (command === 'remeber-now') {
    await changeNowPage();
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
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({
    color: '#f082ac',
  });
})
