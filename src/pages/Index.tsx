
import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MessageSquare, Code, Bot, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
  const [currentView, setCurrentView] = useState<'projects' | 'conversations' | 'messages' | 'search'>('projects');
  const [projects, setProjects] = useState<MySQLProject[]>([]);
  const [conversations, setConversations] = useState<MySQLConversation[]>([]);
  const [messages, setMessages] = useState<MySQLMessage[]>([]);
  const [selectedProject, setSelectedProject] = useState<MySQLProject | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<MySQLConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MySQLStats | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    loadProjects();
  }, []);

  const queryMySQL = async (action: string, params: any = {}) => {
    const { data, error } = await supabase.functions.invoke('mysql-query', {
      body: { action, ...params }
    });

    if (error) throw error;
    return data;
  };

  const loadStats = async () => {
    try {
      const data = await queryMySQL('get_stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({
        title: "获取统计失败",
        description: "无法获取数据库统计信息",
        variant: "destructive",
      });
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await queryMySQL('get_projects', { limit: 50, offset: 0 });
      setProjects(data.data);
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

  const handleProjectSelect = async (projectName: string) => {
    try {
      setLoading(true);
      const project = projects.find(p => p.name === projectName);
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        setLoading(true);
        const data = await queryMySQL('search', {
          searchTerm: query,
          searchType: 'projects',
          limit: 50
        });
        setProjects(data.data);
        setCurrentView('search');
      } catch (error) {
        console.error('Search failed:', error);
        toast({
          title: "搜索失败",
          description: "搜索过程中出现错误",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentView('projects');
      loadProjects();
    }
  };

  const handleBackToProjects = () => {
    setCurrentView('projects');
    setSelectedProject(null);
    setSelectedConversation(null);
    setConversations([]);
    setMessages([]);
    loadProjects();
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

  if (loading && !projects.length) {
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
        {currentView === 'projects' && !searchQuery && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  总项目数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projects}</div>
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
                <div className="text-2xl font-bold">{stats.conversations}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  总消息数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.messages}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {currentView === 'projects' && (
            <Card>
              <CardHeader>
                <CardTitle>项目列表</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                    加载中...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                            onClick={() => handleProjectSelect(project.name)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            <Badge variant="secondary">{project.platform}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            路径: {truncateText(project.path, 40)}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            工作区: {truncateText(project.workspace_id, 20)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            更新时间: {formatDate(project.updated_at)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentView === 'conversations' && selectedProject && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedProject.name} - 对话列表</CardTitle>
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
                      <Card key={conversation.id} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleConversationSelect(conversation.id)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{conversation.name || '未命名对话'}</h3>
                              <p className="text-sm text-muted-foreground">
                                消息数量: {conversation.message_count}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                创建时间: {formatDate(conversation.created_at)}
                              </p>
                            </div>
                            <Badge variant="outline">{conversation.message_count} 条消息</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentView === 'messages' && selectedConversation && (
            <Card>
              <CardHeader>
                <CardTitle>消息详情</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                    加载中...
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((message) => (
                      <div key={message.id} className={`p-4 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : 'bg-gray-50 border-l-4 border-gray-500'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                            {message.role === 'user' ? '用户' : '助手'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentView === 'search' && searchQuery && (
            <Card>
              <CardHeader>
                <CardTitle>搜索结果: "{searchQuery}"</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                          onClick={() => handleProjectSelect(project.name)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Badge variant="secondary">{project.platform}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          路径: {truncateText(project.path, 40)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          更新时间: {formatDate(project.updated_at)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
