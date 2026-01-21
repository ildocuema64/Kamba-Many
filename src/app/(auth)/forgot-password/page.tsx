'use client';

import { useState } from 'react';
import { Input, Button, Alert, Card } from '@/components/ui';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // TODO: Implementar envio de email real
            // Por agora, simular processo de recuperação
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Validar email básico
            if (!email.includes('@')) {
                throw new Error('Email inválido');
            }

            setSuccess(true);
        } catch (err) {
            setError((err as Error).message || 'Erro ao enviar email de recuperação');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary)] rounded-2xl mb-4">
                        <span className="text-white font-bold text-2xl">P</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Recuperar Password</h1>
                    <p className="text-gray-600">
                        Insira seu email para receber instruções de recuperação
                    </p>
                </div>

                {/* Form Card */}
                <Card>
                    {success ? (
                        // Success State
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Enviado!</h3>
                            <p className="text-gray-600 mb-6">
                                Verifique seu email <strong>{email}</strong> para instruções de recuperação de password.
                            </p>
                            <Link href="/login" className="btn-primary inline-block">
                                Voltar ao Login
                            </Link>
                        </div>
                    ) : (
                        // Form State
                        <>
                            {error && (
                                <Alert variant="error" className="mb-4">
                                    {error}
                                </Alert>
                            )}

                            <Alert variant="info" className="mb-6">
                                <p className="text-sm">
                                    <strong>Nota:</strong> Em produção, um email será enviado com instruções para redefinir sua password.
                                </p>
                            </Alert>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    type="email"
                                    label="Email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    leftIcon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    }
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    size="lg"
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Enviando...' : 'Enviar Email de Recuperação'}
                                </Button>

                                <div className="text-center">
                                    <Link href="/login" className="text-sm text-[var(--primary)] hover:underline">
                                        ← Voltar ao Login
                                    </Link>
                                </div>
                            </form>
                        </>
                    )}
                </Card>

                {/* Help Text */}
                {!success && (
                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>Não recebeu o email? Verifique sua pasta de spam.</p>
                        <p className="mt-2">
                            Precisa de ajuda? Entre em contato:{' '}
                            <a href="mailto:ildocuema@gmail.com" className="text-[var(--primary)] hover:underline">
                                ildocuema@gmail.com
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
