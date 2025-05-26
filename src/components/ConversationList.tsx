
import React, { useState, useMemo } from 'react';
import { Calendar, MessageSquare, Filter, Code, Zap, Bot, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Project } from '@/data/mockData';

interface ConversationListProps {
  project: Project;
  onConversationSelect: (conversationId: string) => void;
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  project, 
  onConversationSelect, 
  selectedTools, 
  onToolsChange 
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const toolConfig = {
    cursor: { icon: Code, color: 'blue', label: 'Cursor' },
    augmentcode: { icon: Zap, color: 'green', label: 'AugmentCode' },
    cline: { icon: Bot, color: 'purple', label: 'Cline' },
    roocode: { icon: Cpu, color: 'orange', label: 'RooCode' }
  };

  const allTools = Object.keys(toolConfig);

  const filteredConversations = useMemo(() => {
    if (selectedTools.length === 0) {
      return project.conversations;
    }
    return project.conversations.filter(conv => selectedTools.includes(conv.tool));
  }, [project.conversations, selectedTools]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToolToggle = (tool: string) => {
    const updatedTools = selectedTools.includes(tool)
      ? selectedTools.filter(t => t !== tool)
      : [...selectedTools, tool];
    onToolsChange(updatedTools);
  };

  const groupedConversations = useMemo(() => {
    const groups: Record<string, typeof project.conversations> = {};
    filteredConversations.forEach(conv => {
      if (!groups[conv.tool]) {
        groups[conv.tool] = [];
      }
      groups[conv.tool].push(conv);
    });
    return groups;
  }, [filteredConversations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{project.name}</h2>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          筛选工具
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-3">
            <h3 className="font-medium">按AI工具筛选</h3>
            <div className="flex flex-wrap gap-4">
              {allTools.map(tool => {
                const config = toolConfig[tool as keyof typeof toolConfig];
                const Icon = config.icon;
                return (
                  <div key={tool} className="flex items-center space-x-2">
                    <Checkbox
                      id={tool}
                      checked={selectedTools.includes(tool)}
                      onCheckedChange={() => handleToolToggle(tool)}
                    />
                    <label 
                      htmlFor={tool} 
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Icon className={`h-4 w-4 text-${config.color}-500`} />
                      <span>{config.label}</span>
                    </label>
                  </div>
                );
              })}
            </div>
            {selectedTools.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onToolsChange([])}
              >
                清除筛选
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Conversations */}
      <div className="space-y-6">
        {Object.entries(groupedConversations).map(([tool, conversations]) => {
          const config = toolConfig[tool as keyof typeof toolConfig];
          const Icon = config.icon;
          
          return (
            <div key={tool} className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 text-${config.color}-500`} />
                <h3 className="text-lg font-medium">{config.label}</h3>
                <Badge variant="secondary">{conversations.length} 个对话</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversations.map((conversation) => (
                  <Card 
                    key={conversation.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-102 group"
                    onClick={() => onConversationSelect(conversation.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base group-hover:text-blue-600 transition-colors flex items-start justify-between">
                        <span className="line-clamp-2">{conversation.title}</span>
                        <Badge 
                          variant="outline" 
                          className={`ml-2 flex-shrink-0 border-${config.color}-300 text-${config.color}-600`}
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {conversation.messages.length} 条消息
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(conversation.createdAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredConversations.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">没有找到符合条件的对话</p>
          {selectedTools.length > 0 && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => onToolsChange([])}
            >
              清除筛选条件
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default ConversationList;
