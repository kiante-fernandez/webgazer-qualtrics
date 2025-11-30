import WebcamClient from "./WebcamClient";
import { GazeResult } from "./types";

// @ts-ignore
import WebEyeTrackWorker from "./WebEyeTrackWorker?worker&inline";
export default class WebEyeTrackProxy {
  private worker: Worker;

  public status: 'idle' | 'inference' | 'calib' = 'idle';

  constructor(webcamClient: WebcamClient) {

    // Initialize the WebEyeTrackWorker
    this.worker = new WebEyeTrackWorker();
    console.log('WebEyeTrackProxy worker initialized');

    this.worker.onmessage = (mess) =>{
      // console.log(`[WebEyeTrackWorker] ${mess.data}`)
      // console.log('[WebEyeTrackProxy] received message', mess);

      // Switch state based on message type
      switch (mess.data.type) {
        case 'ready':
          console.log('[WebEyeTrackProxy] Worker is ready');

          // Start the webcam client and set up the frame callback
          webcamClient.startWebcam(async (frame: ImageData, timestamp: number) => {
            // Send the frame to the worker for processing
            if (this.status === 'idle') {
              this.worker.postMessage({
                type: 'step',
                payload: { frame, timestamp }
              })
            }
          });
          break;

        case 'stepResult':
          // Handle gaze results
          const gazeResult: GazeResult = mess.data.result;
          this.onGazeResults(gazeResult);
          break;

        case 'statusUpdate':
          this.status = mess.data.status;
          break;

        default:
          console.warn(`[WebEyeTrackProxy] Unknown message type: ${mess.data.type}`);
          break;
      }
    }

    // Initialize the worker with model path
    // Construct absolute URL for model at repository root
    // The model is at /dist/web/model.json from repo root, not relative to current file
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    // Extract repo base path
    // For GitHub Pages: /repo-name/experiments/calibration.html -> /repo-name/
    // For local dev: /experiments/calibration.html -> /
    let repoBase: string;
    if (pathname.includes('/experiments/')) {
      // Remove everything from /experiments/ onwards
      repoBase = pathname.substring(0, pathname.indexOf('/experiments/'));
    } else if (pathname.includes('/demo/')) {
      // Remove everything from /demo/ onwards
      repoBase = pathname.substring(0, pathname.indexOf('/demo/'));
    } else {
      // Fallback: just remove filename
      repoBase = pathname.replace(/\/[^/]*$/, '');
    }

    // Ensure trailing slash is removed
    repoBase = repoBase.replace(/\/$/, '');

    const modelPath = `${origin}${repoBase}/dist/web/model.json`;
    console.log('[WebEyeTrackProxy] Repo base:', repoBase);
    console.log('[WebEyeTrackProxy] Model path:', modelPath);
    this.worker.postMessage({ type: 'init', payload: { modelPath } });

    // Add mouse handler for re-calibration
    window.addEventListener('click', (e: MouseEvent) => {
      // Convert px to normalized coordinates
      const normX = (e.clientX / window.innerWidth) - 0.5;
      const normY = (e.clientY / window.innerHeight) - 0.5;
      console.log(`[WebEyeTrackProxy] Click at (${normX}, ${normY})`);
      this.worker.postMessage({ type: 'click', payload: { x: normX, y: normY }});
    })
  }

  // Callback for gaze results
  onGazeResults: (gazeResult: GazeResult) => void = () => { 
    console.warn('onGazeResults callback not set');
  }
}
