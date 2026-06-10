# 📱 Guia Completo: Gerar e Assinar APK para Instalação no Celular

## 🎯 Objetivo

Gerar um APK assinado que pode ser instalado diretamente no celular Android.

---

## 🚀 Método Rápido (Recomendado)

### Opção 1: Script Unificado (Gera e Assina)

```powershell
cd client
npm run apk:generate:full
```

Este comando:
1. ✅ Faz build do React
2. ✅ Sincroniza com Capacitor
3. ✅ Gera o APK
4. ✅ **Automaticamente abre o PowerShell para assinatura**
5. ✅ Copia o APK assinado para a raiz

**Ou execute diretamente:**
```powershell
cd client
.\gerar-e-assinar-apk.ps1
```

---

## 📋 Método Passo a Passo

### Passo 1: Gerar APK

```powershell
cd client
npm run apk:generate
```

**Ou:**
```powershell
cd client
.\gerar-apk.ps1
```

Isso gera o APK não assinado em:
```
android\app\build\outputs\apk\release\app-release-unsigned.apk
```

### Passo 2: Assinar APK

O script de geração **automaticamente direciona** para o PowerShell de assinatura.

**Ou execute manualmente:**
```powershell
cd client
npm run apk:sign
```

**Ou:**
```powershell
cd client
.\assinar-apk.ps1
```

O script irá:
1. ✅ Verificar se o APK existe
2. ✅ Verificar se Java está instalado
3. ✅ Criar keystore (se não existir)
4. ✅ Solicitar senha da keystore
5. ✅ Assinar o APK
6. ✅ Verificar assinatura
7. ✅ Copiar APK assinado para a raiz

---

## 🔐 Sobre a Keystore

### Primeira Vez

Na primeira execução, o script criará uma keystore automaticamente.

**IMPORTANTE:**
- ⚠️ **GUARDE BEM A SENHA DA KEYSTORE!**
- ⚠️ Você precisará dela para todas as atualizações futuras
- ⚠️ Se perder a senha, não poderá atualizar o app

### Keystore Existente

Se já existe uma keystore (`android\app\release.keystore`), o script pedirá apenas a senha.

---

## 📱 Instalar APK no Celular

### Método 1: Transferir Arquivo

1. **Localizar o APK assinado:**
   - Arquivo: `app-release-assinado-YYYYMMDD-HHMMSS.apk`
   - Localização: Pasta `client\`

2. **Transferir para o celular:**
   - Via USB (copiar arquivo)
   - Via email (anexar arquivo)
   - Via WhatsApp (enviar arquivo)
   - Via Google Drive / Dropbox

3. **No celular:**
   - Abrir gerenciador de arquivos
   - Localizar o arquivo `.apk`
   - Tocar no arquivo
   - Permitir "Instalar de fontes desconhecidas" (se solicitado)
   - Tocar em "Instalar"

### Método 2: Via ADB (USB Debugging)

1. **Habilitar modo desenvolvedor no celular:**
   - Configurações > Sobre o telefone
   - Tocar 7 vezes em "Número da versão"

2. **Habilitar depuração USB:**
   - Configurações > Opções do desenvolvedor
   - Ativar "Depuração USB"

3. **Conectar celular via USB**

4. **Instalar via ADB:**
   ```powershell
   cd client
   adb install app-release-assinado-YYYYMMDD-HHMMSS.apk
   ```

---

## 🔧 Solução de Problemas

### Erro: "Java não encontrado"

**Solução:**
```powershell
# Instalar Java 11
.\INSTALAR_JAVA11.ps1

# Ou Java 17
.\INSTALAR_JAVA17_DIRETO.ps1
```

### Erro: "APK não encontrado"

**Solução:**
1. Execute primeiro: `npm run apk:generate`
2. Verifique se o arquivo existe em:
   - `android\app\build\outputs\apk\release\app-release-unsigned.apk`

### Erro: "Ferramentas Java não encontradas"

**Solução:**
1. Verifique se Java está instalado: `java -version`
2. Verifique se `keytool` e `jarsigner` estão no PATH
3. Reinstale o Java JDK

### Erro: "Senha incorreta"

**Solução:**
- Verifique se está usando a senha correta da keystore
- Se esqueceu a senha, você precisará criar uma nova keystore
- ⚠️ **ATENÇÃO:** Nova keystore = novo app (não pode atualizar app antigo)

### APK não instala no celular

**Possíveis causas:**
1. **APK não assinado:** Use o script de assinatura
2. **Permissões:** Habilite "Instalar de fontes desconhecidas"
3. **Versão Android:** Verifique se o celular suporta a versão mínima (Android 5.0+)
4. **Espaço insuficiente:** Libere espaço no celular

---

## 📝 Comandos NPM Disponíveis

```powershell
# Build e sincronizar
npm run apk:build

# Gerar APK (não assinado)
npm run apk:generate

# Gerar e assinar APK (RECOMENDADO)
npm run apk:generate:full

# Assinar APK existente
npm run apk:sign

# Gerar APK assinado (método antigo)
npm run apk:generate:signed
```

---

## 🎯 Fluxo Recomendado

### Para Desenvolvimento/Teste

```powershell
cd client
npm run apk:generate:full
```

### Para Produção/Distribuição

```powershell
cd client
npm run apk:generate:full
```

O script unificado faz tudo automaticamente!

---

## 📦 Estrutura de Arquivos

```
client/
├── gerar-e-assinar-apk.ps1    ← Script unificado (RECOMENDADO)
├── gerar-apk.ps1              ← Apenas gerar APK
├── assinar-apk.ps1            ← Apenas assinar APK
├── android/
│   └── app/
│       ├── release.keystore    ← Keystore (criada automaticamente)
│       └── build/
│           └── outputs/
│               └── apk/
│                   └── release/
│                       ├── app-release-unsigned.apk
│                       └── app-release-signed.apk
└── app-release-assinado-*.apk  ← APK final (pronto para instalar)
```

---

## ✅ Checklist de Instalação

- [ ] Java JDK instalado (11 ou superior)
- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] APK gerado com sucesso
- [ ] APK assinado com sucesso
- [ ] APK copiado para a raiz
- [ ] Arquivo transferido para o celular
- [ ] Permissões habilitadas no celular
- [ ] App instalado e funcionando

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do PowerShell
2. Verifique se todas as dependências estão instaladas
3. Execute `npm run apk:build` primeiro
4. Verifique se o Java está no PATH
5. Tente gerar o APK manualmente no Android Studio

---

**Última atualização:** 2024
**Versão do script:** 2.0
