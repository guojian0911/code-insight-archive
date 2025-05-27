
import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MessageSquare, Code, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import ProjectList from '@/components/ProjectList';
import ConversationList from '@/components/ConversationList';
import MessageDetail from '@/components/MessageDetail';
import SearchResults from '@/components/SearchResults';
import { projectService } from '@/services/projectService';
import { ProjectWithConversations, ConversationWithMessages } from '@/types/database';

const Index = () => {
  const [currentView, setCurrentView] = useState<'projects' | 'conversations' | 'messages' | 'search'>('projects');
  const [projects, setProjects] = useState<ProjectWithConversations[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWithConversations | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithMessages | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjectsWithConversations();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "加载失败",
        description: "无法加载项目数据，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setCurrentView('conversations');
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    if (!selectedProject) return;
    
    try {
      const conversation = selectedProject.conversations.find(c => c.id === conversationId);
      if (conversation) {
        const messages = await projectService.getConversationMessages(conversationId);
        const conversationWithMessages: ConversationWithMessages = {
          ...conversation,
          messages
        };
        setSelectedConversation(conversationWithMessages);
        setCurrentView('messages');
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast({
        title: "加载失败",
        description: "无法加载对话消息，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setCurrentView('search');
    } else {
      setCurrentView('projects');
    }
  };

  const handleBackToProjects = () => {
    setCurrentView('projects');
    setSelectedProject(null);
    setSelectedConversation(null);
  };

  const handleBackToConversations = () => {
    setCurrentView('conversations');
    setSelectedConversation(null);
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
            <span className="text-foreground">{selectedConversation.name}</span>
          </>
        )}
      </div>
    );
  };

  const totalConversations = projects.reduce((sum, p) => sum + p.conversations.length, 0);
  const platformCount = new Set(projects.map(p => p.platform)).size;
  const thisMonthProjects = projects.filter(p => 
    new Date(p.updated_at).getMonth() === new Date().getMonth()
  ).length;

  if (loading) {
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI编程助手聊天记录管理平台
          </h1>
          <p className="text-muted-foreground text-lg">
            统一管理Cursor、AugmentCode、Cline等AI编程工具的对话历史
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索项目、对话或消息内容..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Breadcrumb */}
        {currentView !== 'projects' && currentView !== 'search' && renderBreadcrumb()}

        {/* Stats Cards */}
        {currentView === 'projects' && !searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  总项目数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  总对话数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalConversations}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Bot className="h-4 w-4 mr-2" />
                  AI工具类型
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformCount}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  本月活跃
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thisMonthProjects}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {currentView === 'projects' && !searchQuery && (
            <ProjectList 
              projects={projects} 
              onProjectSelect={handleProjectSelect}
            />
          )}

          {currentView === 'conversations' && selectedProject && (
            <ConversationList
              project={selectedProject}
              onConversationSelect={handleConversationSelect}
              selectedTools={selectedTools}
              onToolsChange={setSelectedTools}
            />
          )}

          {currentView === 'messages' && selectedConversation && (
            <MessageDetail
              conversation={selectedConversation}
            />
          )}

          {currentView === 'search' && searchQuery && (
            <SearchResults
              query={searchQuery}
              projects={projects}
              onProjectSelect={handleProjectSelect}
              onConversationSelect={handleConversationSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
