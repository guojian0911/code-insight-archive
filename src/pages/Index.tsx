import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Database, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MessageDetail from '@/components/MessageDetail';
import StatsCards from '@/components/StatsCards';
import ProjectCard from '@/components/ProjectCard';
import ConversationCard from '@/components/ConversationCard';
import SearchBar from '@/components/SearchBar';

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
  messages?: MySQLMessage[];
}

interface MySQLMessage {
  id: number;
  conversation_id: string;
  request_id: string;
  role: string;
  content: string;
  timestamp: string;
  message_order: number;
}

interface MySQLStats {
  projects: number;
  conversations: number;
  messages: number;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'projects' | 'conversations' | 'messages'>('projects');
  const [allProjects, setAllProjects] = useState<MySQLProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<MySQLProject[]>([]);
  const [conversations, setConversations] = useState<MySQLConversation[]>([]);
  const [messages, setMessages] = useState<MySQLMessage[]>([]);
  const [selectedProject, setSelectedProject] = useState<MySQLProject | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<MySQLConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MySQLStats | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, []);

  // Frontend search implementation
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return allProjects;
    }
    
    const query = searchQuery.toLowerCase();
    return allProjects.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.platform.toLowerCase().includes(query) ||
      project.path.toLowerCase().includes(query) ||
      project.workspace_id.toLowerCase().includes(query)
    );
  }, [allProjects, searchQuery]);

  useEffect(() => {
    setFilteredProjects(searchResults);
  }, [searchResults]);

  const queryMySQL = async (action: string, params: any = {}) => {
    const { data, error } = await supabase.functions.invoke('mysql-query', {
      body: { action, ...params }
    });

    if (error) throw error;
    return data;
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load projects first
      const projectsData = await queryMySQL('get_projects', { limit: 100, offset: 0 });
      setAllProjects(projectsData.data);
      setFilteredProjects(projectsData.data);
      
      // Load stats only once if not already loaded
      if (!statsLoaded) {
        try {
          const statsData = await queryMySQL('get_stats');
          setStats(statsData);
          setStatsLoaded(true);
        } catch (statsError) {
          console.error('Failed to load stats:', statsError);
          // Don't block the main UI if stats fail
          toast({
            title: "统计信息加载失败",
            description: "项目数据已加载，但统计信息暂时不可用",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast({
        title: "加载失败",
        description: "无法加载项目数据，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (projectName: string) => {
    try {
      setLoading(true);
      const project = allProjects.find(p => p.name === projectName);
      if (project) {
        setSelectedProject(project);
        const data = await queryMySQL('get_conversations', { 
          project_name: projectName,
          limit: 50,
          offset: 0
        });
        setConversations(data.data);
        setCurrentView('conversations');
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast({
        title: "加载失败",
        description: "无法加载对话数据，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    try {
      setLoading(true);
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        const data = await queryMySQL('get_messages', {
          conversation_id: conversationId,
          limit: 100,
          offset: 0
        });
        setMessages(data.data);
        setCurrentView('messages');
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        title: "加载失败",
        description: "无法加载消息数据，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleBackToProjects = () => {
    setCurrentView('projects');
    setSelectedProject(null);
    setSelectedConversation(null);
    setConversations([]);
    setMessages([]);
    setSearchQuery('');
  };

  const handleBackToConversations = () => {
    setCurrentView('conversations');
    setSelectedConversation(null);
    setMessages([]);
  };

  const renderBreadcrumb = () => {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <button 
          onClick={handleBackToProjects}
          className="hover:text-primary transition-colors"
        >
          项目
        </button>
        {selectedProject && (
          <>
            <span>/</span>
            <button 
              onClick={handleBackToConversations}
              className="hover:text-primary transition-colors"
            >
              {selectedProject.name}
            </button>
          </>
        )}
        {selectedConversation && (
          <>
            <span>/</span>
            <span className="text-foreground">{selectedConversation.name || '未命名对话'}</span>
          </>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatConversationForDetail = () => {
    if (!selectedConversation || !messages.length) return null;
    
    const platformToTool = (platform: string): 'cursor' | 'augmentcode' | 'cline' | 'roocode' => {
      const normalizedPlatform = platform.toLowerCase();
      switch (normalizedPlatform) {
        case 'cursor':
        case 'cursor-ai':
          return 'cursor';
        case 'augmentcode':
        case 'augment-code':
          return 'augmentcode';
        case 'cline':
          return 'cline';
        case 'roocode':
          return 'roocode';
        default:
          return 'cursor';
      }
    };
    
    return {
      id: selectedConversation.id,
      title: selectedConversation.name || '未命名对话',
      tool: platformToTool(selectedProject?.platform || 'cursor'),
      createdAt: selectedConversation.created_at,
      messages: messages.map(msg => ({
        id: msg.id.toString(),
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
      }))
    };
  };

  const getToolStats = (projects: MySQLProject[]) => {
    const toolCounts: Record<string, number> = {};
    projects.forEach(project => {
      const tool = project.platform || 'unknown';
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    });
    return Object.keys(toolCounts).length;
  };

  if (loading && !allProjects.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                AI编程助手聊天记录管理平台
              </h1>
              <p className="text-muted-foreground text-lg">
                统一管理Cursor、AugmentCode、Cline等AI编程工具的对话历史
              </p>
            </div>
            <Button 
              onClick={() => navigate('/migration')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Database className="h-4 w-4 mr-2" />
              数据库迁移
            </Button>
          </div>
        </div>

        {/* Search Bar - Only show on projects view */}
        {currentView === 'projects' && (
          <SearchBar 
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            resultCount={filteredProjects.length}
          />
        )}

        {/* Breadcrumb */}
        {currentView !== 'projects' && renderBreadcrumb()}

        {/* Stats Cards - Only show on projects view and when stats are available */}
        {currentView === 'projects' && (
          <StatsCards stats={stats} allProjects={allProjects} />
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {currentView === 'projects' && (
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    项目列表
                    {searchQuery && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (搜索: "{searchQuery}")
                      </span>
                    )}
                  </CardTitle>
                  <Badge variant="secondary" className="px-3 py-1">
                    {filteredProjects.length} 个项目
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                    加载中...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <ProjectCard 
                        key={project.id}
                        project={project}
                        onSelect={handleProjectSelect}
                      />
                    ))}
                  </div>
                )}
                
                {!loading && filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery ? '未找到匹配的项目' : '暂无项目'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? '尝试使用不同的关键词搜索' 
                        : '开始导入您的 AI 编程工具对话记录'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentView === 'conversations' && selectedProject && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">{selectedProject.name} - 对话列表</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                    加载中...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations.map((conversation) => (
                      <ConversationCard 
                        key={conversation.id}
                        conversation={conversation}
                        onSelect={handleConversationSelect}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentView === 'messages' && selectedConversation && (
            <div className="space-y-6">
              {formatConversationForDetail() && (
                <MessageDetail conversation={formatConversationForDetail()!} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
