
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
    // 直接解析数据库时间字符串，不进行时区转换
    const date = dateString.replace(' ', 'T'); // 转换为ISO格式
    const parsedDate = new Date(date);
    
    // 手动格式化，避免时区转换
    const year = parsedDate.getUTCFullYear();
    const month = (parsedDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = parsedDate.getUTCDate().toString().padStart(2, '0');
    const hours = parsedDate.getUTCHours().toString().padStart(2, '0');
    const minutes = parsedDate.getUTCMinutes().toString().padStart(2, '0');
    const seconds = parsedDate.getUTCSeconds().toString().padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
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
