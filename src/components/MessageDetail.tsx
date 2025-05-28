
import React from 'react';
import { Calendar, User, Bot, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Conversation } from '@/data/mockData';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

interface MessageDetailProps {
  conversation: Conversation;
}

const MessageDetail: React.FC<MessageDetailProps> = ({ conversation }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toolConfig = {
    cursor: { color: 'blue', label: 'Cursor' },
    augmentcode: { color: 'green', label: 'AugmentCode' },
    cline: { color: 'purple', label: 'Cline' },
    roocode: { color: 'orange', label: 'RooCode' },
    // Add fallback mappings for common platform names
    'cursor-ai': { color: 'blue', label: 'Cursor' },
    'augment-code': { color: 'green', label: 'AugmentCode' },
    default: { color: 'gray', label: 'AI助手' }
  };

  // Get config with fallback to default
  const config = toolConfig[conversation.tool] || toolConfig.default;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <div className="relative">
            <SyntaxHighlighter
              {...props}
              style={oneDark}
              language={language}
              PreTag="div"
              className="rounded-lg"
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      return (
        <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    // Table components
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto">
        <Table className="border">
          {children}
        </Table>
      </div>
    ),
    thead: ({ children }: any) => <TableHeader>{children}</TableHeader>,
    tbody: ({ children }: any) => <TableBody>{children}</TableBody>,
    tr: ({ children }: any) => <TableRow>{children}</TableRow>,
    th: ({ children }: any) => (
      <TableHead className="border-r border-b font-semibold text-left">
        {children}
      </TableHead>
    ),
    td: ({ children }: any) => (
      <TableCell className="border-r border-b">
        {children}
      </TableCell>
    ),
    // Image component with size adjustment
    img: ({ src, alt, title }: any) => (
      <div className="my-4 flex justify-center">
        <img
          src={src}
          alt={alt || ''}
          title={title}
          className="max-w-full h-auto rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          style={{ maxHeight: '500px' }}
          onClick={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.style.maxWidth === '100%' || !img.style.maxWidth) {
              img.style.maxWidth = 'none';
              img.style.maxHeight = 'none';
              img.style.cursor = 'zoom-out';
            } else {
              img.style.maxWidth = '100%';
              img.style.maxHeight = '500px';
              img.style.cursor = 'zoom-in';
            }
          }}
        />
      </div>
    ),
    h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>,
    p: ({ children }: any) => <p className="mb-3 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-200 pl-4 italic my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
    a: ({ href, children }: any) => (
      <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">{conversation.title}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge 
                variant="outline" 
                className={`border-${config.color}-300 text-${config.color}-600`}
              >
                {config.label}
              </Badge>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(conversation.createdAt)}
              </span>
              <span>{conversation.messages.length} 条消息</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <div className="space-y-4">
        {conversation.messages.map((message, index) => (
          <Card 
            key={message.id} 
            className={`${
              message.role === 'user' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <CardContent className="p-6">
              {/* Message Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {message.role === 'user' ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <User className="h-5 w-5" />
                      <span className="font-medium">用户</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Bot className="h-5 w-5" />
                      <span className="font-medium">AI助手</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(message.timestamp)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedId === message.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Message Content */}
              <div className={`prose prose-sm max-w-none ${
                message.role === 'user' ? 'prose-blue' : 'prose-slate'
              }`}>
                <ReactMarkdown components={MarkdownComponents}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MessageDetail;
