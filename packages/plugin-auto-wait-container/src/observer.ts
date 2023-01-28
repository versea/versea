import { once } from 'ramda';

function observeChildList(callback: (node: Node) => void): void {
  new MutationObserver(function (mutationsList) {
    // 遍历出所有的MutationRecord对象
    mutationsList.forEach(function (mutation) {
      if (mutation.type === 'childList') {
        callback(mutation.target);
      }
    });
  }).observe(document.body, { childList: true, subtree: true });
}

export const observeChildListOnce = once(observeChildList);
