// src/utils/validation.ts

// Validação de e-mail
export function validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validação de CPF (algoritmo brasileiro)
export function validateCPF(cpfValue: string): boolean {
    const cpfNumeros: string = cpfValue.replace(/\D/g, '');
    if (cpfNumeros.length !== 11 || /^([0-9])\1+$/.test(cpfNumeros)) { return false; }
    let soma = 0;
    for (let i = 0; i < 9; i++) { soma += parseInt(cpfNumeros.charAt(i), 10) * (10 - i); }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) { resto = 0; }
    if (resto !== parseInt(cpfNumeros.charAt(9), 10)) { return false; }
    soma = 0;
    for (let i = 0; i < 10; i++) { soma += parseInt(cpfNumeros.charAt(i), 10) * (11 - i); }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) { resto = 0; }
    if (resto !== parseInt(cpfNumeros.charAt(10), 10)) { return false; }
    return true;
}

// Validação de RG (apenas números, 9 dígitos)
export function validateRG(rg: string): boolean {
    return /^\d{9}$/.test(rg);
}

// Validação de telefone (10 ou 11 dígitos, apenas números)
export function validateTelefone(telefone: string): boolean {
    return /^\d{10,11}$/.test(telefone);
}

// Validação de nome (mínimo 3 letras, apenas letras e espaços)
export function validateNome(nome: string): boolean {
    return nome.trim().length >= 3 && /^[a-zA-ZÀ-ÿ\s]+$/.test(nome.trim());
}

// Validação de senha (mínimo 8 caracteres)
export function validateSenha(senha: string): boolean {
    return senha.length >= 8;
}

// Avaliação da força da senha
export function avaliarForcaSenha(s: string): 'fraca' | 'média' | 'forte' | '' {
    if (!s) {return '';}
    if (s.length < 8) {return 'fraca';}
    const temLetra = /[a-zA-Z]/.test(s);
    const temNumero = /\d/.test(s);
    const temEspecial = /[^a-zA-Z0-9]/.test(s);
    if (s.length >= 8 && temLetra && temNumero && temEspecial) {return 'forte';}
    if (temLetra && temNumero) {return 'média';}
    return 'fraca';
}
