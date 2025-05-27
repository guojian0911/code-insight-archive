
import React, { useState, useEffect } from 'react';
import { Database, Tabs, TabsList, TabsTrigger } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs as UITabs, TabsContent } from '@/components/ui/tabs';
import MySQLDataViewer from './MySQLDataViewer';

const DataMigration: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">数据库管理</h2>
      </div>

      <UITabs defaultValue="mysql" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mysql">MySQL 数据查看</TabsTrigger>
          <TabsTrigger value="migration">数据迁移</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mysql" className="space-y-4">
          <MySQLDataViewer />
        </TabsContent>
        
        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                数据迁移功能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                数据迁移功能暂时不可用。请使用 MySQL 数据查看功能来浏览数据库中的数据。
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </UITabs>
    </div>
  );
};

export default DataMigration;
