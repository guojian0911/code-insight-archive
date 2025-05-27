
import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, CheckCircle, AlertCircle, RefreshCw, Pause, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MigrationStats {
  mysql: {
    projects: number;
    conversations: number;
    messages: number;
  };
  supabase: {
    projects: number;
    conversations: number;
    messages: number;
  };
}

interface MigrationProgress {
  currentTable: string;
  totalTables: number;
  currentTableIndex: number;
  totalItems: number;
  migratedItems: number;
  currentBatch: number;
  totalBatches: number;
  errors: number;
  isRunning: boolean;
  isPaused: boolean;
}

const DataMigration: React.FC = () => {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error' | 'paused'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [progress, setProgress] = useState<MigrationProgress>({
    currentTable: '',
    totalTables: 3,
    currentTableIndex: 0,
    totalItems: 0,
    migratedItems: 0,
    currentBatch: 0,
    totalBatches: 0,
    errors: 0,
    isRunning: false,
    isPaused: false
  });
  const { toast } = useToast();

  // 批次大小配置 - 避免CPU过载
  const BATCH_SIZES = {
    projects: 10,      // 项目批次较小
    conversations: 15, // 对话批次中等
    messages: 20       // 消息批次稍大但仍然保守
  };

  const BATCH_DELAYS = {
    projects: 200,     // 项目间延迟200ms
    conversations: 150, // 对话间延迟150ms
    messages: 100      // 消息间延迟100ms
  };

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      setConnectionStatus('checking');
      const { data, error } = await supabase.functions.invoke('migrate-mysql-data', {
        body: { action: 'check_connection' }
      });

      if (error) throw error;

      if (data.mysql_connected && data.supabase_connected) {
        setConnectionStatus('connected');
        await getStats();
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('error');
      toast({
        title: "连接失败",
        description: "无法连接到 MySQL 数据库，请检查配置",
        variant: "destructive",
      });
    }
  };

  const getStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('migrate-mysql-data', {
        body: { action: 'get_stats' }
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Failed to get stats:', error);
      toast({
        title: "获取统计失败",
        description: "无法获取数据库统计信息",
        variant: "destructive",
      });
    }
  };

  const clearData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('migrate-mysql-data', {
        body: { action: 'clear_data' }
      });

      if (error) throw error;
      
      toast({
        title: "数据清理完成",
        description: "Supabase 中的现有数据已清理",
      });
      
      await getStats();
    } catch (error) {
      console.error('Clear data failed:', error);
      toast({
        title: "清理失败",
        description: "清理数据时出现错误",
        variant: "destructive",
      });
    }
  };

  const migrateBatch = async (table: string, offset: number, batchSize: number) => {
    const { data, error } = await supabase.functions.invoke('migrate-mysql-data', {
      body: { 
        action: 'migrate_batch',
        table,
        batchOffset: offset,
        batchLimit: batchSize
      }
    });

    if (error) throw error;
    return data;
  };

  const startMigration = async () => {
    if (!stats) return;

    try {
      setMigrationStatus('migrating');
      
      // 先清理数据
      await clearData();
      
      const tables = [
        { name: 'projects', total: stats.mysql.projects },
        { name: 'conversations', total: stats.mysql.conversations },
        { name: 'messages', total: stats.mysql.messages }
      ];

      let totalMigrated = 0;
      let totalErrors = 0;

      for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
        const table = tables[tableIndex];
        const batchSize = BATCH_SIZES[table.name as keyof typeof BATCH_SIZES];
        const delay = BATCH_DELAYS[table.name as keyof typeof BATCH_DELAYS];
        const totalBatches = Math.ceil(table.total / batchSize);
        
        setProgress(prev => ({
          ...prev,
          currentTable: table.name,
          currentTableIndex: tableIndex,
          totalItems: table.total,
          migratedItems: 0,
          currentBatch: 0,
          totalBatches,
          isRunning: true
        }));

        let offset = 0;
        let batchIndex = 0;
        let tableMigrated = 0;

        while (offset < table.total && migrationStatus !== 'paused') {
          try {
            const result = await migrateBatch(table.name, offset, batchSize);
            
            tableMigrated += result.migrated;
            totalMigrated += result.migrated;
            totalErrors += result.errors;
            batchIndex++;

            setProgress(prev => ({
              ...prev,
              migratedItems: tableMigrated,
              currentBatch: batchIndex,
              errors: totalErrors
            }));

            toast({
              title: `${table.name} 批次 ${batchIndex}/${totalBatches} 完成`,
              description: `迁移 ${result.migrated} 条记录，${result.errors} 个错误`,
            });

            if (result.completed) break;
            
            offset += batchSize;
            
            // 批次间延迟，避免CPU过载
            await new Promise(resolve => setTimeout(resolve, delay));
            
          } catch (error) {
            console.error(`Batch migration error for ${table.name}:`, error);
            totalErrors++;
            break;
          }
        }
      }

      setMigrationStatus('completed');
      setProgress(prev => ({ ...prev, isRunning: false }));
      
      await getStats();

      toast({
        title: "迁移完成",
        description: `总共迁移 ${totalMigrated} 条记录，${totalErrors} 个错误`,
      });

    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus('error');
      setProgress(prev => ({ ...prev, isRunning: false }));
      toast({
        title: "迁移失败",
        description: error.message || "数据迁移过程中出现错误",
        variant: "destructive",
      });
    }
  };

  const pauseMigration = () => {
    setMigrationStatus('paused');
    setProgress(prev => ({ ...prev, isPaused: true, isRunning: false }));
  };

  const resumeMigration = () => {
    setMigrationStatus('migrating');
    setProgress(prev => ({ ...prev, isPaused: false, isRunning: true }));
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'checking':
        return <Badge variant="secondary">检查中...</Badge>;
      case 'connected':
        return <Badge variant="default" className="bg-green-500">已连接</Badge>;
      case 'error':
        return <Badge variant="destructive">连接失败</Badge>;
    }
  };

  const getMigrationStatusIcon = () => {
    switch (migrationStatus) {
      case 'idle':
        return <Database className="h-5 w-5" />;
      case 'migrating':
        return <RefreshCw className="h-5 w-5 animate-spin" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getOverallProgress = () => {
    if (!stats) return 0;
    const total = stats.mysql.projects + stats.mysql.conversations + stats.mysql.messages;
    if (total === 0) return 0;
    
    const currentTableProgress = progress.totalItems > 0 ? (progress.migratedItems / progress.totalItems) : 0;
    const completedTablesProgress = progress.currentTableIndex / progress.totalTables;
    const currentTableWeight = 1 / progress.totalTables;
    
    return Math.round((completedTablesProgress + currentTableWeight * currentTableProgress) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">MySQL 数据迁移</h2>
        {getConnectionStatusBadge()}
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            连接状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded">
              <div className="text-lg font-semibold text-blue-600">MySQL</div>
              <div className="text-sm text-muted-foreground">
                {connectionStatus === 'connected' ? '已连接' : connectionStatus === 'error' ? '连接失败' : '检查中...'}
              </div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-lg font-semibold text-green-600">Supabase</div>
              <div className="text-sm text-muted-foreground">已连接</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>数据统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-blue-600">MySQL (源数据库)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>项目:</span>
                    <span className="font-semibold">{stats.mysql.projects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>对话:</span>
                    <span className="font-semibold">{stats.mysql.conversations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>消息:</span>
                    <span className="font-semibold">{stats.mysql.messages}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-green-600">Supabase (目标数据库)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>项目:</span>
                    <span className="font-semibold">{stats.supabase.projects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>对话:</span>
                    <span className="font-semibold">{stats.supabase.conversations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>消息:</span>
                    <span className="font-semibold">{stats.supabase.messages}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {getMigrationStatusIcon()}
            <span className="ml-2">数据迁移</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {progress.isRunning && (
            <div className="space-y-4">
              {/* 总体进度 */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>总体进度</span>
                  <span>{getOverallProgress()}%</span>
                </div>
                <Progress value={getOverallProgress()} className="h-2" />
              </div>

              {/* 当前表进度 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">当前表: {progress.currentTable}</span>
                  <Badge variant="secondary">
                    批次 {progress.currentBatch}/{progress.totalBatches}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>已迁移: {progress.migratedItems}/{progress.totalItems}</span>
                  <span>错误: {progress.errors}</span>
                </div>
                <Progress 
                  value={progress.totalItems > 0 ? (progress.migratedItems / progress.totalItems) * 100 : 0} 
                  className="h-2"
                />
              </div>

              {/* 批次设置信息 */}
              <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
                <div className="font-medium mb-1">批次设置 (优化CPU使用):</div>
                <div>项目: {BATCH_SIZES.projects} 条/批次, {BATCH_DELAYS.projects}ms 延迟</div>
                <div>对话: {BATCH_SIZES.conversations} 条/批次, {BATCH_DELAYS.conversations}ms 延迟</div>
                <div>消息: {BATCH_SIZES.messages} 条/批次, {BATCH_DELAYS.messages}ms 延迟</div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            {!progress.isRunning && migrationStatus !== 'paused' && (
              <Button
                onClick={startMigration}
                disabled={connectionStatus !== 'connected'}
                className="flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                开始迁移
              </Button>
            )}

            {progress.isRunning && (
              <Button
                onClick={pauseMigration}
                variant="outline"
                className="flex items-center"
              >
                <Pause className="h-4 w-4 mr-2" />
                暂停迁移
              </Button>
            )}

            {migrationStatus === 'paused' && (
              <Button
                onClick={resumeMigration}
                className="flex items-center"
              >
                <Play className="h-4 w-4 mr-2" />
                继续迁移
              </Button>
            )}

            <Button
              variant="outline"
              onClick={clearData}
              disabled={connectionStatus !== 'connected' || progress.isRunning}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              清理数据
            </Button>

            <Button
              variant="outline"
              onClick={getStats}
              disabled={connectionStatus !== 'connected'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新统计
            </Button>

            <Button
              variant="outline"
              onClick={checkConnections}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              检查连接
            </Button>
          </div>

          {migrationStatus === 'completed' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700 font-medium">迁移完成！</span>
              </div>
              <p className="text-green-600 text-sm mt-1">
                所有数据已成功从 MySQL 迁移到 Supabase
              </p>
            </div>
          )}

          {migrationStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">迁移失败</span>
              </div>
              <p className="text-red-600 text-sm mt-1">
                请检查连接设置和错误日志
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataMigration;
