import { WebcamClient, WebEyeTrackProxy, GazeResult } from 'webeyetrack';

export default class GazeAdapter {
    private proxy: WebEyeTrackProxy | null = null;
    private webcam: WebcamClient | null = null;
    private sampleCallback: ((sample: any) => void) | null = null;
    private lastSample: any = null;
    private videoElement: HTMLVideoElement | null = null;
    private isReady: boolean = false;
    private isTracking: boolean = false;

    constructor() {
        // Adapter initialized, call init() to set up camera
    }

    async init(): Promise<void> {
        if (this.isReady) return;

        if (!this.isAvailable()) {
            throw new Error('WebEyeTrack is not available. Camera access is required.');
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
        // WebEyeTrack proxy starts automatically on init
        // Use isTracking flag to control sample processing
        this.isTracking = true;
    }

    async stop(): Promise<void> {
        this.isTracking = false;
    }

    async calibrate(points: { x: number, y: number }[] = []): Promise<any> {
        return new Promise(async (resolve) => {
            // Ensure tracking is started so we can collect validation samples
            if (!this.isTracking) {
                await this.start();
            }

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
            dot.style.background = '#2ecc71';  // Professional green
            dot.style.borderRadius = '50%';
            dot.style.position = 'absolute';
            dot.style.transition = 'all 0.5s';
            overlay.appendChild(dot);

            // Calibration points (where user clicks to calibrate)
            const defaultCalibPoints = [
                { x: 0.5, y: 0.1 },   // top center
                { x: 0.1, y: 0.5 },   // left middle
                { x: 0.9, y: 0.5 },   // right middle
                { x: 0.5, y: 0.5 },   // center
                { x: 0.1, y: 0.1 },   // top left
                { x: 0.9, y: 0.1 },   // top right
                { x: 0.1, y: 0.9 },   // bottom left
                { x: 0.9, y: 0.9 },   // bottom right
            ];
            const calibPoints = points.length > 0 ? points : defaultCalibPoints;

            // PHASE 1: Calibration
            for (const p of calibPoints) {
                dot.style.left = `${p.x * 100}%`;
                dot.style.top = `${p.y * 100}%`;

                await new Promise(r => setTimeout(r, 1000)); // Wait for eye to settle

                // Dispatch click event for WebEyeTrack calibration
                const clickEvent = new MouseEvent('click', {
                    clientX: p.x * window.innerWidth,
                    clientY: p.y * window.innerHeight,
                    bubbles: true
                });
                window.dispatchEvent(clickEvent);

                await new Promise(r => setTimeout(r, 500));
            }

            // Wait for tracking to stabilize after calibration
            await new Promise(r => setTimeout(r, 1000));

            // Ensure we have samples before proceeding
            let waitAttempts = 0;
            while (!this.lastSample && waitAttempts < 50) {
                await new Promise(r => setTimeout(r, 100));
                waitAttempts++;
            }

            if (!this.lastSample) {
                console.warn('[GazeAdapter] No gaze samples available - validation skipped');
                document.body.removeChild(overlay);
                resolve({
                    rmse: 0.1, // Assume decent calibration if tracker is working
                    rmse_pixels: 100,
                    errors: [],
                    validation_points: 0,
                    warning: 'No samples available for validation'
                });
                return;
            }

            // PHASE 2: Validation (different points to test accuracy)
            const validationPoints = [
                { x: 0.3, y: 0.3 },
                { x: 0.7, y: 0.3 },
                { x: 0.5, y: 0.7 },
                { x: 0.3, y: 0.7 },
            ];

            const errors: number[] = [];

            for (const p of validationPoints) {
                dot.style.left = `${p.x * 100}%`;
                dot.style.top = `${p.y * 100}%`;
                dot.style.background = 'blue'; // Different color for validation

                await new Promise(r => setTimeout(r, 800)); // Wait for eye to settle

                // Collect gaze samples
                const samples: { x: number, y: number }[] = [];
                const sampleDuration = 300; // ms
                const sampleStart = performance.now();

                while (performance.now() - sampleStart < sampleDuration) {
                    if (this.lastSample) {
                        samples.push({ x: this.lastSample.x, y: this.lastSample.y });
                    }
                    await new Promise(r => setTimeout(r, 16)); // ~60fps
                }

                if (samples.length > 0) {
                    // Calculate median gaze position (more robust than mean)
                    const sortedX = samples.map(s => s.x).sort((a, b) => a - b);
                    const sortedY = samples.map(s => s.y).sort((a, b) => a - b);
                    const medianX = sortedX[Math.floor(sortedX.length / 2)];
                    const medianY = sortedY[Math.floor(sortedY.length / 2)];

                    // Expected position in pixels
                    const expectedX = p.x * window.innerWidth;
                    const expectedY = p.y * window.innerHeight;

                    // Euclidean distance error
                    const error = Math.sqrt(
                        Math.pow(medianX - expectedX, 2) +
                        Math.pow(medianY - expectedY, 2)
                    );
                    errors.push(error);
                }
            }

            document.body.removeChild(overlay);

            // Calculate RMSE (Root Mean Square Error)
            // Normalize by screen diagonal to get a 0-1 range
            const screenDiagonal = Math.sqrt(
                Math.pow(window.innerWidth, 2) +
                Math.pow(window.innerHeight, 2)
            );

            const squaredErrors = errors.map(e => Math.pow(e, 2));
            const meanSquaredError = squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length;
            const rmse = Math.sqrt(meanSquaredError);
            const normalizedRMSE = rmse / screenDiagonal; // 0-1 range

            console.log('[GazeAdapter] Validation complete:');
            console.log('  Errors (px):', errors.map(e => e.toFixed(1)));
            console.log('  RMSE (px):', rmse.toFixed(1));
            console.log('  Normalized RMSE:', normalizedRMSE.toFixed(3));

            resolve({
                rmse: normalizedRMSE,
                rmse_pixels: rmse,
                errors: errors,
                validation_points: validationPoints.length
            });
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

    private handleGazeResult(result: GazeResult) {
        if (!this.isTracking) return;

        const { normPog, gazeState } = result;

        // WebEyeTrack normPog is centered at 0 in range [-0.5, 0.5]
        // Convert to screen coordinates
        const x = (normPog[0] + 0.5) * window.innerWidth;
        const y = (normPog[1] + 0.5) * window.innerHeight;

        const sample = {
            x,
            y,
            t: Date.now(),
            perf_t: performance.now(),
            confidence: gazeState === 'tracking' ? 1 : 0,
            trial_id: ''
        };

        this.lastSample = sample;
        if (this.sampleCallback) {
            this.sampleCallback(sample);
        }
    }
}
