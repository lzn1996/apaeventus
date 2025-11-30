# 🎓 Guia Rápido: Como Criar e Executar Testes

**Para: Novos colaboradores que acabaram de fazer pull do repositório**

---

## 📦 1. Setup Inicial (Primeira Vez)

```bash
# 1. Navegue até a pasta do projeto
cd apaeventus

# 2. Instale as dependências
npm install

# 3. Execute todos os testes para verificar se está tudo OK
npm test
```

**Resultado esperado:**
```
Test Suites: 11 passed, 11 total
```

✅ Se viu isso, está tudo configurado corretamente!

---

## 🧪 2. Como Eu Crio os Testes? (Metodologia)

### **Fluxo de Trabalho:**

```
📱 Componente → 🔍 Análise → ✏️ Criar Teste → ▶️ Executar → 📝 Documentar
```

### **Passo a Passo Detalhado:**

#### **Passo 1: Escolher o Componente a Testar**

```bash
# Veja a lista de componentes disponíveis
ls src/screens/

# Exemplo: Vou testar o ChatbotScreen.tsx
code src/screens/ChatbotScreen.tsx
```

#### **Passo 2: Analisar o Componente (5 perguntas)**

Antes de escrever qualquer código, responda:

1. **O que aparece na tela?** (título, botões, inputs, listas)
2. **O que o usuário pode fazer?** (clicar, digitar, arrastar)
3. **Quais APIs são chamadas?** (GET /events, POST /login, etc)
4. **Quais estados existem?** (loading, erro, sucesso, vazio)
5. **Para onde navega?** (telas que podem ser acessadas)

**Exemplo real - ChatbotScreen:**
- ✅ Aparece: mensagem do bot, input de texto, botão enviar
- ✅ Usuário pode: digitar mensagem, enviar, ver sugestões, selecionar sugestão
- ✅ APIs: POST /chatbot/generate-event, POST /chatbot/reset-conversation
- ✅ Estados: loading (IA pensando), conversa completa, modal de sugestões
- ✅ Navega: volta para CreateEvent (com dados ou sem)

#### **Passo 3: Criar o Arquivo de Teste**

```bash
# Criar arquivo em __tests__/
code __tests__/ChatbotScreen.test.tsx
```

**Estrutura básica que eu uso:**

```typescript
// __tests__/ChatbotScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatbotScreen from '../src/screens/ChatbotScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';

// ===== PARTE 1: MOCKS =====
// Simular dependências externas (API, navegação, storage)

jest.mock('../src/services/api', () => ({
  __esModule: true,
  default: { post: jest.fn() }
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() })
}));

// ===== PARTE 2: SUITE DE TESTES =====
describe('ChatbotScreen - RF13: Assistente IA', () => {
  
  // ===== PARTE 3: SETUP =====
  // Executado ANTES de cada teste
  beforeEach(() => {
    jest.clearAllMocks(); // Limpa contadores de mock
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    (api.post as jest.Mock).mockResolvedValue({
      data: { message: 'Resposta do bot', conversationComplete: false }
    });
  });

  // ===== PARTE 4: TESTES ORGANIZADOS =====
  
  describe('Renderização inicial', () => {
    it('exibe mensagem de boas-vindas', () => {
      const { getByText } = render(<ChatbotScreen />);
      expect(getByText(/Olá! Vou te ajudar/i)).toBeTruthy();
    });

    it('exibe campo de input', () => {
      const { getByPlaceholderText } = render(<ChatbotScreen />);
      expect(getByPlaceholderText('Digite sua resposta...')).toBeTruthy();
    });
  });

  describe('Envio de mensagens', () => {
    it('envia mensagem ao clicar no botão', async () => {
      const { getByPlaceholderText, getByText } = render(<ChatbotScreen />);
      
      const input = getByPlaceholderText('Digite sua resposta...');
      const button = getByText('➤');

      fireEvent.changeText(input, 'Show de rock');
      fireEvent.press(button);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/chatbot/generate-event',
          { message: 'Show de rock' },
          { headers: { Authorization: 'Bearer mock-token' } }
        );
      });
    });
  });

  describe('Tratamento de erros', () => {
    it('exibe erro quando API falha', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Erro no servidor' } }
      });

      const { getByText, findByText } = render(<ChatbotScreen />);
      
      fireEvent.press(getByText('➤'));

      const error = await findByText('Erro no servidor');
      expect(error).toBeTruthy();
    });
  });
});
```

