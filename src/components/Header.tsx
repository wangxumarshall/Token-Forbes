import { Cpu, LogOut, AlertCircle, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginMenu from './LoginMenu';

const SOURCE_REPO_URL = 'https://github.com/wangxumarshall/Token-Forbes';

export default function Header() {
  const { currentUser, login, logout, error, isLoggingIn, activeProvider } = useAuth();
  const displayName =
    currentUser?.displayName ||
    currentUser?.providerData.find((item) => item.displayName)?.displayName ||
    currentUser?.email ||
    'Signed in';

  return (
    <>
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 sm:px-6 md:h-16 md:flex-nowrap md:gap-4 md:py-0 lg:px-8">
          <a href="/" className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
            <Cpu className="w-6 h-6 text-[#D4AF37]" />
            <span className="truncate font-serif text-base font-bold tracking-[0.22em] uppercase text-white sm:text-xl sm:tracking-wider">
              Token <span className="text-[#D4AF37]">Forbes</span>
            </span>
          </a>

          <nav className="hidden md:flex flex-1 justify-center gap-6 text-sm font-medium text-gray-400 items-center">
            <a href="/#rankings" className="text-white hover:text-[#D4AF37] transition-colors">Rankings</a>
            <a href="/#methodology" className="hover:text-white transition-colors">Methodology</a>
            <a href="/#data-engine" className="hover:text-white transition-colors">Data Engine</a>
            <a href="/#submit-proof" className="hover:text-white transition-colors">Submit Proof</a>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href={SOURCE_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10 sm:px-3 sm:text-xs"
              aria-label="Open source repository on GitHub"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">Source</span>
            </a>

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <img 
                    src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=D4AF37&color=000`} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border border-[#D4AF37]/50"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden max-w-[140px] truncate text-white text-sm sm:block">{displayName}</span>
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
              <LoginMenu
                login={login}
                isLoggingIn={isLoggingIn}
                activeProvider={activeProvider}
                label="Login"
                align="right"
                buttonClassName="bg-[#D4AF37] text-black hover:bg-[#b8952b] border-transparent"
              />
            )}
          </div>

          <nav className="no-scrollbar order-last flex w-full gap-2 overflow-x-auto pb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400 md:hidden">
            <a href="/#rankings" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white">Rankings</a>
            <a href="/#methodology" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 hover:text-white">Methodology</a>
            <a href="/#data-engine" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 hover:text-white">Data Engine</a>
            <a href="/#submit-proof" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 hover:text-white">Submit Proof</a>
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
