/* eslint-disable @typescript-eslint/unbound-method */
import { IRouter } from '../router/interface';
import { HistoryFunctionName, LocationEventName, HistoryEventListenersType } from './types';

// eslint-disable-next-line @typescript-eslint/naming-convention
let _router: IRouter | null = null;
export function bindRouter(router: IRouter): void {
  _router = router;
}

const capturedEventListeners: Record<LocationEventName, EventListener[]> = {
  hashchange: [],
  popstate: [],
};
const routingEventsListeningTo = Object.keys(capturedEventListeners) as LocationEventName[];

export function callCapturedEventListeners(navigationEvent?: Event): void {
  if (navigationEvent) {
    const eventType = navigationEvent.type as LocationEventName;
    capturedEventListeners[eventType]?.forEach((listener: EventListener) => {
      try {
        listener.apply(navigationEvent.target, [navigationEvent]);
      } catch (e) {
        // event listener 执行可能会报错，但这些错误不应该中断 versea 的执行逻辑.
        setTimeout(() => {
          throw e;
        });
      }
    });
  }
}

// 监听路由事件
const handleUrlChange = (navigationEvent?: HashChangeEvent | PopStateEvent): void => {
  if (_router) {
    void _router.reroute(navigationEvent);
    return;
  }
  callCapturedEventListeners(navigationEvent);
};
window.addEventListener('popstate', handleUrlChange);
window.addEventListener('hashchange', handleUrlChange);

// 重写 addEventListener 和 removeEventListener
// 当增加 popstate 或 hashchange 事件监听函数，把他们存储到 capturedEventListeners，在 versea 切换应用的合适时机调用
const rawAddEventListener = window.addEventListener;
const rawRemoveEventListener = window.removeEventListener;

window.addEventListener = function (
  eventName: string,
  listenerFn: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions | boolean,
): void {
  if (typeof listenerFn === 'function') {
    if (
      routingEventsListeningTo.includes(eventName as LocationEventName) &&
      !capturedEventListeners[eventName as LocationEventName].find((listener: EventListener) => listener === listenerFn)
    ) {
      capturedEventListeners[eventName as LocationEventName].push(listenerFn);
      return;
    }
  }
  rawAddEventListener.call(this, eventName, listenerFn, options);
};

window.removeEventListener = function (
  eventName: string,
  listenerFn: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions | boolean,
): void {
  if (typeof listenerFn === 'function') {
    if (routingEventsListeningTo.includes(eventName as LocationEventName)) {
      capturedEventListeners[eventName as LocationEventName] = capturedEventListeners[
        eventName as LocationEventName
      ].filter((fn: EventListener) => fn !== listenerFn);
      return;
    }
  }

  rawRemoveEventListener.call(this, eventName, listenerFn, options);
};

/** 创建 popstate 事件 */
function createPopStateEvent(state: PopStateEventInit, methodName: HistoryFunctionName): Event {
  const evt = new PopStateEvent('popstate', { state });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (evt as any).versea = true;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (evt as any).verseaTrigger = methodName;
  return evt;
}

function patchedUpdateState(updateState: HistoryEventListenersType, methodName: HistoryFunctionName) {
  return function (this: History, ...args: Parameters<HistoryEventListenersType>): void {
    const urlBefore = window.location.href;
    updateState.apply(this, args);
    const urlAfter = window.location.href;

    if (urlBefore !== urlAfter) {
      if (_router?.isStarted) {
        // 如果已经启动应用，需要触发一个 popstate 事件，这样才能通知已经注册的应用知晓路由变更，这些应用的路由状态和页面状态才会发生变更。
        // 如果不触发 popstate 事件，可能导致路由切换成功，但那些已经注册的应用的页面未发生变更
        window.dispatchEvent(createPopStateEvent(window.history.state as PopStateEventInit, methodName));
      } else {
        void _router?.reroute();
      }
    }
  };
}

// 重写 pushState 和 replaceState 方法
window.history.pushState = patchedUpdateState(window.history.pushState, 'pushState');
window.history.replaceState = patchedUpdateState(window.history.replaceState, 'replaceState');
