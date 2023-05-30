const htmlDom = document.querySelector('html');
const bodyDom = document.querySelector('html body');
let historyMap = {};
let url = '';

window.addEventListener('load', async () => {
  url = encodeURIComponent(window.location.href);
  ({ historyMap } = await chrome.storage.sync.get('historyMap') || {});
  const scrollTop = historyMap[url];
  if (scrollTop) {
    window.scrollBy({
      top: scrollTop,
      behavior: "smooth",
    });
  }
})

window.addEventListener('beforeunload', async () => {
  const htmlScrollTop = htmlDom.scrollTop;
  const bodyScrollTop = bodyDom.scrollTop;
  const scrollTop = Math.max(htmlScrollTop, bodyScrollTop);
  await chrome.storage.sync.set({ historyMap: {
    ...historyMap,
    [url]: scrollTop,
  } });
});
