/**
 * Serviço de Activação de Assinaturas
 * Gera e valida códigos de activação de forma segura
 */

import CryptoJS from 'crypto-js';

// Configurações de planos (valores em AOA)
export const SUBSCRIPTION_PLANS = {
    MENSAL: {
        label: 'Mensal',
        price: 15000,
        duration: 30, // dias
        description: '1 mês de acesso completo',
    },
    TRIMESTRAL: {
        label: 'Trimestral',
        price: 40000,
        duration: 90,
        description: '3 meses de acesso (economia de 5.000 AOA)',
    },
    SEMESTRAL: {
        label: 'Semestral',
        price: 75000,
        duration: 180,
        description: '6 meses de acesso (economia de 15.000 AOA)',
    },
    ANUAL: {
        label: 'Anual',
        price: 140000,
        duration: 365,
        description: '12 meses de acesso (economia de 40.000 AOA)',
    },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;

// Informações de pagamento
export const PAYMENT_INFO = {
    bank: 'BAI',
    accountNumber: '17357484',
    iban: '0040.0000.1735.7484.1011.5',
    whatsapp: '+244 921 923 232',
    whatsappLink: 'https://wa.me/244921923232',
};

// Secret salt para geração de códigos (em produção, usar variável de ambiente)
const ACTIVATION_SECRET = 'KAMBA-MANY-POS-ANGOLA-2026-SECURE';

/**
 * Gera um código de referência visível ao utilizador
 * Formato: REF-XXXXXX
 */
export function generateReferenceCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem I,O,0,1 para evitar confusão
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `REF-${code}`;
}

/**
 * Gera um código de activação interno (determinístico)
 * Formato: ACT-XXXX-XXXX-XXXX
 * Code = HMAC(Reference + Plan + Secret)
 * 
 * IMPORTANTE: Agora é puramente determinístico para permitir geração remota.
 * O SuperAdmin só precisa da Referência e do Plano para gerar o mesmo código.
 */
export function generateActivationCode(referenceCode: string, planType: PlanType): string {
    // SECURITY: Algoritmo Determinístico
    // Se mudarmos o SECRET, todos os códigos antigos deixam de funcionar
    const rawString = `${referenceCode.toUpperCase()}|${planType}|${ACTIVATION_SECRET}`;
    const hash = CryptoJS.SHA256(rawString).toString();

    // Formatar como ACT-XXXX-XXXX-XXXX
    // Usamos os primeiros 12 caracteres do hash hexadecimal
    const code = hash.substring(0, 12).toUpperCase();
    return `ACT-${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 12)}`;
}

/**
 * Valida um código de activação
 * Recalcula o código esperado com base na Referência e Plano e compara com o Input
 */
export function validateActivationCode(
    inputCode: string,
    referenceCode: string,
    planType: PlanType
): boolean {
    const expectedCode = generateActivationCode(referenceCode, planType);
    return inputCode.toUpperCase() === expectedCode;
}

/**
 * Calcula a data de fim da assinatura baseada no plano
 */
export function calculateEndDate(planType: PlanType, startDate: Date = new Date()): Date {
    const plan = SUBSCRIPTION_PLANS[planType];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration);
    return endDate;
}

/**
 * Formata valor em AOA
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
        minimumFractionDigits: 0,
    }).format(value);
}

/**
 * Verifica se uma assinatura está activa
 */
export function isSubscriptionActive(endDate: string | Date): boolean {
    const end = new Date(endDate);
    return end > new Date();
}

/**
 * Calcula dias restantes da assinatura
 */
export function daysRemaining(endDate: string | Date): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
