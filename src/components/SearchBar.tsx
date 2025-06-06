
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
    <Card className="ui-card mb-6 border-0 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="relative">
          {/* Search icon with improved positioning and styling */}
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70 pointer-events-none" aria-hidden="true" />
          
          {/* Enhanced input field with better styling */}
          <Input
            placeholder="搜索项目名称、平台、路径..."
            value={searchQuery}
            onChange={onSearchChange}
            className="ui-input pl-12 pr-20 h-14 text-base bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md focus:shadow-md"
            aria-label="搜索项目"
          />
          
          {/* Results count with enhanced styling */}
          {searchQuery && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground/80 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/30 backdrop-blur-sm">
              <span className="font-medium">{resultCount}</span> 个结果
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchBar;
