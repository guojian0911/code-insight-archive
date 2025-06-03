
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

// 连接池配置
const POOL_CONFIG = {
  maxConnections: 5,
  connectionTimeout: 30000,
  idleTimeout: 300000, // 5分钟空闲超时
  healthCheckInterval: 60000, // 1分钟健康检查间隔
};

// 连接池管理器
class MySQLConnectionPool {
  private connections: Array<{
    client: Client;
    inUse: boolean;
    lastUsed: number;
    isHealthy: boolean;
  }> = [];
  private healthCheckTimer: number | null = null;

  constructor() {
    this.startHealthCheck();
  }

  // 获取连接
  async getConnection(): Promise<Client> {
    // 查找可用的健康连接
    const availableConnection = this.connections.find(
      conn => !conn.inUse && conn.isHealthy
    );

    if (availableConnection) {
      availableConnection.inUse = true;
      availableConnection.lastUsed = Date.now();
      console.log(`Reusing existing connection. Pool size: ${this.connections.length}`);
      return availableConnection.client;
    }

    // 如果没有可用连接且未达到最大连接数，创建新连接
    if (this.connections.length < POOL_CONFIG.maxConnections) {
      const newConnection = await this.createConnection();
      console.log(`Created new connection. Pool size: ${this.connections.length}`);
      return newConnection;
    }

    // 等待可用连接（简单的重试机制）
    console.log('Pool exhausted, waiting for available connection...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getConnection(); // 递归重试
  }

  // 释放连接
  releaseConnection(client: Client): void {
    const connection = this.connections.find(conn => conn.client === client);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
      console.log(`Connection released. Available connections: ${this.getAvailableCount()}`);
    }
  }

  // 创建新连接
  private async createConnection(): Promise<Client> {
    const client = new Client();

    try {
      await client.connect({
        ...MYSQL_CONFIG,
        timeout: POOL_CONFIG.connectionTimeout,
      });

      const connectionInfo = {
        client,
        inUse: true,
        lastUsed: Date.now(),
        isHealthy: true,
      };

      this.connections.push(connectionInfo);
      return client;
    } catch (error) {
      console.error('Failed to create MySQL connection:', error);
      throw error;
    }
  }

  // 健康检查
  private async healthCheck(): Promise<void> {
    const now = Date.now();

    for (let i = this.connections.length - 1; i >= 0; i--) {
      const conn = this.connections[i];

      // 检查空闲超时
      if (!conn.inUse && (now - conn.lastUsed) > POOL_CONFIG.idleTimeout) {
        console.log('Removing idle connection');
        try {
          await conn.client.close();
        } catch (error) {
          console.error('Error closing idle connection:', error);
        }
        this.connections.splice(i, 1);
        continue;
      }

      // 健康检查（仅对空闲连接）
      if (!conn.inUse) {
        try {
          await conn.client.query('SELECT 1');
          conn.isHealthy = true;
        } catch (error) {
          console.error('Connection health check failed:', error);
          conn.isHealthy = false;
          // 移除不健康的连接
          try {
            await conn.client.close();
          } catch (closeError) {
            console.error('Error closing unhealthy connection:', closeError);
          }
          this.connections.splice(i, 1);
        }
      }
    }
  }

  // 启动健康检查定时器
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.healthCheck().catch(error => {
        console.error('Health check error:', error);
      });
    }, POOL_CONFIG.healthCheckInterval) as unknown as number;
  }

  // 获取可用连接数
  private getAvailableCount(): number {
    return this.connections.filter(conn => !conn.inUse && conn.isHealthy).length;
  }

  // 获取连接池状态
  getPoolStatus() {
    return {
      total: this.connections.length,
      inUse: this.connections.filter(conn => conn.inUse).length,
      available: this.getAvailableCount(),
      unhealthy: this.connections.filter(conn => !conn.isHealthy).length,
    };
  }

  // 关闭所有连接
  async closeAll(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    const closePromises = this.connections.map(async (conn) => {
      try {
        await conn.client.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    });

    await Promise.all(closePromises);
    this.connections = [];
    console.log('All connections closed');
  }
}

// 全局连接池实例
let connectionPool: MySQLConnectionPool | null = null;

// 获取连接池实例（懒加载）
function getConnectionPool(): MySQLConnectionPool {
  if (!connectionPool) {
    connectionPool = new MySQLConnectionPool();
    console.log('MySQL connection pool initialized');
  }
  return connectionPool;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let mysqlClient: Client | null = null;
  const pool = getConnectionPool();

  try {
    // Parse request body once and extract all needed parameters
    const requestBody = await req.json();
    const {
      action,
      limit = 50,
      offset = 0,
      project_name,
      conversation_id,
      searchTerm,
      searchType
    } = requestBody;

    // Get connection from pool
    console.log('Getting MySQL connection from pool...');
    mysqlClient = await pool.getConnection();
    console.log('MySQL connection acquired from pool');

    // Log pool status for monitoring
    const poolStatus = pool.getPoolStatus();
    console.log('Pool status:', poolStatus);

    let result = {};

    switch (action) {
      case 'get_projects': {
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
      }

      case 'get_conversations': {
        console.log(`Fetching conversations for project: ${project_name}`);
        let conversationsQuery = 'SELECT * FROM conversations';
        const queryParams: (string | number)[] = [];

        if (project_name) {
          conversationsQuery += ' WHERE project_name = ?';
          queryParams.push(project_name);
        }

        conversationsQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const conversations = await mysqlClient.query(conversationsQuery, queryParams);

        let countQuery = 'SELECT COUNT(*) as total FROM conversations';
        const countParams: (string | number)[] = [];
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
      }

      case 'get_messages': {
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
      }

      case 'get_stats': {
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
      }

      case 'search': {
        console.log(`Searching for: ${searchTerm} in ${searchType}`);

        let searchQuery: string;
        let searchParams: (string | number)[];

        if (searchType === 'projects') {
          searchQuery = 'SELECT * FROM projects WHERE name LIKE ? OR platform LIKE ? ORDER BY created_at DESC LIMIT ?';
          searchParams = [`%${searchTerm}%`, `%${searchTerm}%`, limit];
        } else if (searchType === 'conversations') {
          searchQuery = 'SELECT * FROM conversations WHERE name LIKE ? OR project_name LIKE ? ORDER BY created_at DESC LIMIT ?';
          searchParams = [`%${searchTerm}%`, `%${searchTerm}%`, limit];
        } else if (searchType === 'messages') {
          searchQuery = 'SELECT m.*, c.name as conversation_name FROM messages m LEFT JOIN conversations c ON m.conversation_id = c.id WHERE m.content LIKE ? ORDER BY m.timestamp DESC LIMIT ?';
          searchParams = [`%${searchTerm}%`, limit];
        } else {
          throw new Error('Invalid search type');
        }

        const searchResults = await mysqlClient.query(searchQuery, searchParams);

        result = {
          data: searchResults,
          searchTerm,
          searchType,
          count: searchResults.length
        };
        break;
      }

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
        pool.releaseConnection(mysqlClient);
        console.log('MySQL connection released to pool');
      } catch (releaseError) {
        console.error('Error releasing MySQL connection:', releaseError);
      }
    }
  }
});
