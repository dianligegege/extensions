const htmlDom = document.querySelector('html');
const bodyDom = document.querySelector('html body');
let url = '';
let historyMap = {};

console.log('zl-直接执行content');

window.addEventListener('load', async () => {
  console.log('load');
  const messageObj = {
    name: 'load_message',
  };
  chrome.runtime.sendMessage(JSON.stringify(messageObj), (res) => {
    console.log('zl-onmessage', res);
    historyMap = res.historyMap;
    const smoothStatus = res.smoothStatus;
    url = encodeURIComponent(window.location.href);
    // ({ historyMap } = await chrome.storage.sync.get('historyMap') || {});
    console.log('zl-historyMap', historyMap);
    const scrollTop = historyMap[url];
    console.log('zl-scrollTop', scrollTop);
    if (scrollTop && scrollTop > 0) {
      setTimeout(() => {
        window.scroll({
          top: scrollTop,
          behavior: smoothStatus ? "smooth" : 'instant',
        });
      }, 500);
    }
  });
})

window.addEventListener('beforeunload', async () => {
  const htmlScrollTop = htmlDom?.scrollTop || 0;
  const bodyScrollTop = bodyDom?.scrollTop || 0;
  const scrollTop = Math.max(htmlScrollTop, bodyScrollTop);
  const messageObj = {
    name: 'beforeunload_message',
    url,
    scrollTop,
  };
  chrome.runtime.sendMessage(JSON.stringify(messageObj));
});
