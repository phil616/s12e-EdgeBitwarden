import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { VaultItem } from '@/lib/types';
import { Copy, Eye, Key, StickyNote, Fingerprint, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface VaultItemCardProps {
  item: VaultItem;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => void;
}

export function VaultItemCard({ item, onEdit, onDelete }: VaultItemCardProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [viewAsMarkdown, setViewAsMarkdown] = React.useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} 已复制到剪贴板`);
  };

  const Icon = item.type === 'login' ? Key : item.type === 'note' ? StickyNote : Fingerprint;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
        </div>
        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {item.type === 'login' && (
          <div className="space-y-2 text-sm">
            {item.username && (
                <div className="flex justify-between items-center group">
                    <span className="text-slate-500 truncate max-w-[150px]">{item.username}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(item.username!, '用户名')}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            )}
            {item.password && (
                <div className="flex justify-between items-center group">
                    <span className="font-mono text-slate-500 truncate max-w-[150px]">
                        {showPassword ? item.password : '••••••••'}
                    </span>
                    <div className="flex opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPassword(!showPassword)}>
                            <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(item.password!, '密码')}>
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}
            {expanded && item.customFields && item.customFields.length > 0 && (
                <div className="pt-2 border-t mt-2 space-y-1">
                    <p className="text-xs font-semibold text-slate-400">自定义字段</p>
                    {item.customFields.map((field) => (
                        <div key={field.id} className="flex justify-between items-center group">
                            <span className="text-slate-500">{field.name}:</span>
                            <div className="flex items-center space-x-1">
                                <span className="font-mono text-slate-700 truncate max-w-[100px]">
                                    {field.type === 'hidden' ? '••••••' : field.value}
                                </span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(field.value, field.name)}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}
        {item.type === 'note' && (
            <div className={expanded ? '' : 'line-clamp-3'}>
                {expanded && (
                    <div className="flex justify-end mb-2">
                         <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={(e) => { e.stopPropagation(); setViewAsMarkdown(!viewAsMarkdown); }}
                        >
                            {viewAsMarkdown ? '查看纯文本' : '查看 Markdown'}
                        </Button>
                    </div>
                )}
                {viewAsMarkdown && expanded ? (
                    <div className="prose prose-sm prose-slate max-w-none dark:prose-invert p-4 border rounded-md bg-white dark:bg-slate-900 overflow-auto">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code(props) {
                              const {children, className, node, ref, ...rest} = props
                              const match = /language-(\w+)/.exec(className || '')
                              return match ? (
                                <SyntaxHighlighter
                                  {...rest}
                                  PreTag="div"
                                  children={String(children).replace(/\n$/, '')}
                                  language={match[1]}
                                  style={vscDarkPlus}
                                />
                              ) : (
                                <code {...rest} className={className}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {item.content || ''}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 whitespace-pre-wrap font-mono">{item.content}</p>
                )}
            </div>
        )}
        {item.type === 'passkey' && (
            <p className="text-sm text-slate-500">已存储通行密钥。</p>
        )}
        {!expanded && (item.type === 'note' || (item.type === 'login' && item.customFields?.length)) && (
            <div className="text-xs text-center text-slate-400 mt-2 cursor-pointer hover:text-slate-600" onClick={() => setExpanded(true)}>
                展开更多...
            </div>
        )}
        {expanded && (
             <div className="text-xs text-center text-slate-400 mt-2 cursor-pointer hover:text-slate-600" onClick={() => setExpanded(false)}>
                收起
            </div>
        )}
      </CardContent>
    </Card>
  );
}
