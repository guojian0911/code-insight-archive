
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
    <div className="mb-6 space-y-4">
      {/* Navigation Buttons - Consistent styling with proper contrast */}
      <div className="flex items-center gap-3">
        {currentView === 'conversations' && (
          <Button
            variant="outline"
            onClick={onBackToProjects}
            className="nav-link flex items-center gap-2 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            返回项目列表
          </Button>
        )}
        
        {currentView === 'messages' && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onBackToConversations}
              className="nav-link flex items-center gap-2 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              返回对话列表
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToProjects}
              className="text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 px-3 py-1.5"
            >
              返回项目列表
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Breadcrumb with proper contrast and accessibility */}
      <div className="flex items-center space-x-2 text-sm bg-card border border-border px-4 py-3 rounded-lg shadow-sm">
        <button 
          onClick={onBackToProjects}
          className="text-primary hover:text-primary/80 hover:underline transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
          aria-label="返回项目列表"
        >
          项目
        </button>
        
        {selectedProject && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            {currentView === 'conversations' ? (
              <span className="text-foreground font-medium truncate" title={selectedProject.name}>
                {selectedProject.name}
              </span>
            ) : (
              <button 
                onClick={onBackToConversations}
                className="text-primary hover:text-primary/80 hover:underline transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm truncate"
                title={selectedProject.name}
                aria-label={`返回到项目 ${selectedProject.name} 的对话列表`}
              >
                {selectedProject.name}
              </button>
            )}
          </>
        )}
        
        {selectedConversation && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <span className="text-foreground font-medium truncate" title={selectedConversation.name || '未命名对话'}>
              {selectedConversation.name || '未命名对话'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default NavigationHeader;
