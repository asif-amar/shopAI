/**
 * Prompt builder utility for constructing AI prompts with explicit sections
 */

export interface PromptSection {
  task: string;
  constraints?: string[];
  examples?: string[];
  context?: Record<string, any>;
}

export interface ShoppingPromptContext {
  productInfo?: {
    name: string;
    price: number;
    currency: string;
    description?: string;
    category?: string;
    brand?: string;
  };
  userPreferences?: {
    budget?: number;
    priorities?: string[];
    preferredBrands?: string[];
  };
  marketContext?: {
    similarProducts?: Array<{
      name: string;
      price: number;
      url: string;
    }>;
    priceHistory?: Array<{
      date: string;
      price: number;
    }>;
  };
}

export class PromptBuilder {
  private sections: PromptSection[] = [];
  private context: ShoppingPromptContext = {};

  addSection(section: PromptSection): this {
    this.sections.push(section);
    return this;
  }

  setContext(context: ShoppingPromptContext): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  build(): string {
    const parts: string[] = [];

    // Add context if available
    if (Object.keys(this.context).length > 0) {
      parts.push(this.buildContextSection());
    }

    // Add each section
    for (const section of this.sections) {
      parts.push(this.buildSection(section));
    }

    return parts.join('\n\n');
  }

  private buildContextSection(): string {
    const contextParts: string[] = ['CONTEXT:'];
    
    if (this.context.productInfo) {
      const { productInfo } = this.context;
      contextParts.push(`Product: ${productInfo.name}`);
      contextParts.push(`Price: ${productInfo.price} ${productInfo.currency}`);
      if (productInfo.description) {
        contextParts.push(`Description: ${productInfo.description}`);
      }
      if (productInfo.category) {
        contextParts.push(`Category: ${productInfo.category}`);
      }
      if (productInfo.brand) {
        contextParts.push(`Brand: ${productInfo.brand}`);
      }
    }

    if (this.context.userPreferences) {
      const { userPreferences } = this.context;
      if (userPreferences.budget) {
        contextParts.push(`Budget: ${userPreferences.budget} ${this.context.productInfo?.currency || 'USD'}`);
      }
      if (userPreferences.priorities?.length) {
        contextParts.push(`Priorities: ${userPreferences.priorities.join(', ')}`);
      }
      if (userPreferences.preferredBrands?.length) {
        contextParts.push(`Preferred Brands: ${userPreferences.preferredBrands.join(', ')}`);
      }
    }

    if (this.context.marketContext) {
      // TODO: Fix TypeScript issues with marketContext properties
      // if (this.context.marketContext.similarProducts?.length) {
      //   contextParts.push('Similar Products:');
      //   this.context.marketContext.similarProducts.forEach(product => {
      //     contextParts.push(`  - ${product.name}: ${product.price} (${product.url})`);
      //   });
      // }
      // if (this.context.marketContext.priceHistory?.length) {
      //   contextParts.push('Price History:');
      //   this.context.marketContext.priceHistory.forEach(entry => {
      //     contextParts.push(`  - ${entry.date}: ${entry.price}`);
      //   });
      // }
    }

    return contextParts.join('\n');
  }

  private buildSection(section: PromptSection): string {
    const parts: string[] = [];

    // Task
    parts.push(`TASK: ${section.task}`);

    // Constraints
    if (section.constraints?.length) {
      parts.push('CONSTRAINTS:');
      section.constraints.forEach(constraint => {
        parts.push(`- ${constraint}`);
      });
    }

    // Examples
    if (section.examples?.length) {
      parts.push('EXAMPLES:');
      section.examples.forEach(example => {
        parts.push(`- ${example}`);
      });
    }

    return parts.join('\n');
  }
}

/**
 * Pre-built prompt templates for common shopping tasks
 */
export class ShoppingPrompts {
  static priceAnalysis(productInfo: ShoppingPromptContext['productInfo']): string {
    const context: ShoppingPromptContext = {};
    if (productInfo) {
      context.productInfo = productInfo;
    }
    
    return new PromptBuilder()
      .setContext(context)
      .addSection({
        task: 'Analyze the price of this product and provide insights on whether it represents good value.',
        constraints: [
          'Consider the product category and typical price ranges',
          'Evaluate quality-to-price ratio',
          'Provide specific, actionable advice',
          'Keep response under 200 words'
        ],
        examples: [
          'This price is competitive for the category and brand reputation',
          'Consider waiting for a sale as this is 20% above average market price',
          'The price is reasonable given the premium features included'
        ]
      })
      .build();
  }

  static productComparison(
    currentProduct: ShoppingPromptContext['productInfo'],
    alternatives: Array<{ name: string; price: number; url: string; }> | undefined
  ): string {
    const context: ShoppingPromptContext = {};
    if (currentProduct) {
      context.productInfo = currentProduct;
    }
    if (alternatives) {
      context.marketContext = { similarProducts: alternatives };
    }
    
    return new PromptBuilder()
      .setContext(context)
      .addSection({
        task: 'Compare the current product with alternatives and recommend the best option.',
        constraints: [
          'Consider price, features, and value for money',
          'Highlight key differences between options',
          'Provide a clear recommendation with reasoning',
          'Keep response under 300 words'
        ]
      })
      .build();
  }

  static purchaseRecommendation(
    context: ShoppingPromptContext
  ): string {
    return new PromptBuilder()
      .setContext(context)
      .addSection({
        task: 'Provide a purchase recommendation based on the product and user preferences.',
        constraints: [
          'Consider user budget and priorities',
          'Evaluate if the product meets user needs',
          'Suggest alternatives if better options exist',
          'Provide clear yes/no recommendation with reasoning'
        ]
      })
      .build();
  }

  static dealAlert(
    productInfo: ShoppingPromptContext['productInfo'],
    priceHistory: Array<{ date: string; price: number; }> | undefined
  ): string {
    const context: ShoppingPromptContext = {};
    if (productInfo) {
      context.productInfo = productInfo;
    }
    if (priceHistory) {
      context.marketContext = { priceHistory };
    }
    
    return new PromptBuilder()
      .setContext(context)
      .addSection({
        task: 'Analyze if this is a good time to buy based on price history and current market conditions.',
        constraints: [
          'Consider price trends and seasonal patterns',
          'Evaluate if current price is a good deal',
          'Suggest optimal timing for purchase',
          'Provide confidence level in recommendation'
        ]
      })
      .build();
  }
} 