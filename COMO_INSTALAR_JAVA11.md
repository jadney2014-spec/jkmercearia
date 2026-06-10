# ☕ Como Instalar Java 11 Automaticamente

## 🎯 Objetivo

Instalar Java 11 para poder gerar o APK usando o Gradle.

---

## 🚀 Método Automático (Recomendado)

### Passo 1: Executar Script como Administrador

1. **Clique com botão direito** no PowerShell
2. Selecione **"Executar como administrador"**
3. Navegue até a pasta do projeto:
   ```powershell
   cd "C:\Users\Jadney Ranes\contabilidade"
   ```
4. Execute o script:
   ```powershell
   .\INSTALAR_JAVA11_DIRETO.ps1
   ```

### Passo 2: Aguardar Instalação

O script vai:
- ✅ Verificar se Java já está instalado
- ✅ Baixar Java 11 automaticamente
- ✅ Instalar Java 11
- ✅ Configurar JAVA_HOME
- ✅ Adicionar ao PATH

**Tempo estimado:** 5-10 minutos

### Passo 3: Verificar Instalação

Após a instalação, **feche e reabra o terminal** e execute:

```powershell
java -version
```

Você deve ver algo como:
```
openjdk version "11.0.23" ...
```

---

## 📱 Gerar APK Após Instalar Java

Depois que o Java 11 estiver instalado:

```powershell
cd client\android
.\gradlew.bat assembleDebug
```

O APK será gerado em:
```
client\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 🔧 Método Manual (Se o Script Não Funcionar)

### Opção 1: Download Direto

1. Acesse: **https://adoptium.net/temurin/releases/?version=11**
2. Selecione:
   - **Operating System:** Windows
   - **Architecture:** x64
   - **Package Type:** JDK
3. Clique em **"Download"** (arquivo .msi)
4. Execute o instalador
5. Siga as instruções (Next, Next, Install)

### Opção 2: Via Chocolatey (Se Tiver)

```powershell
# Executar PowerShell como Administrador
choco install openjdk11 -y
```

---

## ✅ Verificar Instalação

Após instalar, verifique:

```powershell
# Verificar versão
java -version

# Verificar JAVA_HOME
echo $env:JAVA_HOME
```

---

## 🐛 Problemas Comuns

### Erro: "Java não encontrado"
**Solução:** Reinicie o terminal após instalar

### Erro: "JAVA_HOME não configurado"
**Solução:** Configure manualmente:
```powershell
# Encontrar instalação do Java
Get-ChildItem "C:\Program Files\Eclipse Adoptium\" -Recurse -Filter "java.exe" | Select-Object -First 1

# Configurar JAVA_HOME (substitua pelo caminho encontrado)
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-11.0.23.9-hotspot", "Machine")
```

### Erro: "Permissão negada"
**Solução:** Execute o PowerShell como Administrador

---

## 📋 Checklist

- [ ] Executar PowerShell como Administrador
- [ ] Executar script: `.\INSTALAR_JAVA11_DIRETO.ps1`
- [ ] Aguardar instalação
- [ ] Fechar e reabrir terminal
- [ ] Verificar: `java -version`
- [ ] Gerar APK: `cd client\android && .\gradlew.bat assembleDebug`

---

**Status:** ✅ Script criado - Execute como Administrador!
