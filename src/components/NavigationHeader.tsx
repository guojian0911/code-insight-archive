
import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MySQLProject {
  id: number;
  workspace_id: string;
  platform: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
}

interface MySQLConversation {
  id: string;
  workspace_id: string;
  project_name: string;
  name: string;
  created_at: string;
  last_interacted_at: string;
  message_count: number;
}

interface NavigationHeaderProps {
  currentView: 'projects' | 'conversations' | 'messages';
  selectedProject: MySQLProject | null;
  selectedConversation: MySQLConversation | null;
  onBackToProjects: () => void;
  onBackToConversations: () => void;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentView,
  selectedProject,
  selectedConversation,
  onBackToProjects,
  onBackToConversations
}) => {
  if (currentView === 'projects') {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-4">
        {currentView === 'conversations' && (
          <Button
            variant="outline"
            onClick={onBackToProjects}
            className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回项目列表
          </Button>
        )}
        
        {currentView === 'messages' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onBackToConversations}
              className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              返回对话列表
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToProjects}
              className="text-muted-foreground hover:text-primary"
            >
              返回项目列表
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm bg-muted/30 px-4 py-2 rounded-lg border">
        <button 
          onClick={onBackToProjects}
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium"
        >
          项目
        </button>
        
        {selectedProject && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {currentView === 'conversations' ? (
              <span className="text-foreground font-medium">{selectedProject.name}</span>
            ) : (
              <button 
                onClick={onBackToConversations}
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium"
              >
                {selectedProject.name}
              </button>
            )}
          </>
        )}
        
        {selectedConversation && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">
              {selectedConversation.name || '未命名对话'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default NavigationHeader;
