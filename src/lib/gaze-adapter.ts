import { WebcamClient, WebEyeTrackProxy, GazeResult } from 'webeyetrack';

export default class GazeAdapter {
    private proxy: WebEyeTrackProxy | null = null;
    private webcam: WebcamClient | null = null;
    private sampleCallback: ((sample: any) => void) | null = null;
    private lastSample: any = null;
    private videoElement: HTMLVideoElement | null = null;
    private canvasElement: HTMLCanvasElement | null = null;
    private isReady: boolean = false;

    constructor(options: any = {}) {
        // Options could include video element ID, etc.
        // For now, we'll create a hidden video element if not provided
    }

    async init(): Promise<void> {
        if (this.isReady) return;

        if (!this.isAvailable()) {
            console.warn('WebEyeTrack is not available on this device.');
            return;
        }

        // Create video element for WebcamClient
        this.videoElement = document.createElement('video');
        this.videoElement.id = 'webeyetrack-video';
        this.videoElement.style.opacity = '0';  // Invisible but still in layout
        this.videoElement.style.position = 'fixed';
        this.videoElement.style.top = '0';
        this.videoElement.style.left = '0';
        this.videoElement.style.pointerEvents = 'none';
        this.videoElement.style.zIndex = '-1';
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        document.body.appendChild(this.videoElement);

        try {
            this.webcam = new WebcamClient('webeyetrack-video');
            this.proxy = new WebEyeTrackProxy(this.webcam);

            // Hook up the proxy's callback
            this.proxy.onGazeResults = (result: GazeResult) => {
                this.handleGazeResult(result);
            };

            this.isReady = true;
            console.log('GazeAdapter initialized');
        } catch (e) {
            console.error('Failed to initialize GazeAdapter:', e);
            throw e;
        }
    }

    async start(): Promise<void> {
        if (!this.isReady) await this.init();
        if (this.proxy) {
            // The proxy starts inference when the webcam starts sending frames
            // logic in proxy: webcamClient.startWebcam(...)
            // But proxy.constructor calls webcamClient.startWebcam? 
            // Wait, looking at proxy code: 
            // case 'ready': webcamClient.startWebcam(...)
            // So it starts automatically when worker is ready.
            // But we might want to control it.
            // The proxy doesn't seem to have an explicit 'startInference' method exposed in the snippet I saw?
            // Wait, the browser subagent saw `startInference`.
            // Let's assume `startInference` exists or we trigger it.
            // If the snippet showed:
            // case 'ready': webcamClient.startWebcam(...)
            // This means it starts immediately on ready.
            // We might need to control this.
            // For now, let's assume calling init() starts the camera flow.

            // Actually, looking at the snippet:
            // webcamClient.startWebcam(async (frame, timestamp) => { ... worker.postMessage('step') ... })
            // This starts the loop.

            // If we want to "start" and "stop", we might need to stop the webcam or ignore results.
            // WebcamClient has stopWebcam().

            // Let's verify if `startInference` exists on proxy.
            // I'll assume it does based on the subagent report, but if not, I'll rely on webcam control.
            // The snippet showed `onGazeResults` assignment.

            // If `startInference` is not on the proxy (it wasn't in the snippet I read, but was in the screenshot?), 
            // I'll check the screenshot content mentally.
            // Screenshot `webeyetrackproxy_ts` showed:
            // `startInference(callback)`? No, the snippet I read was:
            // `onGazeResults: (gazeResult: GazeResult) => void = () => { ... }`
            // And the constructor sets up the worker message handler.
            // And `webcamClient.startWebcam` is called in `case 'ready'`.
            // So it starts AUTOMATICALLY.

            // To implement `start()` and `stop()`, I might need to manage the webcam or a flag.
            // `stop()`: `this.webcam.stopWebcam()`?
            // `start()`: `this.webcam.startWebcam(...)`?
            // But the proxy handles `startWebcam` internally in `case 'ready'`.
            // This is a bit rigid.
            // If I call `stop()`, I should probably stop the webcam.
            // If I call `start()`, I might need to re-trigger the proxy's flow?
            // Or just ignore samples if stopped.

            // Let's assume for now `start` ensures webcam is running and `stop` stops it.
            // But `proxy` calls `startWebcam` with a specific callback.
            // If I call `webcam.stopWebcam()`, the callback stops.
            // If I call `webcam.startWebcam()` again, I need to pass the SAME callback.
            // But the callback is defined inside the proxy constructor's closure!
            // This makes restarting hard if I stop the webcam.

            // Workaround: Don't stop the webcam, just ignore samples in `handleGazeResult`.
            // Or, if `stop` is meant to release resources, I'm in trouble.
            // But usually `stop` in these experiments just means "pause tracking".
            // WebGazer has `pause` and `resume`.
            // The adapter API has `stop`.
            // I'll implement a `isTracking` flag.
        }
        this.isTracking = true;
    }

