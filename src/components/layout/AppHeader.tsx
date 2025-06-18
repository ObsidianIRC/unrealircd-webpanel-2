import { useState, useEffect, useRef } from 'react';
import { Search, Moon, Sun, User, LogOut, Bell, Hash, Users as UsersIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

interface SearchResult {
  type: 'user' | 'channel' | 'server';
  name: string;
  description: string;
  data: unknown;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    logout();
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearchLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setSearchResults(data.results || []);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const handleSearchSelect = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    // TODO: Navigate to the selected item
    console.log('Selected:', result);
  };

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UsersIcon className="h-4 w-4" />;
      case 'channel':
        return <Hash className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <SidebarTrigger />

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users, channels, servers..."
                  value={searchQuery}
                  onChange={(e) => {
                    handleSearchChange(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  className="pl-9"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search users, channels, servers..."
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                />
                <CommandList>
                  {isSearchLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <CommandGroup heading="Results">
                        {searchResults.slice(0, 10).map((result, index) => (
                          <CommandItem
                            key={`${result.type}-${result.name}-${index}`}
                            onSelect={() => handleSearchSelect(result)}
                            className="flex items-center gap-2"
                          >
                            {getSearchIcon(result.type)}
                            <div className="flex-1">
                              <div className="font-medium">{result.name}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {result.description}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {searchResults.length > 10 && (
                        <div className="p-2 text-sm text-muted-foreground text-center border-t">
                          {searchResults.length - 10} more results...
                        </div>
                      )}
                    </>
                  ) : searchQuery ? (
                    <CommandEmpty>No results found.</CommandEmpty>
                  ) : null}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          {/* Network Status Badge */}
          <Badge variant="outline" className="text-green-600 border-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-1" />
            Online
          </Badge>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0">
              3
            </Badge>
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
