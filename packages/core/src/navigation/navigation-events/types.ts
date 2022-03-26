export type EventName = 'hashchange' | 'popstate';
export type HistoryFunctionName = 'pushState' | 'replaceState';
export type HistoryEventListenersType = (data: unknown, unused: string, url?: URL | string | null | undefined) => void;
