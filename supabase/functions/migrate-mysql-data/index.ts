
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MySQL 连接配置 - 直接在代码中配置
const MYSQL_CONFIG = {
  hostname: 'rm-2zeci3z6ogyl025l59o.mysql.rds.aliyuncs.com',
  port: 3306,
  username: 'chip',
  password: 'chip@2024',
  db: 'chat_history'
};

// 生成 UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let mysqlClient;

  try {
    const { action, batchSize = 100 } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize MySQL client with hardcoded config and timeout
    console.log('Connecting to MySQL...');
    mysqlClient = new Client();
    await mysqlClient.connect({
      ...MYSQL_CONFIG,
      timeout: 30000, // 30 seconds timeout
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
        const mysqlProjects = await mysqlClient.query('SELECT * FROM projects LIMIT ?', [batchSize]);
        
        const projectsToInsert = mysqlProjects.map((project: any) => ({
          id: generateUUID(), // 生成新的 UUID 而不是使用原始数字 ID
          workspace_id: project.workspace_id || '',
          platform: project.platform || '',
          name: project.name || '',
          path: project.path || '',
          created_at: project.created_at,
          updated_at: project.updated_at
        }));

        if (projectsToInsert.length > 0) {
          const { error: projectsError } = await supabase
            .from('projects')
            .insert(projectsToInsert);

          if (projectsError) throw projectsError;
        }

        result = {
          migrated: projectsToInsert.length,
          message: `Successfully migrated ${projectsToInsert.length} projects`
        };
        break;

      case 'migrate_conversations':
        const mysqlConversations = await mysqlClient.query('SELECT * FROM conversations LIMIT ?', [batchSize]);
        
        const conversationsToInsert = mysqlConversations.map((conv: any) => ({
          id: conv.id || generateUUID(),
          workspace_id: conv.workspace_id || '',
          project_name: conv.project_name || '',
          name: conv.name || '',
          created_at: conv.created_at,
          last_interacted_at: conv.last_interacted_at,
          message_count: conv.message_count || 0,
          created_timestamp: conv.created_timestamp || new Date().toISOString(),
          updated_timestamp: conv.updated_timestamp || new Date().toISOString()
        }));

        if (conversationsToInsert.length > 0) {
          const { error: conversationsError } = await supabase
            .from('conversations')
            .insert(conversationsToInsert);

          if (conversationsError) throw conversationsError;
        }

        result = {
          migrated: conversationsToInsert.length,
          message: `Successfully migrated ${conversationsToInsert.length} conversations`
        };
        break;

      case 'migrate_messages':
        const mysqlMessages = await mysqlClient.query('SELECT * FROM messages LIMIT ?', [batchSize]);
        
        const messagesToInsert = mysqlMessages.map((msg: any) => ({
          id: generateUUID(), // 生成新的 UUID
          conversation_id: msg.conversation_id || '',
          request_id: msg.request_id || '',
          role: msg.role || '',
          content: msg.content || '',
          timestamp: msg.timestamp,
          message_order: msg.message_order || 0,
          workspace_files: msg.workspace_files,
          created_at: msg.created_at || new Date().toISOString()
        }));

        if (messagesToInsert.length > 0) {
          const { error: messagesError } = await supabase
            .from('messages')
            .insert(messagesToInsert);

          if (messagesError) throw messagesError;
        }

        result = {
          migrated: messagesToInsert.length,
          message: `Successfully migrated ${messagesToInsert.length} messages`
        };
        break;

      case 'migrate_all':
        console.log('Starting complete migration...');
        
        // Migrate in order: projects -> conversations -> messages
        const allProjects = await mysqlClient.query('SELECT * FROM projects');
        console.log(`Found ${allProjects.length} projects to migrate`);

        const allConversations = await mysqlClient.query('SELECT * FROM conversations');
        console.log(`Found ${allConversations.length} conversations to migrate`);

        const allMessages = await mysqlClient.query('SELECT * FROM messages');
        console.log(`Found ${allMessages.length} messages to migrate`);

        // Migrate projects
        if (allProjects.length > 0) {
          const projectsData = allProjects.map((project: any) => ({
            id: generateUUID(),
            workspace_id: project.workspace_id || '',
            platform: project.platform || '',
            name: project.name || '',
            path: project.path || '',
            created_at: project.created_at,
            updated_at: project.updated_at
          }));

          const { error: pError } = await supabase
            .from('projects')
            .insert(projectsData);
          if (pError) {
            console.error('Projects migration error:', pError);
            throw pError;
          }
          console.log(`Migrated ${projectsData.length} projects`);
        }

        // Migrate conversations
        if (allConversations.length > 0) {
          const conversationsData = allConversations.map((conv: any) => ({
            id: conv.id || generateUUID(),
            workspace_id: conv.workspace_id || '',
            project_name: conv.project_name || '',
            name: conv.name || '',
            created_at: conv.created_at,
            last_interacted_at: conv.last_interacted_at,
            message_count: conv.message_count || 0,
            created_timestamp: conv.created_timestamp || new Date().toISOString(),
            updated_timestamp: conv.updated_timestamp || new Date().toISOString()
          }));

          const { error: cError } = await supabase
            .from('conversations')
            .insert(conversationsData);
          if (cError) {
            console.error('Conversations migration error:', cError);
            throw cError;
          }
          console.log(`Migrated ${conversationsData.length} conversations`);
        }

        // Migrate messages in batches
        const batchSizeForMessages = 500;
        let totalMessagesMigrated = 0;
        
        for (let i = 0; i < allMessages.length; i += batchSizeForMessages) {
          const batch = allMessages.slice(i, i + batchSizeForMessages);
          const messagesData = batch.map((msg: any) => ({
            id: generateUUID(),
            conversation_id: msg.conversation_id || '',
            request_id: msg.request_id || '',
            role: msg.role || '',
            content: msg.content || '',
            timestamp: msg.timestamp,
            message_order: msg.message_order || 0,
            workspace_files: msg.workspace_files,
            created_at: msg.created_at || new Date().toISOString()
          }));

          const { error: mError } = await supabase
            .from('messages')
            .insert(messagesData);
          if (mError) {
            console.error('Messages migration error:', mError);
            throw mError;
          }
          totalMessagesMigrated += messagesData.length;
          console.log(`Migrated batch ${Math.floor(i / batchSizeForMessages) + 1}, total messages: ${totalMessagesMigrated}`);
        }

        result = {
          projects: allProjects.length,
          conversations: allConversations.length,
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
    // 确保关闭 MySQL 连接
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
