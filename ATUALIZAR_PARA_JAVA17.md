# ☕ Atualizar para Java 17

## ⚠️ Problema

O Android Gradle plugin requer **Java 17**, mas você tem Java 11 instalado.

---

## 🚀 Solução: Instalar Java 17

### Opção 1: Script Automático (Recomendado)

1. **Abra PowerShell como Administrador**
2. **Navegue até a pasta do projeto**:
   ```powershell
   cd "C:\Users\Jadney Ranes\contabilidade"
   ```
3. **Execute o script**:
   ```powershell
   .\INSTALAR_JAVA17_DIRETO.ps1
   ```

O script vai:
- ✅ Baixar Java 17 automaticamente
- ✅ Instalar Java 17
- ✅ Configurar JAVA_HOME
- ✅ Atualizar PATH
- ✅ Configurar Gradle para usar Java 17

### Opção 2: Download Manual

1. **Acesse**: https://adoptium.net/temurin/releases/?version=17
2. **Baixe**: Windows x64 JDK (.msi)
3. **Execute o instalador**
4. **Configure JAVA_HOME**:
   ```powershell
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot", "Machine")
   ```

---

## 🔧 Configurar Gradle

Após instalar Java 17, configure o Gradle:

### Método 1: Via gradle.properties (Já configurado)

O arquivo `client/android/gradle.properties` já foi atualizado com:
```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.13.11-hotspot
```

**Nota:** Ajuste o caminho se o Java 17 estiver em outro local.

### Método 2: Via JAVA_HOME

Configure a variável de ambiente JAVA_HOME:
```powershell
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot", "Machine")
```

---

## ✅ Verificar Instalação

Após instalar:

1. **Feche e reabra o terminal**
2. **Verifique a versão**:
   ```powershell
   java -version
   ```
   Deve mostrar: `openjdk version "17.0.13"` ou similar

3. **Verifique JAVA_HOME**:
   ```powershell
   echo $env:JAVA_HOME
   ```

---

## 📱 Gerar APK

Depois que o Java 17 estiver instalado:

```powershell
cd client\android
.\gradlew.bat assembleDebug
```

O APK será gerado em:
```
client\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 🐛 Problemas Comuns

### Erro: "Java 17 não encontrado"
**Solução:** 
1. Verifique se o Java 17 está instalado
2. Configure JAVA_HOME manualmente
3. Atualize `gradle.properties` com o caminho correto

### Erro: "Gradle ainda usa Java 11"
**Solução:**
1. Edite `client/android/gradle.properties`
2. Adicione: `org.gradle.java.home=CAMINHO_DO_JAVA17`
3. Use barras duplas: `C:\\Program Files\\...`

---

## 📋 Checklist

- [ ] Instalar Java 17 (script ou manual)
- [ ] Configurar JAVA_HOME
- [ ] Atualizar gradle.properties
- [ ] Fechar e reabrir terminal
- [ ] Verificar: `java -version`
- [ ] Gerar APK: `.\gradlew.bat assembleDebug`

---

**Status:** ✅ Script criado - Execute para instalar Java 17!
