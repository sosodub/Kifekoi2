import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import TabBar, { TabType } from './TabBar';

interface MainLayoutProps {
  activeTab?: TabType;
  onTabChange: (tab: TabType) => void;
  children: ReactNode;
  onAddTask?: () => void;
}

export default function MainLayout({ activeTab, onTabChange, children, onAddTask }: MainLayoutProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = async () => {
    try {
      setShowMenu(false);
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      alert('Erreur lors de la déconnexion');
    }
  };

  const handleProfile = () => {
    navigate('/profile');
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen bg-k-background">
      <div className="max-w-mobile mx-auto bg-k-background">
        <header className="flex items-center justify-between px-6 py-2">
          <div className="flex-1"></div>
          <img src="/kifekoi logo.png" alt="kifékoi" className="h-16" />
          <div className="flex-1 flex justify-end relative" ref={menuRef}>
            {activeTab ? (
              <>
                <button onClick={() => setShowMenu(!showMenu)} className="p-2" aria-label="Paramètres">
                  <svg
                    className="w-6 h-6 text-gray-900"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={handleProfile}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      Mon foyer
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => navigate('/dashboard')} className="p-2" aria-label="Retour">
                <svg
                  className="w-6 h-6 text-gray-900"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
        </header>

        {activeTab && <TabBar activeTab={activeTab} onTabChange={onTabChange} />}

        <main className="p-4 pb-24">
          {children}
        </main>

        {onAddTask && (
          <button
            onClick={onAddTask}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-k-green-dark rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center text-4xl font-bold hover:scale-110 active:scale-95 transition-all duration-200 hover:bg-k-green-dark border-4 leading-none"
            style={{ color: '#48B700', borderColor: '#48B700' }}
            aria-label="Ajouter une tâche"
          >
            <span className="mb-1">+</span>
          </button>
        )}
      </div>
    </div>
  );
}
