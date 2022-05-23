import { IApp } from '@versea/core';

export interface VerseaAppWindow extends Window {
  /* eslint-disable @typescript-eslint/naming-convention */
  __MICRO_APP_NAME__: string;
  __MICRO_APP_PUBLIC_PATH__: string;
  __MICRO_APP_BASE_URL__: string;
  /* eslint-enable @typescript-eslint/naming-convention */

  /** 应用实例 */
  verseaApp: IApp;

  rawWindow: Window;
  rawDocument: Document;

  /** 删除元素和事件的应用隔离 */
  removeScope: () => void;
}
