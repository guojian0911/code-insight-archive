
import React, { useState } from 'react';
import { Search, Filter, Calendar, MessageSquare, Code, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ProjectList from '@/components/ProjectList';
import ConversationList from '@/components/ConversationList';
import MessageDetail from '@/components/MessageDetail';
import SearchResults from '@/components/SearchResults';
import { mockData } from '@/data/mockData';

const Index = () => {
  const [currentView, setCurrentView] = useState<'projects' | 'conversations' | 'messages' | 'search'>('projects');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setCurrentView('conversations');
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setCurrentView('messages');
  };

  const handleSearch = (query: string) => {
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
    const project = mockData.projects.find(p => p.id === selectedProject);
    const conversation = project?.conversations.find(c => c.id === selectedConversation);

    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <button 
          onClick={handleBackToProjects}
          className="hover:text-primary transition-colors"
        >
          项目
        </button>
        {project && (
          <>
            <span>/</span>
            <button 
              onClick={handleBackToConversations}
              className="hover:text-primary transition-colors"
            >
              {project.name}
            </button>
          </>
        )}
        {conversation && (
          <>
            <span>/</span>
            <span className="text-foreground">{conversation.title}</span>
          </>
        )}
      </div>
    );
  };

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
                <div className="text-2xl font-bold">{mockData.projects.length}</div>
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
                <div className="text-2xl font-bold">
                  {mockData.projects.reduce((sum, p) => sum + p.conversations.length, 0)}
                </div>
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
                <div className="text-2xl font-bold">4</div>
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
                <div className="text-2xl font-bold">
                  {mockData.projects.filter(p => 
                    new Date(p.lastUpdated).getMonth() === new Date().getMonth()
                  ).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {currentView === 'projects' && !searchQuery && (
            <ProjectList 
              projects={mockData.projects} 
              onProjectSelect={handleProjectSelect}
            />
          )}

          {currentView === 'conversations' && selectedProject && (
            <ConversationList
              project={mockData.projects.find(p => p.id === selectedProject)!}
              onConversationSelect={handleConversationSelect}
              selectedTools={selectedTools}
              onToolsChange={setSelectedTools}
            />
          )}

          {currentView === 'messages' && selectedProject && selectedConversation && (
            <MessageDetail
              conversation={mockData.projects
                .find(p => p.id === selectedProject)!
                .conversations.find(c => c.id === selectedConversation)!}
            />
          )}

          {currentView === 'search' && searchQuery && (
            <SearchResults
              query={searchQuery}
              projects={mockData.projects}
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
