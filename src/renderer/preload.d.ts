import { Channels } from 'main/preload';

declare global {
  interface Window {
    electron: {
      isMac: boolean;
      isWindows: boolean;
      ipcRenderer: {
        sendMessage<TArgs>(channel: Channels, args: TArgs): void;
        on<TArgs>(
          channel: string,
          func: (...args: TArgs[]) => void
        ): (() => void) | undefined;
        once<TArgs>(channel: string, func: (...args: TArgs[]) => void): void;
      };
    };
  }
}

export {};
