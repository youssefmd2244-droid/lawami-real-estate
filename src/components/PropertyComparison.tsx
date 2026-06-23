import { X, Scale, Hash, Layers } from 'lucide-react';
import { translations } from '../data/translations';
import { Property } from '../types';

interface PropertyComparisonProps {
  lang: 'ar' | 'en';
  comparedProperties: Property[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function PropertyComparison({
  lang,
  comparedProperties,
  onRemove,
  onClear,
  onClose
}: PropertyComparisonProps) {
  const t = translations[lang];

  const attrs = [
    {
      label: lang === 'ar' ? 'السعر الكلي' : 'Total Price',
      value: (p: Property) => `${p.price.toLocaleString()} ${t.currency}`,
      hl: true
    },
    {
      label: lang === 'ar' ? 'المساحة الإجمالية' : 'Dimensions / Area',
      value: (p: Property) => `${p.area} ${t.area_unit}`
    },
    {
      label: lang === 'ar' ? 'غرف النوم سكنية' : 'Sovereign Bedrooms',
      value: (p: Property) => `${p.bedrooms} ${t.beds}`
    },
    {
      label: lang === 'ar' ? 'حمامات فخمة' : 'State Bathrooms',
      value: (p: Property) => `${p.bathrooms} ${t.baths}`
    },
    {
      label: lang === 'ar' ? 'الموقع الجغرافي والحي' : 'Location (District)',
      value: (p: Property) => (lang === 'ar' ? `${p.district_ar} (${p.region_ar})` : `${p.district_en} (${p.region_en})`)
    },
    {
      label: lang === 'ar' ? 'المزايا والنظم الذكية' : 'Elite Features',
      value: (p: Property) => (lang === 'ar' ? p.amenities_ar.slice(0, 3).join(' ، ') : p.amenities_en.slice(0, 3).join(', '))
    },
    {
      label: lang === 'ar' ? 'الحالة الحالية' : 'Current Deal Status',
      value: (p: Property) => (lang === 'ar' ? t[`status_${p.status}` as any] || p.status : t[`status_${p.status}` as any] || p.status),
      badge: true
    }
  ];

  const isRtl = lang === 'ar';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      <div className="bg-zinc-950 border border-gold-soft rounded-xl max-w-5xl w-full p-6 relative gold-glow max-h-[90vh] overflow-y-auto">
        
        {/* Header bar */}
        <div className="flex justify-between items-center border-b border-gold-soft/30 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Scale className="text-gold-400" size={22} />
            <h3 className="font-serif font-bold text-xl text-white">
              {t.compare_title}
            </h3>
          </div>
          
          <button
            id="close-compare-modal"
            onClick={onClose}
            className="p-1.5 rounded-full border border-zinc-800 hover:border-gold-400 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {comparedProperties.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-zinc-500 text-sm italic">{t.compare_empty}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gold-soft hover:bg-gold-405/10 text-gold-400 text-xs rounded hover:text-gold-300 transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'الرجوع للمحفظة' : 'Return to Catalog'}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs text-gray-400">
                ⚖️ {lang === 'ar' ? `المشاريع المقارنة حالياً: ${comparedProperties.length}` : `Properties compared: ${comparedProperties.length}`}
              </span>
              <button
                onClick={onClear}
                className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                🗑️ {t.compare_clear}
              </button>
            </div>

            {/* Custom Comparison Responsive Matrix */}
            <div className="overflow-x-auto border border-gold-soft/20 rounded-lg">
              <table className="w-full text-right min-w-[600px] border-collapse">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-gold-soft/20">
                    <th className={`p-4 text-xs font-bold uppercase text-gold-400 w-1/4 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {lang === 'ar' ? 'المعيار العقاري' : 'Estates Parameter'}
                    </th>
                    {comparedProperties.map((p) => (
                      <th key={p.id} className="p-4 relative text-center border-l border-gold-soft/10 w-1/4">
                        <button
                          onClick={() => onRemove(p.id)}
                          className="absolute -top-1 -right-1 sm:top-2 sm:right-2 p-1 bg-red-950/40 border border-red-500/20 rounded-full hover:bg-red-500 text-red-400 hover:text-black transition-all cursor-pointer"
                          title="Remove"
                        >
                          <X size={12} />
                        </button>
                        <div className="text-center space-y-2 mt-4 sm:mt-1">
                          <img
                            src={p.images[0]}
                            alt={p.title_en}
                            className="w-20 h-16 sm:w-28 sm:h-20 object-cover rounded mx-auto border border-gold-soft/50"
                            referrerPolicy="no-referrer"
                          />
                          <span className="block font-serif text-sm font-semibold text-white mt-1 line-clamp-1">
                            {lang === 'ar' ? p.title_ar : p.title_en}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attrs.map((attr, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-zinc-900 hover:bg-zinc-900/35 transition-colors"
                    >
                      <td className={`p-4 text-xs font-semibold text-gray-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                        {attr.label}
                      </td>
                      {comparedProperties.map((p) => (
                        <td
                          key={p.id}
                          className={`p-4 text-center border-l border-gold-soft/5 text-sm ${
                            attr.hl ? 'text-gold-400 font-bold font-serif' : 'text-white'
                          }`}
                        >
                          {attr.badge ? (
                            <span className="inline-block px-2.5 py-1 rounded bg-gold-400/10 border border-gold-400/20 text-xs text-gold-300">
                              {attr.value(p)}
                            </span>
                          ) : (
                            attr.value(p)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
