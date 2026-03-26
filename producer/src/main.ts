import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger } from '@nestjs/common'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  
  // Create application context without HTTP server (standalone Kafka producer)
  const app = await NestFactory.createApplicationContext(AppModule)
  
  logger.log('Producer service started - Running as standalone Kafka producer')
  logger.log('Producing comments to raw-comments topic...')
  
  // Keep the process running
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully...')
    await app.close()
    process.exit(0)
  })
}
bootstrap()
