import { NavLink } from 'react-router-dom';
import { Calendar, ListChecks, Sprout, Bot, Share2, Menu } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import UserMenu from './UserMenu';
import { UI_MESSAGES } from '../../utils/constants';

const navigation = [
  { name: UI_MESSAGES.NAV_PLANNING, href: '/planning', icon: Calendar },
  { name: UI_MESSAGES.NAV_TODO, href: '/todo', icon: ListChecks },
  { name: UI_MESSAGES.NAV_CROPS, href: '/crops', icon: Sprout },
  { name: UI_MESSAGES.NAV_BASIL, href: '/basil', icon: Bot },
  { name: UI_MESSAGES.NAV_SHARE, href: '/share', icon: Share2 },
];

export default function Sidebar() {
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } flex flex-col`}
    >
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && <h1 className="text-xl font-bold">Basile</h1>}
        <button
          onClick={toggle}
          className="p-2 rounded hover:bg-gray-800"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <UserMenu isCollapsed={isCollapsed} />
    </aside>
  );
}
