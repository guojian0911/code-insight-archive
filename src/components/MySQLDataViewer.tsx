
import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, ChevronLeft, ChevronRight, Eye, MessageSquare, Folder } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const MySQLDataViewer: React.FC = () => {
  const [stats, setStats] = useState<MySQLStats | null>(null);
  const [projects, setProjects] = useState<MySQLProject[]>([]);
  const [conversations, setConversations] = useState<MySQLConversation[]>([]);
  const [messages, setMessages] = useState<MySQLMessage[]>([]);
  const [currentView, setCurrentView] = useState<'projects' | 'conversations' | 'messages'>('projects');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedConversation, setSelectedConversation] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ limit: 20, offset: 0, total: 0 });
  const { toast } = useToast();

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

  const loadProjects = async (offset = 0) => {
    try {
      setLoading(true);
      const data = await queryMySQL('get_projects', { 
        limit: pagination.limit, 
        offset 
      });
      setProjects(data.data);
      setPagination(prev => ({ ...prev, offset, total: data.total }));
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "加载项目失败",
        description: "无法加载项目数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (project_name: string, offset = 0) => {
    try {
      setLoading(true);
      const data = await queryMySQL('get_conversations', { 
        project_name,
        limit: pagination.limit, 
        offset 
      });
      setConversations(data.data);
      setPagination(prev => ({ ...prev, offset, total: data.total }));
      setSelectedProject(project_name);
      setCurrentView('conversations');
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast({
        title: "加载对话失败",
        description: "无法加载对话数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversation_id: string, offset = 0) => {
    try {
      setLoading(true);
      const data = await queryMySQL('get_messages', { 
        conversation_id,
        limit: pagination.limit, 
        offset 
      });
      setMessages(data.data);
      setPagination(prev => ({ ...prev, offset, total: data.total }));
      setSelectedConversation(conversation_id);
      setCurrentView('messages');
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        title: "加载消息失败",
        description: "无法加载消息数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const data = await queryMySQL('search', { 
        searchTerm,
        searchType: currentView,
        limit: pagination.limit
      });
      
      if (currentView === 'projects') {
        setProjects(data.data);
      } else if (currentView === 'conversations') {
        setConversations(data.data);
      } else if (currentView === 'messages') {
        setMessages(data.data);
      }
      
      setPagination(prev => ({ ...prev, offset: 0, total: data.count }));
      
      toast({
        title: "搜索完成",
        description: `找到 ${data.count} 条结果`,
      });
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
  };

  const nextPage = () => {
    const newOffset = pagination.offset + pagination.limit;
    if (newOffset < pagination.total) {
      if (currentView === 'projects') {
        loadProjects(newOffset);
      } else if (currentView === 'conversations') {
        loadConversations(selectedProject, newOffset);
      } else if (currentView === 'messages') {
        loadMessages(selectedConversation, newOffset);
      }
    }
  };

  const prevPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    if (currentView === 'projects') {
      loadProjects(newOffset);
    } else if (currentView === 'conversations') {
      loadConversations(selectedProject, newOffset);
    } else if (currentView === 'messages') {
      loadMessages(selectedConversation, newOffset);
    }
  };

  const goBack = () => {
    if (currentView === 'messages') {
      setCurrentView('conversations');
      setMessages([]);
    } else if (currentView === 'conversations') {
      setCurrentView('projects');
      setConversations([]);
      setSelectedProject('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center">
          <Database className="h-6 w-6 mr-2" />
          MySQL 数据查看器
        </h2>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新统计
        </Button>
      </div>

      {/* 数据统计 */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">项目总数</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.projects}</p>
                </div>
                <Folder className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">对话总数</p>
                  <p className="text-2xl font-bold text-green-600">{stats.conversations}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">消息总数</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.messages}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和导航 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentView !== 'projects' && (
                <Button onClick={goBack} variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  返回
                </Button>
              )}
              <CardTitle>
                {currentView === 'projects' && '项目列表'}
                {currentView === 'conversations' && `${selectedProject} - 对话列表`}
                {currentView === 'messages' && '消息列表'}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder={`搜索${currentView === 'projects' ? '项目' : currentView === 'conversations' ? '对话' : '消息'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              加载中...
            </div>
          ) : (
            <>
              {/* 项目列表 */}
              {currentView === 'projects' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>项目名称</TableHead>
                      <TableHead>平台</TableHead>
                      <TableHead>工作区ID</TableHead>
                      <TableHead>路径</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{project.platform}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {truncateText(project.workspace_id, 20)}
                        </TableCell>
                        <TableCell className="text-sm">{truncateText(project.path, 30)}</TableCell>
                        <TableCell className="text-sm">{formatDate(project.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() => loadConversations(project.name)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看对话
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* 对话列表 */}
              {currentView === 'conversations' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>对话名称</TableHead>
                      <TableHead>对话ID</TableHead>
                      <TableHead>消息数量</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>最后交互</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.map((conversation) => (
                      <TableRow key={conversation.id}>
                        <TableCell className="font-medium">
                          {conversation.name || '未命名对话'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {truncateText(conversation.id, 25)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{conversation.message_count}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(conversation.created_at)}</TableCell>
                        <TableCell className="text-sm">
                          {conversation.last_interacted_at ? formatDate(conversation.last_interacted_at) : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => loadMessages(conversation.id)}
                            size="sm"
                            variant="outline"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            查看消息
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* 消息列表 */}
              {currentView === 'messages' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>角色</TableHead>
                      <TableHead>消息内容</TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead>顺序</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>
                          <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                            {message.role === 'user' ? '用户' : '助手'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate" title={message.content}>
                            {truncateText(message.content, 100)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(message.timestamp)}</TableCell>
                        <TableCell>{message.message_order}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* 分页控制 */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  显示 {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} 
                  共 {pagination.total} 条记录
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={prevPage}
                    disabled={pagination.offset === 0}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    onClick={nextPage}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    variant="outline"
                    size="sm"
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MySQLDataViewer;
