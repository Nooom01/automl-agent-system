export interface KnowledgeEntry {
  id: string;
  category: 'architecture' | 'training' | 'optimization' | 'troubleshooting' | 'best-practice';
  tags: string[];
  title: string;
  content: string;
  examples?: string[];
  relatedEntries?: string[];
  confidence: number;
}

export interface SearchResult {
  entry: KnowledgeEntry;
  relevance: number;
  matchedTerms: string[];
}

export class KnowledgeBase {
  private entries: Map<string, KnowledgeEntry>;
  private tagIndex: Map<string, Set<string>>;
  private termIndex: Map<string, Set<string>>;

  constructor() {
    this.entries = new Map();
    this.tagIndex = new Map();
    this.termIndex = new Map();
    this.initializeKnowledge();
  }

  private initializeKnowledge(): void {
    const knowledgeData: KnowledgeEntry[] = [
      {
        id: 'arch-cnn-basics',
        category: 'architecture',
        tags: ['cnn', 'convolution', 'image-classification'],
        title: 'CNN Architecture Basics',
        content: 'Convolutional Neural Networks (CNNs) are ideal for image classification. Key components include convolutional layers for feature extraction, pooling layers for dimensionality reduction, and fully connected layers for classification.',
        examples: [
          'Conv2D -> MaxPooling2D -> Conv2D -> MaxPooling2D -> Flatten -> Dense -> Output',
          'Use 3x3 or 5x5 kernels for convolution layers',
          'Apply batch normalization after convolution layers'
        ],
        confidence: 0.95
      },
      {
        id: 'arch-transfer-learning',
        category: 'architecture',
        tags: ['transfer-learning', 'pretrained', 'fine-tuning'],
        title: 'Transfer Learning Strategies',
        content: 'Transfer learning leverages pre-trained models to improve performance on new tasks. Common approaches include feature extraction (freeze base layers) and fine-tuning (unfreeze top layers).',
        examples: [
          'MobileNetV2 for mobile deployment',
          'EfficientNet for best accuracy/efficiency trade-off',
          'ResNet50 for general purpose tasks'
        ],
        relatedEntries: ['arch-cnn-basics', 'train-fine-tuning'],
        confidence: 0.92
      },
      {
        id: 'train-early-stopping',
        category: 'training',
        tags: ['early-stopping', 'overfitting', 'validation'],
        title: 'Early Stopping Configuration',
        content: 'Early stopping prevents overfitting by monitoring validation metrics. Stop training when validation loss stops improving for a specified number of epochs (patience).',
        examples: [
          'patience=5-10 for small datasets',
          'patience=10-20 for large datasets',
          'monitor="val_loss" with mode="min"'
        ],
        confidence: 0.88
      },
      {
        id: 'train-learning-rate',
        category: 'training',
        tags: ['learning-rate', 'optimization', 'scheduler'],
        title: 'Learning Rate Scheduling',
        content: 'Adaptive learning rates improve convergence. Start with a higher rate and reduce it when plateaus are detected. Common schedulers include ReduceLROnPlateau and CosineAnnealing.',
        examples: [
          'Initial LR: 0.001 for Adam, 0.01 for SGD',
          'Reduce factor: 0.1-0.5',
          'Patience: 3-5 epochs'
        ],
        relatedEntries: ['opt-adam-optimizer'],
        confidence: 0.90
      },
      {
        id: 'opt-data-augmentation',
        category: 'optimization',
        tags: ['augmentation', 'data', 'preprocessing'],
        title: 'Data Augmentation Techniques',
        content: 'Data augmentation artificially expands training data through transformations. Essential for small datasets and improving model generalization.',
        examples: [
          'Rotation: ±15-30 degrees',
          'Width/Height shift: 0.1-0.2',
          'Horizontal flip for symmetric objects',
          'Zoom range: 0.1-0.2'
        ],
        confidence: 0.93
      },
      {
        id: 'opt-batch-size',
        category: 'optimization',
        tags: ['batch-size', 'memory', 'performance'],
        title: 'Batch Size Selection',
        content: 'Batch size affects training stability and speed. Larger batches provide more stable gradients but require more memory. Smaller batches add regularization effect.',
        examples: [
          '32-64 for most tasks',
          '8-16 for limited memory',
          '128-256 for large datasets with sufficient GPU'
        ],
        confidence: 0.87
      },
      {
        id: 'trouble-low-accuracy',
        category: 'troubleshooting',
        tags: ['accuracy', 'performance', 'debugging'],
        title: 'Improving Low Accuracy',
        content: 'Low accuracy can result from various issues. Check data quality, model capacity, learning rate, and training duration.',
        examples: [
          'Verify data labels are correct',
          'Increase model complexity if underfitting',
          'Add regularization if overfitting',
          'Try different architectures'
        ],
        relatedEntries: ['arch-cnn-basics', 'opt-data-augmentation'],
        confidence: 0.85
      },
      {
        id: 'trouble-overfitting',
        category: 'troubleshooting',
        tags: ['overfitting', 'regularization', 'generalization'],
        title: 'Addressing Overfitting',
        content: 'Overfitting occurs when model memorizes training data. Apply regularization techniques to improve generalization.',
        examples: [
          'Add dropout layers (0.2-0.5)',
          'Use L1/L2 regularization',
          'Reduce model complexity',
          'Increase training data or augmentation'
        ],
        relatedEntries: ['train-early-stopping', 'opt-data-augmentation'],
        confidence: 0.91
      },
      {
        id: 'best-image-preprocessing',
        category: 'best-practice',
        tags: ['preprocessing', 'normalization', 'images'],
        title: 'Image Preprocessing Standards',
        content: 'Consistent preprocessing ensures model stability. Normalize pixel values and resize images to expected input dimensions.',
        examples: [
          'Normalize to [0,1] by dividing by 255',
          'Normalize to [-1,1] for certain models',
          'Resize maintaining aspect ratio when possible',
          'Center crop for consistent dimensions'
        ],
        confidence: 0.94
      },
      {
        id: 'best-model-evaluation',
        category: 'best-practice',
        tags: ['evaluation', 'metrics', 'validation'],
        title: 'Model Evaluation Best Practices',
        content: 'Comprehensive evaluation ensures reliable deployment. Use multiple metrics and cross-validation for robust assessment.',
        examples: [
          'Report accuracy, precision, recall, F1',
          'Generate confusion matrix',
          'Use stratified splits for imbalanced data',
          'Perform k-fold cross-validation'
        ],
        relatedEntries: ['trouble-low-accuracy'],
        confidence: 0.89
      }
    ];

    // Index all knowledge entries
    knowledgeData.forEach(entry => {
      this.addEntry(entry);
    });
  }

