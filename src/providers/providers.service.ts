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
        areaAtuacao: true,
        status: true,
        createdAt: true,
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
        cpfCnpj: true,
        areaAtuacao: true,
        status: true,
        createdAt: true,
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
}
