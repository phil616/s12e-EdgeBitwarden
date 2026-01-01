import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { VaultItem } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Plus, Trash2 } from 'lucide-react';

interface VaultItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: VaultItem) => Promise<void>;
  initialData?: VaultItem;
}

export function VaultItemDialog({ open, onOpenChange, onSubmit, initialData }: VaultItemDialogProps) {
  const [activeTab, setActiveTab] = React.useState<string>(initialData?.type || 'login');
  
  const { register, control, handleSubmit, reset, setValue, watch } = useForm<VaultItem>({
    defaultValues: initialData || { type: 'login', customFields: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "customFields"
  });

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        reset(initialData);
        setActiveTab(initialData.type);
      } else {
        reset({ type: 'login' as any, id: crypto.randomUUID(), createdAt: Date.now(), customFields: [] });
        setActiveTab('login');
      }
    }
  }, [open, initialData, reset]);

  const onFormSubmit = async (data: VaultItem) => {
    // Ensure type is correct based on tab
    const finalData = { ...data, type: activeTab as any };
    await onSubmit(finalData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? '编辑项目' : '新建项目'}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={() => setActiveTab('login')}>登录账号</TabsTrigger>
                <TabsTrigger value="note" onClick={() => setActiveTab('note')}>安全便签</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                    <Label htmlFor="name">名称</Label>
                    <Input id="name" {...register('name', { required: true })} placeholder="例如：Google" />
                </div>

                {activeTab === 'login' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="username">用户名</Label>
                            <Input id="username" {...register('username')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">密码</Label>
                            <Input id="password" type="text" {...register('password')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="uri">网址 (URI)</Label>
                            <Input id="uri" {...register('uri')} placeholder="https://example.com" />
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                            <div className="flex justify-between items-center">
                                <Label>自定义字段 ({fields.length}/20)</Label>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => append({ id: crypto.randomUUID(), name: '', value: '', type: 'text' })}
                                    disabled={fields.length >= 20}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> 添加字段
                                </Button>
                            </div>
                            
                            <div className="space-y-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-start space-x-2 p-2 border rounded-md bg-slate-50">
                                        <div className="flex-1 space-y-1">
                                            <Input 
                                                placeholder="字段名" 
                                                className="h-8 text-sm"
                                                {...register(`customFields.${index}.name` as const, { required: true })} 
                                            />
                                            <Input 
                                                placeholder="值" 
                                                className="h-8 text-sm"
                                                type={watch(`customFields.${index}.type` as const) === 'hidden' ? 'password' : 'text'}
                                                {...register(`customFields.${index}.value` as const)} 
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <select 
                                                className="h-8 rounded-md border border-slate-200 text-xs px-2"
                                                {...register(`customFields.${index}.type` as const)}
                                            >
                                                <option value="text">文本</option>
                                                <option value="hidden">隐藏</option>
                                                <option value="boolean">布尔值</option>
                                            </select>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-red-500"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'note' && (
                    <div className="space-y-2">
                        <Label htmlFor="content">内容</Label>
                        <textarea 
                            className="flex min-h-[200px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                            {...register('content')} 
                        />
                    </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button type="submit">保存</Button>
                </div>
            </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
