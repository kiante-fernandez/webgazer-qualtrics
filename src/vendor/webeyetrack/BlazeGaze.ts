import * as tf from '@tensorflow/tfjs';

// References
// https://js.tensorflow.org/api/latest/#class:LayersModel

export default class BlazeGaze {
    // private model: tf.GraphModel | null = null;
    private model: tf.LayersModel | null = null;  // Use LayersModel for tf.loadLayersModel

    constructor() {
        // Optionally trigger model load in constructor
    }

    async loadModel(modelPath?: string): Promise<void> {
        // Use provided path or construct absolute path from worker/main context
        // Workers need absolute URLs since relative paths don't resolve correctly
        let path: string;

        if (modelPath) {
            path = modelPath;
        } else {
            // Fallback: try to construct absolute path
            // This works in main thread but may fail in workers
            const origin = typeof window !== 'undefined' ? window.location.origin : self.location.origin;
            const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
            const base = pathname.replace(/\/[^/]*$/, '');
            path = `${origin}${base}/dist/web/model.json`;
            console.warn('[BlazeGaze] No model path provided, using fallback:', path);
        }

        try {
            // Load model from specified path
            this.model = await tf.loadLayersModel(path);
            console.log('✅ BlazeGaze model loaded successfully from:', path);
        } catch (error) {
            console.error('❌ Error loading BlazeGaze model from path:', path);
            console.error(error);
            throw error;
        }
        
        // Freeze the ``cnn_model`` layers but keep the gaze_MLP trainable
        this.model.getLayer('cnn_encoder').trainable = false;
    }

    predict(image: tf.Tensor, head_vector: tf.Tensor, face_origin_3d: tf.Tensor): tf.Tensor {
        if (!this.model) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        const inputList: tf.Tensor[] = [image, head_vector, face_origin_3d];

        // Run inference
        const output = this.model.predict(inputList) as tf.Tensor | tf.Tensor[];  // GraphModel always returns Tensor or Tensor[]

        if (Array.isArray(output)) {
            return output[0];  // Return the first tensor if multiple
        }

        return output;
    }
}
