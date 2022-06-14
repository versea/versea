import { IApp } from '@versea/core';

export type VerseaAppEventListener = EventListenerOrEventListenerObject & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __VERSEA_APP_LISTENER_OPTIONS__?: AddEventListenerOptions | boolean;
};

export interface TimerEventRecord {
  handler: TimerHandler;
  timeout?: number;
  args: unknown[];
}

export interface VerseaAppWindow extends Window {
  /* eslint-disable @typescript-eslint/naming-convention */
  __VERSEA_APP_ENVIRONMENT__: boolean;
  __VERSEA_APP_NAME__: string;
  __VERSEA_APP_PUBLIC_PATH__: string;
  __VERSEA_APP_BASE_URL__: string;
  __VERSEA_APP_WINDOW__: VerseaAppWindow;
  /* eslint-enable @typescript-eslint/naming-convention */

  /** 应用实例 */
  verseaApp: IApp;

  rawWindow: Window;
  rawDocument: Document;

  /** 删除元素和事件的应用隔离 */
  removeScope: () => void;
}
