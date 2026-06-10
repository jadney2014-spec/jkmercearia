# 📋 Plano de Implementação - Sistema de Escalas Similar ao LouveApp

## 🎯 Objetivo
Criar um sistema completo de escalas similar ao LouveApp, integrado ao site e aplicativo da igreja, com:
- Gestão de escalas por ministério
- Diferentes níveis de acesso (membro, líder, admin)
- Notificações personalizadas por role
- Confirmação de presença via app
- Integração com WhatsApp

---

## 🏗️ Estrutura do Sistema

### 1. **Sistema de Roles/Permissões**

#### Roles Disponíveis:
- **`membro`**: Visualiza apenas suas escalas e atividades da igreja
- **`lider`**: Gerencia escalas do seu ministério, visualiza membros
- **`admin`**: Acesso total ao sistema

#### Permissões por Role:

| Funcionalidade | Membro | Líder | Admin |
|---------------|--------|-------|-------|
| Ver minhas escalas | ✅ | ✅ | ✅ |
| Confirmar presença | ✅ | ✅ | ✅ |
| Ver escalas do ministério | ❌ | ✅ | ✅ |
| Criar/editar escalas | ❌ | ✅ (seu ministério) | ✅ |
| Gerenciar membros | ❌ | ✅ (seu ministério) | ✅ |
| Ver todas escalas | ❌ | ❌ | ✅ |
| Configurações gerais | ❌ | ❌ | ✅ |

---

### 2. **Interface de Escalas (Similar ao LouveApp)**

#### Para Líderes/Admin:
- **Lista de Escalas**: Visualização em cards ou calendário
- **Criar Escala**: Formulário com:
  - Seleção de ministério
  - Data e horário
  - Adicionar membros por função
  - Observações
- **Editar Escala**: Modificar membros, datas, status
- **Gerar Escala Automática**: Baseada em rotação
- **Enviar via WhatsApp**: Botão para compartilhar escala

#### Para Membros:
- **Minhas Escalas**: Lista de escalas onde está escalado
- **Confirmar Presença**: Botão de confirmação
- **Ver Detalhes**: Data, horário, ministério, outros membros
- **Notificações**: Alertas de novas escalas

---

### 3. **Notificações Baseadas em Roles**

#### Membros:
- ✅ Nova escala criada (quando escalado)
- ✅ Lembrete 24h antes da escala
- ✅ Lembrete 1h antes da escala
- ✅ Atividades da igreja (eventos, estudos)

#### Líderes:
- ✅ Todas notificações de membros
- ✅ Confirmação de presença dos membros
- ✅ Membros que não confirmaram (24h antes)
- ✅ Novos membros no ministério

#### Admin:
- ✅ Todas notificações anteriores
- ✅ Relatórios e estatísticas
- ✅ Alertas do sistema

---

### 4. **Integração WhatsApp**

#### Funcionalidades:
- **Enviar Escala**: Compartilhar escala completa via WhatsApp
- **Notificações**: Enviar lembretes automáticos
- **Confirmação**: Permitir confirmação via WhatsApp (futuro)

#### Formato da Mensagem:
```
🎵 ESCALA - Ministério de Louvor
📅 15/02/2024 às 19:00

👥 Membros Escalados:
• João Silva - Vocal
• Maria Santos - Teclado
• Pedro Costa - Bateria

📍 Local: Templo Principal
📝 Observações: Chegar 30min antes

✅ Confirme sua presença no app!
```

---

### 5. **Dashboard Mobile**

#### Para Membros:
- **Minhas Escalas**: Próximas escalas
- **Atividades**: Eventos e estudos
- **Notificações**: Alertas e lembretes
- **Perfil**: Informações pessoais

#### Para Líderes:
- **Escalas do Ministério**: Gerenciar escalas
- **Membros**: Lista de membros do ministério
- **Confirmações**: Status de confirmações
- **Estatísticas**: Relatórios básicos

---

## 📱 Estrutura de Arquivos

```
client/src/
├── pages/
│   ├── Scales.tsx (Admin/Líder - Gerenciar)
│   ├── MyScales.tsx (Membro - Visualizar)
│   └── ScalesMobile.tsx (Versão mobile otimizada)
├── components/
│   ├── ScaleCard.tsx (Card de escala)
│   ├── ScaleForm.tsx (Formulário criar/editar)
│   ├── ScaleConfirmation.tsx (Confirmar presença)
│   ├── ScaleWhatsApp.tsx (Enviar via WhatsApp)
│   └── RoleBasedAccess.tsx (Controle de acesso)
├── hooks/
│   ├── useUserRole.ts (Hook para verificar role)
│   ├── useMyScales.ts (Hook para escalas do membro)
│   └── useScaleNotifications.ts (Hook para notificações)
├── services/
│   ├── scalesAPI.ts (Já existe - melhorar)
│   ├── notificationsAPI.ts (Novo)
│   └── whatsappAPI.ts (Novo)
└── types/
    ├── Scale.ts (Já existe - expandir)
    ├── Role.ts (Novo)
    └── Notification.ts (Novo)
```

---

## 🚀 Fases de Implementação

### Fase 1: Sistema de Roles ✅
- [x] Criar tipos de roles
- [ ] Adicionar role ao usuário no Firebase
- [ ] Criar hook useUserRole
- [ ] Criar componente RoleBasedAccess

### Fase 2: Interface de Escalas
- [ ] Melhorar Scales.tsx (Admin/Líder)
- [ ] Criar MyScales.tsx (Membro)
- [ ] Criar ScaleCard component
- [ ] Criar ScaleForm melhorado

### Fase 3: Notificações
- [ ] Criar sistema de notificações
- [ ] Implementar lembretes automáticos
- [ ] Criar hook useScaleNotifications

### Fase 4: WhatsApp
- [ ] Criar componente WhatsApp
- [ ] Implementar envio de escalas
- [ ] Formatar mensagens

### Fase 5: Mobile App
- [ ] Criar versão mobile das escalas
- [ ] Implementar confirmação rápida
- [ ] Dashboard mobile

---

## 🔧 Tecnologias Utilizadas

- **Frontend**: React + TypeScript
- **Backend**: Firebase Firestore
- **Autenticação**: Firebase Auth
- **Notificações**: Firebase Cloud Messaging (FCM)
- **WhatsApp**: API do WhatsApp Business (futuro) ou link direto

---

## 📝 Próximos Passos

1. Implementar sistema de roles
2. Melhorar interface de escalas
3. Criar página para membros
4. Implementar notificações
5. Integrar WhatsApp

---

**Status**: 🚧 Em desenvolvimento
**Referência**: [LouveApp](https://app.louveapp.com.br/#/login)
