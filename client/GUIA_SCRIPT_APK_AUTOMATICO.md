# 🚀 Guia: Script Automático para Gerar APK Corrigido

## 📋 Script Criado

**Arquivo**: `gerar-apk-corrigido-automatico.ps1`

Este script aplica **TODAS as correções necessárias** e gera um APK válido e pronto para instalação.

## ✅ O que o Script Faz Automaticamente

1. ✅ **Verifica dependências** (Java, npm, Android SDK)
2. ✅ **Ajusta versões do SDK** (minSdk=21, compileSdk=36, targetSdk=34)
3. ✅ **Corrige build.gradle** (remove splits, configura signingConfig)
4. ✅ **Corrige erro do Capacitor** (VANILLA_ICE_CREAM)
5. ✅ **Verifica/Cria keystore** automaticamente
6. ✅ **Limpa o projeto** (gradlew clean)
7. ✅ **Faz build do React** (npm run build)
8. ✅ **Sincroniza Capacitor** (npx cap sync android)
9. ✅ **Gera APK release assinado** (gradlew assembleRelease)
10. ✅ **Valida e copia APK** para a raiz do projeto

## 🚀 Como Usar

### Uso Básico (Recomendado)

```powershell
cd client
.\gerar-apk-corrigido-automatico.ps1
```

O script fará **TUDO automaticamente**:
- Aplicará todas as correções
- Gerará o APK
- Copiará para a raiz com nome `app-release-corrigido-YYYYMMDD-HHMMSS.apk`

### Opções Disponíveis

#### Pular Build do React

Se você já fez o build do React e só quer gerar o APK:

```powershell
.\gerar-apk-corrigido-automatico.ps1 -skipBuild
```

#### Pular Limpeza

Se você quer manter o cache do Gradle:

```powershell
.\gerar-apk-corrigido-automatico.ps1 -skipClean
```

#### Combinar Opções

```powershell
.\gerar-apk-corrigido-automatico.ps1 -skipBuild -skipClean
```

## 📋 Requisitos

### Obrigatórios
- ✅ Java JDK instalado
- ✅ Node.js e npm instalados
- ✅ Projeto Android configurado (pasta `android`)

### Opcionais (mas recomendados)
- ✅ Android SDK instalado
- ✅ Keystore existente (se não tiver, o script cria automaticamente)

## 📱 Após Gerar o APK

O script:
1. ✅ Gera o APK em: `android/app/build/outputs/apk/release/app-release.apk`
2. ✅ Copia para: `app-release-corrigido-YYYYMMDD-HHMMSS.apk`
3. ✅ Abre a pasta no explorador automaticamente

### Instalar no Celular

1. **Transferir APK** para o dispositivo:
   - Via USB
   - Via WhatsApp/Email
   - Via Google Drive

2. **No celular**:
   - Abrir o arquivo `.apk`
   - Permitir "Instalar de fontes desconhecidas" (se solicitado)
   - Instalar

## 🔍 Informações do APK Gerado

O script exibe automaticamente:

```
INFORMACOES DO APK:
   Caminho: app-release-corrigido-YYYYMMDD-HHMMSS.apk
   Package Name: com.comunidaderesgate.app
   MinSdk Suportado: 21
   APK Universal: Sim
   Tamanho: X.XX MB
   Assinado: Sim

CONFIGURACOES APLICADAS:
   minSdkVersion: 21
   compileSdkVersion: 36
   targetSdkVersion: 34
   Splits por ABI: Desabilitado
```

## ⚠️ Solução de Problemas

### Erro: "Java não encontrado"
**Solução**: Instale o Java JDK e adicione ao PATH.

### Erro: "npm não encontrado"
**Solução**: Instale o Node.js (que inclui npm).

### Erro: "Falha ao gerar APK"
**Solução**: 
1. Verifique se o Android SDK está instalado
2. Execute: `.\gerar-apk-corrigido-automatico.ps1 -skipBuild` (se já fez build)
3. Verifique os logs de erro no final do output

### APK não está assinado
**Solução**: 
1. Verifique se a keystore existe: `Test-Path android\app\release.keystore`
2. Se não existir, o script cria automaticamente
3. Se existir mas não funcionar, crie nova: `.\criar-keystore-automatico.ps1`

## 📚 Scripts Relacionados

| Script | Descrição |
|--------|-----------|
| `gerar-apk-corrigido-automatico.ps1` | **Este script** - Correções + Geração completa |
| `corrigir-e-gerar-apk-valido.ps1` | Versão anterior (ainda funcional) |
| `assinar-apk-definitivo.ps1` | Apenas assinar APK existente |
| `criar-keystore-automatico.ps1` | Criar nova keystore |

## 🎯 Exemplo de Uso Completo

```powershell
# 1. Navegar para pasta client
cd client

# 2. Executar script (faz tudo automaticamente)
.\gerar-apk-corrigido-automatico.ps1

# 3. Aguardar conclusão (pode levar vários minutos)

# 4. APK será gerado e pasta será aberta automaticamente

# 5. Transferir APK para celular e instalar
```

## ✅ Vantagens do Script Automático

1. **Zero configuração manual** - Tudo é feito automaticamente
2. **Aplica todas as correções** - Não precisa lembrar de nada
3. **Valida tudo** - Verifica dependências antes de começar
4. **Informações completas** - Mostra todas as informações do APK
5. **Abre pasta automaticamente** - Facilita encontrar o APK

## 🔄 Atualizações Futuras

Se precisar atualizar o script:
1. Edite `gerar-apk-corrigido-automatico.ps1`
2. Adicione novas correções conforme necessário
3. Teste antes de usar em produção

---

**Pronto para usar!** Execute o script e o APK será gerado automaticamente com todas as correções aplicadas! 🚀
