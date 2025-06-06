
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Enhanced tool badge styling with better contrast
  const getToolBadgeStyles = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    switch (normalizedPlatform) {
      case 'cursor':
      case 'cursor-ai':
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      case 'augmentcode':
      case 'augment-code':
      case 'augment_code':
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'cline':
        return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
      case 'roocode':
        return 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
    }
  };

  // Enhanced border accent color
  const getBorderAccentColor = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    switch (normalizedPlatform) {
      case 'cursor':
      case 'cursor-ai':
        return 'border-l-blue-500';
      case 'augmentcode':
      case 'augment-code':
      case 'augment_code':
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
      className={`ui-card cursor-pointer group border-l-4 ${getBorderAccentColor(project.platform)} transform hover:scale-105 transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}
      onClick={() => onSelect(project.name)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(project.name);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`选择项目 ${project.name}`}
    >
      <CardHeader className="pb-3 card-spacing">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors duration-200 flex items-center">
              <FolderOpen className="h-5 w-5 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{project.name}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 truncate" title={project.path}>
              {truncateText(project.path, 40)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 px-6 pb-6">
        {/* Workspace info with proper contrast */}
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">工作区:</span> {truncateText(project.workspace_id, 20)}
        </p>

        {/* Date and status with consistent styling */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
            <span>{formatDate(project.updated_at)}</span>
          </div>
        </div>

        {/* Enhanced tool badge with better accessibility */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className={`ui-badge text-xs font-medium transition-colors duration-200 ${getToolBadgeStyles(project.platform)}`}
          >
            {project.platform}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
