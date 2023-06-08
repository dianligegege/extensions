// 基础状态变量
let historyMap = {}; // 所有记录列表
const textList = [
  'appName',
  'editPages',
  'normalHistory',
  'bookmarkHistory',
  'feedback',
  'normalLabel',
  'historyLabel',
];

const hisoryList = document.querySelector('#history-list');
const bookmarkList = document.querySelector('#bookmark-list');
const idMap = {
  'history-list': hisoryList,
  'bookmark-list': bookmarkList,
};

// 删除操作
const deleteHandle = async (e, domId, dom) => {
  const { target } = e;
  if (target.className === 'delete-icon') {
    const id = target.id.split('-')[1];
    const aDom = document.querySelector(`#${domId} #li-${id} a`)
    const deleteUrl = encodeURIComponent(aDom.innerText);
    delete historyMap[deleteUrl];
    await chrome.storage.sync.set({ historyMap: historyMap }).then(() => {
      const deleteLiDom = document.querySelector(`#${domId} #li-${id}`)
      dom.removeChild(deleteLiDom);
      const wrapDom = idMap[domId];
      if (wrapDom.children.length === 0) {
        const emptyDom = document.createElement('div');
        emptyDom.setAttribute('class', 'empty-list');
        emptyDom.innerText = chrome.i18n.getMessage('empty');
        wrapDom.appendChild(emptyDom);
      }
    });
  }
};

// 记录列表
hisoryList.addEventListener('click', (e) => deleteHandle(e, 'history-list', hisoryList));
bookmarkList.addEventListener('click', (e) => deleteHandle(e, 'bookmark-list', bookmarkList));


// 插入dom工具函数
function appendDom(fatherDom, childDom) {
  if (childDom && childDom.children && childDom.children.length) {
    fatherDom.appendChild(childDom);
  } else {
    const emptyDom = document.createElement('div');
    emptyDom.setAttribute('class', 'empty-list');
    emptyDom.innerText = chrome.i18n.getMessage('empty');
    fatherDom.appendChild(emptyDom);
  }
}

// 初始操作
async function setStatus() {
  // 记录本页按钮
  ({ historyMap } = await chrome.storage.sync.get('historyMap') || {});
  const normalDom = document.createDocumentFragment('ul');
  const bookmarkDom = document.createDocumentFragment('ul');
  Object.entries(historyMap).forEach(([key, value]) => {
    const random = `${new Date().getTime()}${Math.floor(Math.random() * 1000)}`;
    const liDom = document.createElement('li');
    liDom.setAttribute('id', `li-${random}`);
    const spanNumDom = document.createElement('span');
    spanNumDom.setAttribute('class', `top-height`);
    spanNumDom.innerText = value;
    const aDom = document.createElement('a');
    aDom.setAttribute('href', decodeURIComponent(key));
    aDom.setAttribute('target', '_blank');
    aDom.innerText = decodeURIComponent(key);
    const spanDeleteDom = document.createElement('span');
    spanDeleteDom.innerText = '✖';
    spanDeleteDom.setAttribute('id', `delete-${random}`);
    spanDeleteDom.setAttribute('class', `delete-icon`);
    liDom.appendChild(aDom);
    if (value >= 0) {
      liDom.appendChild(spanNumDom);
    }
    liDom.appendChild(spanDeleteDom);
    if (value >= 0) {
      normalDom.appendChild(liDom);
    } else {
      bookmarkDom.appendChild(liDom);
    }
  })

  appendDom(hisoryList, normalDom);
  appendDom(bookmarkList, bookmarkDom);
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
