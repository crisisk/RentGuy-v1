export interface IScannerControls {
  stop(): void
}

export interface ResultLike {
  getText(): string
}

export class BrowserMultiFormatReader {
  decodeFromVideoDevice(
    _deviceId: string | null,
    _video: unknown,
    _callback: (result: ResultLike | null, error: unknown, controls?: IScannerControls) => void,
  ): Promise<IScannerControls> {
    const controls: IScannerControls = {
      stop() {
        /* noop */
      },
    }
    // Immediately invoke callback with null result so callers can initialise state without errors.
    try {
      _callback(null, null, controls)
    } catch {
      // ignore callback errors in the stub implementation
    }
    return Promise.resolve(controls)
  }

  reset(): void {
    // no-op stub
  }
}
