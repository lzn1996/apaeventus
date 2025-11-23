# ⚡ Quick Start - Testes (5 minutos)

## 🚀 Setup Rápido

```bash
cd apaeventus
npm install
npm test
```

✅ Passou? Pronto para começar!

---

## 📝 Criar Novo Teste (Template Pronto)

```typescript
// __tests__/SeuComponente.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SeuComponente from '../src/screens/SeuComponente';

// 1. MOCKS
jest.mock('../src/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() }
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() })
}));

// 2. TESTES
describe('SeuComponente - RF##: Descrição', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('exibe título', () => {
      const { getByText } = render(<SeuComponente />);
      expect(getByText('Título')).toBeTruthy();
    });
  });

  describe('Interações', () => {
    it('permite clicar em botão', async () => {
      const { getByText } = render(<SeuComponente />);
      fireEvent.press(getByText('Botão'));
      await waitFor(() => {
        // Verificar resultado
      });
    });
  });
});
```

---

## 🎯 3 Comandos Essenciais

```bash
# Executar um teste específico
npm test -- SeuArquivo.test.tsx

# Modo watch (reexecuta ao salvar)
npm test -- --watch

# Ver todos os testes
npm test
```

---

## 📚 Exemplos Rápidos (Copie!)

### Testar Texto

```typescript
const { getByText } = render(<Comp />);
expect(getByText('Texto')).toBeTruthy();
```

### Testar Input

```typescript
const { getByPlaceholderText } = render(<Comp />);
const input = getByPlaceholderText('Email');
fireEvent.changeText(input, 'test@email.com');
expect(input.props.value).toBe('test@email.com');
```

### Testar Botão

```typescript
const { getByText } = render(<Comp />);
fireEvent.press(getByText('Enviar'));
await waitFor(() => {
  expect(api.post).toHaveBeenCalled();
});
```

### Testar API

```typescript
(api.get as jest.Mock).mockResolvedValue({
  data: { resultado: 'sucesso' }
});

const { findByText } = render(<Comp />);
expect(await findByText('sucesso')).toBeTruthy();
```

### Testar Erro

```typescript
(api.post as jest.Mock).mockRejectedValue({
  response: { status: 500 }
});

const { findByText } = render(<Comp />);
expect(await findByText(/erro/i)).toBeTruthy();
```

---

## 🐛 2 Problemas Comuns

### ❌ "Unable to find element"

```typescript
// USE: findBy (aguarda) ao invés de getBy
const element = await findByText('Texto');
```

### ❌ Mock não funciona

```typescript
// SEMPRE adicione no beforeEach:
beforeEach(() => {
  jest.clearAllMocks(); // ← IMPORTANTE!
});
```

---

## ✅ Checklist Rápido

- [ ] Arquivo criado em `__tests__/`
- [ ] Mocks configurados (API, navegação)
- [ ] `beforeEach` com `jest.clearAllMocks()`
- [ ] Testou renderização
- [ ] Testou cliques/inputs
- [ ] Testou API (sucesso + erro)
- [ ] Todos passando: `npm test -- SeuArquivo.test.tsx`

---

## 📖 Guia Completo

Para mais detalhes, veja: `__tests__/GUIA_PARA_NOVOS_COLABORADORES.md`

---

**Pronto! Agora é só copiar o template e começar! 🚀**
