import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
  nome: z.string().min(3),
  cpfCnpj: z.string().regex(/^\d{11,14}$/),
  areaAtuacao: z.string().min(3),
});

const LoginSchema = z.object({
  email: z.string().email(),
  senha: z.string(),
});

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    try {
      const validated = RegisterSchema.parse(data);

      const existingProvider = await this.prisma.provider.findUnique({
        where: { email: validated.email },
      });

      if (existingProvider) {
        throw new BadRequestException('Email já registrado');
      }

      const hashedPassword = await bcrypt.hash(validated.senha, 10);

      const provider = await this.prisma.provider.create({
        data: {
          email: validated.email,
          senha: hashedPassword,
          nome: validated.nome,
          cpfCnpj: validated.cpfCnpj,
          areaAtuacao: validated.areaAtuacao,
        },
      });

      const token = this.jwtService.sign({
        id: provider.id,
        email: provider.email,
      });

      return {
        token,
        provider: {
          id: provider.id,
          email: provider.email,
          nome: provider.nome,
          status: provider.status,
        },
      };
    } catch (error) {
  if (error instanceof z.ZodError) {
    throw new BadRequestException(error.issues[0].message);
  }
  throw error;
}
  }

  async login(data: any) {
    try {
      const validated = LoginSchema.parse(data);

      const provider = await this.prisma.provider.findUnique({
        where: { email: validated.email },
      });

      if (!provider) {
        throw new UnauthorizedException('Email ou senha inválidos');
      }

      const passwordMatch = await bcrypt.compare(validated.senha, provider.senha);

      if (!passwordMatch) {
        throw new UnauthorizedException('Email ou senha inválidos');
      }

      const token = this.jwtService.sign({
        id: provider.id,
        email: provider.email,
      });

      return {
        token,
        provider: {
          id: provider.id,
          email: provider.email,
          nome: provider.nome,
          status: provider.status,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
throw new BadRequestException(error.issues[0].message);
      }
      throw error;
    }
  }

  async validateToken(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new UnauthorizedException('Prestador não encontrado');
    }

    return {
      id: provider.id,
      email: provider.email,
      nome: provider.nome,
      status: provider.status,
      areaAtuacao: provider.areaAtuacao,
    };
  }
}
