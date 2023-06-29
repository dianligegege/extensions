const htmlDom = document.querySelector('html');
const bodyDom = document.querySelector('html body');
let url = '';
let historyMap = {};

window.addEventListener('load', async () => {
  const messageObj = {
    name: 'load_message',
  };
  chrome.runtime.sendMessage(JSON.stringify(messageObj), (res) => {
    historyMap = res.historyMap;
    const smoothStatus = res.smoothStatus;
    url = encodeURIComponent(window.location.href);
    const scrollTop = historyMap[url];
    if (scrollTop && scrollTop > 0) {
      setTimeout(() => {
        window.scroll({
          top: scrollTop,
          behavior: smoothStatus ? "smooth" : 'instant',
        });
      }, 300);
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
