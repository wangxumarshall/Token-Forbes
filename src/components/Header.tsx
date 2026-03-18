import { Cpu, LogOut, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { currentUser, login, logout, error, isLoggingIn } = useAuth();

  return (
    <>
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#D4AF37]" />
            <span className="font-serif text-xl font-bold tracking-wider uppercase text-white">
              Token <span className="text-[#D4AF37]">Forbes</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400 items-center">
            <a href="#rankings" className="text-white hover:text-[#D4AF37] transition-colors">Rankings</a>
            <a href="#methodology" className="hover:text-white transition-colors">Methodology</a>
            <a href="#data-engine" className="hover:text-white transition-colors">Data Engine</a>
            <a href="#submit-proof" className="hover:text-white transition-colors">Submit Proof</a>
            
            <div className="h-4 w-px bg-white/20 mx-2"></div>
            
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img 
                    src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'User'}&background=D4AF37&color=000`} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border border-[#D4AF37]/50"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-white text-sm">{currentUser.displayName}</span>
                </div>
                <button 
                  onClick={logout}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                disabled={isLoggingIn}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
              >
                {isLoggingIn && <Loader2 className="w-3 h-3 animate-spin" />}
                {isLoggingIn ? 'Signing In...' : 'Sign In'}
              </button>
            )}
          </nav>
        </div>
      </header>
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}
    </>
  );
}
