import { useEffect, useState } from 'react';
import { Menu, X, Globe, Moon, Sun, Shield } from 'lucide-react';
import { translations } from '../data/translations';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  onOpenAdmin: () => void;
  onOpenCompare: () => void;
  compareCount: number;
}

export default function Header({
  lang,
  setLang,
  darkMode,
  setDarkMode,
  activeSection,
  setActiveSection,
  onOpenAdmin,
  onOpenCompare,
  compareCount
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Background blur trigger
      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Sticky hide/reveal mechanism (Hide on scroll down, reveal on scroll up)
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setVisible(false); // scrolling down
      } else {
        setVisible(true); // scrolling up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { id: 'home', label: t.menu_home },
    { id: 'properties', label: t.menu_properties },
    { id: 'about', label: t.menu_about },
    { id: 'contact', label: t.menu_contact }
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isRtl = lang === 'ar';

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      } ${
        scrolled
          ? 'bg-black/85 backdrop-blur-md border-b border-gold-soft py-3'
          : 'bg-transparent py-5'
      }`}
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo & Title with RPG magical glowing and spinning icons */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-4 group text-left"
          >
            <div className="relative w-11 h-11 flex items-center justify-center">
              {/* Outer RPG dash spinner that rotates continuously */}
              <div className="absolute inset-0 border border-dashed border-gold-400/50 rounded-full animate-rpg-ring-cw scale-102" />
              <div className="absolute inset-1 border border-double border-gold-500/20 rounded-full animate-rpg-ring-ccw scale-110" />
              {/* Inner glowing core that blinks on/off (glow pulse) */}
              <div className="absolute inset-2 rounded-full rpg-glow-gold opacity-50" />
              
              {/* Actual core emblem shape */}
              <div className="relative z-10 w-8 h-8 bg-zinc-950 border border-gold-400/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <span className="font-serif font-black text-sm text-gold-300 animate-pulse">
                  {lang === 'ar' ? 'ل' : 'L'}
                </span>
              </div>
            </div>
            <div>
              <span className="block font-serif font-bold text-lg sm:text-xl tracking-wider text-white transition-colors duration-300 group-hover:text-gold-300">
                {t.brand_name}
              </span>
              <span className="block text-[9px] tracking-widest text-gold-400/80 uppercase font-sans">
                {lang === 'ar' ? 'عقارات نخبوية بالرياض' : 'Elite Riyadh Estates'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 space-x-reverse">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 rounded ${
                  activeSection === item.id
                    ? 'text-gold-400 border-b border-gold-400/50 bg-gold-400/5'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Practical Actions Menu */}
          <div className="hidden md:flex items-center gap-3">
            {/* Project Comparison count */}
            <button
              id="compare-trigger-btn"
              onClick={onOpenCompare}
              className="relative p-2 rounded-full border border-gold-soft hover:bg-gold-400/10 text-gray-300 hover:text-gold-300 transition-colors duration-300"
              title={t.menu_compare}
            >
              <span className="text-xs font-semibold px-1">{t.menu_compare}</span>
              {compareCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-500 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center pulse-gold">
                  {compareCount}
                </span>
              )}
            </button>

            {/* Language switch */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold-soft text-xs text-gray-300 hover:bg-gold-400/10 hover:text-gold-300 transition-colors duration-300 font-medium"
            >
              <Globe size={14} />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Admin toggle door */}
            <button
              id="admin-login-door"
              onClick={onOpenAdmin}
              className="p-2 rounded-full border border-gold-soft text-gray-400 hover:text-gold-400 hover:bg-gold-400/10 transition-colors"
              title={t.admin_login_title}
            >
              <Shield size={16} />
            </button>
          </div>

          {/* Handheld menu toggle button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="p-2 rounded border border-gold-soft text-gray-300"
            >
              <Globe size={16} />
            </button>

            <button
              id="compare-trigger-mobile"
              onClick={onOpenCompare}
              className="relative p-2 rounded border border-gold-soft text-gray-300"
            >
              <span className="text-xs">{compareCount > 0 ? `(${compareCount})` : ''} ⚖️</span>
            </button>

            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-gold-400 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Handheld Slider Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-lg border-b border-gold-soft px-4 pt-3 pb-6 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-right ${isRtl ? 'text-right' : 'text-left'} px-4 py-3 text-base font-medium rounded transition-all duration-300 ${
                activeSection === item.id
                  ? 'bg-gold-500/10 text-gold-400 border-r-2 border-gold-500'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-gold-soft/50 flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300"
            >
              <Shield size={16} />
              <span>{t.admin_btn}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
