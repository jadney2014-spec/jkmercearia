# 📱 Guia Definitivo: Transformação Web para Android (JK Mercearia)

Este documento detalha o processo de transformação da aplicação web hospedada no Firebase para um aplicativo Android nativo utilizando **Capacitor**.

---

## 1. Identificação do Projeto
- **Framework:** React (TypeScript)
- **Ferramenta de Build Web:** `react-scripts` (CRA)
- **Integração Mobile:** Capacitor 8.0

---

## 2. Configuração do Capacitor

O Capacitor foi instalado e configurado para vincular o build web (`client/build`) ao projeto nativo.

### Alterações Realizadas (Branding):
- **Nome do App:** Atualizado para `JK Mercearia` no arquivo `capacitor.config.json`.
- **Package ID:** Atualizado para `com.jkmercearia.app` para garantir unicidade na Play Store.
- **Configuração de Servidor:** Configurado para permitir navegação nos domínios do Firebase.

---

## 3. Estrutura Android

A pasta `client/android` foi criada e sincronizada. Os principais arquivos de configuração são:
- `AndroidManifest.xml`: Define permissões (Internet, Câmera, Notificações).
- `strings.xml`: Define o nome exibido no ícone do celular.
- `build.gradle`: Define as versões de SDK e chaves de assinatura.

---

## 4. Como Gerar o APK (Passo a Passo)

Para gerar o APK de release, siga estas etapas no seu terminal:

### Passo 1: Build do React
Gera os arquivos estáticos otimizados.
```powershell
cd client
npm run build
```

### Passo 2: Sincronização
Transfere o build e as configurações para a pasta Android.
```powershell
npx cap sync android
```

### Passo 3: Compilação (APK)
Utiliza o Gradle para gerar o arquivo final.
```powershell
cd android
./gradlew assembleRelease
```

---

## 5. Requisitos de Ambiente

Para que a compilação funcione, você deve ter instalado:
1. **Java JDK 17:** Disponível na pasta `client/jdk17`.
2. **Android SDK:** Necessário para compilar arquivos nativos.
   - Use o script `.\INSTALAR_ANDROID_SDK.ps1` na raiz para instalar automaticamente.

---

## 6. Localização do APK Final

Após a conclusão, o APK assinado estará disponível em:
`client/android/app/build/outputs/apk/release/app-release.apk`

---

## 7. Scripts de Atalho

Foram disponibilizados scripts para automatizar todo o processo:
- `npm run apk:generate:full`: Executa build, sync e gera o APK assinado.
- `.\gerar-e-assinar-apk.ps1`: Script unificado para gerar e assinar o app.

---
**Desenvolvido para:** JK Mercearia
**Tecnologia:** React + Capacitor
**Data:** Junho de 2026
