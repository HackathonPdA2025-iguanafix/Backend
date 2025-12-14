export class ChatbotUpdateDto {
  // Seção 1: Fotos e Documentos
  fotoPerfil?: string;
  fotoDocumento?: string;
  certidaoAntecedentes?: string;
  
  // Seção 2: Informações Pessoais e Endereço
  rg?: string;
  estado?: string;
  cidade?: string;
  cep?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  
  // Seção 3: Região de Interesse e Serviços
  estadoInteresse?: string;
  cidadeInteresse?: string;
  categorias?: string[];
  
  // Seção 4: Experiência e Referências
  certificados?: string[];
  referencias?: Array<{
    nome: string;
    telefone: string;
    telefoneAlternativo?: string;
  }>;
  
  // Seção 5: Dados Fiscais
  cnpjDoc?: string;
  razaoSocial?: string;
  cnpj?: string;
  tipoConta?: string;
  pixTipo?: string;
  pixChave?: string;
  bancoNome?: string;
  agencia?: string;
  conta?: string;
  titularNome?: string;
  titularDoc?: string;
}
