export interface IScannerControls {
  stop(): void
}

export interface ResultLike {
  getText(): string
}

type Callback = (result: ResultLike | null, error: unknown, controls?: IScannerControls) => void

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>
    }
  }
}

function createControls(stop: () => void): IScannerControls {
  return {
    stop,
  }
}

function ensureVideoElement(target: unknown): HTMLVideoElement {
  if (target instanceof HTMLVideoElement) {
    return target
  }
  if (typeof document !== 'undefined') {
    const element = document.createElement('video')
    element.setAttribute('playsinline', 'true')
    return element
  }
  throw new Error('Video element is required for decoding')
}

export class BrowserMultiFormatReader {
  private stream: MediaStream | null = null
  private rafId: number | null = null
  private stopped = false

  async decodeFromVideoDevice(deviceId: string | null, video: unknown, callback: Callback): Promise<IScannerControls> {
    const htmlVideo = ensureVideoElement(video)
    const controls = createControls(() => this.stopInternal(htmlVideo))

    callback(null, null, controls)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      callback(null, new Error('Camera API is niet beschikbaar in deze omgeving'), controls)
      return controls
    }

    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' },
      audio: false,
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      htmlVideo.srcObject = this.stream
      await htmlVideo.play()
      this.stopped = false
      this.loop(htmlVideo, callback, controls)
    } catch (error) {
      callback(null, error, controls)
    }

    return controls
  }

  reset(): void {
    this.stopInternal()
  }

  private stopInternal(video?: HTMLVideoElement): void {
    this.stopped = true
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (video) {
      video.pause()
      video.srcObject = null
    }
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop()
      }
      this.stream = null
    }
  }

  private loop(video: HTMLVideoElement, callback: Callback, controls: IScannerControls): void {
    if (this.stopped) {
      return
    }

    const detector = typeof window !== 'undefined' && window.BarcodeDetector ? new window.BarcodeDetector({
      formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'],
    }) : null

    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
    const context = canvas ? canvas.getContext('2d') : null

    const scanFrame = async () => {
      if (this.stopped) {
        return
      }
      try {
        if (video.readyState >= 2) {
          if (canvas && context) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
          }
          if (detector && canvas) {
            const detections = await detector.detect(canvas)
            if (detections.length > 0) {
              const text = detections[0].rawValue
              callback(
                {
                  getText: () => text,
                },
                null,
                controls,
              )
            } else {
              callback(null, null, controls)
            }
          } else {
            callback(null, null, controls)
          }
        }
      } catch (error) {
        callback(null, error, controls)
      }
      if (!this.stopped) {
        this.rafId = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(scanFrame) : null
        if (this.rafId === null) {
          setTimeout(scanFrame, 250)
        }
      }
    }

    scanFrame().catch(error => callback(null, error, controls))
  }
}
