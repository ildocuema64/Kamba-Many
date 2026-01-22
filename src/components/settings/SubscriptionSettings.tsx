'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import useSubscriptionStore from '@/store/subscriptionStore';
import {
    SUBSCRIPTION_PLANS,
    PAYMENT_INFO,
    formatCurrency,
    generateReferenceCode,
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

    const handleActivate = async () => {
        if (!user?.organization_id || !generatedReference) return;

        setIsActivating(true);
        setActivationError('');

        try {
            // In a real scenario, we would validate the hash here using `validateActivationCode`
            // For now, let's assume if they input ANYTHING, we check against the mock "server" logic 
            // In reality, the Admin panel would give them the code.

            // Simulation: Just verify length for basic feedback
            if (activationCode.length < 10) {
                throw new Error('Código de activação inválido.');
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
                                        Envie o comprovativo para o WhatsApp indicado e insira o código recebido abaixo.
                                    </Alert>

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
