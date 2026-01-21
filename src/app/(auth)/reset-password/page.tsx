'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Button, Alert, Card } from '@/components/ui';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validações
        if (password.length < 8) {
            setError('A password deve ter no mínimo 8 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('As passwords não coincidem');
            return;
        }

        if (!token) {
            setError('Token de recuperação inválido');
            return;
        }

        setIsLoading(true);

        try {
            // TODO: Implementar reset de password real
            // Por agora, simular processo
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSuccess(true);

            // Redirect para login após 2 segundos
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError((err as Error).message || 'Erro ao redefinir password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
                <Card className="max-w-md">
                    <Alert variant="error">
                        <p className="font-medium">Link Inválido</p>
                        <p className="text-sm mt-1">
                            Este link de recuperação é inválido ou expirou.
                        </p>
                    </Alert>
                    <div className="mt-4 text-center">
                        <Link href="/forgot-password" className="btn-primary inline-block">
                            Solicitar Novo Link
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary)] rounded-2xl mb-4">
                        <span className="text-white font-bold text-2xl">P</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Redefinir Password</h1>
                    <p className="text-gray-600">
                        Crie uma nova password para sua conta
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
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Redefinida!</h3>
                            <p className="text-gray-600 mb-4">
                                Sua password foi alterada com sucesso.
                            </p>
                            <p className="text-sm text-gray-500">
                                Redirecionando para o login...
                            </p>
                        </div>
                    ) : (
                        // Form State
                        <>
                            {error && (
                                <Alert variant="error" className="mb-4">
                                    {error}
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    type="password"
                                    label="Nova Password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    helperText="Mínimo 8 caracteres"
                                    leftIcon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    }
                                />

                                <Input
                                    type="password"
                                    label="Confirmar Password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    leftIcon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    }
                                />

                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className={`flex-1 h-2 rounded-full ${password.length >= 12 ? 'bg-green-500' :
                                                    password.length >= 8 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                }`} />
                                            <span className="text-xs text-gray-600">
                                                {password.length >= 12 ? 'Forte' :
                                                    password.length >= 8 ? 'Média' :
                                                        'Fraca'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    size="lg"
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Redefinindo...' : 'Redefinir Password'}
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

                {/* Security Note */}
                {!success && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-blue-900">Dica de Segurança</p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Use uma password forte com letras, números e símbolos. Não reutilize passwords de outros serviços.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
