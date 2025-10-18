declare module '@zxing/browser' {
  export interface Result {
    getText(): string
  }

  export interface IScannerControls {
    stop(): void
  }

  export class BrowserMultiFormatReader {
    decodeFromVideoDevice(
      deviceId: string | null,
      videoElement: HTMLVideoElement | null,
      callback: (result: Result | null, error: unknown, controls?: IScannerControls) => void
    ): Promise<IScannerControls>

    reset(): void
  }
}
