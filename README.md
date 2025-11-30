# WebEyeTrack Adapter for Qualtrics

This project integrates **WebEyeTrack** into Qualtrics surveys, replacing the legacy WebGazer integration. It uses a custom adapter to provide a stable API and handles the WebEyeTrack library via a bundled build.

## Components

1.  **`src/lib/gaze-adapter.ts`**: The core adapter class that wraps WebEyeTrack:
    *   `init()`: Initializes camera and WebEyeTrack model
    *   `start()` / `stop()`: Controls gaze tracking
    *   `calibrate()`: Runs calibration sequence with RMSE metrics
    *   `isAvailable()`: Checks for camera support

2.  **`dist/gaze-adapter.bundle.umd.js`**: Compiled bundle containing the adapter and all dependencies (WebEyeTrack, TensorFlow.js, MediaPipe).

3.  **`demo/gaze-demo.html`**: Standalone demo page to test the adapter.

4.  **`experiments/calibration.html`**: Main experiment file used in the Qualtrics iframe. Handles calibration and continuous tracking.

5.  **`qualtrics/example-question-code.js`**: JavaScript templates for Qualtrics integration.

## Quick Start

### Building the Adapter

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Build the adapter bundle:
    ```bash
    npm run build
    ```

3.  Test the demo:
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173/demo/gaze-demo.html`

### Deploying to Qualtrics

1.  **Deploy files**: Upload `dist/` and `experiments/` to your web server (e.g., GitHub Pages).

2.  **Add Header Code**: In Qualtrics, go to Look & Feel → General → Header and add:
    ```html
    <script>
    (function() {
      if (document.getElementById('calibration-iframe')) return;
      const iframe = document.createElement('iframe');
      iframe.id = 'calibration-iframe';
      iframe.src = 'https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html';
      iframe.allow = 'camera; microphone';
      iframe.style.position = 'fixed';
      iframe.style.bottom = '0';
      iframe.style.left = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-1';
      document.body.appendChild(iframe);
    })();
    </script>
    ```

3.  **Question 1 (Calibration)**: Use the JavaScript template from `qualtrics/example-question-code.js` → "Question 1: Calibration".

4.  **Subsequent Questions**: Use the "Standard Tracking Questions" template for Q2, Q3, etc.

See `qualtrics/README.md` for detailed integration instructions.

## Calibration

The calibration process:
1.  Displays calibration points on screen
2.  Guides user to look at each point
3.  Feeds gaze data to WebEyeTrack's personalization API
4.  Returns RMSE (Root Mean Square Error) accuracy metric

## Fallback Behavior

If camera is unavailable or permission denied:
- `adapter.init()` throws an error
- `adapter.isAvailable()` returns `false`
- Experiment logs diagnostic information

## Visual Verification

After calibration, a red dot appears in standalone mode to show gaze prediction in real-time. This helps verify tracking accuracy.

## License

MIT License - See LICENSE file for details.
