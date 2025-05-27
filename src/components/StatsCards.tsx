
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, MessageSquare, Bot, Database } from 'lucide-react';

interface MySQLProject {
  id: number;
  workspace_id: string;
  platform: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
}

interface MySQLStats {
  projects: number;
  conversations: number;
  messages: number;
}

interface StatsCardsProps {
  stats: MySQLStats | null;
  allProjects: MySQLProject[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, allProjects }) => {
  const getToolStats = (projects: MySQLProject[]) => {
    const toolCounts: Record<string, number> = {};
    projects.forEach(project => {
      const tool = project.platform || 'unknown';
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    });
    return Object.keys(toolCounts).length;
  };

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Code className="h-4 w-4 mr-2" />
            总项目数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.projects}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            总对话数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.conversations}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Bot className="h-4 w-4 mr-2" />
            AI工具类型
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{getToolStats(allProjects)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Database className="h-4 w-4 mr-2" />
            总消息数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.messages}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
