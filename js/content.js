const htmlDom = document.querySelector('html');
const bodyDom = document.querySelector('html body');
let url = '';

window.addEventListener('load', async () => {
  const { smoothStatus } = await chrome.storage.sync.get('smoothStatus') || {};
  url = encodeURIComponent(window.location.href);
  const { historyMap } = await chrome.storage.sync.get('historyMap') || {};
  const scrollTop = historyMap[url];
  console.log('scrollTop', scrollTop);
  if (scrollTop && scrollTop > 0) {
    setTimeout(() => {
      window.scroll({
        top: scrollTop,
        behavior: smoothStatus ? "smooth" : 'instant',
      });
    }, 500);
  }
})

window.addEventListener('beforeunload', async () => {
  const htmlScrollTop = htmlDom.scrollTop;
  const bodyScrollTop = bodyDom.scrollTop;
  const scrollTop = Math.max(htmlScrollTop, bodyScrollTop);
  const { historyMap } = await chrome.storage.sync.get('historyMap') || {};
  if (historyMap[url] !== undefined && historyMap[url] !== -1) {
    historyMap[url] = scrollTop;
    await chrome.storage.sync.set({ historyMap });
  }
});
