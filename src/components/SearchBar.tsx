
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resultCount: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, onSearchChange, resultCount }) => {
  return (
    <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索项目名称、平台、路径..."
            value={searchQuery}
            onChange={onSearchChange}
            className="pl-10 h-12 text-base"
          />
          {searchQuery && (
            <div className="absolute right-3 top-3 text-sm text-muted-foreground">
              {resultCount} 个结果
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchBar;
