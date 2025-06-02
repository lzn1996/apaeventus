// src/utils/errorMessages.ts

// Objeto utilitário para mensagens de erro do formulário de cadastro
// Facilita manutenção e internacionalização

const errorMessages = {
  nome: {
    required: 'Nome é obrigatório.',
    minLength: 'Nome deve ter ao menos 3 caracteres.',
    invalid: 'Nome inválido.',
  },
  email: {
    required: 'E-mail é obrigatório.',
    invalid: 'E-mail inválido.',
  },
  senha: {
    required: 'Senha é obrigatória.',
    minLength: 'Senha deve ter pelo menos 8 caracteres.',
    weak: 'Senha muito curta.',
    mismatch: 'As senhas não coincidem.',
  },
  confirmarSenha: {
    required: 'Confirme a senha.',
    mismatch: 'As senhas não coincidem.',
    minLength: 'A senha deve ter pelo menos 8 caracteres.',
  },
  cpf: {
    required: 'CPF é obrigatório.',
    length: 'CPF deve ter 11 dígitos.',
    onlyNumbers: 'CPF deve conter apenas números.',
    invalid: 'CPF inválido.',
  },
  rg: {
    required: 'RG é obrigatório.',
    length: 'RG deve ter 9 dígitos.',
    invalid: 'RG inválido.',
  },
  telefone: {
    required: 'Telefone é obrigatório.',
    length: 'Telefone deve ter pelo menos 10 dígitos.',
    invalid: 'Telefone inválido.',
  },
  generic: {
    required: 'Campo obrigatório.',
    invalid: 'Valor inválido.',
  },
};

export default errorMessages;
