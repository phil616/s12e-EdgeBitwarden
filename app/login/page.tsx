'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Fingerprint, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { AuroraBackground, FadeIn } from '@/components/ui/motion';

export default function LoginPage() {
  const { needsSetup, setup, login, loginPasskey, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(password);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }
    await setup(password);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
      </div>
    );
  }

  return (
    <AuroraBackground>
        <div className="flex min-h-screen items-center justify-center p-4">
            <FadeIn delay={0.2} className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-white/10 p-3 rounded-2xl w-fit backdrop-blur-sm mb-4 border border-white/20 shadow-xl">
                        <ShieldCheck className="h-10 w-10 text-cyan-400" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2 drop-shadow-sm">EdgeBitwarden</h1>
                    <p className="text-slate-300">安全、加密、隐私。</p>
                </div>

                <Card className="w-full border-slate-200/20 bg-white/90 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1 pb-2">
                        <CardTitle className="text-xl font-bold text-center text-slate-800">
                            {needsSetup ? '创建您的密码库' : '欢迎回来'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {needsSetup ? (
                            <form onSubmit={handleSetup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="setup-password">主密码</Label>
                                    <Input
                                        id="setup-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="bg-white/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">确认密码</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="bg-white/50"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    创建密码库
                                </Button>
                            </form>
                        ) : (
                            <Tabs defaultValue="password" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-slate-100/80">
                                    <TabsTrigger value="password">密码</TabsTrigger>
                                    <TabsTrigger value="passkey">通行密钥</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="password">
                                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">主密码</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="bg-white/50"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                            解锁
                                        </Button>
                                    </form>
                                </TabsContent>
                                
                                <TabsContent value="passkey">
                                    <div className="mt-4 flex flex-col items-center space-y-4 py-4">
                                        <div className="rounded-full bg-cyan-50 p-4 border border-cyan-100">
                                            <Fingerprint className="h-10 w-10 text-cyan-600" />
                                        </div>
                                        <p className="text-center text-sm text-slate-500">
                                            使用指纹、面容或安全密钥立即登录。
                                        </p>
                                        <Button onClick={() => loginPasskey()} className="w-full" variant="outline" disabled={isLoading}>
                                            使用通行密钥验证
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </FadeIn>
        </div>
    </AuroraBackground>
  );
}
