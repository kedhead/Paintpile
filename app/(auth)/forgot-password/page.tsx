'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Image from 'next/image';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { resetPassword } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    async function onSubmit(data: ForgotPasswordFormData) {
        try {
            setError('');
            setIsLoading(true);
            await resetPassword(data.email);
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                // For security reasons, still show success or a generic message
                // But for UX, sometimes knowing it failed is helpful. 
                // Best practice is usually "If an account exists..."
                // But Firebase throws user-not-found.
                setError('No account found with this email.');
            } else {
                setError('Failed to send reset email. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="relative w-full max-w-4xl h-64 mb-8">
                <Image
                    src="/paintpile-logo.png"
                    alt="PaintPile Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            <div className="w-full max-w-md space-y-8">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl text-primary">Reset Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground">Check your email</h3>
                                <p className="text-muted-foreground">
                                    We have sent password reset instructions to your email address.
                                </p>
                                <Link href="/login">
                                    <Button variant="outline" className="w-full mt-4">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <p className="text-center text-sm text-muted-foreground mb-6">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>

                                {error && (
                                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <Input
                                        label="Email"
                                        type="email"
                                        placeholder="you@example.com"
                                        error={errors.email?.message}
                                        {...register('email')}
                                        className="bg-background/50"
                                    />

                                    <Button type="submit" variant="default" className="w-full font-semibold" isLoading={isLoading}>
                                        Send Reset Link
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Login
                                    </Link>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
