# ApaEventus

**ApaEventus** é uma aplicação mobile desenvolvida para a gestão de eventos da **APAE de Itapira**, permitindo o controle de ingressos, validação por QR Code e organização de eventos sociais e culturais.

## 📌 Finalidade

Este projeto tem como objetivo proporcionar uma solução prática e eficiente para o gerenciamento de eventos da APAE, oferecendo uma experiência moderna e acessível via aplicativo.

## 🧭 Escopo

ApaEventus é uma solução SaaS híbrida, acessada por dispositivos móveis, que permite:

- Compra de ingressos
- Validação por QR Code
- Controle de participantes
- Gerenciamento de eventos por administradores

---

## ✅ Requisitos Funcionais

- RF01: Cadastro de novos usuários
- RF02: Autenticação por e-mail e senha
- RF03: Atualização de dados do usuário
- RF04: Exibição de eventos organizados por data
- RF05: Compra de ingressos por usuários autenticados
- RF06: Geração de QR Code único por ingresso
- RF07: Envio do ingresso por e-mail e exibição no perfil
- RF08: Bloqueio de compra após atingir o limite de ingressos
- RF09: Administração de eventos (criar, ativar, desativar, excluir)
- RF10: Validação de entrada via QR Code
- RF11: Busca de eventos por nome ou descrição
- RF12: Criação de eventos apenas com data futura (mínimo 1 dia)
- RF13: Api de pagamento
- RF14: Chatbot para sugestão de título e descrição para os eventos

---

## 🚫 Requisitos Não Funcionais

- RNF01: Aplicativo mobile híbrido com **React Native**
- RNF02: Backend em **NestJS (Node.js e TypeScript)**
- RNF03: Banco de dados **PostgreSQL na nuvem**
- RNF04: Infraestrutura hospedada na **AWS (EC2, S3, Lambda)**
- RNF05: Autenticação via **JWT**
- RNF06: Interface responsiva e amigável
- RNF07: Alta disponibilidade e escalabilidade

---

## 🧩 Casos de Uso Principais

| Caso de Uso                | Atores        | Descrição                                        |
|---------------------------|---------------|--------------------------------------------------|
| Cadastro de Usuário       | Visitante     | Registro na plataforma                          |
| Autenticação              | Usuário       | Login com e-mail e senha                        |
| Compra de Ingresso        | Usuário       | Seleção de evento e compra de ingressos         |
| Geração de QR Code        | Sistema       | Envio do ingresso por e-mail com QR Code        |
| Validação de Ingresso     | Administrador | Leitura do QR Code para validação               |
| Gerenciamento de Evento   | Administrador | Administração completa de eventos               |

---

## 📌 Restrições

- Limite de ingressos por evento
- QR Code válido apenas uma vez
- Somente administradores gerenciam eventos

---

## ✅ Critérios de Aceitação

- Bloqueio de login com credenciais inválidas
- Exibição dos eventos em ordem cronológica
- Bloqueio da compra de ingressos esgotados
- Validação bem-sucedida do QR Code na entrada
- Envio do ingresso por e-mail após pagamento

---

---

## 🚀 Como Usar o Aplicativo

### 📱 **Opção 1: Desenvolvimento com Expo Go (Recomendada)**

1. **Instale o Expo CLI:**
   ```bash
   npm install -g @expo/cli
   ```

2. **Clone e configure o projeto:**
   ```bash
   git clone https://github.com/lzn1996/apaeventus.git
   cd apaeventus
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npx expo start
   ```

