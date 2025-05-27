
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
      timeout: 30000,
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

      case 'migrate_batch':
        // 批次迁移，支持实时进度更新
        const { table, batchOffset, batchLimit } = await req.json();
        
        console.log(`Starting batch migration for ${table}, offset: ${batchOffset}, limit: ${batchLimit}`);
        
        let batchResult = {
          migrated: 0,
          errors: 0,
          completed: false
        };

        if (table === 'projects') {
          const projects = await mysqlClient.query('SELECT * FROM projects LIMIT ? OFFSET ?', [batchLimit, batchOffset]);
          
          for (const project of projects) {
            try {
              const projectData = {
                id: crypto.randomUUID(),
                workspace_id: String(project.workspace_id || ''),
                platform: String(project.platform || ''),
                name: String(project.name || ''),
                path: String(project.path || ''),
                created_at: project.created_at || new Date().toISOString(),
                updated_at: project.updated_at || new Date().toISOString()
              };

              const { error } = await supabase.from('projects').insert([projectData]);
              if (error) {
                console.error('Project insertion error:', error);
                batchResult.errors++;
              } else {
                batchResult.migrated++;
              }
            } catch (err) {
              console.error('Error processing project:', err);
              batchResult.errors++;
            }
            
            // 每个项目后小延迟
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          batchResult.completed = projects.length < batchLimit;
        }
        
        else if (table === 'conversations') {
          const conversations = await mysqlClient.query('SELECT * FROM conversations LIMIT ? OFFSET ?', [batchLimit, batchOffset]);
          
          for (const conv of conversations) {
            try {
              const convData = {
                id: String(conv.id || crypto.randomUUID()),
                workspace_id: String(conv.workspace_id || ''),
                project_name: String(conv.project_name || ''),
                name: String(conv.name || ''),
                created_at: conv.created_at,
                last_interacted_at: conv.last_interacted_at,
                message_count: conv.message_count || 0,
                created_timestamp: conv.created_timestamp || new Date().toISOString(),
                updated_timestamp: conv.updated_timestamp || new Date().toISOString()
              };

              const { error } = await supabase.from('conversations').insert([convData]);
              if (error) {
                console.error('Conversation insertion error:', error);
                batchResult.errors++;
              } else {
                batchResult.migrated++;
              }
            } catch (err) {
              console.error('Error processing conversation:', err);
              batchResult.errors++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          batchResult.completed = conversations.length < batchLimit;
        }
        
        else if (table === 'messages') {
          const messages = await mysqlClient.query('SELECT * FROM messages LIMIT ? OFFSET ?', [batchLimit, batchOffset]);
          
          for (const msg of messages) {
            try {
              const msgData = {
                id: crypto.randomUUID(),
                conversation_id: String(msg.conversation_id || ''),
                request_id: String(msg.request_id || ''),
                role: String(msg.role || ''),
                content: String(msg.content || '').substring(0, 8000), // 限制长度避免过大
                timestamp: msg.timestamp,
                message_order: msg.message_order || 0,
                workspace_files: msg.workspace_files,
                created_at: msg.created_at || new Date().toISOString()
              };

              const { error } = await supabase.from('messages').insert([msgData]);
              if (error) {
                console.error('Message insertion error:', error);
                batchResult.errors++;
              } else {
                batchResult.migrated++;
              }
            } catch (err) {
              console.error('Error processing message:', err);
              batchResult.errors++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          
          batchResult.completed = messages.length < batchLimit;
        }

        result = batchResult;
        break;

      case 'clear_data':
        // 清理现有数据
        console.log('Cleaning existing data...');
        await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('conversations').delete().neq('id', '');
        await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('Cleanup completed');
        
        result = { message: 'Data cleared successfully' };
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
      details: error.toString(),
      stack: error.stack
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
