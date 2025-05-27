import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
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

const DataMigration: React.FC = () => {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

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

  const startMigration = async () => {
    try {
      setMigrationStatus('migrating');
      setMigrationProgress(0);
      setCurrentStep('开始迁移...');

      const { data, error } = await supabase.functions.invoke('migrate-mysql-data', {
        body: { action: 'migrate_all' }
      });

      if (error) throw error;

      setMigrationProgress(100);
      setCurrentStep('迁移完成');
      setMigrationStatus('completed');
      
      await getStats(); // Refresh stats

      toast({
        title: "迁移成功",
        description: `成功迁移 ${data.projects} 个项目、${data.conversations} 个对话、${data.messages} 条消息`,
      });

    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus('error');
      toast({
        title: "迁移失败",
        description: error.message || "数据迁移过程中出现错误",
        variant: "destructive",
      });
    }
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
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
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
          {migrationStatus === 'migrating' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{migrationProgress}%</span>
              </div>
              <Progress value={migrationProgress} />
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={startMigration}
              disabled={connectionStatus !== 'connected' || migrationStatus === 'migrating'}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              {migrationStatus === 'migrating' ? '迁移中...' : '开始迁移'}
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
