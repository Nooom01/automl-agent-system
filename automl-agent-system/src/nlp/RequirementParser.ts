/**
 * RequirementParser - Natural Language Processing for AutoML Requirements
 * 
 * Converts natural language descriptions into structured requirements that
 * the AutoML agents can understand and execute.
 */

export interface ParsedRequirement {
  taskType: 'classification' | 'detection' | 'segmentation';
  categories: string[];
  targetAccuracy: number;
  constraints: Constraint[];
  timeLimit?: number;
  priority: 'speed' | 'accuracy' | 'balanced';
  confidence: number;
  ambiguities: string[];
  suggestedClarifications: string[];
}

export interface Constraint {
  type: 'time' | 'memory' | 'accuracy' | 'size';
  value: number;
  unit: string;
}

export class RequirementParser {
  private patterns: {
    taskType: { pattern: RegExp; type: ParsedRequirement['taskType'] }[];
    categories: RegExp[];
    accuracy: RegExp[];
    timeConstraints: RegExp[];
    priority: { pattern: RegExp; priority: ParsedRequirement['priority'] }[];
  };

  constructor() {
    this.patterns = {
      // Task type detection patterns
      taskType: [
        { pattern: /classif(y|ication)/i, type: 'classification' },
        { pattern: /categoriz(e|ation)/i, type: 'classification' },
        { pattern: /distinguish/i, type: 'classification' },
        { pattern: /tell.*(apart|difference)/i, type: 'classification' },
        { pattern: /detect(ion)?/i, type: 'detection' },
        { pattern: /find/i, type: 'detection' },
        { pattern: /locate/i, type: 'detection' },
        { pattern: /segment(ation)?/i, type: 'segmentation' },
        { pattern: /separate/i, type: 'segmentation' },
        { pattern: /mask/i, type: 'segmentation' }
      ],

      // Category extraction patterns
      categories: [
        /(?:between|vs\.?|versus)\s+([^,\n]+?)(?:\s+and\s+([^,\n]+))/i,
        /(?:categories?|classes?|types?)[\s:]+([^,\n.!?]+)/i,
        /(?:dog|cat|bird|car|person|animal|vehicle|object)s?/gi,
        /\(([^)]+)\)/g, // Categories in parentheses
        /["']([^"']+)["']/g // Categories in quotes
      ],

      // Accuracy target patterns
      accuracy: [
        /(\d+(?:\.\d+)?)\s*%/g,
        /accuracy.{0,20}(\d+(?:\.\d+)?)/gi,
        /precise.{0,20}(\d+(?:\.\d+)?)/gi,
        /accurate.{0,20}(\d+(?:\.\d+)?)/gi,
        /performance.{0,20}(\d+(?:\.\d+)?)/gi
      ],

      // Time constraint patterns
      timeConstraints: [
        /(?:in|within|under)\s+(\d+)\s*(minute|min|hour|second|sec)s?/gi,
        /(\d+)\s*(minute|min|hour|second|sec)s?\s*(?:or\s+)?(?:less|max|maximum)/gi,
        /(fast|quick|rapid)/gi
      ],

      // Priority detection patterns
      priority: [
        { pattern: /(fast|quick|speed|rapid|real.?time)/i, priority: 'speed' },
        { pattern: /(accurate|precise|quality|best)/i, priority: 'accuracy' },
        { pattern: /(balanced|moderate|reasonable)/i, priority: 'balanced' }
      ]
    };

