'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseApp } from '@/firebase/provider';
import { motion } from 'framer-motion';

const FloatingVeggie = ({ emoji, delay, duration, x, y }: { emoji: string; delay: number; duration: number; x: number; y: number }) => (
    <motion.div
        initial={{ opacity: 0, x: 0, y: 0 }}
        animate={{
            opacity: [0.3, 0.6, 0.3],
            x: [0, x, 0],
            y: [0, y, 0],
            rotate: [0, 360, 0]
        }}
        transition={{
            duration: duration,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
        }}
        className="absolute text-6xl pointer-events-none select-none z-0"
        style={{ left: `${Math.random() * 80 + 10}%`, top: `${Math.random() * 80 + 10}%` }}
    >
        {emoji}
    </motion.div>
);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const app = useFirebaseApp();
    const auth = getAuth(app);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Login Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    const veggies = ['🥕', '🍅', '🥒', '🍆', '🥬', '🥦', '🌽', '🫑', '🧅', '🥔', '🌶️', '🥑'];

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-950 p-4">

            {/* Animated Background Elements */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                {veggies.map((veg, i) => (
                    <FloatingVeggie
                        key={i}
                        emoji={veg}
                        delay={i * 0.5}
                        duration={15 + Math.random() * 10}
                        x={Math.random() * 100 - 50}
                        y={Math.random() * 100 - 50}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md"
            >
                <Card className="w-full backdrop-blur-xl bg-white/10 border-white/20 text-white shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                                Fresh Login
                            </CardTitle>
                        </motion.div>
                        <CardDescription className="text-gray-300">
                            Welcome back to your vegetable paradise
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">

                        <form onSubmit={handleEmailSignIn}>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-gray-200">Email</Label>
                                    <Input
                                        id="email"
                                        placeholder="name@example.com"
                                        type="email"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
                                        disabled={loading}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-green-500/50 focus:ring-green-500/20"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-gray-200">Password</Label>
                                    <Input
                                        id="password"
                                        placeholder="Password"
                                        type="password"
                                        autoComplete="current-password"
                                        disabled={loading}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-green-500/50 focus:ring-green-500/20"
                                    />
                                </div>
                                <Button
                                    disabled={loading}
                                    type="submit"
                                    className="mt-2 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-900/20 transition-all duration-300"
                                >
                                    {loading ? "Signing In..." : "Sign In"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <p className="w-full text-center text-sm text-gray-400">
                            By clicking continue, you agree to our{" "}
                            <a href="/terms" className="underline underline-offset-4 hover:text-green-400 transition-colors">
                                Terms
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" className="underline underline-offset-4 hover:text-green-400 transition-colors">
                                Privacy Policy
                            </a>
                            .
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
