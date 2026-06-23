import { useEffect, useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Building, Phone, MessageCircle, MapPin, Search, ChevronRight, 
  ChevronLeft, Sparkles, SlidersHorizontal, ArrowUpRight, Scale, Star, Share2, Mail, Info, ShieldCheck
} from 'lucide-react';
import { translations } from './data/translations';
import { Property, WebsiteSettings } from './types';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import SmartSearchPanel from './components/SmartSearchPanel';
import PropertyDetailsModal from './components/PropertyDetailsModal';
import PropertyComparison from './components/PropertyComparison';
import AdminCRM from './components/AdminCRM';
import Footer from './components/Footer';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState('home');

  // Core Data States
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  // Filter values
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(40000000);
  const [searchText, setSearchText] = useState<string>('');

  // AI Smart search override state
  const [smartSearchResults, setSmartSearchResults] = useState<Property[] | null>(null);
  const [smartSearchSummary, setSmartSearchSummary] = useState<{ ar: string; en: string } | null>(null);

  // Comparison State
  const [comparedProperties, setComparedProperties] = useState<Property[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Selected Detail State
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Admin access state
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Testimonial Carousel indices
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const t = translations[lang];

  // Auto-redirect to admin if secure path exists in hash or URL (unauthorised prevention is handled appropriately)
  useEffect(() => {
    if (window.location.pathname.includes('lawami-control-panel-8x92x-secure') || window.location.hash.includes('control-panel')) {
      setIsAdminOpen(true);
    }
  }, []);

  // Fetch initial properties and platform settings
  useEffect(() => {
    fetchProperties();
    fetchSettings();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties');
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
        setFilteredProperties(data);
      }
    } catch (e) {
      console.warn('Network offline or error fetching properties.', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.warn('Using offline settings fallback.');
    }
  };

  // Run dynamic listings filter matching
  useEffect(() => {
    if (smartSearchResults !== null) {
      // If AI Smart results are active, list them
      setFilteredProperties(smartSearchResults);
      return;
    }

    let results = properties;

    if (selectedType !== 'all') {
      results = results.filter(p => p.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      results = results.filter(p => p.status === selectedStatus);
    }

    if (priceRange) {
      results = results.filter(p => p.price <= priceRange);
    }

    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      results = results.filter(
        p => 
          p.title_ar.toLowerCase().includes(query) ||
          p.title_en.toLowerCase().includes(query) ||
          p.district_ar.toLowerCase().includes(query) ||
          p.district_en.toLowerCase().includes(query) ||
          p.region_ar.toLowerCase().includes(query) ||
          p.region_en.toLowerCase().includes(query)
      );
    }

    setFilteredProperties(results);
  }, [properties, selectedType, selectedStatus, priceRange, searchText, smartSearchResults]);

  // Click tracking statistics triggers
  const handleTrackMetric = async (propertyId: string, metric: 'whatsapp' | 'call') => {
    try {
      await fetch('/api/properties/click-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, metric })
      });
      // Increment locally to avoid lag
      setProperties(prev => prev.map(p => {
        if (p.id === propertyId) {
          return {
            ...p,
            whatsappClicks: metric === 'whatsapp' ? (p.whatsappClicks || 0) + 1 : p.whatsappClicks,
            callClicks: metric === 'call' ? (p.callClicks || 0) + 1 : p.callClicks
          };
        }
        return p;
      }));
    } catch (e) {
      console.log('Telemetry coordinate omitted.');
    }
  };

  // Increment view coordinates
  const triggerIncrementView = async (p: Property) => {
    setSelectedProperty(p);
    try {
      await fetch(`/api/properties/${p.id}/view`, { method: 'POST' });
      // Update locally
      setProperties(prev => prev.map(item => {
        if (item.id === p.id) {
          return { ...item, viewsCount: (item.viewsCount || 0) + 1 };
        }
        return item;
      }));
    } catch (e) {
      console.warn(e);
    }
  };

  // Contact form dispatcher
  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !contactMessage) return;

    setContactLoading(true);
    try {
      const res = await fetch('/api/properties/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
          subject: contactSubject || 'طلب استشارة عقارية عامة',
          message: contactMessage
        })
      });

      if (res.ok) {
        setContactSuccess(true);
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
        setTimeout(() => setContactSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setContactLoading(false);
    }
  };

  // Compare listings operations
  const handleAddToCompare = (p: Property) => {
    if (comparedProperties.some(item => item.id === p.id)) {
      setComparedProperties(comparedProperties.filter(item => item.id !== p.id));
    } else {
      if (comparedProperties.length >= 3) {
        alert(lang === 'ar' ? 'يمكنك مقارنة 3 عقارات بحد أقصى.' : 'You can compare up to 3 properties maximum.');
        return;
      }
      setComparedProperties([...comparedProperties, p]);
    }
  };

  // Auto rotate testimonials index
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const dummyTestimonials = [
    {
      name_ar: 'الشيخ عبدالرحمن آل سعود',
      name_en: 'Sheikh Abdulrahman Al-Saud',
      role_ar: 'مستثمر ورائد أعمال',
      role_en: 'Corporate Investor',
      quote_ar: 'تعامل راقي وخدمة حصرية تليق بمتطلبات الصفقات العقارية الكبرى. محفظة لوامع ممتازة وفريدة من نوعها في شمال الرياض.',
      quote_en: 'Exquisite treatment and discrete advisory perfect for high-net-worth acquisitions. Incredibly curated portfolios inside North Riyadh.'
    },
    {
      name_ar: 'المهندس ياسر الغامدي',
      name_en: 'Yasser Al-Ghamdi',
      role_ar: 'رئيس تنفيذي لشركة استشارات هندسية',
      role_en: 'Engineering CEO',
      quote_ar: 'لا يبحثون عن إتمام البيع السريع بقدر اهتمامهم بالملائمة البنيوية والهندسية للمشروع السكني، ثقة وأمانة نادرة.',
      quote_en: 'Their focus lies in architectural suitability rather than rapid sales closure. Complete transparency and engineering integrity.'
    },
    {
      name_ar: 'الأستاذة سارة الشريف',
      name_en: 'Sarah Al-Sharif',
      role_ar: 'سيدة أعمال ومستثمرة عقارية',
      role_en: 'Private Portfolio Specialist',
      quote_ar: 'منحتني جولة الذكاء الاصطناعي ميزة استباقية بالغة السرعة للعثور على المسكن المثالي لعائلتي، تجربة فريدة ورائعة.',
      quote_en: 'The interactive smart search utility speed-matched the perfect residency coordinates for my household. Spectacular platform.'
    }
  ];

  const whatsappRoute = settings?.whatsapp_number || '+966500000000';
  const phoneRoute = settings?.call_number || '+966500000000';

  const isRtl = lang === 'ar';

  return (
    <div className="bg-luxury-dark min-h-screen text-gray-200 overflow-x-hidden selection:bg-gold-500 selection:text-black relative">
      
      {/* Cinematic Live-moving Video-like Background Aura Nodes with optimized hardware acceleration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none opacity-80" style={{ transform: 'translate3d(0,0,0)' }}>
        <div className="absolute top-[10%] left-[-15%] w-[450px] h-[450px] bg-gold-500/10 rounded-full filter blur-[90px] animate-video-aura-1 will-change-transform" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-amber-500/8 rounded-full filter blur-[100px] animate-video-aura-2 will-change-transform" />
        <div className="absolute bottom-[10%] left-[10%] w-[450px] h-[450px] bg-emerald-500/5 rounded-full filter blur-[95px] animate-video-aura-3 will-change-transform" />
      </div>
      
      {/* Luxurious navigational header */}
      <Header
        lang={lang}
        setLang={setLang}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        compareCount={comparedProperties.length}
      />

      {/* Parallax dynamic particles Hero banner */}
      <HeroSection
        lang={lang}
        onBrowseClick={() => {
          const listings = document.getElementById('properties');
          if (listings) listings.scrollIntoView({ behavior: 'smooth' });
        }}
        onSearchFocus={() => {
          const searchIn = document.getElementById('smart-search-input');
          if (searchIn) {
            searchIn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            searchIn.focus();
          }
        }}
      />

      {/* Core main app containers */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">

        {/* ESTATES PORTFOLIO & SELECTION COMPONENT */}
        <motion.section
          id="properties"
          className="space-y-10 scroll-mt-24"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7 }}
        >
          
          <div className="text-center space-y-3">
            <h2 className="font-serif font-bold text-2xl sm:text-4xl text-white">
              {lang === 'ar' ? 'محفظة العقارات الحصرية' : 'The Flagship Portfolio'}
            </h2>
            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-gray-400 font-light leading-relaxed">
              {lang === 'ar' ? 'مجموعة منتقاة بعناية فائقة لتستعرض نخبة الفلل والقصور السكنية في الرياض.' : 'A handpicked ledger representing true architectural grandeur.'}
            </p>
          </div>

          {/* Prompt Natural AI search console */}
          <SmartSearchPanel
            lang={lang}
            onSearchResult={(res, sum) => {
              setSmartSearchResults(res);
              setSmartSearchSummary(sum);
            }}
            onClear={() => {
              setSmartSearchResults(null);
              setSmartSearchSummary(null);
            }}
          />

          {/* AI OVERRIDE ALERT RESET */}
          {smartSearchResults !== null && (
            <div className="p-4 bg-gold-400/10 border border-gold-400/40 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} className="text-gold-400" />
                <span className="text-xs text-gold-300 font-medium">
                  {lang === 'ar' ? 'أنت تستعرض حالياً الاقتراحات المُرشحة بواسطة الذكاء الاصطناعي.' : 'Now visualizing elite recommendations parsed from your plain text query.'}
                </span>
              </div>
              <button
                onClick={() => {
                  setSmartSearchResults(null);
                  setSmartSearchSummary(null);
                }}
                className="px-4 py-1.5 bg-gold-gradient text-black rounded font-bold text-[10px] uppercase cursor-pointer"
              >
                {lang === 'ar' ? 'الرجوع للملف الكامل المعياري 🔄' : 'Reset back to full database'}
              </button>
            </div>
          )}

          {/* CLASSIC CRITERIA FILTER BAR */}
          {smartSearchResults === null && (
            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-gold-400">
                <SlidersHorizontal size={14} />
                <span className="text-xs uppercase font-serif tracking-widest">{t.filter_search}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Search Text */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={t.search_district}
                    className="w-full bg-black/60 border border-zinc-800 focus:border-gold-400 text-white rounded p-2.5 text-xs focus:outline-none"
                  />
                  <Search size={14} className="absolute right-3 top-3.5 text-zinc-500" />
                </div>

                {/* Property Type Dropdown */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-black/60 text-xs text-white border border-zinc-800 rounded p-2.5 focus:outline-none"
                >
                  <option value="all">{lang === 'ar' ? 'كافة التصنيفات المعمارية' : 'All Architectural classes'}</option>
                  <option value="villa">{lang === 'ar' ? 'فلل ذكية سكنية' : 'Smart Villas'}</option>
                  <option value="palace">{lang === 'ar' ? 'قصور وفلل رئاسية' : 'Sovereign Palaces'}</option>
                  <option value="apartment">{lang === 'ar' ? 'شقق فاخرة ريزيدنس' : 'Luxury Residency Apartments'}</option>
                  <option value="penthouse">{lang === 'ar' ? 'بنتهاوس مع إطلالات حرة' : 'Elite Sky Penthouses'}</option>
                </select>

                {/* Property Status Dropdown */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-black/60 text-xs text-white border border-zinc-800 rounded p-2.5 focus:outline-none"
                >
                  <option value="all">{lang === 'ar' ? 'كافة حالات العرض' : 'All Display States'}</option>
                  <option value="available">{lang === 'ar' ? 'متاح للطلب المباشر' : 'Available for purchase'}</option>
                  <option value="special_offer">{lang === 'ar' ? 'عروض فريدة ممتازة' : 'Exclusive Special Offer'}</option>
                  <option value="new">{lang === 'ar' ? 'مشاريع حصرية جديدة' : 'Newly Listed Projects'}</option>
                </select>

                {/* Price Scale Slider */}
                <div>
                  <div className="flex justify-between text-[10px] uppercase text-zinc-400 mb-1">
                    <span>{lang === 'ar' ? 'الحد الأقصى للسعر:' : 'Maximum Price cap:'}</span>
                    <span className="text-gold-400">{(priceRange / 1000000).toFixed(1)}M {t.currency}</span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="45000000"
                    step="500000"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-1.5 accent-gold-500 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PORTFOLIO BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredProperties.map(p => {
              const compared = comparedProperties.some(item => item.id === p.id);
              
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 50, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-zinc-950/40 backdrop-blur-md border border-gold-soft/25 hover:border-gold-soft rounded-lg overflow-hidden transition-all duration-500 hover:scale-[1.015] gold-glow-hover group flex flex-col justify-between"
                >
                  {/* Image wrap block */}
                  <div className="relative aspect-4/3 overflow-hidden bg-black shrink-0">
                    <img
                      src={p.images[0]}
                      alt={p.title_en}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Status / Badge markers */}
                    <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 z-10">
                      {p.badges.map((b, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-black/85 backdrop-blur border border-gold-400/40 text-[9px] uppercase font-bold text-gold-300"
                        >
                          {t[`badge_${b}` as any] || b}
                        </span>
                      ))}
                    </div>

                    <div className="absolute bottom-3 left-3 bg-black/80 px-2 py-0.5 rounded text-[10px] text-zinc-300 font-medium">
                      🏘️ {lang === 'ar' ? t[`type_${p.type}` as any] || p.type : t[`type_${p.type}` as any] || p.type}
                    </div>
                  </div>

                  {/* Narrative details block */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs uppercase font-serif tracking-widest text-gold-400">
                          {lang === 'ar' ? p.district_ar : p.district_en}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          Views: {p.viewsCount || 0}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-base text-white group-hover:text-gold-300 transition-colors line-clamp-1">
                        {lang === 'ar' ? p.title_ar : p.title_en}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-zinc-400 font-light line-clamp-2 leading-relaxed">
                        {lang === 'ar' ? p.description_ar : p.description_en}
                      </p>
                    </div>

                    <div className="border-t border-gold-soft/15 pt-3 flex items-center justify-between">
                      <div className="text-sm font-serif font-bold text-gold-gradient">
                        {p.price.toLocaleString()} {t.currency}
                      </div>
                      
                      <div className="flex gap-2 text-zinc-500 text-[10px] font-mono">
                        <span>{p.area} {t.area_unit}</span>
                        <span>•</span>
                        <span>{p.bedrooms} Beds</span>
                      </div>
                    </div>

                    {/* Integrated CTA actions for client safety and conversion */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gold-soft/10">
                      <button
                        onClick={() => triggerIncrementView(p)}
                        className="p-2 border border-gold-soft/30 hover:border-gold-400 text-gold-400 hover:text-white rounded text-[10px] font-bold uppercase transition-colors duration-200 cursor-pointer"
                      >
                        {lang === 'ar' ? 'التفاصيل والملف ثلاثي الأبعاد' : 'Full Specifications'}
                      </button>

                      <div className="flex gap-1">
                        {/* WhatsApp Dispatch tracker */}
                        <a
                          href={`https://wa.me/${whatsappRoute}?text=${encodeURIComponent(
                            lang === 'ar' 
                              ? `مرحباً، أود الاستفسار عن مشروع: ${p.title_ar} في حي ${p.district_ar}`
                              : `Hello, I'm interested in: ${p.title_en} at district ${p.district_en}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleTrackMetric(p.id, 'whatsapp')}
                          className="flex-1 p-2 bg-gradient-to-br from-zinc-900 to-black hover:bg-neutral-900 border border-teal-800/30 hover:border-teal-400 text-teal-400 hover:text-white rounded text-[10px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                        >
                          <MessageCircle size={11} />
                          <span>WhatsApp</span>
                        </a>

                        {/* Comparison state quick select */}
                        <button
                          onClick={() => handleAddToCompare(p)}
                          className={`p-2 rounded border transition-colors cursor-pointer ${
                            compared 
                              ? 'border-gray-500 text-gray-300 bg-white/5' 
                              : 'border-zinc-800 text-zinc-500 hover:border-gold-400 hover:text-gold-300'
                          }`}
                          title="Add helper comparison"
                        >
                          <Scale size={11} />
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}

            {filteredProperties.length === 0 && (
              <div className="col-span-full text-center py-16 bg-zinc-950 rounded-xl border border-gold-soft/15 space-y-4">
                <Info className="text-gold-400 mx-auto" size={32} />
                <p className="text-xs text-zinc-500 italic">
                  {lang === 'ar' ? 'لم يعثر محركنا المتكامل على مشاريع تطابق خيار تصفيتك بالوقت الراهن.' : 'No flagship property matching your selected specifications resides.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedType('all');
                    setSelectedStatus('all');
                    setSelectedProperty(null);
                    setPriceRange(40000000);
                    setSearchText('');
                  }}
                  className="px-5 py-2 bg-gold-gradient text-black font-semibold text-xs rounded shadow"
                >
                  {lang === 'ar' ? 'إعادة ضبط مرشحات البحث 🔄' : 'Reset search filters'}
                </button>
              </div>
            )}
          </div>

        </motion.section>

        {/* NARRATIVE SECTION: ABOUT US & STORYTELLING COUNTERS */}
        <motion.section
          id="about"
          className="space-y-12 scroll-mt-24"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7 }}
        >
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual block featuring penthouse interior layout */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? 60 : -60, scale: 0.97 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7 }}
              className="relative aspect-4/3 rounded-xl overflow-hidden border border-gold-soft shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              <img
                src="/images/luxury_penthouse_interior_1782158920662.jpg"
                alt="Penthouse interior design"
                className="w-full h-full object-cover transform hover:scale-[1.02] duration-[2s]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-6 z-20 text-right bg-black/80 p-5 rounded-lg border border-gold-soft/30 max-w-sm">
                <span className="text-[10px] text-gold-400 uppercase font-sans font-bold tracking-widest block">LRE CHOSEN SECTORS</span>
                <span className="font-serif font-bold text-sm text-white block mt-1">"العليا بنتهاوس ريزيدنس" - فخامة ترقى لحدود السحاب بالرياض.</span>
              </div>
            </motion.div>

            {/* Narrative storytelling */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7 }}
              className="space-y-6 text-right"
            >
              <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-gold-400 font-sans">
                <Sparkles size={11} className="text-gold-400" />
                <span>{lang === 'ar' ? 'رحلة السيادة والتميز' : 'Dominance & Elite Character'}</span>
              </div>

              <h2 className="font-serif font-bold text-2xl sm:text-4xl text-white tracking-wide">
                {lang === 'ar' ? 'نصنع لترقية المسكن أبعاداً جديدة' : 'Curating Luxury Spaces Beyond Standard Standards'}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-light">
                {settings?.about_ar && lang === 'ar' ? settings.about_ar : (
                  settings?.about_en || `نحن في لوامع للعقارات لا نقف عند حدود الوساطة التقليدية. إننا نستثمر شغف خبراتنا الاستشارية الممتدة لأكثر من خمسة عشر عاماً في تقديم خيارات سكنية وبنيوية ذات قيمة استثمارية مستدامة ونمط معيشي مترف لعملائنا النخبة بمختلف أحياء العاصمة الرياض.`
                )}
              </p>

              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-gold-soft/15">
                <div>
                  <span className="block font-serif text-xl sm:text-3xl font-bold text-gold-gradient">
                    {settings?.experience_years || 15}+
                  </span>
                  <span className="block text-[9px] uppercase text-zinc-500 mt-1">{t.stats_experience}</span>
                </div>
                <div>
                  <span className="block font-serif text-xl sm:text-3xl font-bold text-gold-gradient">
                    {settings?.client_count || 2400}+
                  </span>
                  <span className="block text-[9px] uppercase text-zinc-500 mt-1">{t.stats_clients}</span>
                </div>
                <div>
                  <span className="block font-serif text-xl sm:text-3xl font-bold text-gold-gradient">
                    {settings?.premium_properties_count || 530}+
                  </span>
                  <span className="block text-[9px] uppercase text-zinc-500 mt-1">{t.stats_properties}</span>
                </div>
              </div>
            </motion.div>

          </div>

        </motion.section>

        {/* REVIEWS SECTION: TESTIMONIALS CAROUSEL */}
        <motion.section
          className="space-y-8 text-center"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7 }}
        >
          
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400 font-sans">⭐ {lang === 'ar' ? 'آراء نخبة شركاء قصتنا' : 'Testimonials & Reviews'}</span>
            <h2 className="font-serif font-bold text-xl sm:text-3xl text-white">
              {lang === 'ar' ? 'ماذا يقول عنّا عملاء الصفوة' : 'Sovereign Client Testimony'}
            </h2>
          </div>

          <div className="relative max-w-3xl mx-auto z-10">
            <div className="bg-zinc-950 border border-gold-soft/25 rounded-xl p-8 sm:p-12 text-center shadow-lg relative min-h-[220px] flex flex-col justify-between">
              
              <div className="absolute top-4 left-4 text-gold-400 opacity-20">
                <Star size={70} className="fill-gold-400" />
              </div>

              {/* Review Text */}
              <p className="text-sm sm:text-base text-zinc-200 leading-relaxed italic pr-6 pl-6 pt-3">
                " {lang === 'ar' ? dummyTestimonials[testimonialIndex].quote_ar : dummyTestimonials[testimonialIndex].quote_en} "
              </p>

              {/* Review metadata info */}
              <div className="mt-8 border-t border-gold-soft/10 pt-4">
                <span className="block font-serif text-xs sm:text-sm font-bold text-gold-400">
                  {lang === 'ar' ? dummyTestimonials[testimonialIndex].name_ar : dummyTestimonials[testimonialIndex].name_en}
                </span>
                <span className="block text-[10px] text-zinc-500 mt-0.5">
                  {lang === 'ar' ? dummyTestimonials[testimonialIndex].role_ar : dummyTestimonials[testimonialIndex].role_en}
                </span>
              </div>

            </div>

            {/* Manual Index Steppers */}
            <div className="flex justify-center gap-2.5 mt-5">
              {dummyTestimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestimonialIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    testimonialIndex === idx ? 'bg-gold-400 w-6' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>

        </motion.section>

        {/* INTERACTIVE OFFLINE-SAFE CONTACT COMPONENT */}
        <motion.section
          id="contact"
          className="space-y-12 scroll-mt-24"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7 }}
        >
          
          <div className="text-center space-y-2">
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">
              {t.menu_contact}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
              {lang === 'ar' ? 'فريقنا الاستشاري متواجد للإجابة على تطلعاتكم وضمان صفقاتكم بنجاح.' : 'Let our expert consultants expedite your sovereign real estate objectives.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Quick contact form */}
            <div className="bg-zinc-950 p-6 sm:p-8 border border-gold-soft/30 rounded-xl space-y-4">
              
              {contactSuccess ? (
                <div className="p-6 bg-gold-500/10 border border-gold-400/20 text-center rounded space-y-3">
                  <span className="bg-gold-500 text-black rounded-full p-2 text-xs inline-block font-bold">✓</span>
                  <p className="text-xs text-gold-200 font-semibold">{t.contact_success_message}</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-right">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">{t.contact_form_name}</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={lang === 'ar' ? 'سليمان الحربي' : 'e.g. Faisal'}
                      className="w-full bg-black border border-gold-soft/80 text-white text-xs p-3 rounded focus:outline-none focus:border-gold-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">{t.contact_form_phone}</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        className="w-full bg-black border border-gold-soft/80 text-white text-xs p-3 rounded focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="vip@lawami.com.sa"
                        className="w-full bg-black border border-gold-soft/80 text-white text-xs p-3 rounded focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">{lang === 'ar' ? 'الموضوع المطلوب' : 'Subject/Interest'}</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder={lang === 'ar' ? 'استفسار عن الشراء في حطين' : 'Sovereign consultation request'}
                      className="w-full bg-black border border-gold-soft/80 text-white text-xs p-3 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">{t.contact_form_msg}</label>
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={lang === 'ar' ? 'أكتب رسالتك لشركائنا بوضوح...' : 'State your investment vision...'}
                      className="w-full bg-black border border-gold-soft/80 text-white text-xs p-3 h-28 rounded focus:outline-none focus:border-gold-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full py-3.5 bg-gold-gradient hover:bg-gold-600 text-black font-bold text-xs rounded transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    {contactLoading ? t.smart_search_active : t.contact_form_submit}
                  </button>
                </form>
              )}

            </div>

            {/* Address maps cards */}
            <div className="space-y-6 text-right">
              <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400 font-sans block">{lang === 'ar' ? 'المركز الإستراتيجي الرئيسي بالرياض' : 'Riyadh Executive HQ'}</span>
                
                <div className="flex gap-3">
                  <MapPin className="text-gold-400 shrink-0 mt-1" size={18} />
                  <div className="space-y-1">
                    <span className="block text-sm font-semibold text-white">طريق الملك عبدالعزيز، الياسمين، الرياض.</span>
                    <span className="block text-xs text-paragraph-text font-light text-gray-400">
                      {settings?.address_ar && lang === 'ar' ? settings.address_ar : (settings?.address_en || '')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-900 flex flex-wrap gap-4 text-xs font-mono">
                  <a href={`tel:${phoneRoute}`} className="flex items-center gap-1.5 text-zinc-300 hover:text-gold-400">
                    📞 <span>{phoneRoute}</span>
                  </a>
                  <a href="mailto:info@lawami.com.sa" className="flex items-center gap-1.5 text-zinc-300 hover:text-gold-400">
                    📧 <span>info@lawami.com.sa</span>
                  </a>
                </div>
              </div>

              {/* Minimalist coordinate map design */}
              <div className="h-48 rounded-lg bg-zinc-900 border border-gold-soft/20 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#c29545_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
                <div className="text-center z-10 space-y-2">
                  <span className="block text-3xl">📍</span>
                  <p className="text-xs text-white uppercase font-bold font-serif">Al-Yasmin Business Hub</p>
                  <p className="text-[10px] text-zinc-400 max-w-xs mx-auto leading-relaxed px-4">{lang === 'ar' ? 'طريق الملك عبدالعزيز بجوار المرافق التجارية الكبرى.' : 'Strategically mapped inside North Riyadh commercial quarters.'}</p>
                </div>
              </div>
            </div>

          </div>

        </motion.section>

      </main>

      {/* FOOTER WIDGET */}
      <Footer
        lang={lang}
        onNavClick={(id) => {
          const ele = document.getElementById(id);
          if (ele) ele.scrollIntoView({ behavior: 'smooth' });
        }}
        whatsappNumber={whatsappRoute}
        callNumber={phoneRoute}
        addressAr={settings?.address_ar || 'طريق متميز، الرياض، المملكة العربية السعودية'}
        addressEn={settings?.address_en || 'Distinguished Boulevard, Riyadh, Saudi Arabia'}
      />

      {/* FLOATING ACTION COMMUNICATORS - SEPARATED CORNERS */}
      {/* Call Now Button - Far Left */}
      <div className="fixed bottom-8 left-8 z-40 font-sans">
        <div id="floating-call-rpg" className="relative group p-2 animate-rpg-float">
          {/* Orbital Ring 1 - Golden Rune-like dashed ring */}
          <div className="absolute inset-0 border border-dashed border-gold-400/40 rounded-full animate-rpg-ring-cw scale-110 pointer-events-none" />
          {/* Orbital Ring 2 - Solid ring with double border */}
          <div className="absolute inset-0 border border-double border-gold-500/25 rounded-full animate-rpg-ring-ccw scale-125 pointer-events-none" />
          {/* Inner breathing glow active box */}
          <div className="absolute inset-2 rounded-full rpg-glow-gold pointer-events-none" />
          
          <a
            href={`tel:${phoneRoute}`}
            className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-tr from-gold-600 via-gold-400 to-amber-200 text-black shadow-[0_0_20px_rgba(194,149,69,0.5)] flex items-center justify-center border border-gold-300 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-[360deg] cursor-pointer"
            title="Direct Consultation Direct Call"
          >
            <Phone size={22} className="animate-pulse" />
          </a>
        </div>
      </div>

      {/* WhatsApp Button - Far Right */}
      <div className="fixed bottom-8 right-8 z-40 font-sans">
        <div id="floating-whatsapp-rpg" className="relative group p-2 animate-rpg-float-delayed">
          {/* Orbital Ring 1 - Emerald dashed ring */}
          <div className="absolute inset-0 border border-dashed border-emerald-400/40 rounded-full animate-rpg-ring-cw scale-110 pointer-events-none" />
          {/* Orbital Ring 2 - Solid double ring */}
          <div className="absolute inset-0 border border-double border-emerald-500/25 rounded-full animate-rpg-ring-ccw scale-125 pointer-events-none" />
          {/* Inner breathing glow active box */}
          <div className="absolute inset-2 rounded-full rpg-glow-emerald pointer-events-none" />
          
          <a
            href={`https://wa.me/${whatsappRoute}?text=${encodeURIComponent(
              lang === 'ar' ? 'مرحباً، أود استشارة حول عقارات مكتب لوامع الفاخرة.' : 'Hello, I would like to consult about Lawami Elite properties.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-300 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center border border-emerald-400 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-[360deg] cursor-pointer"
            title="Speak on WhatsApp"
          >
            <MessageCircle size={22} className="animate-pulse" />
          </a>
        </div>
      </div>

      {/* MODAL PANELS AND DRAWERS */}

      {/* Property Details Overlay */}
      {selectedProperty && (
        <PropertyDetailsModal
          lang={lang}
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          whatsappNumber={whatsappRoute}
          callNumber={phoneRoute}
          onAddToCompare={(p) => handleAddToCompare(p)}
          isCompared={comparedProperties.some(item => item.id === selectedProperty.id)}
        />
      )}

      {/* Side-by-Side Comparison Modal */}
      {isCompareOpen && (
        <PropertyComparison
          lang={lang}
          comparedProperties={comparedProperties}
          onRemove={(id) => setComparedProperties(comparedProperties.filter(p => p.id !== id))}
          onClear={() => setComparedProperties([])}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* Protected Admin Control Gateway Portal */}
      {isAdminOpen && (
        <AdminCRM
          lang={lang}
          onClose={() => {
            setIsAdminOpen(false);
            // reset route hash dynamically
            window.location.hash = '';
          }}
        />
      )}

    </div>
  );
}
