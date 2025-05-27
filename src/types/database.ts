
export interface Project {
  id: string;
  workspace_id: string;
  platform: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
  // Add missing properties expected by components
  description?: string;
  lastUpdated: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  project_name: string;
  name: string;
  created_at: string | null;
  last_interacted_at: string | null;
  message_count: number;
  created_timestamp: string;
  updated_timestamp: string;
  // Add missing properties expected by components
  title: string;
  tool: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  request_id: string;
  role: string;
  content: string;
  timestamp: string | null;
  message_order: number;
  workspace_files: any;
  created_at: string;
}

export interface ProjectWithConversations extends Project {
  conversations: Conversation[];
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}
