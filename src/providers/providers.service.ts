import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.provider.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        categorias: true,
        status: true,
        createdAt: true,
        cadastroCompleto: true,
      },
    });
  }

  async findById(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nome: true,
        cpf: true,
        categorias: true,
        status: true,
        createdAt: true,
        cadastroCompleto: true,
        rg: true,
        estado: true,
        cidade: true,
        cep: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }

    return provider;
  }

  async updateStatus(id: string, status: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }

    return this.prisma.provider.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        nome: true,
        status: true,
      },
    });
  }

  async update(id: string, data: any) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }

    // Remover campos que não podem ser atualizados ou que não existem no schema
    const { cpf, senha, telefone, id: _, ...updateData } = data;
    
    return this.prisma.provider.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  }
}
