import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';
import logo from '@/assets/logo.png';

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AppLayoutProps {
  items: NavItem[];
  groupLabel: string;
  roleLabel: string;
  children: ReactNode;
}

const AppSidebar = ({ items, groupLabel, roleLabel }: Omit<AppLayoutProps, 'children'>) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <img src={logo} alt="" className="w-7 h-7 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-heading font-bold text-sm truncate">IF Competition</div>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{roleLabel}</Badge>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => {
                const active = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}
                      tooltip={item.title}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && user?.email && (
          <div className="px-2 py-1 text-xs text-muted-foreground truncate">{user.email}</div>
        )}
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2">
          <LogOut className="w-4 h-4" /> {!collapsed && 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

const AppLayout = ({ items, groupLabel, roleLabel, children }: AppLayoutProps) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar items={items} groupLabel={groupLabel} roleLabel={roleLabel} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-border flex items-center px-3 gap-2 bg-card/80 backdrop-blur">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">{roleLabel}</span>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  </SidebarProvider>
);

export default AppLayout;
