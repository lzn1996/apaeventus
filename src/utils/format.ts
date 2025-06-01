// Funções utilitárias para máscaras e formatação de campos de documento e telefone

export function formatCPF(cpf: string): string {
    const numeros = cpf.replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 3) {return numeros;}
    if (numeros.length <= 6) {return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;}
    if (numeros.length <= 9) {return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;}
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
}

export function formatRG(rg: string): string {
    const numeros = rg.replace(/\D/g, '').slice(0, 9);
    if (numeros.length <= 8) {return numeros;}
    return `${numeros.slice(0, 8)}-${numeros.slice(8)}`;
}

export function formatTelefone(telefone: string): string {
    const numeros = telefone.replace(/\D/g, '').slice(0, 11);
    if (numeros.length === 0) {return '';}
    if (numeros.length <= 2) {return `(${numeros}`;}
    if (numeros.length <= 7) {return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;}
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}