#### **Passo 4: Executar e Iterar**

```bash
# Executar apenas este arquivo de teste
npm test -- ChatbotScreen.test.tsx

# Ver erros e ajustar até todos passarem
# Repetir: escrever teste → executar → ajustar → executar
```

#### **Passo 5: Organizar em Categorias**

Eu sempre organizo os testes nestas categorias:

1. **Renderização inicial** - O que aparece ao carregar
2. **Interações** - Cliques, digitação, gestos
3. **Validações** - Regras de negócio
4. **Chamadas API** - Requisições HTTP
5. **Navegação** - Mudanças de tela
6. **Tratamento de erros** - Cenários de erro
7. **Estados especiais** - Loading, vazio, offline

#### **Passo 6: Atualizar Documentação**

Após todos os testes passarem, atualizo o `README.md`:

```markdown
| **RF13** | Assistente IA | `ChatbotScreen.test.tsx` | 22/22 | ✅ 100% |
```

---

## 🛠️ 3. Comandos que Eu Uso Todo Dia

```bash
# Executar TODOS os testes
npm test

# Executar UM arquivo específico
npm test -- ChatbotScreen.test.tsx

# Modo WATCH (reexecuta ao salvar - MUITO ÚTIL!)
npm test -- --watch

# Ver cobertura de código
npm test -- --coverage

# Ver mais detalhes (útil para debug)
npm test -- --verbose

# Identificar timers/handles abertos
npm test -- --detectOpenHandles
```

---

## 📚 4. Exemplos Práticos (Copie e Cole!)

### **Testar se elemento aparece na tela:**

```typescript
it('exibe título da tela', () => {
  const { getByText } = render(<MinhaScreen />);
  expect(getByText('Bem-vindo')).toBeTruthy();
});
```

### **Testar digitação em input:**

```typescript
it('permite digitar no campo de email', () => {
  const { getByPlaceholderText } = render(<LoginScreen />);
  const input = getByPlaceholderText('Digite seu email');
  
  fireEvent.changeText(input, 'teste@email.com');
  
  expect(input.props.value).toBe('teste@email.com');
});
```

### **Testar clique em botão:**

```typescript
it('chama função ao clicar', async () => {
  const mockFn = jest.fn();
  const { getByText } = render(<Botao onPress={mockFn} />);
  
  fireEvent.press(getByText('Confirmar'));
  
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

### **Testar chamada de API (sucesso):**

```typescript
it('busca eventos da API', async () => {
  (api.get as jest.Mock).mockResolvedValue({
    data: { eventos: [{ id: 1, nome: 'Show' }] }
  });
  
  const { findByText } = render(<EventosScreen />);
  
  expect(await findByText('Show')).toBeTruthy();
  expect(api.get).toHaveBeenCalledWith('/events');
});
```

### **Testar erro de API:**

```typescript
it('exibe erro quando API falha', async () => {
  (api.post as jest.Mock).mockRejectedValue({
    response: { status: 500, data: { message: 'Erro no servidor' } }
  });
  
  const { getByText, findByText } = render(<FormScreen />);
  fireEvent.press(getByText('Enviar'));
  
  expect(await findByText('Erro no servidor')).toBeTruthy();
});
```

### **Testar navegação:**

```typescript
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate })
}));

it('navega para próxima tela', async () => {
  const { getByText } = render(<MinhaScreen />);
  
  fireEvent.press(getByText('Avançar'));
  
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('ProximaTela');
  });
});
```

---

## 🐛 5. Problemas Comuns (E Como Eu Resolvo)

### ❌ "Unable to find element"

**Causa:** Elemento aparece após operação assíncrona

```typescript
// ❌ ERRADO
const element = getByText('Texto que aparece depois');

// ✅ CORRETO
const element = await findByText('Texto que aparece depois');
// OU
await waitFor(() => {
  expect(getByText('Texto que aparece depois')).toBeTruthy();
});
```

### ❌ "Jest did not exit one second after..."

**Causa:** Timers (setTimeout/setInterval) não limpos

```typescript
// ✅ SOLUÇÃO: Adicionar no beforeEach
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### ❌ Mock não funciona

**Causa:** Mock não foi limpo entre testes

```typescript
// ✅ SOLUÇÃO: Sempre limpar mocks
beforeEach(() => {
  jest.clearAllMocks(); // ← ESSENCIAL!
});
```

### ❌ Teste passa isolado mas falha em conjunto

