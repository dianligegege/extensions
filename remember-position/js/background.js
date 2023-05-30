// let historyMap = {};

// chrome.runtime.onInstalled.addListener(async () => {
//   ({ historyMap } = await chrome.storage.sync.get('historyMap') || {});
//   console.log('background', historyMap);

//   chrome.windows.getAll(
//     { windowTypes: ['popup'] },
//     (res) => {
//       console.log(res)
//     }
//   )
// });