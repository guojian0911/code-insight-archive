
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MySQL 连接配置
const MYSQL_CONFIG = {
  hostname: 'rm-2zeci3z6ogyl025l59o.mysql.rds.aliyuncs.com',
  port: 3306,
  username: 'chip',
  password: 'chip@2024',
  db: 'chat_history'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let mysqlClient;

  try {
    const { action, batchSize = 50, offset = 0 } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize MySQL client
    console.log('Connecting to MySQL...');
    mysqlClient = new Client();
    await mysqlClient.connect({
      ...MYSQL_CONFIG,
      timeout: 10000,
    });
    console.log('MySQL connected successfully');

    let result = {};

    switch (action) {
      case 'check_connection':
        // Test both connections
        const mysqlTest = await mysqlClient.query('SELECT 1 as test');
        const { data: supabaseTest } = await supabase.from('projects').select('count').limit(1);
        
        result = {
          mysql_connected: mysqlTest.length > 0,
          supabase_connected: true,
          message: 'Both connections successful'
        };
        break;

      case 'get_stats':
        // Get counts from MySQL
        const projectsCount = await mysqlClient.query('SELECT COUNT(*) as count FROM projects');
        const conversationsCount = await mysqlClient.query('SELECT COUNT(*) as count FROM conversations');
        const messagesCount = await mysqlClient.query('SELECT COUNT(*) as count FROM messages');
        
        // Get counts from Supabase
        const { count: supabaseProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        const { count: supabaseConversations } = await supabase.from('conversations').select('*', { count: 'exact', head: true });
        const { count: supabaseMessages } = await supabase.from('messages').select('*', { count: 'exact', head: true });

        result = {
          mysql: {
            projects: projectsCount[0].count,
            conversations: conversationsCount[0].count,
            messages: messagesCount[0].count
          },
          supabase: {
            projects: supabaseProjects || 0,
            conversations: supabaseConversations || 0,
            messages: supabaseMessages || 0
          }
        };
        break;

      case 'migrate_projects':
        const mysqlProjects = await mysqlClient.query('SELECT * FROM projects LIMIT ? OFFSET ?', [batchSize, offset]);
        
        if (mysqlProjects.length > 0) {
          const projectsToInsert = mysqlProjects.map((project: any) => ({
            id: project.id || crypto.randomUUID(),
            workspace_id: project.workspace_id || '',
            platform: project.platform || '',
            name: project.name || '',
            path: project.path || '',
            created_at: project.created_at || new Date().toISOString(),
            updated_at: project.updated_at || new Date().toISOString()
          }));

          const { error: projectsError } = await supabase
            .from('projects')
            .insert(projectsToInsert);

          if (projectsError) throw projectsError;
        }

        result = {
          migrated: mysqlProjects.length,
          hasMore: mysqlProjects.length === batchSize,
          nextOffset: offset + mysqlProjects.length,
          message: `Successfully migrated ${mysqlProjects.length} projects`
        };
        break;

      case 'migrate_conversations':
        const mysqlConversations = await mysqlClient.query('SELECT * FROM conversations LIMIT ? OFFSET ?', [batchSize, offset]);
        
        if (mysqlConversations.length > 0) {
          const conversationsToInsert = mysqlConversations.map((conv: any) => ({
            id: conv.id || crypto.randomUUID(),
            workspace_id: conv.workspace_id || '',
            project_name: conv.project_name || '',
            name: conv.name || '',
            created_at: conv.created_at,
            last_interacted_at: conv.last_interacted_at,
            message_count: conv.message_count || 0,
            created_timestamp: conv.created_timestamp || new Date().toISOString(),
            updated_timestamp: conv.updated_timestamp || new Date().toISOString()
          }));

          const { error: conversationsError } = await supabase
            .from('conversations')
            .insert(conversationsToInsert);

          if (conversationsError) throw conversationsError;
        }

        result = {
          migrated: mysqlConversations.length,
          hasMore: mysqlConversations.length === batchSize,
          nextOffset: offset + mysqlConversations.length,
          message: `Successfully migrated ${mysqlConversations.length} conversations`
        };
        break;

      case 'migrate_messages':
        const mysqlMessages = await mysqlClient.query('SELECT * FROM messages LIMIT ? OFFSET ?', [batchSize, offset]);
        
        if (mysqlMessages.length > 0) {
          const messagesToInsert = mysqlMessages.map((msg: any) => ({
            id: crypto.randomUUID(),
            conversation_id: msg.conversation_id || '',
            request_id: msg.request_id || '',
            role: msg.role || '',
            content: msg.content || '',
            timestamp: msg.timestamp,
            message_order: msg.message_order || 0,
            workspace_files: msg.workspace_files,
            created_at: msg.created_at || new Date().toISOString()
          }));

          const { error: messagesError } = await supabase
            .from('messages')
            .insert(messagesToInsert);

          if (messagesError) throw messagesError;
        }

        result = {
          migrated: mysqlMessages.length,
          hasMore: mysqlMessages.length === batchSize,
          nextOffset: offset + mysqlMessages.length,
          message: `Successfully migrated ${mysqlMessages.length} messages`
        };
        break;

      case 'migrate_all':
        console.log('Starting complete migration...');
        
        // Get total counts first
        const totalProjectsResult = await mysqlClient.query('SELECT COUNT(*) as count FROM projects');
        const totalConversationsResult = await mysqlClient.query('SELECT COUNT(*) as count FROM conversations');
        const totalMessagesResult = await mysqlClient.query('SELECT COUNT(*) as count FROM messages');
        
        const totalProjects = totalProjectsResult[0].count;
        const totalConversations = totalConversationsResult[0].count;
        const totalMessages = totalMessagesResult[0].count;
        
        console.log(`Total to migrate: ${totalProjects} projects, ${totalConversations} conversations, ${totalMessages} messages`);

        // Migrate projects in small batches
        let projectOffset = 0;
        let totalProjectsMigrated = 0;
        const projectBatchSize = 20;
        
        while (projectOffset < totalProjects) {
          const projects = await mysqlClient.query('SELECT * FROM projects LIMIT ? OFFSET ?', [projectBatchSize, projectOffset]);
          if (projects.length === 0) break;

          const projectsData = projects.map((project: any) => ({
            id: project.id || crypto.randomUUID(),
            workspace_id: project.workspace_id || '',
            platform: project.platform || '',
            name: project.name || '',
            path: project.path || '',
            created_at: project.created_at || new Date().toISOString(),
            updated_at: project.updated_at || new Date().toISOString()
          }));

          const { error: pError } = await supabase.from('projects').insert(projectsData);
          if (pError) throw pError;
          
          totalProjectsMigrated += projects.length;
          projectOffset += projectBatchSize;
          console.log(`Migrated ${totalProjectsMigrated}/${totalProjects} projects`);
        }

        // Migrate conversations in small batches
        let conversationOffset = 0;
        let totalConversationsMigrated = 0;
        const conversationBatchSize = 30;
        
        while (conversationOffset < totalConversations) {
          const conversations = await mysqlClient.query('SELECT * FROM conversations LIMIT ? OFFSET ?', [conversationBatchSize, conversationOffset]);
          if (conversations.length === 0) break;

          const conversationsData = conversations.map((conv: any) => ({
            id: conv.id || crypto.randomUUID(),
            workspace_id: conv.workspace_id || '',
            project_name: conv.project_name || '',
            name: conv.name || '',
            created_at: conv.created_at,
            last_interacted_at: conv.last_interacted_at,
            message_count: conv.message_count || 0,
            created_timestamp: conv.created_timestamp || new Date().toISOString(),
            updated_timestamp: conv.updated_timestamp || new Date().toISOString()
          }));

          const { error: cError } = await supabase.from('conversations').insert(conversationsData);
          if (cError) throw cError;
          
          totalConversationsMigrated += conversations.length;
          conversationOffset += conversationBatchSize;
          console.log(`Migrated ${totalConversationsMigrated}/${totalConversations} conversations`);
        }

        // Migrate messages in very small batches to avoid timeout
        let messageOffset = 0;
        let totalMessagesMigrated = 0;
        const messageBatchSize = 100;
        
        while (messageOffset < totalMessages) {
          const messages = await mysqlClient.query('SELECT * FROM messages LIMIT ? OFFSET ?', [messageBatchSize, messageOffset]);
          if (messages.length === 0) break;

          const messagesData = messages.map((msg: any) => ({
            id: crypto.randomUUID(),
            conversation_id: msg.conversation_id || '',
            request_id: msg.request_id || '',
            role: msg.role || '',
            content: msg.content || '',
            timestamp: msg.timestamp,
            message_order: msg.message_order || 0,
            workspace_files: msg.workspace_files,
            created_at: msg.created_at || new Date().toISOString()
          }));

          const { error: mError } = await supabase.from('messages').insert(messagesData);
          if (mError) throw mError;
          
          totalMessagesMigrated += messages.length;
          messageOffset += messageBatchSize;
          console.log(`Migrated ${totalMessagesMigrated}/${totalMessages} messages`);
          
          // Add small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        result = {
          projects: totalProjectsMigrated,
          conversations: totalConversationsMigrated,
          messages: totalMessagesMigrated,
          message: 'All data migrated successfully'
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    if (mysqlClient) {
      try {
        await mysqlClient.close();
        console.log('MySQL connection closed');
      } catch (closeError) {
        console.error('Error closing MySQL connection:', closeError);
      }
    }
  }
});
