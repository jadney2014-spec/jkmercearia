# Biblioteca Digital - PDFs

## Como Adicionar Livros Reais

### 1. Estrutura de Arquivos
```
public/
├── pdfs/                    # Arquivos PDF dos livros
│   ├── biblia-pentecostal.pdf
│   ├── o-peregrino.pdf
│   ├── vida-cristo.pdf
│   └── ...
└── img/
    └── biblioteca/          # Capas dos livros
        ├── biblia-pentecostal.jpg
        ├── o-peregrino.jpg
        ├── vida-cristo.jpg
        └── ...
```

### 2. Formatos Suportados
- **PDFs**: Apenas arquivos .pdf
- **Imagens**: JPG, PNG, WebP (recomendado: 300x400px)

### 3. Como Adicionar um Novo Livro

#### Opção 1: Via Interface (Recomendado)
1. Acesse a página da biblioteca
2. Clique em "Adicionar Livro"
3. Preencha os dados do livro
4. Faça upload do PDF e da capa
5. Clique em "Adicionar Livro"

#### Opção 2: Manualmente
1. Adicione o PDF em `public/pdfs/`
2. Adicione a capa em `public/img/biblioteca/`
3. Edite `client/src/pages/public/BibliotecaPage.tsx`
4. Adicione o livro na array `livros`

### 4. Exemplo de Adição Manual
```typescript
{
  id: '7',
  titulo: 'Novo Livro',
  autor: 'Nome do Autor',
  descricao: 'Descrição do livro...',
  categoria: 'Teologia',
  capa: '/img/biblioteca/novo-livro.jpg',
  pdfUrl: '/pdfs/novo-livro.pdf',
  tamanho: '15.2 MB',
  paginas: 300,
  ano: 2024,
  tags: ['Tag1', 'Tag2', 'Tag3'],
  downloads: 0,
  avaliacao: 0,
  isNovo: true
}
```

### 5. Livros Sugeridos para Download
- **A Bíblia de Estudo Pentecostal** - Donald C. Stamps
- **O Peregrino** - John Bunyan
- **A Vida de Cristo** - Fulton J. Sheen
- **Oração: A Chave do Avivamento** - E. M. Bounds
- **Estudos no Sermão do Monte** - D. Martyn Lloyd-Jones
- **A História da Igreja Cristã** - Earle E. Cairns

### 6. Fontes Legais para Download
- **Domínio Público**: Livros antigos (antes de 1928)
- **Creative Commons**: Livros com licença CC
- **Editoras Cristãs**: Muitas oferecem downloads gratuitos
- **Bibliotecas Digitais**: HathiTrust, Internet Archive

### 7. Direitos Autorais
⚠️ **IMPORTANTE**: Certifique-se de que os livros estão em domínio público ou têm licença para distribuição gratuita.

### 8. Otimização de Arquivos
- **PDFs**: Comprima para reduzir tamanho
- **Imagens**: Use JPG para fotos, PNG para gráficos
- **Tamanho**: Mantenha PDFs abaixo de 50MB

### 9. Backup
- Faça backup regular dos arquivos
- Mantenha cópias dos PDFs originais
- Documente a fonte de cada livro
