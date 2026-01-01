'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VaultItemCard } from '@/components/VaultItemCard';
import { VaultItemDialog } from '@/components/VaultItemDialog';
import { VaultItem } from '@/lib/types';
import { Plus, Search, ShieldCheck, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/ui/motion';

export default function Dashboard() {
  const { isAuthenticated, isLoading, vaultData, logout, addItem, updateItem, deleteItem, registerPasskey, masterKey, checkStatus } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
    );
  }

  const filteredItems = vaultData?.items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.username?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddNew = () => {
    setEditingItem(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: VaultItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此项目吗？')) {
      await deleteItem(id);
      toast.success('项目已删除');
    }
  };

  const handleSaveItem = async (item: VaultItem) => {
    if (editingItem) {
      await updateItem(item);
      toast.success('项目已更新');
    } else {
      await addItem(item);
      toast.success('项目已添加');
    }
  };

  const handleRefresh = async () => {
      setIsRefreshing(true);
      // Simulate refresh or re-fetch if we had a pull mechanism
      // For now just wait a bit
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-10 transition-all duration-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-cyan-50 p-1.5 rounded-lg border border-cyan-100">
                <ShieldCheck className="h-6 w-6 text-cyan-600" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">EdgeBitwarden</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={registerPasskey} className="hidden sm:flex">
                注册通行密钥
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-600 hover:text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <FadeIn>
            {!masterKey && (
                 <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start shadow-sm">
                    <ShieldCheck className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">密码库已锁定</p>
                        <p className="text-sm opacity-90">您已通过通行密钥登录，但密码库处于锁定状态。在输入主密码之前，您无法添加或查看密码。</p>
                    </div>
                 </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                    <Input 
                        placeholder="搜索密码库..." 
                        className="pl-10 bg-white border-slate-200 focus-visible:ring-cyan-500 transition-shadow shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleAddNew} disabled={!masterKey} className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        新建项目
                    </Button>
                </div>
            </div>
        </FadeIn>

        {filteredItems.length === 0 ? (
            <FadeIn delay={0.2} className="text-center py-20">
                <div className="inline-flex items-center justify-center p-6 bg-slate-100 rounded-full mb-4">
                    <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">未找到项目</h3>
                <p className="text-slate-500 mt-1">{searchTerm ? '请尝试调整搜索关键词。' : '开始创建您的第一个项目吧。'}</p>
            </FadeIn>
        ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                    <StaggerItem key={item.id}>
                        <VaultItemCard 
                            item={item} 
                            onEdit={handleEdit} 
                            onDelete={handleDelete} 
                        />
                    </StaggerItem>
                ))}
            </StaggerContainer>
        )}
      </main>

      <VaultItemDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSubmit={handleSaveItem}
        initialData={editingItem}
      />
    </div>
  );
}
