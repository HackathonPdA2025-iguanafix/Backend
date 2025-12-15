import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap( ) {
  const app = await NestFactory.create(AppModule);

  // ✅ CORRETO: Qualquer rota do frontend funcionará
const frontendUrl = process.env.FRONTEND_URL;

app.enableCors({
  origin: (origin, callback) => {
    if (!origin || origin === frontendUrl) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqueado:', origin);
      callback(new Error('CORS não permitido'));
    }
  },
  credentials: true,
});


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}` );
}

bootstrap();