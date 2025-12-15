import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod';

// Novo schema simplificado para o formulário inicial
const RegisterSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  senha: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }).optional(),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }).optional(),
  nome: z.string().min(3, { message: 'Nome deve ter no mínimo 3 caracteres' }),
  cpf: z.string().transform(val => val.replace(/\D/g, '')).refine(val => val.length === 11, { message: 'CPF deve ter 11 dígitos' }),
}).refine(data => data.senha || data.password, {
  message: 'Senha é obrigatória',
  path: ['senha'],
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
      
      // Aceitar 'password' ou 'senha'
      const senha = validated.password || validated.senha;

      // Verificar se email já existe
      const existingEmail = await this.prisma.provider.findUnique({
        where: { email: validated.email },
      });

      if (existingEmail) {
        throw new BadRequestException('Email já registrado');
      }

      // Verificar se CPF já existe
      const existingCpf = await this.prisma.provider.findUnique({
        where: { cpf: validated.cpf },
      });

      if (existingCpf) {
        throw new BadRequestException('CPF já registrado');
      }

      const hashedPassword = await bcrypt.hash(senha!, 10);

      // Criar provider com apenas dados básicos
      const provider = await this.prisma.provider.create({
        data: {
          email: validated.email,
          senha: hashedPassword,
          nome: validated.nome,
          cpf: validated.cpf,
          cadastroCompleto: false,
        } as any,
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
          name: provider.nome,
          nome: provider.nome,
          cpf: provider.cpf,
          status: provider.status,
          cadastroCompleto: (provider as any).cadastroCompleto,
        },
        message: 'Cadastro inicial realizado com sucesso! Agora vamos completar seu perfil com nosso assistente.',
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
          name: provider.nome,
          nome: provider.nome,
          cpf: provider.cpf,
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
      name: provider.nome,
      nome: provider.nome,
      cpf: provider.cpf,
      rg: provider.rg,
      telefone: provider.telefone,
      estado: provider.estado,
      cidade: provider.cidade,
      cep: provider.cep,
      bairro: provider.bairro,
      logradouro: provider.logradouro,
      numero: provider.numero,
      complemento: provider.complemento,
      status: provider.status,
      cadastroCompleto: (provider as any).cadastroCompleto,
    };
  }
}
