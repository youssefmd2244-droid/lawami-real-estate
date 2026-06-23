import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  X, Calendar, Sparkles, MapPin, Share2, Phone, MessageCircle, 
  ArrowLeft, ArrowRight, Bed, Bath, Compass, Check, Calculator, Copy
} from 'lucide-react';
import { translations } from '../data/translations';
import { Property } from '../types';
import MortgageCalculator from './MortgageCalculator';

interface PropertyDetailsModalProps {
  lang: 'ar' | 'en';
  property: Property;
  onClose: () => void;
  whatsappNumber: string;
  callNumber: string;
  onAddToCompare: (p: Property) => void;
  isCompared: boolean;
}

export default function PropertyDetailsModal({
  lang,
  property,
  onClose,
  whatsappNumber,
  callNumber,
  onAddToCompare,
  isCompared
}: PropertyDetailsModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [show3dGallery, setShow3dGallery] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const t = translations[lang];
  const isRtl = lang === 'ar';

  const canvas3dRef = useRef<HTMLCanvasElement | null>(null);

  // Rotation interactive 3D blueprint wireframe effect for premium tech vibe
  useEffect(() => {
    if (!show3dGallery) return;

    const canvas = canvas3dRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let angleX = 0.5;
    let angleY = 0.5;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = 350);

    // Cube points representing villa geometry
    const points = [
      { x: -1, y: -0.7, z: -1 }, { x: 1, y: -0.7, z: -1 }, { x: 1, y: 0.7, z: -1 }, { x: -1, y: 0.7, z: -1 },
      { x: -1, y: -0.7, z: 1 }, { x: 1, y: -0.7, z: 1 }, { x: 1, y: 0.7, z: 1 }, { x: -1, y: 0.7, z: 1 },
      // Inner roof deck points
      { x: 0, y: -1.3, z: 0 }, { x: -0.8, y: -0.7, z: 0.8 }, { x: 0.8, y: -0.7, z: 0.8 }
    ];

    const project = (x: number, y: number, z: number) => {
      // Rotate around Y
      let rotX = x * Math.cos(angleY) - z * Math.sin(angleY);
      let rotZ = x * Math.sin(angleY) + z * Math.cos(angleY);
      
      // Rotate around X
      let rotY = y * Math.cos(angleX) - rotZ * Math.sin(angleX);
      rotZ = y * Math.sin(angleX) + rotZ * Math.cos(angleX);

      // Perspective scale factor
      const zoom = 140;
      const distance = 3.5;
      const scale = zoom / (rotZ + distance);
      const projX = width / 2 + rotX * scale;
      const projY = height / 2 + rotY * scale;

      return { x: projX, y: projY };
    };

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      angleY += dx * 0.008;
      angleX += dy * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMouseUp = () => { isDragging = false; };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(194, 149, 69, 0.07)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }

      // Draw wireframe paths
      const projected = points.map(p => project(p.x, p.y, p.z));

      ctx.strokeStyle = '#caa35b';
      ctx.lineWidth = 1.5;
      
      // Render luxury geometric frame
      const drawLine = (i: number, j: number) => {
        ctx.beginPath();
        ctx.moveTo(projected[i].x, projected[i].y);
        ctx.lineTo(projected[j].x, projected[j].y);
        ctx.stroke();
      };

      // Lower box
      drawLine(0, 1); drawLine(1, 2); drawLine(2, 3); drawLine(3, 0);
      // Top box
      drawLine(4, 5); drawLine(5, 6); drawLine(6, 7); drawLine(7, 4);
      // Pillars
      drawLine(0, 4); drawLine(1, 5); drawLine(2, 6); drawLine(3, 7);
      // Roof peaks
      drawLine(4, 8); drawLine(5, 8); drawLine(6, 8); drawLine(7, 8);

      // Draw points as golden dots
      projected.forEach(p => {
        ctx.fillStyle = '#f4edd9';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Auto rotation when not dragging
      if (!isDragging) {
        angleY += 0.004;
      }

      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [show3dGallery]);

  const handleShareClick = () => {
    const url = `${window.location.origin}/property/${property.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleViewingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingPhone || !bookingDate) return;

    setBookingLoading(true);
    try {
      const res = await fetch('/api/properties/viewing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          name: bookingName,
          phone: bookingPhone,
          date: bookingDate,
          time: bookingTime
        })
      });

      if (res.ok) {
        setBookingSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      <div className="bg-zinc-950 border border-gold-soft rounded-xl max-w-5xl w-full p-4 sm:p-8 relative gold-glow max-h-[92vh] overflow-y-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Extreme absolute close knob */}
        <button
          onClick={onClose}
          id="close-property-modal"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 border border-zinc-800 hover:border-gold-400 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Top Titles block */}
        <div className="space-y-2 text-right">
          <div className="flex flex-wrap items-center gap-2">
            {property.badges.map((b, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-gold-400/10 border border-gold-400/30 text-gold-300 text-[10px] font-bold uppercase rounded"
              >
                {t[`badge_${b}` as any] || b}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mt-1">
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-wide">
              {lang === 'ar' ? property.title_ar : property.title_en}
            </h2>
            <div className="text-xl sm:text-2xl font-serif font-bold text-gold-gradient tracking-tight">
              {property.price.toLocaleString()} {t.currency}
            </div>
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={13} className="text-gold-400" />
            <span>{lang === 'ar' ? `${property.district_ar} (${property.region_ar} - الرياض)` : `${property.district_en} (${property.region_en}, Riyadh)`}</span>
          </p>
        </div>

        {/* Layout main splitter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Gallery, specifications, amenities, location */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Immersive gallery block Slider */}
            <div className="relative aspect-video rounded-lg overflow-hidden border border-gold-soft/30 bg-black">
              {show3dGallery ? (
                /* Simulated 3D blueprint active */
                <div className="relative w-full h-full bg-zinc-950 flex flex-col justify-between">
                  <div className="p-3 text-[10px] text-zinc-500 font-mono flex justify-between items-center bg-black/40 z-10">
                    <span>👑 INTERACTIVE WIREFRAME BLUEPRINT</span>
                    <span>DRAG ROTATION ENABLED</span>
                  </div>
                  <canvas ref={canvas3dRef} className="w-full grow" />
                  <button
                    onClick={() => setShow3dGallery(false)}
                    className="absolute bottom-3 right-3 z-10 px-3 py-1.5 bg-gold-gradient text-black font-bold text-[10px] rounded"
                  >
                    📸 {lang === 'ar' ? 'عرض الصور العادية' : 'View Real Photos'}
                  </button>
                </div>
              ) : (
                /* Photo slider view */
                <div className="w-full h-full relative group">
                  <img
                    src={property.images[activeImageIndex]}
                    alt="Listing Gallery"
                    className="w-full h-full object-cover transition-all"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Slider Arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full border border-gold-soft/10 text-white hover:text-gold-400"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full border border-gold-soft/10 text-white hover:text-gold-400"
                  >
                    <ArrowRight size={16} />
                  </button>

                  <div className="absolute bottom-3 left-3 bg-black/75 px-2.5 py-1 text-[10px] rounded font-mono">
                    {activeImageIndex + 1} / {property.images.length}
                  </div>

                  {/* 3D toggle triggers */}
                  <button
                    onClick={() => setShow3dGallery(true)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/85 border border-gold-soft/40 hover:bg-gold-500 hover:text-black font-bold text-[10px] text-gold-400 rounded transition-all cursor-pointer"
                  >
                    📐 {lang === 'ar' ? 'المجسم ثلاثي الأبعاد' : '3D Wireframe Model'}
                  </button>
                </div>
              )}
            </div>

            {/* Video Tour Playing */}
            {property.videoUrl && (
              <div className="space-y-2 text-right">
                <span className="text-xs uppercase font-serif font-bold text-gold-400 block tracking-wider">📽️ {lang === 'ar' ? 'جولة فيديو سينمائية حية' : 'Cinematic Video Tour'}</span>
                <video
                  src={property.videoUrl}
                  controls
                  className="w-full rounded-lg border border-gold-soft/20 aspect-video object-cover"
                />
              </div>
            )}

            {/* Property details description text block */}
            <div className="space-y-3 text-right">
              <span className="text-xs uppercase font-serif font-bold text-gold-400 block tracking-wider">{lang === 'ar' ? 'نبذة استشارية عن المعمار' : 'Architectural Design Narrative'}</span>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light">
                {lang === 'ar' ? property.description_ar : property.description_en}
              </p>
            </div>

            {/* Structured Specifications Counters */}
            <div className="grid grid-cols-3 gap-4 border-t border-b border-gold-soft/30 py-4 text-center">
              <div>
                <span className="text-gray-500 text-[10px] block uppercase">{lang === 'ar' ? 'مساحة المسطح الكلي' : 'Total Area'}</span>
                <span className="font-serif font-bold text-sm text-white mt-1 block">{property.area} {t.area_unit}</span>
              </div>
              <div className="border-r border-gold-soft/15" />
              <div>
                <span className="text-gray-500 text-[10px] block uppercase">{lang === 'ar' ? 'الغرف السكنية' : 'Bedrooms'}</span>
                <span className="font-serif font-bold text-sm text-white mt-1 block flex items-center justify-center gap-1">
                  <Bed size={13} className="text-gold-400" />
                  <span>{property.bedrooms} {t.beds}</span>
                </span>
              </div>
              <div className="border-r border-gold-soft/15" />
              <div>
                <span className="text-gray-500 text-[10px] block uppercase">{lang === 'ar' ? 'دورات مياه رخام' : 'Bathrooms'}</span>
                <span className="font-serif font-bold text-sm text-white mt-1 block flex items-center justify-center gap-1">
                  <Bath size={13} className="text-gold-400" />
                  <span>{property.bathrooms} {t.baths}</span>
                </span>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="space-y-3 text-right">
              <span className="text-xs uppercase font-serif font-bold text-gold-400 block tracking-wider">{lang === 'ar' ? 'تجهيزات ومرافق ترفيهية' : 'Luxury Conveniences & Amenities'}</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(lang === 'ar' ? property.amenities_ar : property.amenities_en).map((a, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-900 rounded">
                    <Check size={12} className="text-gold-500 shrink-0" />
                    <span className="text-gray-300 font-light truncate">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solid engineering features */}
            <div className="space-y-3 text-right">
              <span className="text-xs uppercase font-serif font-bold text-gold-400 block tracking-wider">{lang === 'ar' ? 'معايير جودة التنفيذ والضمانات' : 'Material Quality & Warranties'}</span>
              <div className="space-y-1.5 text-xs">
                {(lang === 'ar' ? property.features_ar : property.features_en).map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                    <span className="text-gray-300 font-light">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom vector coordinates map placeholder representing Riyadh */}
            <div className="space-y-3 text-right">
              <span className="text-xs uppercase font-serif font-bold text-gold-400 block tracking-wider">{lang === 'ar' ? 'إحداثيات الموقع والمجاورة' : 'Geographical Proximity Map'}</span>
              <div className="h-44 rounded-lg bg-zinc-900 border border-gold-soft/20 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#c29545_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                <div className="relative text-center z-10 space-y-2 p-4">
                  <MapPin className="text-gold-400 mx-auto animate-bounce" size={24} />
                  <p className="text-xs text-white uppercase font-bold tracking-widest">{lang === 'ar' ? property.district_ar : property.district_en}</p>
                  <p className="text-[10px] text-gray-400 max-w-xs">{lang === 'ar' ? 'يمنحك المربع الذهبي خصوصية مطلقة بجوار الحي الدبلوماسي والمشاريع الكبرى.' : 'Located in the golden luxury corridor proximal to crucial upscale services.'}</p>
                </div>
              </div>
            </div>

            {/* Mortgage Calculator Slider Widget */}
            <MortgageCalculator lang={lang} defaultPrice={property.price} />

          </div>

          {/* RIGHT COLUMN: Booking, Agent details, share */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* VIP Advisory Booking Card */}
            <div className="bg-zinc-950 p-6 border border-gold-soft/30 rounded-lg space-y-5">
              <div className="text-right border-b border-gold-soft/15 pb-3">
                <h4 className="font-serif font-bold text-base text-white">{t.viewing_title}</h4>
                <p className="text-[11px] text-gray-400 mt-1">{t.viewing_subtitle}</p>
              </div>

              {bookingSuccess ? (
                <div className="p-4 bg-gold-500/10 border border-gold-500/20 rounded text-center space-y-4 animate-[fadeIn_0.4s_ease]">
                  <Check className="text-gold-400 mx-auto bg-gold-400/20 rounded-full p-2" size={40} />
                  <p className="text-xs text-gold-1200 leading-relaxed font-semibold text-gold-200">
                    {t.viewing_success}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleViewingSubmit} className="space-y-4 text-right">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">{t.client_name}</label>
                    <input
                      type="text"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      placeholder={lang === 'ar' ? 'سليمان بن محمد' : 'e.g. Faisal Al-Saud'}
                      className="w-full bg-black border border-gold-soft text-white text-xs p-3 rounded focus:outline-none focus:border-gold-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">{t.client_phone}</label>
                    <input
                      type="tel"
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      placeholder="+966 5X XXX XXXX"
                      className="w-full bg-black border border-gold-soft text-white text-xs p-3 rounded focus:outline-none focus:border-gold-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">{t.viewing_date}</label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-black border border-gold-soft text-white text-xs p-3 rounded focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">{t.viewing_time}</label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-black border border-gold-soft text-white text-xs p-3 h-[42px] rounded focus:outline-none"
                      >
                        <option>10:00 AM</option>
                        <option>02:00 PM</option>
                        <option>05:00 PM - Sunset Tour</option>
                        <option>08:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="submit-booking-btn"
                    disabled={bookingLoading}
                    className="w-full py-3 bg-gold-gradient hover:bg-gold-600 text-black font-bold text-xs rounded transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    {bookingLoading ? t.smart_search_active : t.viewing_submit}
                  </button>
                </form>
              )}
            </div>

            {/* Exclusive Private Agent info block */}
            <div className="bg-zinc-950 p-5 rounded-lg border border-zinc-900 flex items-center justify-between gap-4">
              <div className="space-y-1.5 text-right flex-1">
                <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-gold-400 block">{lang === 'ar' ? 'المستشار العقاري الحصري للكود' : 'Senior Client Representative'}</span>
                <span className="block text-sm font-serif font-bold text-white">الأستاذ متعب المطيري / Advisor Mutab</span>
                <span className="block text-[11px] text-zinc-400">{lang === 'ar' ? 'نائب رئيس محفظة حطين والملقا السكنية' : 'VP Luxury Estates Hittin Branch'}</span>
                
                <div className="flex gap-2.5 pt-2">
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 px-3 border border-teal-500/20 hover:bg-teal-500 hover:text-black text-[10px] text-teal-400 rounded-full flex items-center gap-1 transition-all"
                  >
                    <MessageCircle size={11} />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${callNumber}`}
                    className="p-1 px-3 border border-blue-500/20 hover:bg-blue-500 hover:text-black text-[10px] text-blue-400 rounded-full flex items-center gap-1 transition-all"
                  >
                    <Phone size={11} />
                    <span>Call Direct</span>
                  </a>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-gold-soft flex items-center justify-center font-serif text-gold-400 font-bold shrink-0">
                LRE
              </div>
            </div>

            {/* Share and comparison selectors */}
            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-lg flex flex-col gap-3">
              <button
                _id="add-compare-modal-btn"
                onClick={() => onAddToCompare(property)}
                className={`w-full py-2.5 rounded font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isCompared 
                    ? 'border-gray-500 text-gray-400 bg-white/5 hover:bg-transparent'
                    : 'border-gold-soft/50 text-gold-400 hover:bg-gold-400/15'
                }`}
              >
                <Calculator size={14} />
                <span>{isCompared ? (lang === 'ar' ? 'مضاف للمقارنة بنجاح ⚖️' : 'Added to comparison ledger') : (lang === 'ar' ? 'إضافة إلى جدول المقارنة' : 'Add to compare list')}</span>
              </button>

              <div className="flex gap-2.5 justify-between border-t border-zinc-900 pt-3">
                <span className="text-xs text-gray-400 font-normal self-center">🔗 {lang === 'ar' ? 'مشاركة العقار الفاخر:' : 'Forward sovereign project:'}</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleShareClick}
                    className="p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-gold-400 text-gold-400 hover:text-white transition-all cursor-pointer"
                    title="Copy listing URL"
                  >
                    {copiedShare ? <span className="text-[10px] font-sans">Copied!</span> : <Copy size={13} />}
                  </button>

                  <a
                    href={`https://wa.me/?text=Check%20out%20this%20amazing%20luxury%20property%20by%20Lawami%20Real%20Estate:%20${window.location.origin}/property/${property.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-teal-500 text-teal-400 hover:text-white transition-all flex items-center justify-center"
                    title="Share to WhatsApp"
                  >
                    <MessageCircle size={13} />
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
