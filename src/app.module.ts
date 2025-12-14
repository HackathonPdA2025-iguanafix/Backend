import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProvidersModule } from './providers/providers.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
       secret: process.env.JWT_SECRET || 'default',
  signOptions: { expiresIn: (process.env.JWT_EXPIRATION ?? '24h') as any },
    }),
    PassportModule,
    PrismaModule,
    AuthModule,
    ProvidersModule,
    ChatbotModule,
  ],
})
export class AppModule {}
