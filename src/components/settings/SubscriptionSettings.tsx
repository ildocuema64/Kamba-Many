'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import useSubscriptionStore from '@/store/subscriptionStore';
import {
    SUBSCRIPTION_PLANS,
    PAYMENT_INFO,
    formatCurrency,
    generateReferenceCode,
    validateActivationCode,
    type PlanType,
    daysRemaining
} from '@/lib/subscription/activationService';
import { Card, Button, Input, Alert } from '@/components/ui';
import {
    CreditCard,
    CheckCircle,
    Clock,
    AlertTriangle,
    Download,
    RefreshCcw,
    Calendar,
    Activity
} from 'lucide-react';
import db from '@/lib/db/sqlite';

const SubscriptionSettings: React.FC = () => {
    const { user } = useAuthStore();
    const { currentSubscription, loadSubscription, hasActiveSubscription, isLoading } = useSubscriptionStore();

    // UI State
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('MENSAL');
    const [isRequesting, setIsRequesting] = useState(false);
    const [generatedReference, setGeneratedReference] = useState<string | null>(null);
    const [activationCode, setActivationCode] = useState('');
    const [isActivating, setIsActivating] = useState(false);
    const [activationError, setActivationError] = useState('');
    const [activationSuccess, setActivationSuccess] = useState(false);

    useEffect(() => {
        if (user?.organization_id) {
            loadSubscription(user.organization_id);
        }
    }, [user?.organization_id, loadSubscription]);

    const handleRequest = async () => {
        if (!user?.organization_id) return;

        setIsRequesting(true);
        try {
            // Generate Reference
            const refCode = generateReferenceCode();
            setGeneratedReference(refCode);

            // Save request to DB (Simulated "Pending" state)
            const plan = SUBSCRIPTION_PLANS[selectedPlan];

            await db.run(`
                INSERT INTO subscription_requests (
                    id, organization_id, plan_type, payment_method, 
                    reference_code, amount, status, requested_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `, [
                crypto.randomUUID(),
                user.organization_id,
                selectedPlan,
                'TRANSFERENCIA', // Default for now
                refCode,
                plan.price,
                'PENDING'
            ]);

        } catch (err) {
            console.error('Falha ao gerar pedido:', err);
            setActivationError('Erro ao gerar referência. Tente novamente.');
        } finally {
            setIsRequesting(false);
        }
    };

    // Handle WhatsApp send - sends ONLY reference (NO activation code)
    // SECURITY: Activation code is generated ONLY by SuperAdmin after payment verification
    const handleWhatsAppSend = () => {
        if (!generatedReference) return;

        // Build WhatsApp message WITHOUT the activation code
        // User must attach payment proof - SuperAdmin will send code after verification
        const message = `📋 *PEDIDO DE ACTIVAÇÃO - KAMBA POS*

📌 Referência: *${generatedReference}*
📦 Plano: ${SUBSCRIPTION_PLANS[selectedPlan].label}
💰 Valor: ${formatCurrency(SUBSCRIPTION_PLANS[selectedPlan].price)}

📎 *Por favor envie o comprovativo de pagamento em anexo.*

Aguardo o código de activação. Obrigado!`;

        // Open WhatsApp
        window.open(`${PAYMENT_INFO.whatsappLink}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleActivate = async () => {
        if (!user?.organization_id || !generatedReference) return;

        setIsActivating(true);
        setActivationError('');

        try {
            // Verify if request exists (sanity check)
            const request = db.queryOne(
                `SELECT id FROM subscription_requests WHERE reference_code = ?`,
                [generatedReference]
            );

            if (!request) {
                throw new Error('Pedido não encontrado.');
            }

            // Validate using deterministic algorithm (Local Recalculation)
            // We don't need to fetch anything from DB, just verifying if the typed code matches Reference + Plan
            if (!validateActivationCode(activationCode, generatedReference, selectedPlan)) {
                throw new Error('Código de activação inválido. Verifique se digitou correctamente.');
            }

            // Create valid subscription
            const plan = SUBSCRIPTION_PLANS[selectedPlan];
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.duration);

            await db.run(`
                INSERT INTO subscriptions (
                    id, organization_id, plan_type, status, 
                    start_date, end_date, amount, payment_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                crypto.randomUUID(),
                user.organization_id,
                selectedPlan,
                'ACTIVE',
                startDate.toISOString(),
                endDate.toISOString(),
                plan.price,
                'PAID'
            ]);

            // Update request status
            await db.run(`
                UPDATE subscription_requests 
                SET status = 'ACTIVATED', activated_at = datetime('now')
                WHERE reference_code = ?
            `, [generatedReference]);

            setActivationSuccess(true);
            setGeneratedReference(null);
            setActivationCode('');

            // Reload
            loadSubscription(user.organization_id);

        } catch (err) {
            console.error('Activation failed:', err);
            setActivationError((err as Error).message);
        } finally {
            setIsActivating(false);
        }
    };

    const isActive = hasActiveSubscription();
    const remaining = currentSubscription ? daysRemaining(currentSubscription.end_date) : 0;
    const isSuperAdmin = user?.role === 'SUPERADMIN';

    // SuperAdmin view - they don't need subscriptions
    if (isSuperAdmin) {
        return (
            <div className="space-y-6 animate-fadeIn">
                <Card className="p-6 border-l-4 border-l-purple-500">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Acesso SuperAdmin</h3>
                            <p className="text-gray-600 mt-1">
                                Como SuperAdmin, tem acesso completo ao sistema sem necessidade de assinatura.
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Para gerir activações de clientes, aceda ao separador <strong>"Activações"</strong>.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Status Header */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className={`p-6 border-l-4 ${isActive ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Estado da Assinatura</p>
                            <h3 className={`text-2xl font-bold mt-1 ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                                {isActive ? 'Activa' : 'Expirada / Inactiva'}
                            </h3>
                        </div>
                        <Activity className={`w-8 h-8 ${isActive ? 'text-green-100' : 'text-red-100'}`} />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Plano Actual</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">
                                {currentSubscription ? SUBSCRIPTION_PLANS[currentSubscription.plan_type].label : 'Nenhum'}
                            </h3>
                        </div>
                        <CheckCircle className="w-8 h-8 text-blue-100" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Dias Restantes</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">
                                {remaining} dias
                            </h3>
                        </div>
                        <Clock className="w-8 h-8 text-orange-100" />
                    </div>
                </Card>
            </div>

            {/* Activation / Renewal Section */}
            {!isActive && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <RefreshCcw className="w-5 h-5 text-gray-500" />
                        Renovar ou Activar Plano
                    </h3>

                    {!activationSuccess ? (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Plan Selection */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">1. Escolha o Plano</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(Object.keys(SUBSCRIPTION_PLANS) as PlanType[]).map((type) => {
                                        const plan = SUBSCRIPTION_PLANS[type];
                                        return (
                                            <div
                                                key={type}
                                                onClick={() => !generatedReference && setSelectedPlan(type)}
                                                className={`
                                                relative p-4 rounded-xl border-2 cursor-pointer transition-all
                                                ${selectedPlan === type
                                                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }
                                                ${generatedReference ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-gray-900">{plan.label}</span>
                                                    {selectedPlan === type && <CheckCircle className="w-4 h-4 text-[var(--primary)]" />}
                                                </div>
                                                <div className="text-xl font-extrabold text-[var(--primary)] mb-1">
                                                    {formatCurrency(plan.price)}
                                                </div>
                                                <p className="text-xs text-gray-500">{plan.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Payment & Activation */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-4">2. Pagamento e Activação</label>

                                {!generatedReference ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 mb-4">Seleccione um plano para ver os dados de pagamento.</p>
                                        <Button
                                            variant="primary"
                                            onClick={handleRequest}
                                            isLoading={isRequesting}
                                            className="w-full sm:w-auto"
                                        >
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Solicitar Pagamento
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-pulse-once">
                                        {/* Payment Info */}
                                        <div className="space-y-2 text-sm bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Banco:</span>
                                                <span className="font-medium text-gray-900">{PAYMENT_INFO.bank}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">IBAN:</span>
                                                <span className="font-mono text-gray-900">{PAYMENT_INFO.iban}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t mt-2">
                                                <span className="text-gray-500">Referência:</span>
                                                <span className="font-mono font-bold text-lg text-[var(--primary)] bg-blue-50 px-2 rounded">
                                                    {generatedReference}
                                                </span>
                                            </div>
                                        </div>

                                        <Alert variant="info" className="text-xs">
                                            Faça a transferência e envie o comprovativo para o WhatsApp. Depois, insira o código de activação recebido.
                                        </Alert>

                                        {/* WhatsApp Button */}
                                        <button
                                            onClick={handleWhatsAppSend}
                                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                            Enviar no WhatsApp
                                        </button>

                                        {/* Activation Input */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Código de Activação
                                            </label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="ACT-XXXX-XXXX-XXXX"
                                                    value={activationCode}
                                                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                                                    className="uppercase font-mono"
                                                />
                                                <Button
                                                    onClick={handleActivate}
                                                    isLoading={isActivating}
                                                    disabled={!activationCode}
                                                    variant="primary"
                                                >
                                                    Activar
                                                </Button>
                                            </div>
                                            {activationError && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {activationError}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setGeneratedReference(null)}
                                            className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center"
                                        >
                                            Cancelar pedido
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Success View
                        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-green-800 mb-2">Assinatura Activada com Sucesso!</h3>
                            <p className="text-green-700 mb-6">
                                O seu plano <strong>{SUBSCRIPTION_PLANS[selectedPlan].label}</strong> está activo e pronto a usar.
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => setActivationSuccess(false)}
                            >
                                Voltar
                            </Button>
                        </div>
                    )}
                </Card>
            )}

            {/* History Table (Optional/Future) */}
            <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Histórico de Subscrições</h4>
                {/* Could add a simple table here fetching from DB if needed */}
                <p className="text-sm text-gray-400 italic">Nenhum histórico disponível.</p>
            </div>
        </div>
    );
};

export default SubscriptionSettings;
