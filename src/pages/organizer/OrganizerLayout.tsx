import { Outlet } from 'react-router-dom';
import AppLayout, { NavItem } from '@/components/layout/AppLayout';
import { LayoutDashboard, Users } from 'lucide-react';

const items: NavItem[] = [
  { title: 'Painel', url: '/organizer/dashboard', icon: LayoutDashboard },
  { title: 'Minhas Equipes', url: '/organizer/teams', icon: Users },
];

const OrganizerLayout = () => (
  <AppLayout items={items} groupLabel="Organização" roleLabel="Organizador">
    <Outlet />
  </AppLayout>
);

export default OrganizerLayout;
