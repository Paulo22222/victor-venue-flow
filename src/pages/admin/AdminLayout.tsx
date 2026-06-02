import { Outlet } from 'react-router-dom';
import AppLayout, { NavItem } from '@/components/layout/AppLayout';
import { LayoutDashboard, Trophy, Users, Shield, ListChecks, MapPin, IdCard } from 'lucide-react';
import { CompetitionProvider } from '@/context/CompetitionContext';

const items: NavItem[] = [
  { title: 'Painel', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Eventos', url: '/admin/events', icon: Trophy },
  { title: 'Equipes', url: '/admin/teams', icon: Users },
  { title: 'Modalidades', url: '/admin/modalities', icon: ListChecks },
  { title: 'Locais', url: '/admin/venues', icon: MapPin },
  { title: 'Crachás', url: '/admin/badges', icon: IdCard },
  { title: 'Usuários', url: '/admin/users', icon: Shield },
];

const AdminLayout = () => (
  <CompetitionProvider>
    <AppLayout items={items} groupLabel="Administração" roleLabel="Administrador">
      <Outlet />
    </AppLayout>
  </CompetitionProvider>
);

export default AdminLayout;
