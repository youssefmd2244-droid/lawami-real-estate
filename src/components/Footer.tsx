import { Phone, Mail, MapPin, ExternalLink, ShieldAlert } from 'lucide-react';
import { translations } from '../data/translations';

interface FooterProps {
  lang: 'ar' | 'en';
  onNavClick: (id: string) => void;
  whatsappNumber: string;
  callNumber: string;
  addressAr: string;
  addressEn: string;
}

export default function Footer({
  lang,
  onNavClick,
  whatsappNumber,
  callNumber,
  addressAr,
  addressEn
}: FooterProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const date = new Date().getFullYear();

  return (
    <footer
      id="main-footer"
      className="bg-black border-t border-gold-soft/50 pt-16 pb-8 text-gray-400"
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 font-sans border-b border-zinc-900 pb-12 mb-8">
          
          {/* Column 1: Brand Pitch */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 border border-gold-400 rotate-45 bg-black">
                <span className="font-bold -rotate-45 font-serif text-gold-400 text-xs">ل</span>
              </div>
              <span className="font-serif font-bold text-lg text-white">
                {t.brand_name}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400">
              {lang === 'ar' ? 'السمو في الاختيار والنزاهة في الإرساء والريادة العقارية في قلب العاصمة الرياض.' : 'The height of custom curation and elite portfolio transactions inside Riyadh.'}
            </p>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="space-y-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
            <h4 className="font-serif text-sm font-bold text-white mb-2">{lang === 'ar' ? 'روابط سريعة' : 'Quick Navigation'}</h4>
            <ul className="space-y-2 font-normal lowercase tracking-normal">
              <li>
                <button
                  onClick={() => onNavClick('home')}
                  className="hover:text-gold-400 transition-colors cursor-pointer"
                >
                  {t.menu_home}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('properties')}
                  className="hover:text-gold-400 transition-colors cursor-pointer"
                >
                  {t.menu_properties}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('about')}
                  className="hover:text-gold-400 transition-colors cursor-pointer"
                >
                  {t.menu_about}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('contact')}
                  className="hover:text-gold-400 transition-colors cursor-pointer"
                >
                  {t.menu_contact}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact coordinates */}
          <div className="space-y-4 text-xs">
            <h4 className="font-serif text-sm font-bold text-white mb-2">{lang === 'ar' ? 'بيانات التواصل' : 'Contact Details'}</h4>
            <ul className="space-y-3 font-normal text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="text-gold-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{lang === 'ar' ? addressAr : addressEn}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-gold-400" />
                <a href={`tel:${callNumber}`} className="hover:text-gold-400 transition-colors">
                  {callNumber}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-gold-400" />
                <a href="mailto:info@lawami.com.sa" className="hover:text-gold-400 transition-colors">
                  info@lawami.com.sa
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legals & credentials */}
          <div className="space-y-4 text-xs">
            <h4 className="font-serif text-sm font-bold text-white mb-2">{lang === 'ar' ? 'النزاهة القانونية' : 'Legals & Licenses'}</h4>
            <p className="leading-relaxed text-zinc-500">
              {lang === 'ar' ? 'مرخصين برقم رخصة فال العقارية الرسمية لدى الهيئة العامة للعقار بالملكة.' : 'Fully accredited under official VAL Saudi real estate licenses regulation.'}
            </p>
            <div className="space-y-1.5 flex flex-col text-[10px] uppercase font-bold tracking-widest font-sans">
              <a href="#privacy" className="hover:text-gold-400 transition-colors">
                🔐 {t.privacy_policy}
              </a>
              <a href="#terms" className="hover:text-gold-400 transition-colors">
                📜 {t.terms_conditions}
              </a>
            </div>
          </div>

        </div>

        {/* Closing elements */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-normal">
          <div>
            <span>{t.rights_reserved} {date}</span>
          </div>

          {/* THE MASTER RULE LINK */}
          <div className="text-center sm:text-right mt-2 sm:mt-0">
            <a
              href="https://icon-code.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide text-zinc-500 hover:text-gold-400 transition-colors duration-300 font-sans"
            >
              <span>{t.developed_by_prefix}</span>
              <span className="font-bold text-gold-400 relative group">
                {t.developed_by_link}
                <span className="absolute left-0 bottom-0 w-full h-[1px] bg-gold-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </span>
              <ExternalLink size={10} className="text-gold-400" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
