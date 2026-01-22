'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, Button, Input, Alert } from '@/components/ui';
import {
    Key,
    RefreshCcw,
    Copy,
    CheckCircle,
    Clock,
    XCircle,
    Search,
    MessageCircle,
    Phone
} from 'lucide-react';
import db from '@/lib/db/sqlite';
import {
    generateActivationCode,
    SUBSCRIPTION_PLANS,
    PAYMENT_INFO,
    formatCurrency,
    type PlanType
} from '@/lib/subscription/activationService';

interface SubscriptionRequest {
    id: string;
    organization_id: string;
    plan_type: PlanType;
    reference_code: string;
    amount: number;
    status: 'PENDING' | 'ACTIVATED' | 'REJECTED' | 'EXPIRED';
    requested_at: string;
    activated_at: string | null;
    org_name?: string;
}

const ActivationManager: React.FC = () => {
    const { user } = useAuthStore();
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [generatedCode, setGeneratedCode] = useState<{ [key: string]: string }>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = () => {
        setIsLoading(true);
        try {
            const data = db.query<SubscriptionRequest>(`
                SELECT sr.*, o.name as org_name 
                FROM subscription_requests sr
                LEFT JOIN organizations o ON sr.organization_id = o.id
                ORDER BY 
                    CASE sr.status 
                        WHEN 'PENDING' THEN 1 
                        WHEN 'ACTIVATED' THEN 2 
                        ELSE 3 
                    END,
                    sr.requested_at DESC
            `);
            setRequests(data);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateCode = (request: SubscriptionRequest) => {
        const code = generateActivationCode(request.reference_code, request.plan_type);

        // No deterministic mode, we technically don't need to store the hash for validation
        // But for UI persistency (to show the code to admin again), we update the local state.
        // The DB update for 'activation_code_hash' is deprecated but we can leave it empty or 
        // store a placeholder if needed. For now, we skip DB update related to hash.

        setGeneratedCode(prev => ({ ...prev, [request.id]: code }));
    };

    const handleCopyCode = (requestId: string) => {
        const code = generatedCode[requestId];
        if (code) {
            navigator.clipboard.writeText(code);
            setCopiedId(requestId);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const handleReject = (requestId: string) => {
        db.run(`
            UPDATE subscription_requests 
            SET status = 'REJECTED'
            WHERE id = ?
        `, [requestId]);
        loadRequests();
    };

    // Send activation code to client via WhatsApp
    const handleSendToClient = (request: SubscriptionRequest) => {
        const code = generatedCode[request.id];
        if (!code) return;

        const message = `✅ *ACTIVAÇÃO APROVADA - KAMBA POS*

Olá! O seu pagamento foi confirmado.

📌 Referência: *${request.reference_code}*
📦 Plano: ${SUBSCRIPTION_PLANS[request.plan_type]?.label}

🔑 *Código de Activação:*
\`${code}\`

Por favor insira este código na página de Assinatura do sistema para activar o seu plano.

Obrigado por escolher o KAMBA POS!`;

        // Open WhatsApp (SuperAdmin responds in the same conversation)
        window.open(`${PAYMENT_INFO.whatsappLink}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const filteredRequests = requests.filter(r =>
        r.reference_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.org_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingCount = requests.filter(r => r.status === 'PENDING').length;

    // Only SuperAdmin can access this
    if (user?.role !== 'SUPERADMIN') {
        return (
            <Alert variant="error">
                Acesso restrito. Apenas SuperAdmin pode gerir activações.
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Key className="w-6 h-6 text-[var(--primary)]" />
                        Gestão de Activações
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {pendingCount} pedido(s) pendente(s)
                    </p>
                </div>
                <Button variant="outline" onClick={loadRequests} disabled={isLoading}>
                    <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    placeholder="Pesquisar por referência ou organização..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <Card className="p-8 text-center text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhum pedido de activação encontrado.</p>
                    </Card>
                ) : (
                    filteredRequests.map(request => (
                        <Card key={request.id} className={`p-4 border-l-4 ${request.status === 'PENDING' ? 'border-l-yellow-500' :
                            request.status === 'ACTIVATED' ? 'border-l-green-500' :
                                'border-l-red-500'
                            }`}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono font-bold text-lg text-[var(--primary)]">
                                            {request.reference_code}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            request.status === 'ACTIVATED' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {request.status === 'PENDING' ? 'Pendente' :
                                                request.status === 'ACTIVATED' ? 'Activado' : 'Rejeitado'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong>Organização:</strong> {request.org_name || 'N/A'}</p>
                                        <p><strong>Plano:</strong> {SUBSCRIPTION_PLANS[request.plan_type]?.label} - {formatCurrency(request.amount)}</p>
                                        <p><strong>Solicitado:</strong> {new Date(request.requested_at).toLocaleString('pt-AO')}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {request.status === 'PENDING' && (
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        {!generatedCode[request.id] ? (
                                            <Button
                                                variant="primary"
                                                onClick={() => handleGenerateCode(request)}
                                                className="w-full"
                                            >
                                                <Key className="w-4 h-4 mr-2" />
                                                Gerar Código
                                            </Button>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="bg-gray-100 p-3 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500 mb-1">Código de Activação:</p>
                                                    <code className="font-mono font-bold text-green-700 text-lg select-all">
                                                        {generatedCode[request.id]}
                                                    </code>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleCopyCode(request.id)}
                                                        className="w-full text-xs"
                                                    >
                                                        {copiedId === request.id ? (
                                                            <><CheckCircle className="w-3 h-3 mr-1 text-green-600" /> Copiado</>
                                                        ) : (
                                                            <><Copy className="w-3 h-3 mr-1" /> Copiar</>
                                                        )}
                                                    </Button>

                                                    <Button
                                                        variant="primary"
                                                        onClick={() => handleSendToClient(request)}
                                                        className="w-full bg-green-600 hover:bg-green-700 text-xs"
                                                    >
                                                        <MessageCircle className="w-3 h-3 mr-1" />
                                                        WhatsApp
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            onClick={() => handleReject(request.id)}
                                            className="w-full text-red-600 border-red-200 hover:bg-red-50 mt-2"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Rejeitar
                                        </Button>
                                    </div>
                                )}

                                {request.status === 'ACTIVATED' && (
                                    <div className="text-green-600 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="text-sm">Activado em {new Date(request.activated_at!).toLocaleDateString('pt-AO')}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivationManager;
