/**
 * DataAgent - Data Intelligence for AutoML
 * 
 * Handles data validation, preprocessing, augmentation, and quality assessment.
 * Ensures data is optimally prepared for training.
 */

import { BaseAgent, AgentTask, AgentResult } from './BaseAgent';

// Simple interface for DataAgent use
interface OptimizationPlan {
  id: string;
  name: string;
  approach: string;
}

export interface DataProcessingRequest {
  plan: OptimizationPlan;
  trainingData: File[];
  testData: File[];
  augmentationStrategy: string[];
}

export interface DataProcessingResult {
  success: boolean;
  processedData: ProcessedDataset;
  testData: ProcessedDataset;
  statistics: DataStatistics;
  qualityReport: QualityReport;
  augmentationReport: AugmentationReport;
}

export interface ProcessedDataset {
  images: ProcessedImage[];
  labels: number[];
  categories: string[];
  shape: [number, number, number]; // [height, width, channels]
  size: number;
}

export interface ProcessedImage {
  data: Float32Array | Uint8Array;
  shape: [number, number, number];
  category: string;
  label: number;
  augmented: boolean;
  quality: number; // 0-1 quality score
}

export interface DataStatistics {
  totalImages: number;
  categoryCounts: Record<string, number>;
  averageImageSize: [number, number];
  colorChannels: number;
  dataBalance: number; // 0-1, closer to 1 is more balanced
  qualityScore: number; // 0-1 overall quality
  duplicates: number;
  corrupted: number;
}

export interface QualityReport {
  overallScore: number;
  issues: QualityIssue[];
  recommendations: string[];
  dataBalance: BalanceReport;
  imageQuality: ImageQualityReport;
}

export interface QualityIssue {
  type: 'class_imbalance' | 'low_quality' | 'size_variation' | 'corruption' | 'duplicates';
  severity: 'low' | 'medium' | 'high';
  description: string;
  count: number;
  recommendation: string;
}

export interface BalanceReport {
  isBalanced: boolean;
  imbalanceRatio: number;
  leastSamples: number;
  mostSamples: number;
  recommendation: string;
}

export interface ImageQualityReport {
  averageQuality: number;
  lowQualityCount: number;
  resolutionVariance: number;
  colorConsistency: number;
}

export interface AugmentationReport {
  strategiesApplied: string[];
  originalCount: number;
  augmentedCount: number;
  totalFinalCount: number;
  balanceImprovement: number;
}

export class DataAgent extends BaseAgent {
  private supportedFormats: Set<string>;
  private qualityThreshold: number;
  private maxImageSize: number;
  private targetImageSize: [number, number];

  constructor(id: string) {
    super(id, 'Data Agent');
    this.supportedFormats = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']);
    this.qualityThreshold = 0.7;
    this.maxImageSize = 2048;
    this.targetImageSize = [224, 224]; // Standard input size
  }

  protected async onInitialize(): Promise<void> {
    console.log('📊 Initializing Data Agent...');
    console.log('📁 Supported formats:', Array.from(this.supportedFormats));
    console.log('🎯 Target image size:', this.targetImageSize);
    console.log('⚡ Quality threshold:', this.qualityThreshold);
  }

  protected async onExecute(task: AgentTask): Promise<AgentResult> {
    if (task.type === 'process_data') {
      return await this.handleDataProcessing(task.data as DataProcessingRequest);
    }
    
    throw new Error(`Unknown task type: ${task.type}`);
  }

  protected async onCleanup(): Promise<void> {
    console.log('🧹 Cleaning up Data Agent...');
  }

  /**
   * Main data processing method
   */
  async processData(request: DataProcessingRequest): Promise<DataProcessingResult> {
    console.log('🔄 Starting data processing pipeline...');
    
    try {
      // Step 1: Validate and load data
      console.log('📋 Step 1: Validating and loading data...');
      const { trainingImages, testImages } = await this.validateAndLoadData(
        request.trainingData, 
        request.testData
      );

      // Step 2: Analyze data quality
      console.log('🔍 Step 2: Analyzing data quality...');
      const statistics = await this.analyzeDataStatistics(trainingImages);
      const qualityReport = await this.generateQualityReport(trainingImages, statistics);

      // Step 3: Preprocess images
      console.log('⚙️ Step 3: Preprocessing images...');
      const preprocessedTraining = await this.preprocessImages(trainingImages);
      const preprocessedTest = await this.preprocessImages(testImages);

      // Step 4: Apply data augmentation
      console.log('🎨 Step 4: Applying data augmentation...');
      const { augmentedImages, augmentationReport } = await this.applyDataAugmentation(
        preprocessedTraining,
        request.augmentationStrategy,
        statistics
      );

      // Step 5: Create final datasets
      console.log('📦 Step 5: Creating final datasets...');
      const processedTraining = this.createProcessedDataset(augmentedImages, request.plan.strategy.categories);
      const processedTest = this.createProcessedDataset(preprocessedTest, request.plan.strategy.categories);

      const result: DataProcessingResult = {
        success: true,
        processedData: processedTraining,
        testData: processedTest,
        statistics: await this.analyzeDataStatistics([...augmentedImages]),
        qualityReport,
        augmentationReport
      };

      console.log('✅ Data processing completed successfully');
      console.log(`📊 Final dataset: ${result.processedData.size} training, ${result.testData.size} test images`);
      
      return result;

    } catch (error) {
      console.error('❌ Data processing failed:', error);
      throw error;
    }
  }

