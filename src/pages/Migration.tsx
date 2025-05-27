
import React from 'react';
import DataMigration from '@/components/DataMigration';

const Migration = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            数据迁移管理
          </h1>
          <p className="text-muted-foreground text-lg">
            从 MySQL 数据库迁移聊天记录到 Supabase
          </p>
        </div>

        <DataMigration />
      </div>
    </div>
  );
};

export default Migration;
