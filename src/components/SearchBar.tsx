
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
    <Card className="ui-card mb-6">
      <CardContent className="card-spacing">
        <div className="relative">
          {/* Search icon with proper positioning and color */}
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          
          {/* Input field with consistent styling */}
          <Input
            placeholder="搜索项目名称、平台、路径..."
            value={searchQuery}
            onChange={onSearchChange}
            className="ui-input pl-10 h-12 text-base bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary transition-all duration-200"
            aria-label="搜索项目"
          />
          
          {/* Results count with proper contrast */}
          {searchQuery && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground bg-background px-2 py-1 rounded">
              {resultCount} 个结果
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchBar;
