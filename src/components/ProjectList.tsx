
import React from 'react';
import { Calendar, MessageSquare, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectWithConversations } from '@/types/database';

interface ProjectListProps {
  projects: ProjectWithConversations[];
  onProjectSelect: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onProjectSelect }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getToolStats = (project: ProjectWithConversations) => {
    const toolCounts: Record<string, number> = {};
    project.conversations.forEach(conv => {
      // 使用 workspace_id 的前缀来识别工具类型，或者直接使用 platform 字段
      const tool = project.platform || 'unknown';
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    });
    return toolCounts;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">项目列表</h2>
        <Badge variant="secondary" className="px-3 py-1">
          {projects.length} 个项目
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const toolStats = getToolStats(project);
          
          return (
            <Card 
              key={project.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group border-l-4 border-l-blue-500"
              onClick={() => onProjectSelect(project.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors flex items-center">
                      <FolderOpen className="h-5 w-5 mr-2 text-blue-500" />
                      {project.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.platform} • {project.workspace_id}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm line-clamp-2">
                  路径: {project.path}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {project.conversations.length} 个对话
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(project.updated_at)}
                  </div>
                </div>

                {/* Tool Statistics */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(toolStats).map(([tool, count]) => (
                    <Badge 
                      key={tool} 
                      variant="outline" 
                      className={`text-xs ${
                        tool === 'cursor' ? 'border-blue-300 text-blue-600' :
                        tool === 'augmentcode' ? 'border-green-300 text-green-600' :
                        tool === 'cline' ? 'border-purple-300 text-purple-600' :
                        'border-orange-300 text-orange-600'
                      }`}
                    >
                      {tool} ({count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">暂无项目</h3>
          <p className="text-sm text-muted-foreground">开始导入您的 AI 编程工具对话记录</p>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
