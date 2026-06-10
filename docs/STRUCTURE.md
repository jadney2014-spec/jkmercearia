# Estrutura do Projeto

## Frontend Ativo (`client/`)

- Aplicação principal em React + TypeScript (CRA).
- Scripts de build/teste definidos em `client/package.json`.
- Contém os contextos, páginas e componentes utilizados em produção.
- É a única pasta que deve receber novas funcionalidades e correções.

## Snapshot Legado (`contabilidade/`)

- Cópia completa usada como referência histórica.
- Mantém versões antigas de `client/`, `server/` e funções serverless.
- Não participa do fluxo de build atual.
- Será arquivada/extraída para um repositório separado após validação de que nada mais depende dessa árvore.

## Plano de Consolidação

1. **Congelar alterações** na pasta `contabilidade/` (somente leitura).
2. **Migrar** qualquer código ainda exclusivo do legado para `client/` conforme necessidade.
3. **Atualizar documentação** para apontar apenas para `client/`.
4. **Arquivar** a pasta `contabilidade/` (zip ou repositório dedicado) após a confirmação dos times.

> Enquanto a etapa 4 não acontece, toda automação (lint, build, deploy) deve ser executada na raiz ou dentro de `client/`.

## Scripts e Builds

- `npm run dev | build | start` → executam os scripts de `client/`.
- `npm run server` → scripts Node locais permanecem funcionais e independentes da pasta duplicada.

## Como Contribuir

- Trabalhe sempre em `client/`.
- Caso precise consultar comportamento anterior, use os arquivos equivalentes em `contabilidade/` apenas como referência.
- Registre no PR se algum trecho ainda não foi portado do legado para o código ativo.




