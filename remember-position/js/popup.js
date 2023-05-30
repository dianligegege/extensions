// 基础状态变量
let isRemeberNowPage = false; // 是否记录本页面
let historyMap = {}; // 所有记录列表
let nowUrl = ''; // 当前页面url
const pageBtnText = {
  0: '记录本页 (⌥Q)',
  1: '取消记录本页 (⌥Q)'
};

// 配置按钮操作
const optionButton = document.querySelector('#option-button');
optionButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
})

// 开启书签记录开关
const bookmarkSwitch = document.querySelector('#bookmark-switch');
bookmarkSwitch.addEventListener('click', async (event) => {
  const switchVal = event.target?.checked;
  await chrome.storage.sync.set({ bookmarkStatus: switchVal });
})

// 记录本页面
const nowPageBtn = document.querySelector('#page-button');
nowPageBtn.addEventListener('click', (e) => changeNowPage(e));
async function changeNowPage(e) {
  let btnStatus = 0;
  if (!isRemeberNowPage) {
    historyMap = {
      ...historyMap,
      [nowUrl]: 0,
    };
    btnStatus = 1;
  } else {
    delete historyMap[nowUrl];
    btnStatus = 0;
  }
  console.log('historyMap', historyMap);
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
  // 记录书签开关
  const { bookmarkStatus = true } = await chrome.storage.sync.get('bookmarkStatus');
  bookmarkSwitch.checked = bookmarkStatus;
  // 记录本页按钮
  ({ historyMap } = await chrome.storage.sync.get('historyMap') || {});
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  nowUrl = encodeURIComponent(tab.url);
  isRemeberNowPage = historyMap[nowUrl] !== undefined;
  if (isRemeberNowPage) {
    nowPageBtn.classList.add('no-checked');
    nowPageBtn.innerText = pageBtnText[1]
  };
}

setStatus();
