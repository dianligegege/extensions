// 基础状态变量
let historyMap = {}; // 所有记录列表

// 开启书签记录开关
const bookmarkSwitch = document.querySelector('#bookmark-switch');
bookmarkSwitch.addEventListener('click', async (event) => {
  const switchVal = event.target?.checked;
  await chrome.storage.sync.set({ bookmarkStatus: switchVal });
})

// 记录列表
const hisoryList = document.querySelector('#history-list');
hisoryList.addEventListener('click', async (e) => {
  console.log(e);
  const { target } = e;
  console.log(target);
  if (target.className === 'delete-icon') {
    const id = target.id.split('-')[1];
    const aDom = document.querySelector(`#history-list #li-${id} a`)
    const deleteUrl = encodeURIComponent(aDom.innerText);
    delete historyMap[deleteUrl];
    await chrome.storage.sync.set({ historyMap: historyMap }).then(() => {
      const deleteLiDom = document.querySelector(`#history-list #li-${id}`)
      hisoryList.removeChild(deleteLiDom);
    });
  }
});

// 初始操作
async function setStatus() {
  // 记录书签开关
  const { bookmarkStatus = true } = await chrome.storage.sync.get('bookmarkStatus');
  bookmarkSwitch.checked = bookmarkStatus;
  // 记录本页按钮
  ({ historyMap } = await chrome.storage.sync.get('historyMap') || {});
  const ulDom = document.createDocumentFragment('ul');
  Object.keys(historyMap).forEach((item) => {
    const random = `${new Date().getTime()}${Math.floor(Math.random() * 1000)}`;
    const liDom = document.createElement('li');
    liDom.setAttribute('id', `li-${random}`);
    const aDom = document.createElement('a');
    aDom.setAttribute('href', decodeURIComponent(item));
    aDom.setAttribute('target', '_blank');
    aDom.innerText = decodeURIComponent(item);
    const spanDom = document.createElement('span');
    spanDom.innerText = '✖';
    spanDom.setAttribute('id', `delete-${random}`);
    spanDom.setAttribute('class', `delete-icon`);
    liDom.appendChild(aDom);
    liDom.appendChild(spanDom);
    ulDom.appendChild(liDom);
    hisoryList.appendChild(ulDom);
  })
}

setStatus();
