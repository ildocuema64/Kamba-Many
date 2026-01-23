'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Input, Button, Alert } from '@/components/ui';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showDemoCreds, setShowDemoCreds] = useState(false);

    useEffect(() => {
        // Check if demo creds should be shown
        const shouldHide = localStorage.getItem('kamba_hide_demo_creds');
        if (!shouldHide) {
            setShowDemoCreds(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            // Hide demo creds on successful login
            localStorage.setItem('kamba_hide_demo_creds', 'true');
            router.push('/dashboard');
        } catch (err) {
            setError((err as Error).message || 'Erro ao fazer login');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="KAMBA Many" className="w-20 h-20 mx-auto mb-4 rounded-2xl" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">KAMBA Many</h1>
                    <p className="text-gray-600">O Amigo do Seu Negócio</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Entrar</h2>

                    {error && (
                        <Alert variant="error" className="mb-4">
                            {error}
                        </Alert>
                    )}

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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            }
                        />

                        <Input
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            leftIcon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded" />
                                <span className="text-gray-600">Lembrar-me</span>
                            </label>
                            <Link href="/forgot-password" className="text-[var(--primary)] hover:underline">
                                Esqueci a senha
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            size="lg"
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>

                    {/* Demo Credentials */}
                    {showDemoCreds && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 relative group">
                            <button
                                onClick={() => {
                                    setShowDemoCreds(false);
                                    localStorage.setItem('kamba_hide_demo_creds', 'true');
                                }}
                                className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Ocultar para sempre"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <p className="text-sm text-blue-800 font-medium mb-2">💡 Credenciais de Teste:</p>
                            <p className="text-xs text-blue-700 font-mono">Email: ildocuema@gmail.com</p>
                            <p className="text-xs text-blue-700 font-mono">Password: Ildo7..Marques</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-600">
                    <p>Desenvolvido para Angola 🇦🇴</p>
                    <p className="mt-2">
                        Conforme Decreto 74/19 e 71/25
                    </p>
                </div>
            </div>
        </div>
    );
}
