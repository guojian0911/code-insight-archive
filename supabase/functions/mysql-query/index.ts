
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { action, table, limit = 50, offset = 0, project_name, conversation_id } = await req.json();
    
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
      case 'get_projects':
        console.log(`Fetching projects with limit: ${limit}, offset: ${offset}`);
        const projects = await mysqlClient.query(
          'SELECT * FROM projects ORDER BY created_at DESC LIMIT ? OFFSET ?', 
          [limit, offset]
        );
        const projectsCount = await mysqlClient.query('SELECT COUNT(*) as total FROM projects');
        
        result = {
          data: projects,
          total: projectsCount[0].total,
          limit,
          offset
        };
        break;

      case 'get_conversations':
        console.log(`Fetching conversations for project: ${project_name}`);
        let conversationsQuery = 'SELECT * FROM conversations';
        let queryParams = [];
        
        if (project_name) {
          conversationsQuery += ' WHERE project_name = ?';
          queryParams.push(project_name);
        }
        
        conversationsQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);
        
        const conversations = await mysqlClient.query(conversationsQuery, queryParams);
        
        let countQuery = 'SELECT COUNT(*) as total FROM conversations';
        let countParams = [];
        if (project_name) {
          countQuery += ' WHERE project_name = ?';
          countParams.push(project_name);
        }
        
        const conversationsCount = await mysqlClient.query(countQuery, countParams);
        
        result = {
          data: conversations,
          total: conversationsCount[0].total,
          limit,
          offset,
          project_name
        };
        break;

      case 'get_messages':
        console.log(`Fetching messages for conversation: ${conversation_id}`);
        const messages = await mysqlClient.query(
          'SELECT * FROM messages WHERE conversation_id = ? ORDER BY message_order ASC, timestamp ASC LIMIT ? OFFSET ?',
          [conversation_id, limit, offset]
        );
        const messagesCount = await mysqlClient.query(
          'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?',
          [conversation_id]
        );
        
        result = {
          data: messages,
          total: messagesCount[0].total,
          limit,
          offset,
          conversation_id
        };
        break;

      case 'get_stats':
        console.log('Fetching database statistics');
        const projectsStats = await mysqlClient.query('SELECT COUNT(*) as count FROM projects');
        const conversationsStats = await mysqlClient.query('SELECT COUNT(*) as count FROM conversations');
        const messagesStats = await mysqlClient.query('SELECT COUNT(*) as count FROM messages');
        
        result = {
          projects: projectsStats[0].count,
          conversations: conversationsStats[0].count,
          messages: messagesStats[0].count
        };
        break;

      case 'search':
        const { searchTerm, searchType } = await req.json();
        console.log(`Searching for: ${searchTerm} in ${searchType}`);
        
        let searchQuery;
        let searchParams;
        
        if (searchType === 'projects') {
          searchQuery = 'SELECT * FROM projects WHERE name LIKE ? OR platform LIKE ? ORDER BY created_at DESC LIMIT ?';
          searchParams = [`%${searchTerm}%`, `%${searchTerm}%`, limit];
        } else if (searchType === 'conversations') {
          searchQuery = 'SELECT * FROM conversations WHERE name LIKE ? OR project_name LIKE ? ORDER BY created_at DESC LIMIT ?';
          searchParams = [`%${searchTerm}%`, `%${searchTerm}%`, limit];
        } else if (searchType === 'messages') {
          searchQuery = 'SELECT m.*, c.name as conversation_name FROM messages m LEFT JOIN conversations c ON m.conversation_id = c.id WHERE m.content LIKE ? ORDER BY m.timestamp DESC LIMIT ?';
          searchParams = [`%${searchTerm}%`, limit];
        }
        
        const searchResults = await mysqlClient.query(searchQuery, searchParams);
        
        result = {
          data: searchResults,
          searchTerm,
          searchType,
          count: searchResults.length
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('MySQL query error:', error);
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
