import { useAuth } from '../../hooks/useAuth';
import { LogOut, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UI_MESSAGES } from '../../utils/constants';

interface UserMenuProps {
  isCollapsed: boolean;
}

export default function UserMenu({ isCollapsed }: UserMenuProps) {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="p-4 border-t border-gray-800">
      <div className="mb-3">
        {!isCollapsed && (
          <p className="text-sm text-gray-400 mb-1">
            {user?.email ?? UI_MESSAGES.AUTH_ANONYMOUS}
          </p>
        )}
      </div>

      {isGuest ? (
        <div className="space-y-2">
          {!isCollapsed && (
            <p className="text-xs text-yellow-400 mb-2">
              Créez un compte pour sauvegarder vos données
            </p>
          )}
          <button
            onClick={() => navigate('/signup')}
            className="w-full flex items-center gap-2 p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm"
          >
            <UserPlus className="w-4 h-4" />
            {!isCollapsed && <span>{UI_MESSAGES.AUTH_CREATE_ACCOUNT}</span>}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center gap-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm"
          >
            <LogIn className="w-4 h-4" />
            {!isCollapsed && <span>{UI_MESSAGES.AUTH_SIGN_IN}</span>}
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>{UI_MESSAGES.AUTH_SIGN_OUT}</span>}
        </button>
      )}
    </div>
  );
}
