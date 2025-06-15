import * as tf from '@tensorflow/tfjs';

export class TensorFlowUtils {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('TensorFlow.js already initialized');
      return;
    }

    try {
      // Set backend to WebGL for better performance
      await tf.setBackend('webgl');
      
      // Wait for backend to be ready
      await tf.ready();
      
      this.initialized = true;
      
      console.log('✅ TensorFlow.js initialized successfully');
      console.log('Backend:', tf.getBackend());
      console.log('Memory:', tf.memory());
      
    } catch (error) {
      console.error('❌ Failed to initialize TensorFlow.js:', error);
      
      // Fallback to CPU backend
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        this.initialized = true;
        console.log('⚠️ Fallback to CPU backend successful');
      } catch (fallbackError) {
        console.error('❌ CPU fallback also failed:', fallbackError);
        throw new Error('Failed to initialize TensorFlow.js with any backend');
      }
    }
  }

  static isInitialized(): boolean {
    return this.initialized;
  }

  static getSystemInfo() {
    return {
      backend: tf.getBackend(),
      memory: tf.memory(),
      version: tf.version.tfjs,
      platform: tf.env().platform,
      features: {
        webgl: tf.env().getBool('WEBGL_VERSION'),
        cpu: true,
        simd: tf.env().getBool('WASM_HAS_SIMD_SUPPORT'),
        threads: tf.env().getBool('WASM_HAS_MULTITHREAD_SUPPORT')
      }
    };
  }

  // Model loading utilities
  static async loadModel(modelUrl: string): Promise<tf.LayersModel> {
    try {
      console.log(`Loading model from: ${modelUrl}`);
      const model = await tf.loadLayersModel(modelUrl);
      console.log('✅ Model loaded successfully');
      console.log('Model summary:', model.summary());
      return model;
    } catch (error) {
      console.error('❌ Failed to load model:', error);
      throw error;
    }
  }

  // Pre-trained model utilities
  static async loadMobileNet(): Promise<tf.LayersModel> {
    try {
      const mobilenet = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
      console.log('✅ MobileNet loaded successfully');
      return mobilenet;
    } catch (error) {
      console.error('❌ Failed to load MobileNet:', error);
      throw error;
    }
  }

  // Image preprocessing utilities
  static preprocessImage(imageElement: HTMLImageElement, targetSize: [number, number] = [224, 224]): tf.Tensor {
    return tf.tidy(() => {
      // Convert image to tensor
      let tensor = tf.browser.fromPixels(imageElement);
      
      // Resize to target size
      tensor = tf.image.resizeBilinear(tensor, targetSize);
      
      // Normalize to [0, 1]
      tensor = tensor.div(255.0);
      
      // Add batch dimension
      tensor = tensor.expandDims(0);
      
      return tensor;
    });
  }

  static async preprocessImageFile(file: File, targetSize: [number, number] = [224, 224]): Promise<tf.Tensor> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const tensor = this.preprocessImage(img, targetSize);
          resolve(tensor);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Data preparation utilities
  static createDataset(images: tf.Tensor[], labels: number[]): tf.data.Dataset<{xs: tf.Tensor, ys: tf.Tensor}> {
    const xs = tf.stack(images);
    const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), Math.max(...labels) + 1);
    
    return tf.data.zip({xs: tf.data.array(xs.unstack()), ys: tf.data.array(ys.unstack())});
  }

  // Training utilities
  static createOptimizer(type: string, learningRate: number): tf.Optimizer {
    switch (type.toLowerCase()) {
      case 'adam':
        return tf.train.adam(learningRate);
      case 'sgd':
        return tf.train.sgd(learningRate);
      case 'rmsprop':
        return tf.train.rmsprop(learningRate);
      default:
        console.warn(`Unknown optimizer: ${type}, using Adam`);
        return tf.train.adam(learningRate);
    }
  }

  // Memory management
  static cleanupTensors(): void {
    const numTensors = tf.memory().numTensors;
    tf.disposeVariables();
    console.log(`🧹 Cleaned up tensors. Before: ${numTensors}, After: ${tf.memory().numTensors}`);
  }

  static logMemoryUsage(): void {
    const memory = tf.memory();
    console.log('📊 TensorFlow.js Memory Usage:', {
      numTensors: memory.numTensors,
      numDataBuffers: memory.numDataBuffers,
      numBytes: memory.numBytes,
      unreliable: memory.unreliable
    });
  }

  // Model building utilities
  static createSequentialModel(inputShape: number[]): tf.Sequential {
    const model = tf.sequential();
    
    // Add input layer implicitly through first layer
    console.log(`Creating model with input shape: [${inputShape.join(', ')}]`);
    
    return model;
  }

  static addTransferLearningLayers(
    baseModel: tf.LayersModel, 
    numClasses: number, 
    freezeBase: boolean = true
  ): tf.Sequential {
    const model = tf.sequential();
    
    // Add base model (feature extractor)
    if (freezeBase) {
      baseModel.trainable = false;
    }
    
    // Remove top classification layer and add custom layers
    const featureExtractor = tf.model({
      inputs: baseModel.input,
      outputs: baseModel.layers[baseModel.layers.length - 2].output
    });
    
    model.add(featureExtractor);
    model.add(tf.layers.globalAveragePooling2d({}));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ 
      units: numClasses, 
      activation: 'softmax',
      name: 'predictions'
    }));
    
    return model;
  }

  // Evaluation utilities
  static async evaluateModel(
    model: tf.LayersModel, 
    testData: tf.data.Dataset<{xs: tf.Tensor, ys: tf.Tensor}>
  ): Promise<{accuracy: number, loss: number}> {
    const evaluation = await model.evaluateDataset(testData);
    
    const loss = await (evaluation as tf.Scalar[])[0].data();
    const accuracy = await (evaluation as tf.Scalar[])[1].data();
    
    return {
      loss: loss[0],
      accuracy: accuracy[0]
    };
  }

  // Prediction utilities
  static async predict(model: tf.LayersModel, input: tf.Tensor): Promise<number[]> {
    const prediction = model.predict(input) as tf.Tensor;
    const probabilities = await prediction.data();
    return Array.from(probabilities);
  }

  static getPredictedClass(probabilities: number[]): {classIndex: number, confidence: number} {
    const classIndex = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[classIndex];
    
    return { classIndex, confidence };
  }
}

// Initialize TensorFlow.js when module is imported
TensorFlowUtils.initialize().catch(error => {
  console.error('Failed to initialize TensorFlow.js on import:', error);
});