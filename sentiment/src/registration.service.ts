import { Injectable, Logger } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'

interface RegisteredConsumer {
  id: string
  name: string
  registeredAt: Date
}

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name)
  private readonly consumers = new Map<string, RegisteredConsumer>()

  registerConsumer(consumerName: string): string {
    const consumerId = uuidv4()
    
    this.consumers.set(consumerId, {
      id: consumerId,
      name: consumerName,
      registeredAt: new Date(),
    })

    this.logger.log(`Registered new consumer: ${consumerName} with ID: ${consumerId.substring(0, 8)}...`)
    
    return consumerId
  }

  isRegistered(consumerId: string): boolean {
    return this.consumers.has(consumerId)
  }

  getConsumer(consumerId: string): RegisteredConsumer | undefined {
    return this.consumers.get(consumerId)
  }

  getStats() {
    return {
      totalRegistered: this.consumers.size,
      consumers: Array.from(this.consumers.values()).map(c => ({
        id: c.id.substring(0, 8) + '...',
        name: c.name,
        registeredAt: c.registeredAt,
      })),
    }
  }
}
