import { Injectable, OnModuleInit } from '@nestjs/common'
import { RawComment } from '@repo/shared'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class CommentGeneratorService implements OnModuleInit {
  private commentTemplates: string[] = []
  private sources = ['twitter', 'instagram', 'facebook', 'tiktok']
  private processedComments = new Set<string>()
  private minDelay: number
  private maxDelay: number
  private duplicateRate: number

  onModuleInit() {
    this.minDelay = parseInt(process.env.PRODUCER_MIN_DELAY || '100')
    this.maxDelay = parseInt(process.env.PRODUCER_MAX_DELAY || '10000')
    this.duplicateRate = parseFloat(process.env.PRODUCER_DUPLICATE_RATE || '0.05')
    this.initializeTemplates()
  }

  private initializeTemplates() {
    // Positive comments
    const positiveTemplates = [
      'Amazing food! Best restaurant in town! 😍',
      'The service was exceptional, will definitely come back!',
      'Absolutely loved the atmosphere and the dishes',
      'Perfect place for a romantic dinner ❤️',
      'The chef really knows what they\'re doing! Incredible!',
      'Best meal I\'ve had in years! Highly recommend',
      'Five stars! Everything was perfect from start to finish',
      'The {dish} was to die for! Coming back tomorrow',
      'Outstanding quality and great prices',
      'This place never disappoints! Love it here',
    ]

    // Negative comments
    const negativeTemplates = [
      'Waited 2 hours for our food. Terrible service.',
      'The food was cold and tasteless. Very disappointed.',
      'Overpriced and underwhelming. Won\'t be returning.',
      'Worst dining experience ever. Do not recommend.',
      'They got my order completely wrong. Unacceptable.',
      'The place was dirty and the staff was rude.',
      'Not worth the hype at all. Save your money.',
      'Food poisoning from the {dish}. Filing a complaint!',
      'Terrible quality for the price. Total waste.',
      'Long wait times and mediocre food. 1 star.',
    ]

    // Neutral comments
    const neutralTemplates = [
      'The food was okay, nothing special.',
      'Average experience. Wouldn\'t go out of my way to visit.',
      'It\'s fine for a quick meal.',
      'Decent portions, average taste.',
      'The {dish} was alright, not bad but not great.',
      'Service was slow but the food was okay.',
      'Pretty standard restaurant food.',
      'It was acceptable for the price.',
      'Nothing to complain about, but nothing amazing either.',
      'Met my expectations, which weren\'t very high.',
    ]

    // Unrelated comments
    const unrelatedTemplates = [
      'Does anyone know what time they close?',
      'Is there parking available nearby?',
      'Check out my food blog! Link in bio',
      'Anyone want to meet up for lunch tomorrow?',
      'What\'s the WiFi password?',
      'Do they have gluten-free options?',
      'Can I make a reservation online?',
      'Is this place kid-friendly?',
      'Random spam message about crypto investment',
      'Follow me for more food recommendations!',
    ]

    this.commentTemplates = [
      ...positiveTemplates,
      ...negativeTemplates,
      ...neutralTemplates,
      ...unrelatedTemplates,
    ]
  }

  generateComment(): RawComment {
    // Decide if we should generate a duplicate
    const shouldDuplicate = Math.random() < this.duplicateRate && this.processedComments.size > 0

    let commentId: string
    let text: string

    if (shouldDuplicate) {
      // Pick a random previously generated comment
      const processedArray = Array.from(this.processedComments)
      commentId = processedArray[Math.floor(Math.random() * processedArray.length)]
      text = this.getTextFromCache(commentId)
    } else {
      commentId = uuidv4()
      text = this.generateCommentText()
      this.processedComments.add(commentId)
    }

    return {
      commentId,
      text,
      timestamp: Date.now(),
      source: this.sources[Math.floor(Math.random() * this.sources.length)],
    }
  }

  private getTextFromCache(commentId: string): string {
    // Simplified: generate similar text. In real implementation, we'd store text-comment mapping
    return this.generateCommentText()
  }

  private generateCommentText(): string {
    const template = this.commentTemplates[Math.floor(Math.random() * this.commentTemplates.length)]
    
    // Replace placeholders
    let text = template
    if (text.includes('{dish}')) {
      const dishes = ['pasta', 'steak', 'salmon', 'burger', 'pizza', 'salad', 'risotto']
      text = text.replace('{dish}', dishes[Math.floor(Math.random() * dishes.length)])
    }
    
    return text
  }

  getRandomDelay(): number {
    return Math.floor(Math.random() * (this.maxDelay - this.minDelay + 1)) + this.minDelay
  }
}
