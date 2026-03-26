import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { join } from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { SentimentRequest, SentimentResponse, RegisterRequest, RegisterResponse } from '@repo/shared'

@Injectable()
export class SentimentClient implements OnModuleInit {
  private readonly logger = new Logger(SentimentClient.name)
  private client: any
  private consumerId: string = 'unregistered'
  private isRegistered: boolean = false

  async onModuleInit() {
    const PROTO_PATH = join(__dirname, '../../proto/sentiment.proto')
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    })

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
    const grpcUrl = process.env.SENTIMENT_GRPC_URL || 'localhost:3004'

    this.client = new protoDescriptor.sentiment.SentimentService(
      grpcUrl,
      grpc.credentials.createInsecure(),
    )

    this.logger.log(`gRPC client connected to: ${grpcUrl}`)
    
    // Register with sentiment service
    await this.register()
  }

  private async register(): Promise<void> {
    try {
      const request: RegisterRequest = {
        consumerName: process.env.KAFKA_CLIENT_ID || 'consumer',
      }
      
      const response = await this.registerConsumer(request)
      this.consumerId = response.consumerId
      this.isRegistered = true
      
      this.logger.log(`Successfully registered with Sentiment service`)
      this.logger.log(`Consumer ID: ${this.consumerId.substring(0, 8)}...`)
      this.logger.log(`Rate limit: ${response.rateLimit}/second`)
    } catch (error) {
      this.logger.warn(`Failed to register with Sentiment service: ${error.message}`)
      this.logger.warn(`Using unauthenticated mode with reduced rate limit (10/sec)`)
      this.consumerId = 'unregistered'
      this.isRegistered = false
    }
  }

  private async registerConsumer(request: RegisterRequest): Promise<RegisterResponse> {
    return new Promise((resolve, reject) => {
      this.client.RegisterConsumer(request, (error: any, response: RegisterResponse) => {
        if (error) {
          reject(error)
        } else {
          resolve(response)
        }
      })
    })
  }

  async analyzeSentiment(request: SentimentRequest): Promise<SentimentResponse> {
    // Override consumerId with registered ID
    const enrichedRequest = {
      ...request,
      consumerId: this.consumerId,
    }
    
    return new Promise((resolve, reject) => {
      this.client.AnalyzeSentiment(enrichedRequest, (error: any, response: SentimentResponse) => {
        if (error) {
          reject(error)
        } else {
          resolve(response)
        }
      })
    })
  }

  getConsumerId(): string {
    return this.consumerId
  }

  getRegistrationStatus(): boolean {
    return this.isRegistered
  }
}
