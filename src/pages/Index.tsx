
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, MessageSquare, Search } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            聊天记录管理系统
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            高效管理和搜索您的聊天记录，支持多项目组织和智能检索
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <Search className="h-6 w-6 mr-2" />
                智能搜索
              </CardTitle>
              <CardDescription>
                快速搜索聊天记录内容，支持关键词和上下文匹配
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                强大的搜索功能帮助您快速找到需要的聊天记录和对话内容
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <MessageSquare className="h-6 w-6 mr-2" />
                对话管理
              </CardTitle>
              <CardDescription>
                按项目和时间线组织您的对话记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                清晰的对话结构让您轻松浏览和管理不同项目的聊天记录
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600">
                <Database className="h-6 w-6 mr-2" />
                数据迁移
              </CardTitle>
              <CardDescription>
                从 MySQL 数据库迁移聊天记录到 Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                安全可靠的数据迁移工具，支持批量导入和进度监控
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              开始搜索
            </Button>
            <Button size="lg" variant="outline">
              浏览项目
            </Button>
          </div>
          
          <div className="pt-4">
            <Link to="/migration">
              <Button size="lg" variant="secondary" className="bg-purple-100 hover:bg-purple-200 text-purple-700">
                <Database className="h-5 w-5 mr-2" />
                数据迁移管理
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