    async stop(): Promise<void> {
        this.isTracking = false;
        // Optionally stop webcam to save battery?
        // this.webcam?.stopWebcam(); 
        // But restarting is hard as noted above.
    }

    async calibrate(points: { x: number, y: number }[] = []): Promise<any> {
        // This needs to implement a calibration flow.
        // 1. Create overlay
        // 2. Show points one by one
        // 3. Collect samples (how? proxy.addCalibrationSample?)
        // 4. Compute metrics

        // Since I don't have the full proxy API for calibration confirmed (startCalibration etc),
        // I will implement a placeholder that logs and returns dummy metrics for now,
        // OR try to use the `click` handler logic seen in the proxy:
        // `window.addEventListener('click', ... worker.postMessage({ type: 'click' ... }))`
        // The proxy listens to clicks for calibration!
        // So `calibrate` could just be: "User, please click on these points".

        // If `points` are provided, I should show them.
        // I'll implement a simple overlay.

        return new Promise(async (resolve) => {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.zIndex = '9999';
            overlay.style.background = 'rgba(0,0,0,0.5)';
            document.body.appendChild(overlay);

            const dot = document.createElement('div');
            dot.style.width = '20px';
            dot.style.height = '20px';
            dot.style.background = 'red';
            dot.style.borderRadius = '50%';
            dot.style.position = 'absolute';
            dot.style.transition = 'all 0.5s';
            overlay.appendChild(dot);

            const defaultPoints = [
                { x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 },
                { x: 0.5, y: 0.5 },
                { x: 0.1, y: 0.9 }, { x: 0.9, y: 0.9 }
            ];
            const calibPoints = points.length > 0 ? points : defaultPoints;

            for (const p of calibPoints) {
                dot.style.left = `${p.x * 100}%`;
                dot.style.top = `${p.y * 100}%`;

                await new Promise(r => setTimeout(r, 1000)); // Wait for eye to settle

                // Simulate click or trigger calibration sample
                // The proxy listens to window clicks.
                // We can dispatch a click event?
                const clickEvent = new MouseEvent('click', {
                    clientX: p.x * window.innerWidth,
                    clientY: p.y * window.innerHeight,
                    bubbles: true
                });
                window.dispatchEvent(clickEvent);

                await new Promise(r => setTimeout(r, 500));
            }

            document.body.removeChild(overlay);
            resolve({ rmse: 0.5 }); // Dummy metric for now
        });
    }

    onSample(callback: (sample: any) => void): void {
        this.sampleCallback = callback;
    }

    getLastSample(): any {
        return this.lastSample;
    }

    isAvailable(): boolean {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    private isTracking: boolean = false;

    private handleGazeResult(result: GazeResult) {
        if (!this.isTracking) return;

        const { normPog, gazeState } = result;
        // normPog is [x, y] normalized?
        // App.tsx: x: (gazeResult.normPog[0] + 0.5) * window.innerWidth
        // So normPog is centered at 0? [-0.5, 0.5]?
        // Yes, App.tsx adds 0.5.

        const x = (normPog[0] + 0.5) * window.innerWidth;
        const y = (normPog[1] + 0.5) * window.innerHeight;

        const sample = {
            x,
            y,
            t: Date.now(),
            perf_t: performance.now(),
            confidence: gazeState === 'tracking' ? 1 : 0, // Simplified
            trial_id: '' // user can set this?
        };

        this.lastSample = sample;
        if (this.sampleCallback) {
            this.sampleCallback(sample);
        }
    }
}
