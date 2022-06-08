import { IApp } from '@versea/core';

export interface VerseaAppWindow extends Window {
  /* eslint-disable @typescript-eslint/naming-convention */
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

export interface ISandbox {
  verseaAppWindow: VerseaAppWindow;

  proxyWindow: VerseaAppWindow;

  start: () => void;

  stop: () => void;
}
