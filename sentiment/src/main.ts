import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { Logger } from '@nestjs/common'
import { join } from 'path'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  // Create hybrid application (HTTP + gRPC)
  const app = await NestFactory.create(AppModule)

  // Add gRPC microservice
  const grpcPort = parseInt(process.env.SENTIMENT_GRPC_PORT || '3004')
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'sentiment',
      protoPath: join(__dirname, '../proto/sentiment.proto'),
      url: `0.0.0.0:${grpcPort}`,
    },
  })

  await app.startAllMicroservices()
  logger.log(`gRPC service started on port: ${grpcPort}`)

  const httpPort = process.env.HTTP_PORT || 3004
  await app.listen(httpPort)
  logger.log(`HTTP endpoint running on: http://localhost:${httpPort}`)
}
bootstrap()
