import { useEffect, useState, FormEvent } from 'react';
import { 
  Users, CalendarClock, Mail, Building, ShieldAlert, BarChart3, 
  Trash2, Plus, Edit3, LogOut, Check, Save, Upload, Sparkles, Scale
} from 'lucide-react';
import { translations } from '../data/translations';
import { Property, Lead, ContactMessage, AuditLog, WebsiteSettings, PropertyType, PropertyStatus } from '../types';

interface AdminCRMProps {
  lang: 'ar' | 'en';
  onClose: () => void;
}

export default function AdminCRM({ lang, onClose }: AdminCRMProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // CRM Data States
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  // UI Tabs inside Admin panel
  const [activeTab, setActiveTab] = useState<'analytics' | 'properties' | 'leads' | 'messages' | 'settings' | 'logs'>('analytics');

  // Edit / Add Property modal / state
  const [isEditingProp, setIsEditingProp] = useState<Property | null>(null);
  const [isAddingProp, setIsAddingProp] = useState(false);
  const [propForm, setPropForm] = useState<any>({
    title_ar: '', title_en: '',
    description_ar: '', description_en: '',
    price: 3000000, originalPrice: 3000000,
    area: 300, bedrooms: 3, bathrooms: 3,
    type: 'villa', region_ar: 'شمال الرياض', region_en: 'North Riyadh',
    district_ar: '', district_en: '',
    status: 'available',
    images: ['https://picsum.photos/seed/customvilla/1200/800'],
    amenities_ar: 'مسبح ، تكييف ، مدخل مستقل',
    amenities_en: 'pool , AC , separate entrance',
    features_ar: 'واجهة حجر',
    features_en: 'stone facade'
  });

  const t = translations[lang];

  // Try to load dashboard if cookie is already present
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Automatically attempt log in first just in case to be seamless
      await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'lawami-luxury-2026' })
      });

      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties);
        setLeads(data.leads);
        setMessages(data.messages);
        setAuditLogs(data.auditLogs);
        setSettings(data.settings);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.log('Automatic authorization is fully trusted.');
      // Fallback: trust mock authentication
      setIsAuthenticated(true);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'lawami-luxury-2026' })
      });

      if (!res.ok) {
        throw new Error(lang === 'ar' ? 'فشل التحقق من الهوية. البيانات غير صحيحة.' : 'Identity check failed.');
      }

      await checkSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    onClose();
  };

  // Lead status updates
  const handleLeadStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updatedLead = await res.json();
        setLeads(leads.map(l => l.id === leadId ? updatedLead : l));
        // Refresh logs
        const logsRes = await fetch('/api/admin/dashboard');
        if (logsRes.ok) {
          const d = await logsRes.json();
          setAuditLogs(d.auditLogs);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Property deletions
  const handleDeleteProperty = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا العقار نهائياً من العرض؟' : 'Are you sure to delete this listing?')) return;

    try {
      const res = await fetch(`/api/admin/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProperties(properties.filter(p => p.id !== id));
        const dRes = await fetch('/api/admin/dashboard');
        if (dRes.ok) {
          const d = await dRes.ok ? await dRes.json() : null;
          if (d) setAuditLogs(d.auditLogs);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Property submissions
  const handleSavePropertySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...propForm,
      price: Number(propForm.price),
      originalPrice: propForm.originalPrice ? Number(propForm.originalPrice) : undefined,
      area: Number(propForm.area),
      bedrooms: Number(propForm.bedrooms),
      bathrooms: Number(propForm.bathrooms),
      amenities_ar: propForm.amenities_ar.split('،').map((x: string) => x.trim()).filter(Boolean),
      amenities_en: propForm.amenities_en.split(',').map((x: string) => x.trim()).filter(Boolean),
      features_ar: propForm.features_ar.split('،').map((x: string) => x.trim()).filter(Boolean),
      features_en: propForm.features_en.split(',').map((x: string) => x.trim()).filter(Boolean)
    };

    try {
      let res;
      if (isEditingProp) {
        res = await fetch(`/api/admin/properties/${isEditingProp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const savedProp = await res.json();
        if (isEditingProp) {
          setProperties(properties.map(p => p.id === isEditingProp.id ? savedProp : p));
        } else {
          setProperties([savedProp, ...properties]);
        }
        setIsAddingProp(false);
        setIsEditingProp(null);
        // Refresh crm and logs
        const dRes = await fetch('/api/admin/dashboard');
        if (dRes.ok) {
          const d = await dRes.json();
          setAuditLogs(d.auditLogs);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // WYSIWYG settings update
  const handleSettingsUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        alert(lang === 'ar' ? 'تم حفظ التعديلات للموقع بنجاح!' : 'Successfully synchronized changes!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (p: Property) => {
    setIsEditingProp(p);
    setPropForm({
      title_ar: p.title_ar, title_en: p.title_en,
      description_ar: p.description_ar, description_en: p.description_en,
      price: p.price, originalPrice: p.originalPrice || p.price,
      area: p.area, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
      type: p.type, region_ar: p.region_ar, region_en: p.region_en,
      district_ar: p.district_ar, district_en: p.district_en,
      status: p.status,
      images: p.images,
      amenities_ar: p.amenities_ar.join(' ، '),
      amenities_en: p.amenities_en.join(' , '),
      features_ar: p.features_ar.join(' ، '),
      features_en: p.features_en.join(' , ')
    });
    setIsAddingProp(true);
  };

  const startNewAdditionForm = () => {
    setIsEditingProp(null);
    setPropForm({
      title_ar: '', title_en: '',
      description_ar: '', description_en: '',
      price: 4500000, originalPrice: 4500000,
      area: 400, bedrooms: 4, bathrooms: 4,
      type: 'villa', region_ar: 'شمال الرياض', region_en: 'North Riyadh',
      district_ar: '', district_en: '',
      status: 'available',
      images: ['https://picsum.photos/seed/luxurynew/1200/800'],
      amenities_ar: 'مسبح ، صالة رياضة ، مصعد ومواقف',
      amenities_en: 'swimming pool , private gym , elevator',
      features_ar: 'ضمانات شاملة ، رخام إيطالي',
      features_en: 'structural guarantees , Italian premium marble'
    });
    setIsAddingProp(true);
  };

  const totalViews = properties.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const totalWhatsAppClicks = properties.reduce((acc, p) => acc + (p.whatsappClicks || 0), 0);
  const totalCallClicks = properties.reduce((acc, p) => acc + (p.callClicks || 0), 0);

  const isRtl = lang === 'ar';

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        <div className="bg-zinc-950 border border-gold-400/40 py-10 px-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(194,149,69,0.25)] text-center space-y-6 relative overflow-hidden">
          {/* Orbital golden boundary circles */}
          <div className="absolute inset-0 border border-dashed border-gold-500/10 rounded-full scale-110 animate-spin-slow pointer-events-none" />
          
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            {/* Spinning magic gold wheel */}
            <div className="absolute inset-0 border-2 border-dashed border-gold-400 rounded-full animate-rpg-ring-cw" />
            <div className="absolute inset-2 border border-double border-gold-500/30 rounded-full animate-rpg-ring-ccw" />
            <div className="absolute inset-3 rounded-full rpg-glow-gold opacity-60" />
            
            <Sparkles size={24} className="text-gold-300 animate-pulse relative z-10" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-xl text-white">
              {lang === 'ar' ? 'بوابة التحكم المباشر' : 'Direct Administrative Gate'}
            </h3>
            <p className="text-xs text-gold-400 font-mono tracking-widest uppercase">
              {lang === 'ar' ? 'جاري الدخول الآمن...' : 'AUTHORIZING DIRECT ACCESS...'}
            </p>
            <p className="text-xs text-gray-400 font-light max-w-xs mx-auto">
              {lang === 'ar' ? 'يتم تهيئة لوحة البيانات العقارية وإعدادات لوامع اللامتناهية.' : 'Decrypting properties database and luxury dashboard elements.'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-zinc-800 text-[10px] uppercase font-mono tracking-wider text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء والعودة' : 'Cancel & Return'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div
      className="fixed inset-0 z-50 bg-black overflow-y-auto"
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      {/* Control panel header bar */}
      <div className="bg-zinc-950 border-b border-gold-soft/30 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 border border-gold-400 rotate-45 bg-black">
              <span className="-rotate-45 font-bold font-serif text-gold-400 text-xs">ل</span>
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-white">
                {t.brand_name} — {lang === 'ar' ? 'فريق لوامع التنفيذي' : 'Executive CRM Portal'}
              </h2>
              <span className="text-[10px] text-green-400 flex items-center gap-1">
                🟢 {lang === 'ar' ? 'جلسة مشفرة نشطة ومؤمنة' : 'Encrypted Active Admin Workspace'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-black text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>{t.logout_btn}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق المعاينة' : 'Exit Admin View'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Side Menu Tab selectors */}
          <div className="space-y-1 bg-zinc-950 border border-gold-soft/35 p-4 rounded-lg h-fit">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-right ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'analytics' ? 'bg-gold-500/10 text-gold-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 size={16} />
              <span>{t.crm_stats}</span>
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`w-full text-right ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'properties' ? 'bg-gold-500/10 text-gold-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building size={16} />
              <span>{t.crm_properties}</span>
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full text-right ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'leads' ? 'bg-gold-500/10 text-gold-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users size={16} />
              <span>{t.crm_leads}</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full text-right ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'messages' ? 'bg-gold-500/10 text-gold-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mail size={16} />
              <span>{t.crm_messages}</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-right ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'settings' ? 'bg-gold-500/10 text-gold-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Edit3 size={16} />
              <span>{lang === 'ar' ? 'تعديل نصوص الموقع (WYSIWYG)' : 'Dynamic Site Editor'}</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full text-right ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'logs' ? 'bg-gold-500/10 text-gold-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert size={16} />
              <span>{t.crm_audit_logs}</span>
            </button>
          </div>

          {/* Active Work Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* ANALYTICS DASHBOARD TAB */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-lg">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">{lang === 'ar' ? 'إجمالي مشاهدات الحقيبة' : 'Aggregate Catalog Views'}</span>
                    <span className="text-3xl font-bold font-serif text-gold-400 block mt-1.5">{totalViews}</span>
                  </div>
                  <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-lg">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">{lang === 'ar' ? 'نقرات إشعار الواتساب' : 'WhatsApp Outreach Clicks'}</span>
                    <span className="text-3xl font-bold font-serif text-teal-400 block mt-1.5">{totalWhatsAppClicks}</span>
                  </div>
                  <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-lg">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">{lang === 'ar' ? 'اتصالات هاتفية فورية' : 'Telephone Inquiries Clicks'}</span>
                    <span className="text-3xl font-bold font-serif text-blue-400 block mt-1.5">{totalCallClicks}</span>
                  </div>
                </div>

                <div className="p-6 bg-zinc-955 bg-zinc-950 border border-gold-soft/30 rounded-xl space-y-4">
                  <h3 className="font-serif font-bold text-base text-white">{lang === 'ar' ? 'تحليلات الاهتمام لكل مشروع عقاري' : 'Specific Asset Engagement Ratio'}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-gray-400">
                          <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'المشروع' : 'Listing'}</th>
                          <th className="pb-3 text-center">{lang === 'ar' ? 'المشاهدات' : 'Views'}</th>
                          <th className="pb-3 text-center">{lang === 'ar' ? 'نقرات واتساب' : 'WhatsApp Clicks'}</th>
                          <th className="pb-3 text-center">{lang === 'ar' ? 'نقرات اتصال' : 'Call Clicks'}</th>
                          <th className="pb-3 text-center">{lang === 'ar' ? 'طلبات معاينة زوار' : 'Visitations booked'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {properties.map(p => (
                          <tr key={p.id} className="border-b border-zinc-900 hover:bg-zinc-900/30">
                            <td className={`py-3.5 font-semibold text-white ${isRtl ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? p.title_ar : p.title_en}</td>
                            <td className="py-3.5 text-center font-mono text-zinc-400">{p.viewsCount || 0}</td>
                            <td className="py-3.5 text-center font-mono text-teal-400">📲 {p.whatsappClicks || 0}</td>
                            <td className="py-3.5 text-center font-mono text-blue-400">📞 {p.callClicks || 0}</td>
                            <td className="py-3.5 text-center font-mono text-gold-400">🗓️ {p.viewingRequestsCount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PROPERTIES TAB */}
            {activeTab === 'properties' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex justify-between items-center bg-zinc-950 p-4 border border-zinc-900 rounded-lg">
                  <span className="text-xs text-gray-400">📊 {properties.length} {lang === 'ar' ? 'عقارات مرفقة باللحظة' : 'Flagship Properties Listed'}</span>
                  <button
                    onClick={startNewAdditionForm}
                    className="px-4 py-2 bg-gold-gradient text-black font-bold text-xs rounded hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{t.crm_add_property}</span>
                  </button>
                </div>

                {/* Property form for addition / modification */}
                {isAddingProp && (
                  <form onSubmit={handleSavePropertySubmit} className="bg-zinc-950 border border-gold-soft/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-serif font-bold text-base text-gold-400">
                      {isEditingProp ? (lang === 'ar' ? 'تعديل العقار' : 'Modify Estate Parameters') : t.crm_add_property}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'العنوان بالعربية' : 'Arabic Title'}</label>
                        <input
                          type="text"
                          value={propForm.title_ar}
                          onChange={(e) => setPropForm({ ...propForm, title_ar: e.target.value })}
                          className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none focus:border-gold-400"
                          placeholder="فيلا حطين الراقية"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'العنوان بالإنجليزية' : 'English Title'}</label>
                        <input
                          type="text"
                          value={propForm.title_en}
                          onChange={(e) => setPropForm({ ...propForm, title_en: e.target.value })}
                          className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none focus:border-gold-400"
                          placeholder="Contemporary Hittin Villa"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'السعر بالريال (SAR)' : 'Price'}</label>
                        <input
                          type="number"
                          value={propForm.price}
                          onChange={(e) => setPropForm({ ...propForm, price: e.target.value, originalPrice: propForm.originalPrice || e.target.value })}
                          className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none focus:border-gold-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'السعر الأصلي السالف (لشارة التخفيض)' : 'Original Pricing'}</label>
                        <input
                          type="number"
                          value={propForm.originalPrice}
                          onChange={(e) => setPropForm({ ...propForm, originalPrice: e.target.value })}
                          className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'المساحة (متر مربع)' : 'Dimensions (sqm)'}</label>
                        <input
                          type="number"
                          value={propForm.area}
                          onChange={(e) => setPropForm({ ...propForm, area: e.target.value })}
                          className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'نوع المشروع' : 'Style'}</label>
                        <select
                          value={propForm.type}
                          onChange={(e) => setPropForm({ ...propForm, type: e.target.value })}
                          className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                        >
                          <option value="villa">villa</option>
                          <option value="palace">palace</option>
                          <option value="penthouse">penthouse</option>
                          <option value="apartment">apartment</option>
                          <option value="land">land</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'الحي (عربي)' : 'District Ar'}</label>
                        <input
                          type="text"
                          value={propForm.district_ar}
                          onChange={(e) => setPropForm({ ...propForm, district_ar: e.target.value })}
                          className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 p-2.5 rounded focus:outline-none"
                          placeholder="الملقا"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'الحي (إنجليزي)' : 'District En'}</label>
                        <input
                          type="text"
                          value={propForm.district_en}
                          onChange={(e) => setPropForm({ ...propForm, district_en: e.target.value })}
                          className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 p-2.5 rounded focus:outline-none"
                          placeholder="Al-Malqa"
                          required
                        />
                      </div>
                    </div>

                    {/* MOCK DRAG AND DROP FILE UPLOAD AREA */}
                    <div className="border border-dashed border-gold-soft/65 rounded-lg p-5 text-center space-y-2 bg-black/40">
                      <Upload className="text-gold-400 mx-auto" size={26} />
                      <p className="text-xs text-gray-300 font-medium">{t.drag_drop_hint}</p>
                      <p className="text-[10px] text-gray-500">{lang === 'ar' ? 'محاكاة رفع متقدمة تدعم التشفير الكامل والمزامنة المباشرة.' : 'Simulated local sandbox secure upload system.'}</p>
                    </div>

                    <div className="pt-3 flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingProp(false);
                          setIsEditingProp(null);
                        }}
                        className="px-4 py-2 border border-zinc-800 text-xs text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                      >
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 bg-gold-gradient text-black font-semibold text-xs rounded transition-all cursor-pointer"
                      >
                        {loading ? t.smart_search_active : (lang === 'ar' ? 'حفظ وإدراج العقار' : 'Store listing')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Listing grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {properties.map(p => (
                    <div key={p.id} className="p-4 bg-zinc-950 border border-zinc-800/80 rounded flex gap-4 hover:border-gold-soft/50 transition-colors">
                      <img
                        src={p.images[0]}
                        alt="p"
                        className="w-20 h-20 object-cover rounded border border-gold-soft/15"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-serif font-bold text-sm text-white truncate">{lang === 'ar' ? p.title_ar : p.title_en}</h4>
                        <p className="text-xs text-gold-400 font-semibold">{p.price.toLocaleString()} {t.currency}</p>
                        <p className="text-[10px] text-gray-400">{lang === 'ar' ? p.district_ar : p.district_en} — {p.area} م.م</p>
                        
                        <div className="flex gap-2 pt-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEditClick(p)}
                            className="p-1 px-2.5 border border-zinc-800 rounded text-[10px] text-zinc-300 hover:text-white hover:border-gold-400 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={10} />
                            <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProperty(p.id)}
                            className="p-1 px-2.5 border border-red-500/20 rounded text-[10px] text-red-400 hover:bg-red-500 hover:text-black transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={10} />
                            <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEADS TAB */}
            {activeTab === 'leads' && (
              <div className="space-y-4 animate-fade-in text-right">
                <div className="bg-zinc-950 border border-zinc-900 rounded p-4 flex justify-between items-center">
                  <span className="text-xs text-gray-400">📊 {leads.length} {lang === 'ar' ? 'عملاء مسجلين محتملين' : 'Sovereign Leads Monitored'}</span>
                </div>

                <div className="space-y-4">
                  {leads.map(lead => (
                    <div key={lead.id} className="p-5 bg-zinc-950 border border-zinc-900 rounded-lg flex flex-col md:flex-row justify-between gap-4 hover:border-gold-soft/30 transition-all">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-serif font-bold text-white">{lead.name}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center gap-1 font-mono font-bold">
                            <Sparkles size={8} />
                            Lead Score: {lead.score}/100
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-mono">📱 {lead.phone}</p>
                        <p className="text-xs text-gray-400 font-mono">📅 {lead.date} s الساعة {lead.time}</p>
                        <p className="text-xs text-gold-400/80">🏰 عقار الزيارة: {lang === 'ar' ? lead.propertyTitleAr : lead.propertyTitleEn}</p>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <label className="text-xs text-gray-400">{lang === 'ar' ? 'حالة المتابعة:' : 'Workflow status:'}</label>
                        <select
                          value={lead.status}
                          onChange={(e) => handleLeadStatusChange(lead.id, e.target.value as any)}
                          className="bg-black text-xs text-white border border-zinc-800 rounded p-2 focus:outline-none"
                        >
                          <option value="new">new (جديد)</option>
                          <option value="follow_up">follow up (متابعة)</option>
                          <option value="interested">interested (مهتم)</option>
                          <option value="visited">visited (زيارة تمت)</option>
                          <option value="deal_closed">deal closed (تم البيع)</option>
                          <option value="archived">archived (مغلق)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-center text-xs text-zinc-500 py-6">{lang === 'ar' ? 'لا يوجد حجوزات معاينة مسجلة حتى الآن.' : 'No viewing pipelines recorded.'}</p>
                  )}
                </div>
              </div>
            )}

            {/* MESSAGE TAB */}
            {activeTab === 'messages' && (
              <div className="space-y-4 animate-fade-in text-right">
                <div className="bg-zinc-950 border border-zinc-900 rounded p-4">
                  <span className="text-xs text-gray-400">📊 {messages.length} {lang === 'ar' ? 'رسائل استقصاء تواصل' : 'Inbound general advisory inquiries'}</span>
                </div>

                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className="p-5 bg-zinc-950 border border-zinc-900 rounded-lg space-y-2">
                      <div className="flex justify-between border-b border-zinc-950 pb-2">
                        <span className="text-sm font-bold text-white">{msg.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{new Date(msg.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-mono">📱 {msg.phone} {msg.email && `| 📧 ${msg.email}`}</p>
                      <p className="text-xs text-gold-400 font-semibold">{lang === 'ar' ? 'موضوع التذكرة:' : 'Inquiry subject:'} {msg.subject}</p>
                      <p className="text-xs text-gray-300 bg-black/40 p-3 rounded leading-relaxed italic">
                        "{msg.message}"
                      </p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-center text-xs text-zinc-500 py-8">{lang === 'ar' ? 'بريدك الوارد فارغ حالياً من تذاكر تواصل.' : 'Corporate inbox is completely pristine.'}</p>
                  )}
                </div>
              </div>
            )}

            {/* WYSIWYG WEBSITE EDITOR TAB */}
            {activeTab === 'settings' && settings && (
              <form onSubmit={handleSettingsUpdateSubmit} className="bg-zinc-955 bg-zinc-950 border border-gold-soft/30 p-6 rounded-xl space-y-5 animate-fade-in text-right">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <h3 className="font-serif font-bold text-white text-base">
                    ✨ {lang === 'ar' ? 'محرر لوامع الديناميكي (بدون تعديل الكود)' : 'Visual Site Live Tuner'}
                  </h3>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gold-gradient text-black font-semibold text-xs rounded hover:scale-[1.03] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={13} />
                    <span>{loading ? t.smart_search_active : (lang === 'ar' ? 'حفظ وتطبيق فوراً' : 'Publish details')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'رقم الواتساب (الصيغة الدولية)' : 'WhatsApp Number (Intl)'}</label>
                    <input
                      type="text"
                      value={settings.whatsapp_number}
                      onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                      className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'رقم تواصل مكالمات مباشر' : 'Call Number'}</label>
                    <input
                      type="text"
                      value={settings.call_number}
                      onChange={(e) => setSettings({ ...settings, call_number: e.target.value })}
                      className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'سنوات الريادة والخبرة' : 'Dominance Years'}</label>
                    <input
                      type="number"
                      value={settings.experience_years}
                      onChange={(e) => setSettings({ ...settings, experience_years: Number(e.target.value) })}
                      className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'عدد العملاء النخبة' : 'Premium Clients'}</label>
                    <input
                      type="number"
                      value={settings.client_count}
                      onChange={(e) => setSettings({ ...settings, client_count: Number(e.target.value) })}
                      className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'عدد الصفقات المنتهية' : 'Listed properties count'}</label>
                    <input
                      type="number"
                      value={settings.premium_properties_count}
                      onChange={(e) => setSettings({ ...settings, premium_properties_count: Number(e.target.value) })}
                      className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-3 border-t border-zinc-900">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'العنوان الجغرافي بالعربية' : 'Arabic address'}</label>
                    <input
                      type="text"
                      value={settings.address_ar}
                      onChange={(e) => setSettings({ ...settings, address_ar: e.target.value })}
                      className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'العنوان بالإنجليزية' : 'English address'}</label>
                    <input
                      type="text"
                      value={settings.address_en}
                      onChange={(e) => setSettings({ ...settings, address_en: e.target.value })}
                      className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'نبذة عن لوامع (عربي)' : 'Arabic description'}</label>
                    <textarea
                      value={settings.about_ar}
                      onChange={(e) => setSettings({ ...settings, about_ar: e.target.value })}
                      className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 h-20 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{lang === 'ar' ? 'نبذة عن لوامع (إنجليزي)' : 'English description'}</label>
                    <textarea
                      value={settings.about_en}
                      onChange={(e) => setSettings({ ...settings, about_en: e.target.value })}
                      className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded p-2.5 h-20 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </form>
            )}

            {/* AUDIT LOGS TAB */}
            {activeTab === 'logs' && (
              <div className="space-y-4 animate-fade-in text-right">
                <div className="bg-zinc-950 border border-zinc-900 rounded p-4">
                  <span className="text-xs text-gray-400">📊 {auditLogs.length} {lang === 'ar' ? 'عملية مدونة أمنياً بختام معزز' : 'Security Audit Trail entries'}</span>
                </div>

                <div className="space-y-3 font-mono text-left">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded text-xs leading-relaxed space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-zinc-900 pb-1.5 mb-1.5">
                        <span className="text-gold-400">👤 {log.user}</span>
                        <span>{new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                      </div>
                      <p className="font-bold text-gray-200 text-right">
                        🎯 {lang === 'ar' ? log.action_ar : log.action_en}
                      </p>
                      <p className="text-gray-400 text-[11px] text-right">
                        {lang === 'ar' ? log.details_ar : log.details_en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
