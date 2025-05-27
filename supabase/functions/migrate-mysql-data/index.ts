
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, batchSize = 100 } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize MySQL client
    const mysqlClient = await new Client().connect({
      hostname: Deno.env.get('MYSQL_HOST')!,
      port: parseInt(Deno.env.get('MYSQL_PORT') || '3306'),
      username: Deno.env.get('MYSQL_USER')!,
      password: Deno.env.get('MYSQL_PASSWORD')!,
      db: Deno.env.get('MYSQL_DATABASE')!,
    });

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
          id: project.id,
          workspace_id: project.workspace_id,
          platform: project.platform,
          name: project.name,
          path: project.path,
          created_at: project.created_at,
          updated_at: project.updated_at
        }));

        const { error: projectsError } = await supabase
          .from('projects')
          .upsert(projectsToInsert, { onConflict: 'id' });

        if (projectsError) throw projectsError;

        result = {
          migrated: projectsToInsert.length,
          message: `Successfully migrated ${projectsToInsert.length} projects`
        };
        break;

      case 'migrate_conversations':
        const mysqlConversations = await mysqlClient.query('SELECT * FROM conversations LIMIT ?', [batchSize]);
        
        const conversationsToInsert = mysqlConversations.map((conv: any) => ({
          id: conv.id,
          workspace_id: conv.workspace_id,
          project_name: conv.project_name,
          name: conv.name,
          created_at: conv.created_at,
          last_interacted_at: conv.last_interacted_at,
          message_count: conv.message_count,
          created_timestamp: conv.created_timestamp,
          updated_timestamp: conv.updated_timestamp
        }));

        const { error: conversationsError } = await supabase
          .from('conversations')
          .upsert(conversationsToInsert, { onConflict: 'id' });

        if (conversationsError) throw conversationsError;

        result = {
          migrated: conversationsToInsert.length,
          message: `Successfully migrated ${conversationsToInsert.length} conversations`
        };
        break;

      case 'migrate_messages':
        const mysqlMessages = await mysqlClient.query('SELECT * FROM messages LIMIT ?', [batchSize]);
        
        const messagesToInsert = mysqlMessages.map((msg: any) => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          request_id: msg.request_id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          message_order: msg.message_order,
          workspace_files: msg.workspace_files,
          created_at: msg.created_at
        }));

        const { error: messagesError } = await supabase
          .from('messages')
          .upsert(messagesToInsert, { onConflict: 'id' });

        if (messagesError) throw messagesError;

        result = {
          migrated: messagesToInsert.length,
          message: `Successfully migrated ${messagesToInsert.length} messages`
        };
        break;

      case 'migrate_all':
        // Migrate in order: projects -> conversations -> messages
        const allProjects = await mysqlClient.query('SELECT * FROM projects');
        const allConversations = await mysqlClient.query('SELECT * FROM conversations');
        const allMessages = await mysqlClient.query('SELECT * FROM messages');

        // Migrate projects
        if (allProjects.length > 0) {
          const projectsData = allProjects.map((project: any) => ({
            id: project.id,
            workspace_id: project.workspace_id,
            platform: project.platform,
            name: project.name,
            path: project.path,
            created_at: project.created_at,
            updated_at: project.updated_at
          }));

          const { error: pError } = await supabase
            .from('projects')
            .upsert(projectsData, { onConflict: 'id' });
          if (pError) throw pError;
        }

        // Migrate conversations
        if (allConversations.length > 0) {
          const conversationsData = allConversations.map((conv: any) => ({
            id: conv.id,
            workspace_id: conv.workspace_id,
            project_name: conv.project_name,
            name: conv.name,
            created_at: conv.created_at,
            last_interacted_at: conv.last_interacted_at,
            message_count: conv.message_count,
            created_timestamp: conv.created_timestamp,
            updated_timestamp: conv.updated_timestamp
          }));

          const { error: cError } = await supabase
            .from('conversations')
            .upsert(conversationsData, { onConflict: 'id' });
          if (cError) throw cError;
        }

        // Migrate messages in batches
        const batchSizeForMessages = 500;
        for (let i = 0; i < allMessages.length; i += batchSizeForMessages) {
          const batch = allMessages.slice(i, i + batchSizeForMessages);
          const messagesData = batch.map((msg: any) => ({
            id: msg.id,
            conversation_id: msg.conversation_id,
            request_id: msg.request_id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            message_order: msg.message_order,
            workspace_files: msg.workspace_files,
            created_at: msg.created_at
          }));

          const { error: mError } = await supabase
            .from('messages')
            .upsert(messagesData, { onConflict: 'id' });
          if (mError) throw mError;
        }

        result = {
          projects: allProjects.length,
          conversations: allConversations.length,
          messages: allMessages.length,
          message: 'All data migrated successfully'
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    await mysqlClient.close();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
