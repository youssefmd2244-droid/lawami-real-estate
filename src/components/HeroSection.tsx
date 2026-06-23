import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, MessageSquare, Compass, Sparkles } from 'lucide-react';
import { translations } from '../data/translations';

interface HeroSectionProps {
  lang: 'ar' | 'en';
  onBrowseClick: () => void;
  onSearchFocus: () => void;
}

export default function HeroSection({ lang, onBrowseClick, onSearchFocus }: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [deviceFallback, setDeviceFallback] = useState(false);
  const t = translations[lang];

  // Golden Particle system that floats and binds with lines based on mouse position
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect performance capability
    const isWeakDevice = 
      navigator.userAgent.includes('Mobi') || 
      window.innerWidth < 768 || 
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);

    if (isWeakDevice) {
      setDeviceFallback(true);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const particles: Particle[] = [];
    const maxParticles = isWeakDevice ? 35 : 120;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      growth: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Float slowly upwards
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -(Math.random() * 0.5 + 0.1);
        this.radius = Math.random() * 2 + 0.5;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.growth = Math.random() * 0.01 + 0.005;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Reset if floats off screen
        if (this.y < 0) {
          this.y = height;
          this.x = Math.random() * width;
        }
        if (this.x < 0 || this.x > width) {
          this.vx *= -1;
        }

        // Shimmer effect
        this.alpha += this.growth;
        if (this.alpha > 0.8 || this.alpha < 0.1) {
          this.growth *= -1;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.shadowBlur = 10;
        c.shadowColor = 'rgba(202, 163, 91, 0.4)';
        c.fillStyle = `rgba(202, 163, 91, ${this.alpha})`;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    // Track mouse coordinates
    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Simple luxury golden grid backdrop representing architecture blueprint
      ctx.strokeStyle = 'rgba(194, 149, 69, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw and connect particles
      particles.forEach((p, idx) => {
        p.update();
        p.draw(ctx);

        // Connection to mouse
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(202, 163, 91, ${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        // Connection to other particles
        for (let j = idx + 1; j < particles.length; j++) {
          const target = particles[j];
          const distance = Math.hypot(p.x - target.x, p.y - target.y);
          if (distance < 110) {
            ctx.strokeStyle = `rgba(202, 163, 91, ${0.08 * (1 - distance / 110)})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isRtl = lang === 'ar';

  const [tilt, setTilt] = useState({ rx: 0, ry: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const xNorm = (e.clientX / innerWidth) - 0.5;
      const yNorm = (e.clientY / innerHeight) - 0.5;
      
      setTilt({
        rx: yNorm * -20, // tilt up/down nicely
        ry: xNorm * 20,  // tilt left/right nicely
        tx: xNorm * 30,  // subtle translate X
        ty: yNorm * 30,  // subtle translate Y
      });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen bg-luxury-dark overflow-hidden flex items-center justify-center pt-24 pb-12 lg:pt-28"
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      {/* Immersive background high-end slide */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark via-luxury-dark/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-luxury-dark/95 via-transparent to-luxury-dark/95 z-10" />
        <img
          src="/src/assets/images/luxury_villa_riyadh_exterior_1782158906130.jpg"
          alt="Riyadh Luxury Villa"
          className="w-full h-full object-cover opacity-20 object-center transform scale-105"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Floating Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
      />

      {/* Hero Core Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 sm:pb-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Narrative Info (Left on LTR, Right on RTL) */}
          <div className={`lg:col-span-7 text-center ${isRtl ? 'lg:text-right lg:items-start' : 'lg:text-left lg:items-end'} space-y-6 flex flex-col justify-center`}>
            
            {/* Brand visual crown badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs font-semibold mb-2 uppercase tracking-wider animate-bounce self-center lg:self-start">
              <Sparkles size={12} className="text-gold-300 animate-pulse" />
              <span>{lang === 'ar' ? 'فخامة مُتميزة بلا حدود' : 'Timeless Luxury Architecture'}</span>
            </div>

            {/* Cinematic headline */}
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-wide leading-tight">
              {t.brand_name}{' '}
              <span className="text-gold-gradient block mt-2 text-2xl sm:text-4xl md:text-5xl font-semibold">
                {t.tagline}
              </span>
            </h1>

            {/* Narrative subheadings */}
            <p className="max-w-2xl text-sm sm:text-base md:text-lg text-gray-300 font-light leading-relaxed">
              {t.slogan_sub}
            </p>

            {/* Dynamic CTAs */}
            <div className={`flex flex-col sm:flex-row items-center gap-4 pt-4 w-full ${isRtl ? 'lg:justify-start' : 'lg:justify-start'} justify-center`}>
              <button
                id="hero-see-properties"
                onClick={onBrowseClick}
                className="w-full sm:w-auto px-8 py-4 bg-gold-gradient hover:bg-gold-600 text-black font-bold tracking-wide rounded relative overflow-hidden shadow-2xl transition-all duration-300 hover:scale-105 hover:translate-y-[-2px] pulse-gold flex items-center justify-center gap-2 group cursor-pointer shine-sweep-hover"
              >
                <span>{t.browse_btn}</span>
                {isRtl ? (
                  <ArrowLeft size={18} className="transform group-hover:-translate-x-1.5 transition-transform" />
                ) : (
                  <ArrowRight size={18} className="transform group-hover:translate-x-1.5 transition-transform" />
                )}
              </button>

              <button
                id="hero-jump-search"
                onClick={onSearchFocus}
                className="w-full sm:w-auto px-8 py-4 bg-black/75 border border-gold-400/35 text-gold-400 font-bold tracking-wide rounded relative overflow-hidden hover:bg-gold-400/15 hover:border-gold-400 shadow-xl transition-all duration-300 hover:scale-105 hover:translate-y-[-2px] flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Compass size={18} className="group-hover:rotate-[180deg] transition-transform duration-700" />
                <span className="relative z-10">{t.smart_search_btn}</span>
              </button>
            </div>

            {/* Low Device / Custom Fallback Notification */}
            {deviceFallback && (
              <div className="text-xs text-gray-500 font-mono mt-4">
                💡 {t.low_device_warning}
              </div>
            )}

            {/* Sizable visual counter counters bar */}
            <div className="grid grid-cols-3 gap-4 border-t border-b border-gold-soft/30 py-6 w-full max-w-xl mx-auto lg:mx-0">
              <div>
                <span className="block font-serif text-xl sm:text-3xl font-bold text-gold-400">15+</span>
                <span className="block text-[10px] sm:text-xs text-gray-400 mt-1">{t.stats_experience}</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-3xl font-bold text-gold-400">2,400+</span>
                <span className="block text-[10px] sm:text-xs text-gray-400 mt-1">{t.stats_clients}</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-3xl font-bold text-gold-400">530+</span>
                <span className="block text-[10px] sm:text-xs text-gray-400 mt-1">{t.stats_properties}</span>
              </div>
            </div>

          </div>

          {/* Interactive 3D Perspective Photo Frame Column */}
          <div className="lg:col-span-5 flex justify-center items-center relative py-12 lg:py-0">
            {/* Ambient Background Aura Shifting with Mouse */}
            <div 
              className="absolute w-72 h-72 rounded-full bg-gold-400/10 blur-[60px] pointer-events-none transition-transform duration-300 ease-out" 
              style={{
                transform: `translate3d(${tilt.tx * 0.8}px, ${tilt.ty * 0.8}px, 0px)`
              }}
            />

            {/* Interactive 3D Rotating Frame */}
            <div 
              className="relative w-full max-w-sm aspect-[4/5] rounded-3xl bg-zinc-950 p-3 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] border border-gold-400/30 select-none group/card overflow-hidden transition-all duration-200 ease-out hover:border-gold-400/70"
              style={{
                transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.02, 1.02, 1.02)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s ease-out, border-color 0.3s'
              }}
            >
              {/* Inner Metallic Gold border line */}
              <div 
                className="absolute inset-2 border border-gold-500/25 rounded-2xl pointer-events-none transition-colors duration-500 group-hover/card:border-gold-400/50" 
                style={{ transform: 'translateZ(15px)' }}
              />

              {/* Shimmer Light Sweeping on mouse movement */}
              <div 
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-gold-400/10 to-transparent pointer-events-none transition-transform duration-500 group-hover/card:translate-x-full" 
                style={{
                  transform: `translate3d(${tilt.tx * -0.5}px, ${tilt.ty * -0.5}px, 20px) skewX(-20deg)`
                }}
              />

              <div className="w-full h-full rounded-2xl overflow-hidden relative">
                {/* Overlay Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15 z-10" />
                
                {/* Main Luxury Architectural Image */}
                <img
                  src="/src/assets/images/luxury_villa_riyadh_exterior_1782158906130.jpg"
                  alt="Riyadh Luxury Villa"
                  className="w-full h-full object-cover transform scale-110 group-hover/card:scale-100 transition-transform duration-700 object-center"
                  referrerPolicy="no-referrer"
                />

                {/* RPG Floating labels anchored onto the 3D Image */}
                <div 
                  className="absolute bottom-6 left-6 right-6 z-20 bg-black/80 backdrop-blur-md p-4 border border-gold-400/30 rounded-xl text-right"
                  style={{ transform: 'translateZ(30px)' }}
                >
                  <div className="flex justify-between items-center mb-1.5 gap-2">
                    <span className="px-2 py-0.5 rounded bg-gold-400/20 text-gold-300 text-[9px] uppercase tracking-wider font-bold">
                      {lang === 'ar' ? 'تصميم حصري' : 'Exclusive'}
                    </span>
                    <span className="text-white text-xs font-serif font-bold">
                      {lang === 'ar' ? 'فيلا شمال الرياض الفاخرة' : 'North Riyadh Exclusive Villa'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 font-light leading-relaxed">
                    {lang === 'ar' ? 'تجسيد فائق للخصوصية والهندسة الفاخرة' : 'Sovereign privacy meets structural masterpiece.'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating Ornamental Rings behind/around the 3D card (RPG style) */}
            <div className="absolute inset-0 border border-dashed border-gold-500/10 rounded-full scale-125 animate-spin-slow pointer-events-none" />
          </div>

        </div>
      </div>

      {/* Floating elegant scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden sm:block">
        <button
          onClick={onBrowseClick}
          className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-widest text-gold-400/60 hover:text-gold-400 transition-colors duration-300"
        >
          <span>{isRtl ? 'اسحب للأسفل لتصفح المحفظة' : 'Scroll Down'}</span>
          <div className="w-5 h-8 border border-gold-400/40 rounded-full flex justify-center p-1">
            <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce" />
          </div>
        </button>
      </div>

    </section>
  );
}
