import { useState } from 'react';
import { Search, Sparkles, X, AlertCircle } from 'lucide-react';
import { translations } from '../data/translations';
import { Property } from '../types';

interface SmartSearchPanelProps {
  lang: 'ar' | 'en';
  onSearchResult: (results: Property[], aiSummary: { ar: string; en: string } | null) => void;
  onClear: () => void;
}

export default function SmartSearchPanel({ lang, onSearchResult, onClear }: SmartSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<{ ar: string; en: string } | null>(null);
  const t = translations[lang];

  const samples = lang === 'ar' ? [
    'فيلا شمال الرياض أقل من 8 مليون',
    'بنتهاوس مع جاكوزي في العليا',
    'قصر ضخم في حطين مع مسبح خاص',
    'شقة ريزيدنس في الدرعية'
  ] : [
    'Smart villa in North Riyadh under 8 million',
    'Penthouse with terrace jacuzzi in Al-Olaya',
    'Grand palace in Hittin with swimming pool',
    'Luxury residency in Diriyah'
  ];

  const handleSmartSearchSubmit = async (textToSearch = query) => {
    const searchText = textToSearch.trim();
    if (!searchText) return;

    setLoading(true);
    setError(null);
    setAiSummary(null);

    try {
      const res = await fetch('/api/properties/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: searchText })
      });

      if (!res.ok) {
        throw new Error('Connection delayed. Trying custom rules.');
      }

      const data = await res.json();
      onSearchResult(data.results, { ar: data.summary_ar, en: data.summary_en });
      setAiSummary({ ar: data.summary_ar, en: data.summary_en });

    } catch (err: any) {
      console.warn('Smart search query failed, using regex backup:', err);
      setError(lang === 'ar' ? 'تعذر جلب نتائج الذكاء الاصطناعي بسبب جدار الحماية، يرجى المحاولة لاحقاً.' : 'API experienced brief latency. Reverting to rule-based indexing.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllSearch = () => {
    setQuery('');
    setAiSummary(null);
    setError(null);
    onClear();
  };

  const isRtl = lang === 'ar';

  return (
    <div
      className="bg-zinc-950 border border-gold-soft/35 rounded-xl p-6 gold-glow transition-all duration-500 mb-10"
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded bg-gold-400/10 text-gold-400">
          <Sparkles size={20} className="animate-spin-slow" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg text-white">
            {t.smart_search_btn}
          </h3>
          <p className="text-xs text-gray-400">
            {lang === 'ar' ? 'ابحث بلغة البشر الطبيعية، ليفهم محركنا طلبك ويرشح لك الأنسب.' : 'Describe your vision in plain words; our AI resolves and surfaces accurate matches.'}
          </p>
        </div>
      </div>

      {/* Input query field */}
      <div className="relative">
        <input
          type="text"
          id="smart-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.smart_search_placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSmartSearchSubmit();
          }}
          className={`w-full bg-black/60 border border-gold-soft focus:border-gold-400 text-white rounded-lg py-4 px-12 text-sm focus:outline-none transition-all ${
            loading ? 'opacity-80' : ''
          }`}
          disabled={loading}
        />
        
        {/* Left search decorator logo */}
        <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} text-gold-400`}>
          <Search size={18} />
        </div>

        {/* Right action controls */}
        {query && (
          <button
            onClick={clearAllSearch}
            className={`absolute top-4 ${isRtl ? 'left-24' : 'right-24'} p-1 hover:text-white text-gray-500`}
          >
            <X size={16} />
          </button>
        )}

        <button
          id="execute-smart-search"
          onClick={() => handleSmartSearchSubmit()}
          disabled={loading || !query.trim()}
          className={`absolute top-2 bottom-2 ${
            isRtl ? 'left-2' : 'right-2'
          } px-5 rounded bg-gold-gradient hover:bg-gold-600 font-bold text-xs text-black transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(194,149,69,0.35)] hover:shadow-[0_0_25px_rgba(194,149,69,0.7)] hover:scale-[1.02] duration-300`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles size={14} className="animate-pulse text-black" />
          )}
          <span>{loading ? t.smart_search_active : t.smart_search_btn}</span>
        </button>
      </div>

      {/* Sample preset clicks */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 font-medium">💡 {t.search_prompt_sample}:</span>
        {samples.map((sampleStr, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(sampleStr);
              handleSmartSearchSubmit(sampleStr);
            }}
            className="text-[11px] tracking-wide text-zinc-400 bg-zinc-900 border border-zinc-800 hover:border-gold-400 hover:text-gold-300 py-1.5 px-3 rounded-full transition-colors duration-200 cursor-pointer"
          >
            {sampleStr}
          </button>
        ))}
      </div>

      {/* Display errors if any */}
      {error && (
        <div className="mt-4 p-3 bg-red-950/20 border border-red-900/40 text-red-400 rounded text-xs flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Exquisite AI Response Welcome Message Box */}
      {aiSummary && (
        <div className="mt-6 border-t border-gold-soft/30 pt-5 animate-[fadeIn_0.5s_ease-out]">
          <div className="bg-gradient-to-br from-gold-900/10 via-black to-gold-900/5 border border-gold-400/20 rounded-lg p-4 font-serif relative">
            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-gold-400 text-[10px] uppercase font-bold tracking-widest font-sans">
              <Sparkles size={10} className="animate-pulse" />
              <span>{lang === 'ar' ? 'تحليل استشاري ذكي' : 'Executive AI Advisory'}</span>
            </div>
            
            <p className="text-sm text-gold-200/90 leading-relaxed italic pr-4 pl-4 pt-3 text-center">
              " {lang === 'ar' ? aiSummary.ar : aiSummary.en} "
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
