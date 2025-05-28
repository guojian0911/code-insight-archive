
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Calendar, MessageSquare } from 'lucide-react';

interface MySQLProject {
  id: number;
  workspace_id: string;
  platform: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
  conversations?: MySQLConversation[];
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

interface ProjectCardProps {
  project: MySQLProject;
  onSelect: (projectName: string) => void;
  conversationCount?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, conversationCount = 0 }) => {
  const formatDate = (dateString: string) => {
    // 直接解析数据库时间字符串，不进行时区转换
    const date = dateString.replace(' ', 'T'); // 转换为ISO格式
    const parsedDate = new Date(date);
    
    // 手动格式化，避免时区转换
    const year = parsedDate.getUTCFullYear();
    const month = (parsedDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = parsedDate.getUTCDate().toString().padStart(2, '0');
    
    return `${year}年${month}月${day}日`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getToolBadgeColor = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    switch (normalizedPlatform) {
      case 'cursor':
      case 'cursor-ai':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'augmentcode':
      case 'augment-code':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cline':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'roocode':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getBorderColor = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    switch (normalizedPlatform) {
      case 'cursor':
      case 'cursor-ai':
        return 'border-l-blue-500';
      case 'augmentcode':
      case 'augment-code':
        return 'border-l-green-500';
      case 'cline':
        return 'border-l-purple-500';
      case 'roocode':
        return 'border-l-orange-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group border-l-4 ${getBorderColor(project.platform)} shadow-sm bg-white`}
      onClick={() => onSelect(project.name)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors flex items-center mb-2">
              <FolderOpen className="h-5 w-5 mr-2 text-blue-500" />
              {project.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mb-3">
              {project.path.split('/').pop() || project.path}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        {/* 对话数量和时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <MessageSquare className="h-4 w-4 mr-1" />
            {conversationCount} 个对话
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(project.updated_at)}
          </div>
        </div>

        {/* 工作区信息 */}
        <div className="text-xs text-gray-500">
          工作区: {truncateText(project.workspace_id, 30)}
        </div>

        {/* 路径信息 */}
        <div className="text-xs text-gray-500">
          路径: {truncateText(project.path, 50)}
        </div>

        {/* Tool Badge */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className={`text-xs font-medium px-3 py-1 rounded-full ${getToolBadgeColor(project.platform)}`}
          >
            {project.platform} (1)
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
