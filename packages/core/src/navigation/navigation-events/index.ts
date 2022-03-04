/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IRouter } from '../router/interface';
import { HistoryEventName, EventName, HistoryEventListenersType } from './types';

let router: IRouter | null = null;
export function setRouter(iRouter: IRouter): void {
  router = iRouter;
}
export const capturedEventListeners: Record<EventName, EventListener[]> = {
  hashchange: [],
  popstate: [],
};

export const routingEventsListeningTo = Object.keys(capturedEventListeners) as EventName[];

const handleUrlChange = (navigationEvent?: HashChangeEvent | PopStateEvent): void => {
  if (router) {
    router.reroute(navigationEvent);
    return;
  }
  if (navigationEvent) {
    const eventType = navigationEvent.type as EventName;
    capturedEventListeners[eventType].forEach((listener: EventListener) => {
      try {
        listener.apply(navigationEvent.target, [navigationEvent]);
      } catch (e) {
        /**
         * event listener错误不应该中断versea的执行.
         */
        setTimeout(() => {
          throw e;
        });
      }
    });
  }
};

window.addEventListener('hashchange', handleUrlChange);

window.addEventListener('popstate', handleUrlChange);

const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

window.addEventListener = function (
  eventName: string,
  listenerFn: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions | boolean,
): void {
  if (typeof listenerFn === 'function') {
    if (
      routingEventsListeningTo.includes(eventName as EventName) &&
      !capturedEventListeners[eventName as EventName].find((listener: EventListener) => listener === listenerFn)
    ) {
      capturedEventListeners[eventName as EventName].push(listenerFn);
      return;
    }
  }
  originalAddEventListener.call(this, eventName, listenerFn, options);
};

window.removeEventListener = function (
  eventName: string,
  listenerFn: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions | boolean,
): void {
  if (typeof listenerFn === 'function') {
    if (routingEventsListeningTo.includes(eventName as EventName)) {
      capturedEventListeners[eventName as EventName] = capturedEventListeners[eventName as EventName].filter(
        (fn: EventListener) => fn !== listenerFn,
      );
      return;
    }
  }

  originalRemoveEventListener.call(this, eventName, listenerFn, options);
};

function createPopStateEvent(state: PopStateEventInit, originalMethodName: HistoryEventName): Event {
  const evt = new PopStateEvent('popstate', { state });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (evt as any).versea = true;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (evt as any).verseaTrigger = originalMethodName;
  return evt;
}

function patchedUpdateState(updateState: HistoryEventListenersType, methodName: HistoryEventName) {
  return function (this: History, ...args: Parameters<HistoryEventListenersType>): void {
    const urlBefore = window.location.href;
    updateState.apply(this, args);
    const urlAfter = window.location.href;

    if (urlBefore !== urlAfter) {
      if (router?._appService.isStarted) {
        window.dispatchEvent(createPopStateEvent(window.history.state as PopStateEventInit, methodName));
      } else {
        handleUrlChange();
      }
    }
  };
}

// eslint-disable-next-line @typescript-eslint/unbound-method
window.history.pushState = patchedUpdateState(window.history.pushState, 'pushState');
// eslint-disable-next-line @typescript-eslint/unbound-method
window.history.replaceState = patchedUpdateState(window.history.replaceState, 'replaceState');