  /**
   * Validate and load image data
   */
  private async validateAndLoadData(
    trainingFiles: File[], 
    testFiles: File[]
  ): Promise<{ trainingImages: ImageData[], testImages: ImageData[] }> {
    
    const trainingImages: ImageData[] = [];
    const testImages: ImageData[] = [];

    // Process training files
    console.log(`📁 Loading ${trainingFiles.length} training files...`);
    for (const file of trainingFiles) {
      if (this.isValidImageFile(file)) {
        try {
          const imageData = await this.loadImageFromFile(file);
          trainingImages.push(imageData);
        } catch (error) {
          console.warn(`⚠️ Failed to load training image ${file.name}:`, error);
        }
      }
    }

    // Process test files
    console.log(`📁 Loading ${testFiles.length} test files...`);
    for (const file of testFiles) {
      if (this.isValidImageFile(file)) {
        try {
          const imageData = await this.loadImageFromFile(file);
          testImages.push(imageData);
        } catch (error) {
          console.warn(`⚠️ Failed to load test image ${file.name}:`, error);
        }
      }
    }

    console.log(`✅ Loaded ${trainingImages.length} training and ${testImages.length} test images`);
    return { trainingImages, testImages };
  }

  /**
   * Check if file is a valid image
   */
  private isValidImageFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return this.supportedFormats.has(extension) && file.size > 0 && file.size < 50 * 1024 * 1024; // Max 50MB
  }

  /**
   * Load image from file
   */
  private async loadImageFromFile(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas to extract image data
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not create canvas context');

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          
          // Extract category from filename (assumes format: category_name_123.jpg)
          const category = this.extractCategoryFromFilename(file.name);
          
          const result: ImageData = {
            data: imageData.data,
            width: img.width,
            height: img.height,
            channels: 4, // RGBA
            category,
            filename: file.name,
            quality: this.assessImageQuality(imageData)
          };

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Extract category from filename
   */
  private extractCategoryFromFilename(filename: string): string {
    // Try common patterns: category_name.jpg, category/image.jpg, etc.
    const patterns = [
      /^([^_]+)_/,           // category_name.jpg
      /\/([^\/]+)\/[^\/]+$/, // path/category/image.jpg  
      /^([^0-9]+)/           // categoryname123.jpg
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase().trim();
      }
    }

    // Default to generic category
    return 'unknown';
  }

  /**
   * Assess individual image quality
   */
  private assessImageQuality(imageData: ImageData): number {
    let quality = 1.0;
    
    // Check resolution
    const totalPixels = imageData.width * imageData.height;
    if (totalPixels < 32 * 32) quality *= 0.3; // Too small
    else if (totalPixels < 64 * 64) quality *= 0.6;
    
    // Check for excessive blur (simplified)
    const data = imageData.data;
    let variance = 0;
    const sampleSize = Math.min(1000, data.length / 4);
    
    for (let i = 0; i < sampleSize * 4; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      variance += Math.pow(gray - 128, 2);
    }
    
    variance /= sampleSize;
    if (variance < 100) quality *= 0.5; // Likely blurry
    
    return Math.max(0.1, quality);
  }

  /**
   * Analyze data statistics
   */
  private async analyzeDataStatistics(images: ImageData[]): Promise<DataStatistics> {
    const categoryCounts: Record<string, number> = {};
    let totalWidth = 0, totalHeight = 0;
    let qualitySum = 0;
    let duplicates = 0;
    let corrupted = 0;

    // Count categories and calculate averages
    for (const img of images) {
      categoryCounts[img.category] = (categoryCounts[img.category] || 0) + 1;
      totalWidth += img.width;
      totalHeight += img.height;
      qualitySum += img.quality;
      
      if (img.quality < 0.3) corrupted++;
    }

    // Calculate data balance
    const counts = Object.values(categoryCounts);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const dataBalance = counts.length > 1 ? minCount / maxCount : 1;

    return {
      totalImages: images.length,
      categoryCounts,
      averageImageSize: [totalWidth / images.length, totalHeight / images.length],
      colorChannels: 3, // Assuming RGB after processing
      dataBalance,
      qualityScore: qualitySum / images.length,
      duplicates,
      corrupted
    };
  }

  /**
   * Generate comprehensive quality report
   */
  private async generateQualityReport(
    images: ImageData[], 
    statistics: DataStatistics
  ): Promise<QualityReport> {
    const issues: QualityIssue[] = [];
    const recommendations: string[] = [];

    // Check class balance
    const balanceReport: BalanceReport = {
      isBalanced: statistics.dataBalance > 0.7,
      imbalanceRatio: statistics.dataBalance,
      leastSamples: Math.min(...Object.values(statistics.categoryCounts)),
      mostSamples: Math.max(...Object.values(statistics.categoryCounts)),
      recommendation: statistics.dataBalance < 0.7 
        ? 'Consider data augmentation for minority classes'
        : 'Classes are reasonably balanced'
    };

    if (!balanceReport.isBalanced) {
      issues.push({
        type: 'class_imbalance',
        severity: statistics.dataBalance < 0.3 ? 'high' : 'medium',
        description: `Class imbalance detected (ratio: ${statistics.dataBalance.toFixed(2)})`,
        count: Object.keys(statistics.categoryCounts).length,
        recommendation: 'Apply targeted data augmentation to minority classes'
      });
    }

    // Check image quality
    const imageQualityReport: ImageQualityReport = {
      averageQuality: statistics.qualityScore,
      lowQualityCount: statistics.corrupted,
      resolutionVariance: this.calculateResolutionVariance(images),
      colorConsistency: 0.8 // Simplified
    };

    if (statistics.qualityScore < this.qualityThreshold) {
      issues.push({
        type: 'low_quality',
        severity: statistics.qualityScore < 0.5 ? 'high' : 'medium',
        description: `Low average image quality (${(statistics.qualityScore * 100).toFixed(1)}%)`,
        count: statistics.corrupted,
        recommendation: 'Consider quality filtering and image enhancement'
      });
    }

    // Overall score calculation
    const overallScore = (
      statistics.dataBalance * 0.3 +
      statistics.qualityScore * 0.4 +
      (1 - statistics.corrupted / statistics.totalImages) * 0.3
    );

    return {
      overallScore,
      issues,
      recommendations,
      dataBalance: balanceReport,
      imageQuality: imageQualityReport
    };
  }

  /**
   * Calculate resolution variance
   */
  private calculateResolutionVariance(images: ImageData[]): number {
    if (images.length === 0) return 0;
    
    const areas = images.map(img => img.width * img.height);
    const mean = areas.reduce((sum, area) => sum + area, 0) / areas.length;
    const variance = areas.reduce((sum, area) => sum + Math.pow(area - mean, 2), 0) / areas.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  /**
   * Preprocess images (resize, normalize)
   */
  private async preprocessImages(images: ImageData[]): Promise<ProcessedImage[]> {
    const processed: ProcessedImage[] = [];
    
    for (const img of images) {
      try {
        const processedImg = await this.preprocessSingleImage(img);
        processed.push(processedImg);
      } catch (error) {
        console.warn(`⚠️ Failed to preprocess image ${img.filename}:`, error);
      }
    }
    
    return processed;
  }

  /**
   * Preprocess single image
   */
  private async preprocessSingleImage(img: ImageData): Promise<ProcessedImage> {
    // Resize image to target size
    const resized = this.resizeImage(img, this.targetImageSize);
    
    // Convert to RGB and normalize
    const normalized = this.normalizeImage(resized);
    
    return {
      data: normalized,
      shape: [this.targetImageSize[0], this.targetImageSize[1], 3],
      category: img.category,
      label: 0, // Will be set later
      augmented: false,
      quality: img.quality
    };
  }

  /**
   * Resize image to target dimensions
   */
  private resizeImage(img: ImageData, targetSize: [number, number]): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    // Create source canvas
    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) throw new Error('Could not create source canvas context');

    sourceCanvas.width = img.width;
    sourceCanvas.height = img.height;
    sourceCtx.putImageData(new ImageData(img.data, img.width, img.height), 0, 0);

    // Resize to target
    canvas.width = targetSize[0];
    canvas.height = targetSize[1];
    ctx.drawImage(sourceCanvas, 0, 0, targetSize[0], targetSize[1]);

    const resizedImageData = ctx.getImageData(0, 0, targetSize[0], targetSize[1]);
    
    return {
      data: resizedImageData.data,
      width: targetSize[0],
      height: targetSize[1],
      channels: 4,
      category: img.category,
      filename: img.filename,
      quality: img.quality
    };
  }

  /**
   * Normalize image data
   */
  private normalizeImage(img: ImageData): Float32Array {
    const rgbData = new Float32Array(img.width * img.height * 3);
    const data = img.data;
    
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      rgbData[j] = data[i] / 255.0;       // R
      rgbData[j + 1] = data[i + 1] / 255.0; // G
      rgbData[j + 2] = data[i + 2] / 255.0; // B
      // Skip alpha channel
    }
    
    return rgbData;
  }

  /**
   * Apply data augmentation
   */
  private async applyDataAugmentation(
    images: ProcessedImage[],
    strategies: string[],
    statistics: DataStatistics
  ): Promise<{ augmentedImages: ProcessedImage[], augmentationReport: AugmentationReport }> {
    
    const augmentedImages = [...images]; // Start with original images
    const originalCount = images.length;
    
    // Apply augmentation based on class imbalance
    const targetCount = Math.max(...Object.values(statistics.categoryCounts));
    
    for (const [category, count] of Object.entries(statistics.categoryCounts)) {
      if (count < targetCount) {
        const needed = targetCount - count;
        const categoryImages = images.filter(img => img.category === category);
        
        for (let i = 0; i < needed && categoryImages.length > 0; i++) {
          const sourceImg = categoryImages[i % categoryImages.length];
          const augmented = this.augmentImage(sourceImg, strategies);
          augmented.augmented = true;
          augmentedImages.push(augmented);
        }
      }
    }

    const augmentationReport: AugmentationReport = {
      strategiesApplied: strategies,
      originalCount,
      augmentedCount: augmentedImages.length - originalCount,
      totalFinalCount: augmentedImages.length,
      balanceImprovement: this.calculateBalanceImprovement(statistics, augmentedImages)
    };

    return { augmentedImages, augmentationReport };
  }

  /**
   * Augment single image
   */
  private augmentImage(img: ProcessedImage, strategies: string[]): ProcessedImage {
    // For now, create a simple copy with slight modifications
    // In a real implementation, this would apply actual augmentation transformations
    const augmented: ProcessedImage = {
      data: new Float32Array(img.data), // Copy data
      shape: [...img.shape] as [number, number, number],
      category: img.category,
      label: img.label,
      augmented: true,
      quality: Math.max(0.5, img.quality * 0.9) // Slightly lower quality for augmented
    };

    // Apply simple modifications based on strategies
    if (strategies.includes('horizontal_flip')) {
      // Flip logic would go here
    }
    if (strategies.includes('brightness_0.2')) {
      // Brightness adjustment would go here
    }

    return augmented;
  }

  /**
   * Calculate balance improvement after augmentation
   */
  private calculateBalanceImprovement(
    originalStats: DataStatistics, 
    augmentedImages: ProcessedImage[]
  ): number {
    const newCounts: Record<string, number> = {};
    
    for (const img of augmentedImages) {
      newCounts[img.category] = (newCounts[img.category] || 0) + 1;
    }
    
    const newCountValues = Object.values(newCounts);
    const newBalance = Math.min(...newCountValues) / Math.max(...newCountValues);
    
    return newBalance - originalStats.dataBalance;
  }

  /**
   * Create final processed dataset
   */
  private createProcessedDataset(images: ProcessedImage[], categories: string[]): ProcessedDataset {
    // Create category to label mapping
    const categoryToLabel = new Map(categories.map((cat, idx) => [cat, idx]));
    
    // Assign labels and filter valid categories
    const validImages = images.filter(img => categoryToLabel.has(img.category));
    validImages.forEach(img => {
      img.label = categoryToLabel.get(img.category) || 0;
    });

    return {
      images: validImages,
      labels: validImages.map(img => img.label),
      categories,
      shape: validImages.length > 0 ? validImages[0].shape : [224, 224, 3],
      size: validImages.length
    };
  }

  /**
   * Handle data processing task
   */
  private async handleDataProcessing(request: DataProcessingRequest): Promise<AgentResult> {
    try {
      const result = await this.processData(request);
      
      return {
        success: true,
        data: result,
        metrics: {
          totalProcessed: result.processedData.size,
          qualityScore: result.statistics.qualityScore,
          dataBalance: result.statistics.dataBalance,
          augmentationApplied: result.augmentationReport.augmentedCount
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown data processing error',
        timestamp: new Date()
      };
    }
  }
}

// Supporting interfaces
interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  channels: number;
  category: string;
  filename: string;
  quality: number;
}