**Causa:** Estado compartilhado entre testes

```typescript
// ✅ SOLUÇÃO: Resetar AsyncStorage e outros estados
beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockClear();
  (AsyncStorage.setItem as jest.Mock).mockClear();
});
```

---

## 📊 6. Como Verifico se Testei Tudo?

```bash
# Gerar relatório de cobertura
npm test -- --coverage

# Olhar o percentual de cobertura
# Meta: > 80% em statements, branches, functions, lines
```

**Checklist mental que eu uso:**

- [ ] Testei renderização de TODOS os elementos importantes?
- [ ] Testei TODAS as interações do usuário? (cliques, digitação)
- [ ] Testei o caminho FELIZ? (tudo funciona)
- [ ] Testei cenários de ERRO? (API falha, campos inválidos)
- [ ] Testei estados ESPECIAIS? (loading, vazio, offline)
- [ ] Testei NAVEGAÇÃO? (mudanças de tela)
- [ ] TODOS os testes estão PASSANDO? ✅

---

## 🎯 7. Fluxo Completo (Resumo Visual)

```
1. 📱 git pull origin main
   ↓
2. 📦 npm install
   ↓
3. ▶️ npm test (verifica se tudo funciona)
   ↓
4. 📂 Escolhe componente: src/screens/NovoScreen.tsx
   ↓
5. 🔍 Analisa: O que faz? APIs? Estados? Navegação?
   ↓
6. ✏️ Cria: __tests__/NovoScreen.test.tsx
   ↓
7. 🧪 Escreve: Mocks → Setup → Testes por categoria
   ↓
8. ▶️ Executa: npm test -- NovoScreen.test.tsx
   ↓
9. 🔄 Ajusta até todos passarem ✅
   ↓
10. 📝 Documenta no README.md
    ↓
11. 🚀 git add . → git commit → git push
```

---

## 📞 8. Precisa de Ajuda?

### **Estratégias que funcionam:**

1. **Copie um teste que funciona** - Use RF01-RF13 como template
2. **Veja o que está sendo renderizado**:
   ```typescript
   const { debug } = render(<MeuComponente />);
   debug(); // Imprime o DOM inteiro
   ```
3. **Use console.log nos testes**:
   ```typescript
   console.log('Valor do input:', input.props.value);
   ```
4. **Leia a documentação oficial**:
   - [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
   - [Jest Docs](https://jestjs.io/docs/getting-started)

### **Padrão que eu sigo:**

> **"Teste o comportamento, não a implementação"**

- ✅ Teste o que o usuário VÊ e FAZ
- ✅ Teste o que acontece quando clica, digita, etc
- ❌ NÃO teste detalhes internos (estados privados, funções internas)

---

## 🎓 9. Resumo dos 156 Testes Existentes

**Você pode usar qualquer um deles como referência:**

| RF | Testes | Arquivo | Complexidade |
|----|--------|---------|--------------|
| RF01 | 15 | RegisterScreen.test.tsx | ⭐ Fácil |
| RF02 | 25 | LoginScreen.test.tsx | ⭐⭐ Média |
| RF03 | 4 | EditProfileScreen.test.tsx | ⭐⭐⭐ Difícil (interceptors) |
| RF04 | 17 | EventListScreen.test.tsx | ⭐⭐ Média |
| RF05 | 13 | PurchaseScreen.test.tsx | ⭐⭐ Média |
| RF06 | 20 | MyTicketsScreen.test.tsx | ⭐⭐ Média |
| RF07 | 25 | TicketsByEventScreen.test.tsx | ⭐⭐ Média |
| RF08 | 15 | QRCodeScannerScreen.test.tsx | ⭐⭐⭐ Difícil (câmera) |
| RF13 | 22 | ChatbotScreen.test.tsx | ⭐⭐ Média |

**Recomendação:** Comece analisando **RF01 (RegisterScreen)** - é o mais simples e didático!

---

## ✅ 10. Você está pronto!

Agora você sabe:
- ✅ Como configurar o ambiente
- ✅ Como analisar um componente
- ✅ Como criar um arquivo de teste
- ✅ Como escrever mocks
- ✅ Como organizar testes por categoria
- ✅ Como executar e debugar
- ✅ Como resolver problemas comuns

**Próximo passo:** Escolha um componente e comece! 🚀

---

**Dúvidas?** Veja os testes existentes em `__tests__/` - eles são seus melhores exemplos! 💡
