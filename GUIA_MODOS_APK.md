# 📱 Guia Completo: Modos de APK (Web vs Bundle)

## 🎯 Visão Geral

Agora você tem **DUAS opções** para gerar o APK do aplicativo:

1. **MODO WEB** 🌐 - Carrega do servidor (atualizações automáticas)
2. **MODO BUNDLE** 📦 - SDK completo embutido (funciona offline)

---

## 🌐 MODO WEB (Recomendado para Desenvolvimento)

### Características

✅ **Atualizações Automáticas**
- Qualquer mudança no site aparece automaticamente no app
- Não precisa gerar novo APK para atualizar conteúdo
- Sempre carrega a versão mais recente do servidor

✅ **Desenvolvimento Ágil**
- Deploy rápido do site = atualização instantânea no app
- Testes rápidos sem gerar APK

⚠️ **Requer Internet**
- Precisa de conexão para carregar o conteúdo
- Funciona como um navegador otimizado

### Quando Usar

- ✅ Desenvolvimento ativo do projeto
- ✅ Quando você quer atualizações frequentes
- ✅ Quando a maioria dos usuários tem internet
- ✅ Para testes rápidos de funcionalidades

### Como Gerar

```powershell
cd client

# APK não assinado (testes)
.\gerar-apk.ps1
# ou
npm run apk:generate

# APK assinado (distribuição)
.\gerar-apk-assinado.ps1
# ou
npm run apk:generate:signed
```

### Configuração

O app usa `capacitor.config.json` com:
```json
{
  "bundledWebRuntime": false,
  "server": {
    "url": "https://comunidaderesgate-82655.web.app"
  }
}
```

---

## 📦 MODO BUNDLE (SDK Completo)

### Características

✅ **Funciona Offline**
- Todo o código web está embutido no APK
- Não precisa de internet para funcionar
- SDK completo incluído

✅ **Performance**
- Carrega mais rápido (código local)
- Não depende de latência de rede

⚠️ **Atualizações Manuais**
- Para atualizar, precisa gerar novo APK
- Usuários precisam reinstalar para ter atualizações

### Quando Usar

- ✅ Distribuição na Play Store
- ✅ Quando precisa funcionar offline
- ✅ Versão estável/final do app
- ✅ Quando quer controle total sobre a versão

### Como Gerar

```powershell
cd client

# APK não assinado (testes)
.\gerar-apk-bundle.ps1
# ou
npm run apk:generate:bundle

# APK assinado (distribuição)
.\gerar-apk-bundle-assinado.ps1
# ou
npm run apk:generate:bundle:signed
```

### Configuração

O app usa `capacitor.config.bundle.json` com:
```json
{
  "bundledWebRuntime": true
  // Sem configuração de servidor
}
```

---

## 🎮 Script Interativo (Recomendado)

Use o script interativo para escolher facilmente:

```powershell
cd client
.\gerar-apk-interativo.ps1
# ou
npm run apk:interactive
```

O script irá:
1. Mostrar as opções disponíveis
2. Perguntar qual modo você quer
3. Perguntar se quer assinado ou não
4. Executar o script apropriado

---

## 📊 Comparação Rápida

| Característica | MODO WEB 🌐 | MODO BUNDLE 📦 |
|----------------|-------------|----------------|
| **Atualizações** | Automáticas | Manual (novo APK) |
| **Internet** | Necessária | Não necessária |
| **Tamanho APK** | Menor | Maior |
| **Velocidade** | Depende da rede | Mais rápido |
| **Desenvolvimento** | Ideal | Mais lento |
| **Distribuição** | Boa | Melhor |
| **Offline** | Não funciona | Funciona |

---

## 🔄 Mudando Entre Modos

### De Web para Bundle

1. Use o script de bundle:
   ```powershell
   .\gerar-apk-bundle.ps1
   ```

2. O script automaticamente:
   - Faz backup da configuração atual
   - Aplica configuração de bundle
   - Gera o APK
   - Restaura configuração original

### De Bundle para Web

1. Use o script de web:
   ```powershell
   .\gerar-apk.ps1
   ```

2. A configuração padrão já é modo web

---

## 📝 Arquivos de Configuração

### Modo Web (Padrão)
- `capacitor.config.json` - Configuração principal
- Usa servidor remoto

### Modo Bundle
- `capacitor.config.bundle.json` - Configuração de bundle
- Usado temporariamente durante geração do APK bundle
- Restaurado automaticamente após geração

---

## 🚀 Fluxo de Trabalho Recomendado

### Durante Desenvolvimento

1. **Use MODO WEB** para testes rápidos
2. Faça mudanças no código
3. Deploy para Firebase
4. Teste no app (atualizações automáticas)

### Para Distribuição

1. **Use MODO BUNDLE** para versão final
2. Teste o APK bundle completamente
3. Assine o APK
4. Publique na Play Store ou distribua

---

## ⚙️ Scripts Disponíveis

### Modo Web
```powershell
.\gerar-apk.ps1                    # Não assinado
.\gerar-apk-assinado.ps1           # Assinado
npm run apk:generate               # Via npm
npm run apk:generate:signed        # Via npm assinado
```

### Modo Bundle
```powershell
.\gerar-apk-bundle.ps1             # Não assinado
.\gerar-apk-bundle-assinado.ps1    # Assinado
npm run apk:generate:bundle        # Via npm
npm run apk:generate:bundle:signed # Via npm assinado
```

### Interativo
```powershell
.\gerar-apk-interativo.ps1         # Escolha interativa
npm run apk:interactive            # Via npm
```

---

## 🎯 Qual Modo Escolher?

### Escolha MODO WEB se:
- ✅ Está desenvolvendo ativamente
- ✅ Quer atualizações frequentes
- ✅ Usuários têm internet estável
- ✅ Quer deploy rápido

### Escolha MODO BUNDLE se:
- ✅ Versão final/estável
- ✅ Precisa funcionar offline
- ✅ Vai publicar na Play Store
- ✅ Quer controle total da versão

---

## 💡 Dica Pro

**Use ambos os modos!**

1. **Durante desenvolvimento:** MODO WEB para testes rápidos
2. **Para release:** MODO BUNDLE para distribuição
3. **Para atualizações:** MODO WEB para correções rápidas

---

## 🔧 Solução de Problemas

### APK Bundle muito grande

- Normal! O bundle inclui todo o código web
- Considere otimizar assets (imagens, etc)
- Use ProGuard para reduzir (cuidado com configuração)

### Modo Web não atualiza

- Verifique se o deploy foi feito corretamente
- Feche e reabra o app
- Limpe cache do app (Configurações > Apps > Seu App > Limpar Cache)

### Erro ao gerar Bundle

- Verifique se o build do React foi bem-sucedido
- Confirme que `capacitor.config.bundle.json` existe
- Verifique logs do Gradle

---

## 📚 Documentação Adicional

- `GUIA_COMPLETO_APK_E_ATUALIZACOES.md` - Guia completo de APK
- `client/README_APK.md` - Guia rápido
- `RESUMO_CONFIGURACAO_APK.md` - Resumo executivo

---

**Última atualização:** Janeiro 2025
**Versão:** 2.0.0 (com suporte a ambos os modos)
