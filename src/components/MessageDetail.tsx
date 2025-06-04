
import React from 'react';
import { Calendar, User, Bot, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/data/mockData';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import MermaidChart from './MermaidChart';
import remarkGfm from 'remark-gfm';

interface MessageDetailProps {
  conversation: Conversation;
}

const MessageDetail: React.FC<MessageDetailProps> = ({ conversation }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

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

  const copyCodeToClipboard = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(codeId);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  // 生成稳定的代码块ID
  const generateCodeId = (content: string, language: string) => {
    // 简单的字符串hash函数
    let hash = 0;
    const str = content + language;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return `code-${Math.abs(hash).toString(36)}`;
  };

  // 扩展的 Markdown 组件配置 - 支持更多富文本功能
  const MarkdownComponents = {
    // 代码块处理 (支持 Mermaid 图表)
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');

      // 处理 Mermaid 图表
      if (!inline && language === 'mermaid') {
        return <MermaidChart chart={codeContent} />;
      }

      if (!inline && language) {
        const codeId = generateCodeId(codeContent, language);

        return (
          <div className="relative my-4 group border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
            {/* 代码块头部 */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              {/* 语言标签 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300">
                  {language}
                </span>
              </div>

              {/* 复制按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyCodeToClipboard(codeContent, codeId)}
                className="h-7 px-2 text-xs opacity-70 hover:opacity-100 transition-opacity bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500"
                title="复制代码"
              >
                {copiedCodeId === codeId ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-green-400" />
                    <span className="text-green-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    <span>复制</span>
                  </>
                )}
              </Button>
            </div>

            {/* 代码内容 */}
            <div className="relative overflow-hidden">
              <SyntaxHighlighter
                {...props}
                style={oneDark}
                language={language}
                PreTag="div"
                showLineNumbers={false}
                wrapLines={false}
                customStyle={{
                  background: 'transparent',
                  padding: '1rem',
                  margin: 0,
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  border: 'none',
                  borderRadius: 0
                }}
                codeTagProps={{
                  style: {
                    background: 'transparent',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                  }
                }}
              >
                {codeContent}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      }

      return (
        <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono emoji-support" {...props}>
          {children}
        </code>
      );
    },

    // 标题组件 - 添加emoji支持
    h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-6 mb-4 border-b pb-2 emoji-support">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-semibold mt-5 mb-3 emoji-support">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-medium mt-4 mb-2 emoji-support">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-base font-medium mt-3 mb-2 emoji-support">{children}</h4>,
    h5: ({ children }: any) => <h5 className="text-sm font-medium mt-2 mb-1 emoji-support">{children}</h5>,
    h6: ({ children }: any) => <h6 className="text-xs font-medium mt-2 mb-1 text-muted-foreground emoji-support">{children}</h6>,

    // 段落和文本 - 添加emoji支持
    p: ({ children }: any) => <p className="mb-3 leading-relaxed emoji-support">{children}</p>,
    strong: ({ children }: any) => <strong className="font-semibold emoji-support">{children}</strong>,
    em: ({ children }: any) => <em className="italic emoji-support">{children}</em>,
    del: ({ children }: any) => <del className="line-through text-muted-foreground emoji-support">{children}</del>,

    // 列表组件 (支持任务列表) - 添加emoji支持
    ul: ({ children, className }: any) => (
      <ul className={`list-disc list-inside mb-3 space-y-1 emoji-support ${className?.includes('contains-task-list') ? 'list-none' : ''}`}>
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-outside mb-3 space-y-2 pl-6 emoji-support">
        {children}
      </ol>
    ),
    li: ({ children, className }: any) => {
      const isTaskItem = className?.includes('task-list-item');
      return (
        <li className={`emoji-support ${isTaskItem ? 'list-none flex items-start space-x-2' : 'mb-2'}`}>
          {children}
        </li>
      );
    },

    // 任务列表复选框
    input: ({ checked, type, ...props }: any) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            disabled
            className="mt-1 accent-blue-500 cursor-default"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },

    // 表格组件 (需要 remark-gfm 插件) - 添加emoji支持
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-6">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 emoji-support">
              {children}
            </table>
          </div>
        </div>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gray-50 emoji-support">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="bg-white divide-y divide-gray-200 emoji-support">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-gray-50 transition-colors emoji-support">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 emoji-support">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 emoji-support">
        {children}
      </td>
    ),

    // 引用块 - 添加emoji支持
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-200 pl-4 italic my-4 text-muted-foreground bg-blue-50 py-2 rounded-r emoji-support">
        {children}
      </blockquote>
    ),

    // 链接 - 添加emoji支持
    a: ({ href, children }: any) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors emoji-support"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),

    // 图片
    img: ({ src, alt, ...props }: any) => (
      <div className="my-4">
        <img
          src={src}
          alt={alt}
          className="max-w-full h-auto rounded-lg shadow-md"
          loading="lazy"
          {...props}
        />
        {alt && (
          <p className="text-sm text-gray-500 text-center mt-2 italic emoji-support">
            {alt}
          </p>
        )}
      </div>
    ),

    // 水平分割线
    hr: () => <hr className="my-6 border-t-2 border-gray-200" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2 emoji-support">{conversation.title}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge 
                variant="outline" 
                className={`border-${config.color}-300 text-${config.color}-600 emoji-support`}
              >
                {config.label}
              </Badge>
              <span className="flex items-center emoji-support">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(conversation.createdAt)}
              </span>
              <span className="emoji-support">{conversation.messages.length} 条消息</span>
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
                      <span className="font-medium emoji-support">用户</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Bot className="h-5 w-5" />
                      <span className="font-medium emoji-support">AI助手</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground emoji-support">
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
              <div className={`prose prose-sm max-w-none emoji-support ${
                message.role === 'user' ? 'prose-blue' : 'prose-slate'
              }`}>
                <ReactMarkdown
                  components={MarkdownComponents}
                  remarkPlugins={[remarkGfm]}
                >
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