4. **Teste no dispositivo:**
   - **Android**: Baixe o [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) e escaneie o QR Code
   - **iOS**: Baixe o [Expo Go](https://apps.apple.com/app/expo-go/id982107779) e escaneie o QR Code

### 🏗️ **Opção 2: Build de Produção**

#### **Build na Nuvem (EAS Build - Recomendado)**

1. **Instale o EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Faça login na sua conta Expo:**
   ```bash
   eas login -s
   ```

3. **Configure o projeto:**
   ```bash
   eas build:configure
   ```

4. **Gere o APK:**
   ```bash
   # Para Android
   eas build --platform android --profile preview
   
   # Para produção
   eas build --platform android --profile production
   ```

#### **Build Local (Avançado)**

1. **Configure o ambiente Android:**
   - Instale [Android Studio](https://developer.android.com/studio)
   - Configure `ANDROID_HOME` e `JAVA_HOME`

2. **Execute o build local:**
   ```bash
   eas build --platform android --local
   ```

### ⚙️ **Configuração do Backend**

Para o aplicativo funcionar completamente, você precisa configurar o backend:

1. **Configure a URL da API** em `src/config/api.ts`
2. **Inicie o servidor backend** (NestJS)
3. **Configure o banco PostgreSQL**

---

## 📚 Documentação e Recursos

### 📖 **Documentação Oficial**

- **[Expo Documentation](https://docs.expo.dev/)** - Documentação completa do Expo
- **[React Native Docs](https://reactnative.dev/docs/getting-started)** - Guia do React Native
- **[EAS Build](https://docs.expo.dev/build/introduction/)** - Sistema de build na nuvem
- **[Expo Go](https://docs.expo.dev/get-started/expo-go/)** - App para desenvolvimento

### 🛠️ **Ferramentas Utilizadas**

- **[Expo SDK 53](https://docs.expo.dev/versions/v53.0.0/)** - Framework e ferramentas
- **[React Navigation](https://reactnavigation.org/)** - Navegação entre telas
- **[Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)** - Seleção de imagens
- **[Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)** - Funcionalidades da câmera

### 🏗️ **Build e Deploy**

#### **EAS Build - Build na Nuvem**
- **[EAS Build Documentation](https://docs.expo.dev/build/introduction/)**
- **[Configuration with eas.json](https://docs.expo.dev/build/eas-json/)**
- **[Environment Variables](https://docs.expo.dev/build-reference/variables/)**

#### **Distribuição**
- **[Internal Distribution](https://docs.expo.dev/build/internal-distribution/)** - Compartilhar APK
- **[App Stores](https://docs.expo.dev/distribution/introduction/)** - Publicar na Play Store/App Store

### 📋 **Scripts Disponíveis**

```bash
# Desenvolvimento
npm start              # Inicia Expo dev server
npm run android        # Roda no emulador Android
npm run ios            # Roda no simulador iOS

# Build
eas build --platform android --profile preview    # APK para testes
eas build --platform android --profile production # APK para produção
eas build --platform android --local              # Build local

# Utilidades
npm run lint           # Verificar código
npm test              # Executar testes
```

---

## 🖥️ Frontend (Mobile Híbrido)

Este repositório contém a parte **frontend mobile** do ApaEventus, desenvolvida em **React Native** junto com **TypeScript**, seguindo boas práticas de estrutura:

### 📁 Estrutura de Pastas

```
/src
├─ /components       # Componentes reutilizáveis (Botões, Listas, Modais...)
├─ /screens          # Telas principais (Login, Lista de Eventos, Perfil, Validação QR)
├─ /navigation       # Configuração de navegação via React Navigation
├─ /services         # Integração com API (axios/fetch, autenticação JWT)
├─ /assets           # Ícones, imagens e fontes
├─ /styles           # Estilos globais e tema (cores, fontes, espaçamentos)
```

### ⚙️ Principais Tecnologias e Configurações

- **React Native + TypeScript**
- **React Navigation** para navegação entre as telas
- **Context API** ou **Redux** (dependendo da implementação) para gerenciamento de estado
- **Axios ou Fetch API** com headers JWT para chamadas à backend
- **Componentização** de telas e elementos visuais
- **react-hook-form** para inputs, validações e controle de formulários
- **QRCode**: geração e leitura com bibliotecas específicas (como `react-native-qrcode-svg`, `react-native-camera`)

### 🎨 UI e Estilo

- Interface responsiva com tema padronizado
- Cores institucionais da APAE
- Feedback visual com mensagens, spinners e modais

### 🔁 Fluxo de Navegação

1. Login/Registro com e-mail e senha
2. Listagem de eventos disponíveis
3. Compra e recebimento de ingresso com QR Code
4. Acesso ao histórico e dados do usuário no perfil
5. Validação de QR Code por administradores na entrada

---

## 📚 Referências

- Sommerville, Ian. *Engenharia de Software*. Pearson.
- [DevMedia - Engenharia de Requisitos](https://www.devmedia.com.br/introducao-a-engenharia-de-requisitos/8034)
- [Como Escrever Requisitos de Software](https://medium.com/lfdev-blog/como-escrever-requisitos-de-software-de-forma-simples-e-garantir-o-m%C3%ADnimo-de-erros-no-sistema-app-74df2ee241cc)

---

📍 *Itapira - 2025*
