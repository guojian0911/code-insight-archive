
import { supabase } from '@/integrations/supabase/client';
import { Project, Conversation, Message, ProjectWithConversations, ConversationWithMessages } from '@/types/database';

export const projectService = {
  // 获取所有项目
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    // Map database fields to expected component properties
    return (data || []).map(project => ({
      ...project,
      description: project.path || 'No description', // Ensure always has a value
      lastUpdated: project.updated_at
    }));
  },

  // 根据 workspace_id 获取项目的对话
  async getProjectConversations(workspaceId: string, projectName: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('project_name', projectName)
      .order('last_interacted_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    // Map database fields to expected component properties
    return (data || []).map(conversation => ({
      ...conversation,
      title: conversation.name || 'Untitled Conversation',
      tool: 'cursor' as const, // Use specific literal type
      createdAt: conversation.created_at || conversation.created_timestamp
    }));
  },

  // 获取对话的消息
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_order', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return data || [];
  },

  // 获取项目及其对话（用于项目列表显示）
  async getProjectsWithConversations(): Promise<ProjectWithConversations[]> {
    const projects = await this.getProjects();
    
    const projectsWithConversations: ProjectWithConversations[] = [];

    for (const project of projects) {
      const conversations = await this.getProjectConversations(project.workspace_id, project.name);
      projectsWithConversations.push({
        ...project,
        conversations
      });
    }

    return projectsWithConversations;
  },

  // 搜索功能
  async searchProjects(query: string): Promise<ProjectWithConversations[]> {
    const allProjects = await this.getProjectsWithConversations();
    
    return allProjects.filter(project => 
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.conversations.some(conv => 
        conv.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  },

  // 根据项目ID查找项目
  async getProjectById(projectId: string): Promise<ProjectWithConversations | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    if (!data) return null;

    const conversations = await this.getProjectConversations(data.workspace_id, data.name);
    
    return {
      ...data,
      description: data.path || 'No description', // Ensure always has a value
      lastUpdated: data.updated_at,
      conversations
    };
  }
};
