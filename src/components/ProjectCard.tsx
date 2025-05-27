
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Calendar } from 'lucide-react';

interface MySQLProject {
  id: number;
  workspace_id: string;
  platform: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
}

interface ProjectCardProps {
  project: MySQLProject;
  onSelect: (projectName: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
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
        return 'border-blue-300 text-blue-600 bg-blue-50';
      case 'augmentcode':
      case 'augment-code':
        return 'border-green-300 text-green-600 bg-green-50';
      case 'cline':
        return 'border-purple-300 text-purple-600 bg-purple-50';
      case 'roocode':
        return 'border-orange-300 text-orange-600 bg-orange-50';
      default:
        return 'border-gray-300 text-gray-600 bg-gray-50';
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
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group border-l-4 ${getBorderColor(project.platform)} shadow-sm`}
      onClick={() => onSelect(project.name)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors flex items-center">
              <FolderOpen className="h-5 w-5 mr-2 text-blue-500" />
              {project.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {truncateText(project.path, 40)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          工作区: {truncateText(project.workspace_id, 20)}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(project.updated_at)}
          </div>
        </div>

        {/* Tool Badge */}
        <div className="flex flex-wrap gap-1">
          <Badge 
            variant="outline" 
            className={`text-xs ${getToolBadgeColor(project.platform)}`}
          >
            {project.platform}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
