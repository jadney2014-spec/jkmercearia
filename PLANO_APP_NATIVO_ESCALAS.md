# 📱 Plano Completo: App Nativo + Sistema de Escalas

## 🎯 Objetivo

Transformar o PWA atual em um **aplicativo nativo instalável** (similar ao Louve App) com sistema completo de **gestão de escalas** para ministérios da igreja.

---

## 📊 Análise: Louve App

### Funcionalidades Principais do Louve App:

1. **Sistema de Escalas**
   - Gestão de ministérios (Louvor, Som, Recepção, etc.)
   - Escalas rotativas automáticas
   - Notificações de escalas
   - Sistema de substituições
   - Histórico de participação

2. **Gestão de Músicas**
   - Repertório digital
   - Cifras e letras
   - Links de vídeos/áudios
   - Vinculação com escalas

3. **Comunicação**
   - Chat em tempo real
   - Notificações push
   - Avisos e lembretes

4. **Gestão de Membros**
   - Perfis completos
   - Ministérios de cada membro
   - Disponibilidade
   - Habilidades/talentos

---

## 🏗️ Arquitetura: PWA → App Nativo

### Estratégia: TWA + Capacitor

#### **Android: TWA (Trusted Web Activity)**
- ✅ Mantém código React existente
- ✅ Publicação na Google Play Store
- ✅ Funciona como app nativo
- ✅ Notificações push nativas
- ✅ Acesso a recursos do dispositivo

#### **iOS: Capacitor**
- ✅ Wrapper nativo para iOS
- ✅ Mantém código React
- ✅ Publicação na App Store
- ✅ Funcionalidades nativas completas

---

## 📋 Fase 1: Sistema de Escalas (2-3 semanas)

### 1.1 Estrutura de Dados (Firestore)

```typescript
// Collections no Firestore

// ministerios/{id}
{
  nome: "Louvor",
  descricao: "Ministério de louvor e adoração",
  funcoes: ["Vocal", "Instrumentista", "Técnico de Som"],
  membros_habilitados: ["membro_id_1", "membro_id_2"],
  frequencia: "semanal", // semanal | quinzenal | mensal
  dia_semana: 0, // 0 = Domingo, 1 = Segunda, etc.
  dia_mes: null, // Para frequência mensal
  ativo: true,
  criado_em: Timestamp,
  atualizado_em: Timestamp
}

// escalas/{id}
{
  ministerio_id: "ministerio_id",
  ministerio_nome: "Louvor",
  data: Timestamp,
  membros: [
    {
      membro_id: "membro_id",
      membro_nome: "Nome do Membro",
      funcao: "Vocal",
      status: "pendente", // pendente | confirmado | substituido | ausente
      confirmado_em: Timestamp,
      substituido_por: "membro_id", // opcional
      observacoes: "string"
    }
  ],
  status: "agendada", // agendada | confirmada | cancelada | concluida
  observacoes: "string",
  criado_em: Timestamp,
  atualizado_em: Timestamp
}

// rotacoes/{ministerio_id}
{
  ministerio_id: "ministerio_id",
  membros: ["membro_id_1", "membro_id_2", "membro_id_3"],
  proximo_indice: 0,
  historico: [
    {
      data: Timestamp,
      membro_id: "membro_id",
      funcao: "Vocal"
    }
  ],
  atualizado_em: Timestamp
}

// membros/{id} - Adicionar campos:
{
  // ... campos existentes
  ministerios: ["ministerio_id_1", "ministerio_id_2"],
  funcoes: {
    "ministerio_id_1": ["Vocal", "Instrumentista"],
    "ministerio_id_2": ["Técnico"]
  },
  disponibilidade: {
    dias_semana: [0, 6], // Domingo e Sábado
    horarios: ["19:00", "20:00"]
  },
  habilidades: ["Vocal", "Violão", "Teclado"],
  token_notificacao: "fcm_token" // Para push notifications
}
```

### 1.2 Funcionalidades a Implementar

#### **Gestão de Ministérios**
- ✅ Criar/editar/deletar ministérios
- ✅ Adicionar/remover membros
- ✅ Definir funções necessárias
- ✅ Configurar frequência de escalas

#### **Sistema de Rotação**
- ✅ Algoritmo de rotação automática
- ✅ Considerar disponibilidade
- ✅ Balancear participação
- ✅ Histórico de escalas

#### **Gestão de Escalas**
- ✅ Criar escalas manualmente
- ✅ Gerar escalas automaticamente
- ✅ Confirmar presença
- ✅ Sistema de substituições
- ✅ Cancelar/remarcar escalas

#### **Notificações**
- ✅ Notificar membros quando escalados
- ✅ Lembretes antes do evento
- ✅ Notificações de substituições
- ✅ Confirmação de presença

#### **Relatórios**
- ✅ Histórico de escalas
- ✅ Frequência de participação
- ✅ Membros mais ativos
- ✅ Estatísticas por ministério

---

## 📋 Fase 2: TWA para Android (1 semana)

### 2.1 Configuração TWA

```bash
# Instalar ferramentas
npm install -g @bubblewrap/cli
npm install -g @pwabuilder/cli

# Gerar projeto TWA
bubblewrap init --manifest https://comunidaderesgate-82655.web.app/manifest.json

# Build APK/AAB
bubblewrap build
```

### 2.2 Estrutura do Projeto

