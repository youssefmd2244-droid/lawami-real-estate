import { useState, useEffect } from 'react';
import { AreaChart, Calculator, Landmark, ShieldCheck } from 'lucide-react';
import { translations } from '../data/translations';

interface MortgageCalculatorProps {
  lang: 'ar' | 'en';
  defaultPrice: number;
}

export default function MortgageCalculator({ lang, defaultPrice }: MortgageCalculatorProps) {
  const [price, setPrice] = useState(defaultPrice || 5000000);
  const [downpayment, setDownpayment] = useState(1000000);
  const [term, setTerm] = useState(20); // years
  const [rate, setRate] = useState(3.5); // interest percentage
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  const t = translations[lang];

  useEffect(() => {
    if (defaultPrice) {
      setPrice(defaultPrice);
      // Auto adjust downpayment as 20%
      setDownpayment(Math.round(defaultPrice * 0.2));
    }
  }, [defaultPrice]);

  useEffect(() => {
    // Calculate Monthly Due
    const principal = price - downpayment;
    if (principal <= 0) {
      setMonthlyPayment(0);
      return;
    }

    const monthlyRate = (rate / 100) / 12;
    const totalMonths = term * 12;

    if (monthlyRate === 0) {
      setMonthlyPayment(principal / totalMonths);
    } else {
      const payment = 
        (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
      setMonthlyPayment(Math.round(payment));
    }
  }, [price, downpayment, term, rate]);

  const isRtl = lang === 'ar';

  return (
    <div
      className="bg-black/80 border border-gold-soft/50 rounded-xl p-6 gold-glow mt-8 text-white"
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      <div className="flex items-center gap-3 border-b border-gold-soft/35 pb-4 mb-6">
        <Landmark className="text-gold-400" size={24} />
        <div>
          <h4 className="font-serif font-bold text-lg">{t.mortgage_title}</h4>
          <p className="text-xs text-gray-400">
            {lang === 'ar' ? 'نموذج محاكاة مرن وقرب التقييم لخطتك الاستثمارية.' : 'Calculate elite property purchasing and amortisation scales.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Sliders Grid */}
        <div className="space-y-5">
          {/* Price */}
          <div>
            <div className="flex justify-between text-xs font-semibold uppercase text-gray-300 mb-2">
              <span>{t.mortgage_price}</span>
              <span className="text-gold-400">{price.toLocaleString()} {t.currency}</span>
            </div>
            <input
              type="range"
              min="1000000"
              max="40000000"
              step="100000"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-gold-500 bg-zinc-900 rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>

          {/* Downpayment */}
          <div>
            <div className="flex justify-between text-xs font-semibold uppercase text-gray-300 mb-2">
              <span>{t.mortgage_downpayment}</span>
              <span className="text-gold-400">
                {downpayment.toLocaleString()} {t.currency} ({Math.round((downpayment / price) * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="100000"
              max={price * 0.9}
              step="50000"
              value={downpayment}
              onChange={(e) => setDownpayment(Number(e.target.value))}
              className="w-full accent-gold-500 bg-zinc-900 rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Term */}
            <div>
              <div className="flex justify-between text-xs font-semibold uppercase text-gray-300 mb-2">
                <span>{t.mortgage_term}</span>
                <span className="text-gold-400">{term} {lang === 'ar' ? 'سنة' : 'Years'}</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                className="w-full accent-gold-500 bg-zinc-900 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
            </div>

            {/* Rate */}
            <div>
              <div className="flex justify-between text-xs font-semibold uppercase text-gray-300 mb-2">
                <span>{t.mortgage_rate}</span>
                <span className="text-gold-400">{rate}%</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="10.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-gold-500 bg-zinc-900 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Dynamic calculation result ledger */}
        <div className="flex flex-col justify-between p-6 bg-zinc-950 border border-gold-soft/30 rounded-lg text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 text-gold-500 opacity-10">
            <Calculator size={110} />
          </div>

          <div className="space-y-4 relative z-10">
            <span className="text-xs uppercase hover:tracking-wider duration-500 tracking-widest text-gold-400 block font-sans">
              {t.mortgage_monthly}
            </span>
            
            <div className="text-3xl sm:text-4xl font-bold font-serif text-gold-gradient tracking-tight my-2">
              {monthlyPayment.toLocaleString()}{' '}
              <span className="text-sm font-sans font-medium text-white">{t.currency} / {lang === 'ar' ? 'شهرياً' : 'Mo'}</span>
            </div>

            <div className="text-xs text-gray-400 flex justify-center gap-4 border-t border-gold-soft/20 pt-4">
              <div>
                <span className="block text-[10px] text-gray-500">{lang === 'ar' ? 'مبلغ التمويل' : 'Loan Amount'}</span>
                <span className="text-sm font-semibold">{(price - downpayment).toLocaleString()} {t.currency}</span>
              </div>
              <div className="border-r border-gold-soft/30" />
              <div>
                <span className="block text-[10px] text-gray-500">{lang === 'ar' ? 'إجمالي الأقساط' : 'Total Repay'}</span>
                <span className="text-sm font-semibold">{(monthlyPayment * term * 12).toLocaleString()} {t.currency}</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 mt-6 leading-relaxed relative z-10">
            ⚠️ {t.mortgage_results_hint}
          </p>
        </div>

      </div>
    </div>
  );
}
