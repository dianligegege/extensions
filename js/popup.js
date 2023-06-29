// 基础状态变量
let isRemeberNowPage = false; // 是否记录本页面
let historyMap = {}; // 所有记录列表
let nowUrl = ''; // 当前页面url,已转码
let isBookmark = false; // 当前页面是否是书签页面
const pageBtnText = {
  0: chrome.i18n.getMessage('remeberNow'),
  1: chrome.i18n.getMessage('forgetNow'),
};
const textList = [
  "switch1",
  "switch2",
  "remeberNow",
  "optionPage",
];

// 记录当前页面按钮
const nowPageBtn = document.querySelector('#remeberNow');

// 配置按钮操作
const optionButton = document.querySelector('#option-button');
optionButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
})

// 平滑滚动开关
const smoothSwitch = document.querySelector('#smooth-switch');
smoothSwitch.addEventListener('click', async (event) => {
  const switchVal = event.target?.checked;
  await chrome.storage.sync.set({ smoothStatus: switchVal });
});

// 开启书签记录开关
const bookmarkSwitch = document.querySelector('#bookmark-switch');
bookmarkSwitch.addEventListener('click', async (event) => {
  const switchVal = event.target?.checked;
  await chrome.storage.sync.set({ bookmarkStatus: switchVal });
  // 开机记录书签 && 当前是书签页 && 未记录过本页
  if (isBookmark && switchVal && historyMap[nowUrl] === undefined) {
    historyMap[nowUrl] = 0;
    await chrome.storage.sync.set({ historyMap});
    nowPageBtn.innerText = pageBtnText[1];
    nowPageBtn.classList.add('no-checked');
  }
})

// 记录本页面 取消记录本页面
nowPageBtn.addEventListener('click', (e) => changeNowPage(e));
async function changeNowPage(e) {
  let btnStatus = 0;
  // 记录本页面
  if (!isRemeberNowPage) {
    historyMap = {
      ...historyMap,
      [nowUrl]: 0,
    };
    btnStatus = 1;
  } else { // 取消记录本页面
    if (isBookmark) { // 当前页面是书签页面
      historyMap[nowUrl] = -1;
    } else { // 当前页面不是书签页面
      delete historyMap[nowUrl];
    }
    btnStatus = 0;
  }
  await chrome.storage.sync.set({ historyMap: historyMap }).then(() => {
    nowPageBtn.innerText = pageBtnText[btnStatus];
    isRemeberNowPage = !!btnStatus;
    if (btnStatus) {
      nowPageBtn.classList.add('no-checked');
    } else {
      nowPageBtn.classList.remove('no-checked');
    }
  });
}

// 初始操作
async function setStatus() {
  // 获取记录历史
  ({ historyMap } = await chrome.storage.sync.get('historyMap') || {});

  // 获取当前tab页面
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  nowUrl = encodeURIComponent(tab.url);

  // 记录书签开关
  const { bookmarkStatus = false } = await chrome.storage.sync.get('bookmarkStatus');
  bookmarkSwitch.checked = bookmarkStatus;

  // 平滑滚动
  const { smoothStatus = false } = await chrome.storage.sync.get('smoothStatus');
  smoothSwitch.checked = smoothStatus;

  // 获取当前页面是否是书签页面
  chrome.bookmarks.search(tab.url, async (res) => {
    if (res.length) isBookmark = true;
    // 如果当前页面是书签页面 && 记录书签页面开关为开 && 历史记录未记录当前页 时添加到历史记录
    if (res.length && bookmarkStatus && historyMap[nowUrl] === undefined) {
      historyMap = {
        ...historyMap,
        [nowUrl]: 0,
      }
      await chrome.storage.sync.set({ historyMap });
    }
    // 记录本页按钮
    isRemeberNowPage = historyMap[nowUrl] !== undefined && historyMap[nowUrl] >= 0;
    if (isRemeberNowPage) {
      nowPageBtn.classList.add('no-checked');
      nowPageBtn.innerText = pageBtnText[1];
    };
  })
}

function replaceText() {
  textList.forEach((item) => {
    const dom = document.querySelectorAll(`#${item}`);
    dom.forEach((d) => {
      d.innerText = chrome.i18n.getMessage(item);
    })
  })
}

setStatus();
replaceText();