```
android/
├── app/
│   ├── build.gradle
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── java/
│           └── res/
├── build.gradle
└── settings.gradle
```

### 2.3 Configurações Necessárias

- **AndroidManifest.xml**: Configurar TWA
- **build.gradle**: Dependências e versões
- **Digital Asset Links**: Verificação de domínio
- **Signing**: Assinatura do app

---

## 📋 Fase 3: Capacitor para iOS (1 semana)

### 3.1 Instalação Capacitor

```bash
cd client
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# Inicializar Capacitor
npx cap init

# Adicionar plataformas
npx cap add ios
npx cap add android

# Sincronizar
npx cap sync
```

### 3.2 Plugins Necessários

```bash
npm install @capacitor/push-notifications
npm install @capacitor/local-notifications
npm install @capacitor/app
npm install @capacitor/status-bar
npm install @capacitor/splash-screen
```

### 3.3 Configurações iOS

- **Info.plist**: Permissões e configurações
- **AppDelegate.swift**: Configuração inicial
- **Signing**: Certificados e provisioning
- **Xcode**: Configuração do projeto

---

## 📋 Fase 4: Notificações Push (1 semana)

### 4.1 Firebase Cloud Messaging (FCM)

```typescript
// Configurar FCM
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Registrar token
const messaging = getMessaging();
const token = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY'
});

// Salvar token no Firestore
await updateDoc(doc(db, 'members', memberId), {
  fcm_token: token
});
```

### 4.2 Cloud Functions para Notificações

```typescript
// functions/src/notifications.ts
export const sendScaleNotification = functions.firestore
  .document('escalas/{escalaId}')
  .onCreate(async (snap, context) => {
    const escala = snap.data();
    const membros = escala.membros;
    
    for (const membro of membros) {
      const membroDoc = await db.collection('members').doc(membro.membro_id).get();
      const fcmToken = membroDoc.data()?.fcm_token;
      
      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: 'Você foi escalado!',
            body: `Você está escalado para ${escala.ministerio_nome} em ${formatDate(escala.data)}`
          }
        });
      }
    }
  });
```

---

## 📋 Fase 5: Publicação nas App Stores (1-2 semanas)

### 5.1 Google Play Store

1. **Criar conta de desenvolvedor** ($25 uma vez)
2. **Preparar assets**:
   - Ícones (512x512)
   - Screenshots
   - Descrição
   - Política de privacidade
3. **Build AAB**:
   ```bash
   bubblewrap build --mode production
   ```
4. **Upload e revisão** (1-3 dias)

### 5.2 Apple App Store

1. **Criar conta de desenvolvedor** ($99/ano)
2. **Preparar assets**:
   - Ícones (1024x1024)
   - Screenshots (vários tamanhos)
   - Descrição
   - Política de privacidade
3. **Build via Xcode**:
   ```bash
   npx cap open ios
   # Build e Archive no Xcode
   ```
4. **Upload via App Store Connect**
5. **Revisão** (1-7 dias)

---

## 🎨 Interface do Sistema de Escalas

### Páginas Necessárias:

1. **Ministérios** (`/tesouraria/ministries`)
   - Lista de ministérios
   - Criar/editar/deletar
   - Gerenciar membros

2. **Escalas** (`/tesouraria/scales`)
   - Calendário de escalas
   - Criar/editar escalas
   - Confirmar presença
   - Substituições

3. **Minhas Escalas** (`/minhas-escalas`)
   - Escalas do membro logado
   - Confirmar presença
   - Solicitar substituição

4. **Relatórios** (`/tesouraria/scale-reports`)
   - Histórico
   - Estatísticas
   - Frequência

---

## 🔧 Tecnologias e Ferramentas

### Frontend:
- ✅ React (já usado)
- ✅ TypeScript (já usado)
- ✅ Firebase Firestore (já usado)
- ✅ React Big Calendar (para calendário)

### Mobile:
- ✅ TWA (Android)
- ✅ Capacitor (iOS)
- ✅ Firebase Cloud Messaging

### Backend:
- ✅ Firebase Functions (notificações)
- ✅ Firestore (banco de dados)

---

## 📅 Cronograma Estimado

| Fase | Duração | Status |
|------|---------|--------|
| Fase 1: Sistema de Escalas | 2-3 semanas | ⏳ Pendente |
| Fase 2: TWA Android | 1 semana | ⏳ Pendente |
| Fase 3: Capacitor iOS | 1 semana | ⏳ Pendente |
| Fase 4: Notificações Push | 1 semana | ⏳ Pendente |
| Fase 5: Publicação | 1-2 semanas | ⏳ Pendente |
| **TOTAL** | **6-8 semanas** | |

---

## 💰 Custos Estimados

- **Google Play Store**: $25 (uma vez)
- **Apple App Store**: $99/ano
- **Firebase**: Gratuito até certo limite
- **Total**: ~$124 no primeiro ano

---

## ✅ Próximos Passos Imediatos

1. ✅ Criar estrutura de dados no Firestore
2. ✅ Implementar API de ministérios
3. ✅ Implementar API de escalas
4. ✅ Criar interface de gestão
5. ✅ Implementar sistema de rotação
6. ✅ Configurar TWA
7. ✅ Configurar Capacitor
8. ✅ Implementar notificações
9. ✅ Publicar nas lojas

---

**Status:** 📋 Plano criado - Pronto para implementação!
