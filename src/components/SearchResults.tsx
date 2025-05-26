
import React, { useMemo } from 'react';
import { Search, FileText, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/data/mockData';

interface SearchResultsProps {
  query: string;
  projects: Project[];
  onProjectSelect: (projectId: string) => void;
  onConversationSelect: (conversationId: string) => void;
}

interface SearchResult {
  type: 'project' | 'conversation' | 'message';
  projectId: string;
  conversationId?: string;
  messageId?: string;
  title: string;
  content: string;
  context: string;
  tool?: string;
  timestamp?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  query, 
  projects, 
  onProjectSelect, 
  onConversationSelect 
}) => {
  const searchResults = useMemo(() => {
    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    projects.forEach(project => {
      // 搜索项目名称和描述
      if (project.name.toLowerCase().includes(searchTerm) || 
          project.description.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'project',
          projectId: project.id,
          title: project.name,
          content: project.description,
          context: `${project.conversations.length} 个对话`,
          timestamp: project.lastUpdated
        });
      }

      // 搜索对话
      project.conversations.forEach(conversation => {
        if (conversation.title.toLowerCase().includes(searchTerm)) {
          results.push({
            type: 'conversation',
            projectId: project.id,
            conversationId: conversation.id,
            title: conversation.title,
            content: `来自项目: ${project.name}`,
            context: `${conversation.messages.length} 条消息`,
            tool: conversation.tool,
            timestamp: conversation.createdAt
          });
        }

        // 搜索消息内容
        conversation.messages.forEach(message => {
          if (message.content.toLowerCase().includes(searchTerm)) {
            const contentPreview = message.content.length > 150 
              ? message.content.substring(0, 150) + '...' 
              : message.content;
            
            results.push({
              type: 'message',
              projectId: project.id,
              conversationId: conversation.id,
              messageId: message.id,
              title: conversation.title,
              content: contentPreview,
              context: `${project.name} > ${conversation.title}`,
              tool: conversation.tool,
              timestamp: message.timestamp
            });
          }
        });
      });
    });

    return results;
  }, [query, projects]);

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toolConfig = {
    cursor: { color: 'blue', label: 'Cursor' },
    augmentcode: { color: 'green', label: 'AugmentCode' },
    cline: { color: 'purple', label: 'Cline' },
    roocode: { color: 'orange', label: 'RooCode' }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'project') {
      onProjectSelect(result.projectId);
    } else if (result.conversationId) {
      onProjectSelect(result.projectId);
      // 延迟一下确保项目已选择
      setTimeout(() => {
        onConversationSelect(result.conversationId!);
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Search className="h-6 w-6 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-semibold">搜索结果</h2>
          <p className="text-muted-foreground">
            找到 {searchResults.length} 个结果，关键词: "{query}"
          </p>
        </div>
      </div>

      {/* Results */}
      {searchResults.length > 0 ? (
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <Card 
              key={`${result.type}-${result.projectId}-${result.conversationId}-${result.messageId}-${index}`}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-102"
              onClick={() => handleResultClick(result)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 hover:text-blue-600 transition-colors">
                      {result.type === 'project' && <FileText className="h-5 w-5 text-blue-500" />}
                      {result.type === 'conversation' && <MessageSquare className="h-5 w-5 text-green-500" />}
                      {result.type === 'message' && <MessageSquare className="h-5 w-5 text-purple-500" />}
                      {highlightText(result.title, query)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.context}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {result.tool && (
                      <Badge 
                        variant="outline" 
                        className={`border-${toolConfig[result.tool as keyof typeof toolConfig].color}-300 text-${toolConfig[result.tool as keyof typeof toolConfig].color}-600`}
                      >
                        {toolConfig[result.tool as keyof typeof toolConfig].label}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="capitalize">
                      {result.type === 'project' ? '项目' : 
                       result.type === 'conversation' ? '对话' : '消息'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground mb-3 line-clamp-3">
                  {highlightText(result.content, query)}
                </p>
                
                {result.timestamp && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(result.timestamp)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">未找到相关结果</h3>
          <p className="text-muted-foreground">
            尝试使用不同的关键词或检查拼写
          </p>
        </Card>
      )}
    </div>
  );
};

export default SearchResults;