    console.log('🧠 RequirementParser initialized with NLP patterns');
  }

  /**
   * Parse natural language requirement into structured format
   */
  async parse(naturalLanguageText: string): Promise<ParsedRequirement> {
    console.log('🔍 Parsing requirement:', naturalLanguageText);

    const requirement: ParsedRequirement = {
      taskType: 'classification', // default
      categories: [],
      targetAccuracy: 0.85, // default 85%
      constraints: [],
      priority: 'balanced', // default
      confidence: 0,
      ambiguities: [],
      suggestedClarifications: []
    };

    try {
      // Extract task type
      requirement.taskType = this.extractTaskType(naturalLanguageText);
      
      // Extract categories
      requirement.categories = this.extractCategories(naturalLanguageText);
      
      // Extract accuracy target
      requirement.targetAccuracy = this.extractAccuracy(naturalLanguageText);
      
      // Extract time constraints
      const timeConstraint = this.extractTimeConstraints(naturalLanguageText);
      if (timeConstraint) {
        requirement.timeLimit = timeConstraint.value;
        requirement.constraints.push(timeConstraint);
      }
      
      // Extract priority
      requirement.priority = this.extractPriority(naturalLanguageText);
      
      // Calculate confidence and find ambiguities
      this.calculateConfidenceAndAmbiguities(requirement, naturalLanguageText);
      
      console.log('✅ Parsed requirement:', requirement);
      return requirement;

    } catch (error) {
      console.error('❌ Failed to parse requirement:', error);
      requirement.confidence = 0.1;
      requirement.ambiguities.push('Failed to parse natural language input');
      requirement.suggestedClarifications.push('Please rephrase your requirement more clearly');
      return requirement;
    }
  }

  /**
   * Extract task type from natural language
   */
  private extractTaskType(text: string): ParsedRequirement['taskType'] {
    for (const { pattern, type } of this.patterns.taskType) {
      if (pattern.test(text)) {
        console.log(`🎯 Detected task type: ${type}`);
        return type;
      }
    }
    
    // Default to classification if no specific task type detected
    console.log('🎯 Defaulting to classification task type');
    return 'classification';
  }

  /**
   * Extract categories/classes from natural language
   */
  private extractCategories(text: string): string[] {
    const categories = new Set<string>();

    // Try different category extraction patterns
    for (const pattern of this.patterns.categories) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Clean up the match
          const cleaned = match
            .replace(/^(between|vs\.?|versus|categories?|classes?|types?|["'()])/i, '')
            .replace(/["'()]/g, '')
            .trim();
          
          if (cleaned && cleaned.length > 1) {
            // Split on common separators
            const splitCategories = cleaned.split(/\s*(?:and|,|vs\.?|versus|\|)\s+/i);
            splitCategories.forEach(cat => {
              const trimmed = cat.trim();
              if (trimmed && trimmed.length > 1) {
                categories.add(trimmed);
              }
            });
          }
        });
      }
    }

    const result = Array.from(categories).slice(0, 10); // Max 10 categories
    console.log('🏷️ Extracted categories:', result);
    
    // If no categories found, suggest common ones
    if (result.length === 0) {
      console.log('⚠️ No categories found, using default suggestions');
      return ['class1', 'class2'];
    }
    
    return result;
  }

  /**
   * Extract accuracy target from natural language
   */
  private extractAccuracy(text: string): number {
    let highestAccuracy = 0;

    for (const pattern of this.patterns.accuracy) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const numbers = match.match(/(\d+(?:\.\d+)?)/);
          if (numbers) {
            let accuracy = parseFloat(numbers[1]);
            
            // Convert percentage to decimal if needed
            if (accuracy > 1) {
              accuracy = accuracy / 100;
            }
            
            // Keep the highest accuracy found
            if (accuracy > highestAccuracy && accuracy <= 1) {
              highestAccuracy = accuracy;
            }
          }
        });
      }
    }

    // Default to 85% if no accuracy specified
    const result = highestAccuracy > 0 ? highestAccuracy : 0.85;
    console.log(`🎯 Target accuracy: ${(result * 100).toFixed(1)}%`);
    
    return result;
  }

  /**
   * Extract time constraints from natural language
   */
  private extractTimeConstraints(text: string): Constraint | null {
    for (const pattern of this.patterns.timeConstraints) {
      const matches = text.match(pattern);
      if (matches) {
        const numbers = matches[0].match(/(\d+)/);
        const units = matches[0].match(/(minute|min|hour|second|sec)/i);
        
        if (numbers && units) {
          const value = parseInt(numbers[1]);
          const unit = units[1].toLowerCase();
          
          // Convert to minutes
          let minutes = value;
          if (unit.startsWith('sec')) {
            minutes = value / 60;
          } else if (unit.startsWith('hour')) {
            minutes = value * 60;
          }
          
          console.log(`⏱️ Time constraint: ${minutes} minutes`);
          
          return {
            type: 'time',
            value: minutes,
            unit: 'minutes'
          };
        }
      }
    }

    // Check for speed keywords
    if (/(fast|quick|rapid)/i.test(text)) {
      console.log('⚡ Speed priority detected, setting 10 minute limit');
      return {
        type: 'time',
        value: 10,
        unit: 'minutes'
      };
    }

    return null;
  }

  /**
   * Extract priority from natural language
   */
  private extractPriority(text: string): ParsedRequirement['priority'] {
    for (const { pattern, priority } of this.patterns.priority) {
      if (pattern.test(text)) {
        console.log(`🎯 Detected priority: ${priority}`);
        return priority;
      }
    }
    
    console.log('🎯 Using balanced priority (default)');
    return 'balanced';
  }

  /**
   * Calculate confidence score and identify ambiguities
   */
  private calculateConfidenceAndAmbiguities(
    requirement: ParsedRequirement, 
    originalText: string
  ): void {
    let confidence = 0.5; // Base confidence
    const ambiguities: string[] = [];
    const clarifications: string[] = [];

    // Boost confidence for clear indicators
    if (requirement.categories.length > 0 && requirement.categories[0] !== 'class1') {
      confidence += 0.2;
    } else {
      ambiguities.push('Categories not clearly specified');
      clarifications.push('Please specify what categories you want to classify (e.g., "dogs vs cats")');
    }

    if (requirement.targetAccuracy !== 0.85) { // Non-default accuracy
      confidence += 0.15;
    }

    if (requirement.timeLimit) {
      confidence += 0.1;
    }

    if (originalText.length > 20) { // More detailed description
      confidence += 0.1;
    }

    // Reduce confidence for potential ambiguities
    if (originalText.length < 10) {
      confidence -= 0.2;
      ambiguities.push('Description too brief');
      clarifications.push('Please provide more details about your classification task');
    }

    if (requirement.categories.length > 5) {
      confidence -= 0.1;
      ambiguities.push('Many categories detected - may be complex');
      clarifications.push('Consider grouping similar categories or splitting into multiple tasks');
    }

    // Ensure confidence is between 0 and 1
    requirement.confidence = Math.max(0.1, Math.min(0.95, confidence));
    requirement.ambiguities = ambiguities;
    requirement.suggestedClarifications = clarifications;

    console.log(`📊 Confidence: ${(requirement.confidence * 100).toFixed(1)}%`);
    if (ambiguities.length > 0) {
      console.log('⚠️ Ambiguities:', ambiguities);
    }
  }

  /**
   * Generate example requirements for testing
   */
  generateExamples(): string[] {
    return [
      "Classify dogs vs cats with 95% accuracy",
      "I need a fast model to distinguish between birds, dogs, and cats",
      "Create an image classifier for vehicles (cars, trucks, motorcycles) with high accuracy",
      "Classify photos of food items in under 5 minutes",
      "Build a quick classifier for pets vs wildlife with reasonable accuracy",
      "Detect faces in images with 90% precision",
      "Segment medical images into different tissue types"
    ];
  }

  /**
   * Validate parsed requirement
   */
  validateRequirement(requirement: ParsedRequirement): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (requirement.categories.length === 0) {
      issues.push('No categories specified');
    }

    if (requirement.targetAccuracy < 0.5 || requirement.targetAccuracy > 1) {
      issues.push('Invalid accuracy target (should be between 50% and 100%)');
    }

    if (requirement.timeLimit && requirement.timeLimit < 1) {
      issues.push('Time limit too short (minimum 1 minute)');
    }

    if (requirement.confidence < 0.3) {
      issues.push('Low confidence in requirement parsing - needs clarification');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}