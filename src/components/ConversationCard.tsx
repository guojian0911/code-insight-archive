
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
    // Direct parsing of database time string without timezone conversion
    const date = dateString.replace(' ', 'T'); // Convert to ISO format
    const parsedDate = new Date(date);
    
    // Manual formatting to avoid timezone conversion
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
      className="ui-card cursor-pointer border-l-4 border-l-blue-400 group transform hover:scale-[1.02] transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      onClick={() => onSelect(conversation.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(conversation.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`选择对话 ${conversation.name || '未命名对话'}`}
    >
      <CardContent className="card-spacing">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Conversation title with proper contrast */}
            <h3 className="font-medium text-foreground text-base mb-2 truncate group-hover:text-primary transition-colors duration-200">
              {conversation.name || '未命名对话'}
            </h3>
            
            {/* Message count with enhanced styling */}
            <p className="text-sm text-muted-foreground mb-2">
              <span className="font-medium text-foreground">消息数量:</span> {conversation.message_count}
            </p>
            
            {/* Creation date with consistent styling */}
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">创建时间:</span> {formatDate(conversation.created_at)}
            </p>
          </div>
          
          {/* Message count badge with improved styling */}
          <Badge 
            variant="outline" 
            className="ui-badge bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors duration-200 flex-shrink-0"
          >
            {conversation.message_count} 条消息
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationCard;