  private addEntry(entry: KnowledgeEntry): void {
    this.entries.set(entry.id, entry);

    // Index by tags
    entry.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(entry.id);
    });

    // Index by terms (simple tokenization)
    const terms = this.extractTerms(entry.title + ' ' + entry.content);
    terms.forEach(term => {
      if (!this.termIndex.has(term)) {
        this.termIndex.set(term, new Set());
      }
      this.termIndex.get(term)!.add(entry.id);
    });
  }

  private extractTerms(text: string): Set<string> {
    // Simple tokenization and normalization
    return new Set(
      text.toLowerCase()
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter(term => term.length > 2)
    );
  }

  search(query: string, options: {
    category?: KnowledgeEntry['category'];
    tags?: string[];
    limit?: number;
  } = {}): SearchResult[] {
    const { category, tags, limit = 5 } = options;
    const queryTerms = this.extractTerms(query);
    const results: SearchResult[] = [];

    // Score each entry
    this.entries.forEach((entry, id) => {
      // Filter by category if specified
      if (category && entry.category !== category) {
        return;
      }

      // Filter by tags if specified
      if (tags && tags.length > 0) {
        const hasRequiredTag = tags.some(tag => entry.tags.includes(tag));
        if (!hasRequiredTag) {
          return;
        }
      }

      // Calculate relevance score
      let relevance = 0;
      const matchedTerms: string[] = [];

      // Term matching
      queryTerms.forEach(term => {
        if (this.termIndex.get(term)?.has(id)) {
          relevance += 1;
          matchedTerms.push(term);
        }
      });

      // Tag matching (higher weight)
      entry.tags.forEach(tag => {
        if (queryTerms.has(tag)) {
          relevance += 2;
          if (!matchedTerms.includes(tag)) {
            matchedTerms.push(tag);
          }
        }
      });

      // Title matching (highest weight)
      const titleTerms = this.extractTerms(entry.title);
      queryTerms.forEach(term => {
        if (titleTerms.has(term)) {
          relevance += 3;
        }
      });

      // Apply confidence factor
      relevance *= entry.confidence;

      if (relevance > 0) {
        results.push({
          entry,
          relevance,
          matchedTerms
        });
      }
    });

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  getRelatedEntries(entryId: string, limit: number = 3): KnowledgeEntry[] {
    const entry = this.entries.get(entryId);
    if (!entry) {
      return [];
    }

    const related: KnowledgeEntry[] = [];

    // Get explicitly related entries
    if (entry.relatedEntries) {
      entry.relatedEntries.forEach(relId => {
        const relEntry = this.entries.get(relId);
        if (relEntry) {
          related.push(relEntry);
        }
      });
    }

    // Find entries with similar tags
    const tagMatches = new Map<string, number>();
    entry.tags.forEach(tag => {
      this.tagIndex.get(tag)?.forEach(id => {
        if (id !== entryId && !entry.relatedEntries?.includes(id)) {
          tagMatches.set(id, (tagMatches.get(id) || 0) + 1);
        }
      });
    });

    // Sort by number of matching tags
    const sortedMatches = Array.from(tagMatches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit - related.length);

    sortedMatches.forEach(([id]) => {
      const matchEntry = this.entries.get(id);
      if (matchEntry) {
        related.push(matchEntry);
      }
    });

    return related.slice(0, limit);
  }

  getByCategory(category: KnowledgeEntry['category']): KnowledgeEntry[] {
    return Array.from(this.entries.values())
      .filter(entry => entry.category === category)
      .sort((a, b) => b.confidence - a.confidence);
  }

  getByTag(tag: string): KnowledgeEntry[] {
    const entryIds = this.tagIndex.get(tag);
    if (!entryIds) {
      return [];
    }

    return Array.from(entryIds)
      .map(id => this.entries.get(id)!)
      .filter(entry => entry !== undefined)
      .sort((a, b) => b.confidence - a.confidence);
  }

  suggestSolutions(problem: string): {
    primary: KnowledgeEntry[];
    secondary: KnowledgeEntry[];
    actions: string[];
  } {
    // Search for directly relevant entries
    const primaryResults = this.search(problem, { limit: 3 });
    const primary = primaryResults.map(r => r.entry);

    // Get related entries for broader context
    const secondary: KnowledgeEntry[] = [];
    primary.forEach(entry => {
      const related = this.getRelatedEntries(entry.id, 2);
      related.forEach(rel => {
        if (!secondary.find(s => s.id === rel.id)) {
          secondary.push(rel);
        }
      });
    });

    // Generate action items based on entries
    const actions: string[] = [];
    
    // Extract examples as actions
    primary.forEach(entry => {
      if (entry.examples) {
        actions.push(...entry.examples.slice(0, 2));
      }
    });

    // Add generic actions based on problem keywords
    const problemLower = problem.toLowerCase();
    if (problemLower.includes('accuracy') || problemLower.includes('performance')) {
      actions.push('Review training data quality and distribution');
      actions.push('Try different model architectures');
    }
    if (problemLower.includes('overfit')) {
      actions.push('Add regularization (dropout, L1/L2)');
      actions.push('Increase data augmentation');
    }
    if (problemLower.includes('slow') || problemLower.includes('speed')) {
      actions.push('Reduce model complexity');
      actions.push('Optimize batch size for hardware');
    }

    return {
      primary,
      secondary,
      actions: actions.slice(0, 5) // Limit to 5 actions
    };
  }
}