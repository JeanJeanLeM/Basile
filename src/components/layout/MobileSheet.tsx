import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, ListChecks, Sprout, Bot, Share2, Menu, X } from 'lucide-react';
import UserMenu from './UserMenu';
import { UI_MESSAGES } from '../../utils/constants';

const navigation = [
  { name: UI_MESSAGES.NAV_PLANNING, href: '/planning', icon: Calendar },
  { name: UI_MESSAGES.NAV_TODO, href: '/todo', icon: ListChecks },
  { name: UI_MESSAGES.NAV_CROPS, href: '/crops', icon: Sprout },
  { name: UI_MESSAGES.NAV_BASIL, href: '/basil', icon: Bot },
  { name: UI_MESSAGES.NAV_SHARE, href: '/share', icon: Share2 },
];

export default function MobileSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-white z-50 flex flex-col transform transition-transform">
            <div className="p-4 flex items-center justify-between border-b border-gray-800">
              <h1 className="text-xl font-bold">Basile</h1>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded hover:bg-gray-800"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`
                        }
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <UserMenu isCollapsed={false} />
          </aside>
        </>
      )}
    </>
  );
}
