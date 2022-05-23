export type VerseaAppEventListener = EventListenerOrEventListenerObject & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __VERSEA_APP_LISTENER_OPTIONS__?: AddEventListenerOptions | boolean;
};

export interface TimerEventRecord {
  handler: TimerHandler;
  timeout?: number;
  args: unknown[];
}
