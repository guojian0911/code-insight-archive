
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MySQLConversation {
  id: string;
  workspace_id: string;
  project_name: string;
  name: string;
  created_at: string;
  last_interacted_at: string;
  message_count: number;
}

interface ConversationCardProps {
  conversation: MySQLConversation;
  onSelect: (conversationId: string) => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({ conversation, onSelect }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <Card 
      key={conversation.id} 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-400"
      onClick={() => onSelect(conversation.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{conversation.name || '未命名对话'}</h3>
            <p className="text-sm text-muted-foreground">
              消息数量: {conversation.message_count}
            </p>
            <p className="text-xs text-muted-foreground">
              创建时间: {formatDate(conversation.created_at)}
            </p>
          </div>
          <Badge variant="outline">{conversation.message_count} 条消息</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationCard;
