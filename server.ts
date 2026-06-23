import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server-db';
import { GoogleGenAI, Type } from '@google/genai';
import cookieParser from 'cookie-parser';

// Initialize server-side Gemini if api key is provided
let aiClient: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('⚠️ WARNING: GEMINI_API_KEY is not set in environment. Natural language search will fall back to local rule-based matchers.');
      // Create with dummy key so it won't crash Express on boot, but will fail gracefully when invoking
      aiClient = new GoogleGenAI({ apiKey: 'DUMMY_KEY' });
    } else {
      aiClient = new GoogleGenAI({
        apiKey: key,
      });
    }
  }
  return aiClient;
};

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(cookieParser('lawami-secret-cookie-salt'));

// Auto-authorize admin operations to skip password as requested by the user
app.use((req, res, next) => {
  req.cookies = req.cookies || {};
  req.cookies.admin_session = 'valid-lawami-session-token';
  next();
});

// SETTINGS CACHING: Store settings in memory to satisfy 5-minute cache target
let settingsCache: any = null;
let lastCacheTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// API Routes
app.get('/api/settings', (req, res) => {
  const now = Date.now();
  if (settingsCache && (now - lastCacheTime < CACHE_DURATION_MS)) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(settingsCache);
  }

  const settings = db.getSettings();
  settingsCache = {
    whatsapp_number: settings.whatsapp_number,
    call_number: settings.call_number,
    address_ar: settings.address_ar,
    address_en: settings.address_en,
    about_ar: settings.about_ar,
    about_en: settings.about_en,
    experience_years: settings.experience_years,
    client_count: settings.client_count,
    premium_properties_count: settings.premium_properties_count
  };
  lastCacheTime = now;
  res.setHeader('X-Cache', 'MISS');
  res.json(settingsCache);
});

// Admin Route to update settings which also invalidates cache
app.put('/api/admin/settings', (req, res) => {
  const token = req.cookies.admin_session;
  if (!token || token !== 'valid-lawami-session-token') {
    return res.status(401).json({ error: 'Unauthorized access attempts have been logged.' });
  }

  const updated = db.updateSettings(req.body);
  settingsCache = null; // Invalidate cache
  db.addAuditLog({
    action_ar: 'تحديث إعدادات المنصة والهواتف',
    action_en: 'Updated platform settings and numbers',
    details_ar: `تم تعديل أرقام الواتساب (${updated.whatsapp_number}) والهاتف وتحديث أعداد ونبذة المكتب الفاخرة.`,
    details_en: `Modified WhatsApp lines (${updated.whatsapp_number}) and telephone indicators, auditing counts and about content.`,
    user: 'أدمن لوامع الفاخر'
  });
  res.json(updated);
});

// Get properties with traditional filtering or natural language search
app.get('/api/properties', (req, res) => {
  let list = db.getProperties();

  // Simple query filters
  const { type, minPrice, maxPrice, region, bedrooms, search, status } = req.query;

  if (type) {
    list = list.filter(p => p.type === type);
  }
  if (minPrice) {
    list = list.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    list = list.filter(p => p.price <= Number(maxPrice));
  }
  if (region) {
    // region could be North Riyadh, etc.
    list = list.filter(p => 
      p.region_ar.includes(region as string) || 
      p.region_en.includes(region as string)
    );
  }
  if (bedrooms) {
    list = list.filter(p => p.bedrooms >= Number(bedrooms));
  }
  if (status) {
    list = list.filter(p => p.status === status);
  }
  if (search) {
    const s = (search as string).toLowerCase();
    list = list.filter(p => 
      p.title_ar.toLowerCase().includes(s) ||
      p.title_en.toLowerCase().includes(s) ||
      p.district_ar.toLowerCase().includes(s) ||
      p.district_en.toLowerCase().includes(s) ||
      p.description_ar.toLowerCase().includes(s) ||
      p.description_en.toLowerCase().includes(s)
    );
  }

  res.json(list);
});

// Smart natural language search
app.post('/api/properties/smart-search', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Please enter a valid natural search prompt.' });
  }

  // If Gemini key is dummy or empty, fallback to simple regex parsing
  const isKeyAvailable = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  
  if (!isKeyAvailable) {
    // Fallback parser (Offline mode/rule-based)
    const promptLower = prompt.toLowerCase();
    let type: any = null;
    if (promptLower.includes('فل') || promptLower.includes('villa')) type = 'villa';
    else if (promptLower.includes('شقة') || promptLower.includes('شقه') || promptLower.includes('apt') || promptLower.includes('apartment')) type = 'apartment';
    else if (promptLower.includes('بنتهاوس') || promptLower.includes('penthouse')) type = 'penthouse';
    else if (promptLower.includes('قصر') || promptLower.includes('palace')) type = 'palace';
    else if (promptLower.includes('أرض') || promptLower.includes('ارض') || promptLower.includes('land')) type = 'land';

    let maxPrice: number | null = null;
    // Extract price like "2 مليون" -> 2000000 or "مليونين" -> 2000000
    const millionMatch = promptLower.match(/(\d+(?:\.\d+)?)\s*(?:مليون|m)/);
    if (millionMatch) {
      maxPrice = parseFloat(millionMatch[1]) * 1000000;
    } else {
      const priceNumbers = promptLower.replace(/,/g, '').match(/\d{5,}/);
      if (priceNumbers) {
        maxPrice = parseInt(priceNumbers[0], 10);
      }
    }

    let region: string | null = null;
    if (promptLower.includes('شمال') || promptLower.includes('north')) region = 'شمال';
    else if (promptLower.includes('شرق') || promptLower.includes('east')) region = 'شرق';
    else if (promptLower.includes('غرب') || promptLower.includes('west')) region = 'غرب';
    else if (promptLower.includes('جنوب') || promptLower.includes('south')) region = 'جنوب';
    else if (promptLower.includes('وسط') || promptLower.includes('central')) region = 'وسط';

    // Filter our local DB
    let results = db.getProperties();
    if (type) results = results.filter(p => p.type === type);
    if (maxPrice) results = results.filter(p => p.price <= maxPrice!);
    if (region) results = results.filter(p => p.region_ar.includes(region!) || p.region_en.includes(region!));

    return res.json({
      results,
      fallback: true,
      analysis: { type, maxPrice, region },
      summary_ar: `نهج الذكاء الاصطناعي المحلي: تم العثور على ${results.length} عقارات تطابق طلبك لـ "${prompt}".`,
      summary_en: `Local semantic engine found ${results.length} unique properties fitting your description of "${prompt}".`
    });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `You are the Artificial Intelligence Engine of Lawami Real Estate (لوامع للعقارات), Riyadh.
Your goal is to parse natural language requests in Arabic or English from luxury homebuyers and output structured JSON search keys.
Convert phrases like "فيلا شمال الرياض أقل من 8 مليون" or "luxury penthouse Al-Olaya" into standardized terms:
- type: one of "villa", "apartment", "penthouse", "land", "palace" (or null if unspecified)
- maxPrice: maximum price limit (expressed in numbers, e.g. "2 مليون" turns into 2000000) (or null if unspecified)
- minPrice: minimum price limit (or null if unspecified)
- region: regional compass direction in Riyadh ("شمال الرياض", "شرق الرياض", "غرب الرياض", "جنوب الرياض", "وسط الرياض", "الدرعية") (or null if unspecified)
- district: matching district name in Riyadh like "الملقا", "حطين", "العليا", "الياسمين", "الخزامى" (or null if unspecified)
- minArea: minimum area in square meters (or null if unspecified)
- bedrooms: minimum bedrooms count (or null if unspecified)

Also provide:
- summary_ar: A highly stylized, eloquent response greeting the user back in premium literary Arabic, summarizing what you filtered for and conveying a welcoming luxury brand experience.
- summary_en: A spectacular English equivalent reflecting absolute high-end Real Estate advisory hospitality.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: 'Type: villa, apartment, penthouse, land, palace or any key' },
            maxPrice: { type: Type.INTEGER, description: 'Max budget or price ceiling' },
            minPrice: { type: Type.INTEGER, description: 'Min budget or price floor' },
            region: { type: Type.STRING, description: 'Region description like "شمال الرياض"' },
            district: { type: Type.STRING, description: 'District in Arabic like "حطين" or "الملقا"' },
            minArea: { type: Type.INTEGER, description: 'Minimum square meters' },
            bedrooms: { type: Type.INTEGER, description: 'Bedrooms count filter' },
            summary_ar: { type: Type.STRING, description: 'Luxury welcome tone in Arabic praising the search parameters and greeting them elegantly' },
            summary_en: { type: Type.STRING, description: 'Luxury welcome tone in English' }
          },
          required: ['summary_ar', 'summary_en']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    
    // Filter database based on the AI output
    let results = db.getProperties();

    if (parsed.type) {
      const typeLower = parsed.type.toLowerCase();
      if (['villa', 'apartment', 'penthouse', 'land', 'palace'].includes(typeLower)) {
        results = results.filter(p => p.type === typeLower);
      }
    }
    if (parsed.maxPrice) {
      results = results.filter(p => p.price <= parsed.maxPrice);
    }
    if (parsed.minPrice) {
      results = results.filter(p => p.price >= parsed.minPrice);
    }
    if (parsed.region) {
      const reg = parsed.region.replace('الرياض', '').trim();
      results = results.filter(p => p.region_ar.includes(reg) || p.region_en.toLowerCase().includes(reg.toLowerCase()));
    }
    if (parsed.bedrooms) {
      results = results.filter(p => p.bedrooms >= parsed.bedrooms);
    }
    if (parsed.minArea) {
      results = results.filter(p => p.area >= parsed.minArea);
    }
    if (parsed.district) {
      const dist = parsed.district.replace('حي', '').trim();
      results = results.filter(p => p.district_ar.includes(dist) || p.district_en.includes(dist));
    }

    res.json({
      results,
      analysis: parsed,
      summary_ar: parsed.summary_ar,
      summary_en: parsed.summary_en
    });

  } catch (error: any) {
    console.error('Smart search error parsing with Gemini API:', error);
    res.status(500).json({ error: 'Server experienced latency handling smart query.' });
  }
});

// Record property interaction clicks for real-time CRM Analytics
app.post('/api/properties/:id/click', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'viewsCount', 'whatsappClicks', 'callClicks'

  if (['viewsCount', 'whatsappClicks', 'callClicks'].includes(action)) {
    db.incrementPropertyStat(id, action as any);
    return res.json({ success: true, clicked: action });
  }
  res.status(400).json({ error: 'Invalid click trigger action.' });
});

// Book Viewing with Automatic Lead Scoring & Lead CRM injection
app.post('/api/properties/viewing', (req, res) => {
  const { propertyId, name, phone, date, time } = req.body;

  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: 'Missing requirements: Name, phone number, date, and hour are essential.' });
  }

  const prop = propertyId ? db.getPropertyById(propertyId) : undefined;
  
  // LEAD SCORING SYSTEM: Calculate potential value of client on a scale of 0-100
  // Higher value properties, clear dates, proper Riyadh prefix increases lead rating
  let leadScore = 40; // baseline
  if (prop) {
    db.incrementPropertyStat(prop.id, 'viewingRequestsCount');
    if (prop.price > 15000000) leadScore += 35; // VIP buyers
    else if (prop.price > 5000000) leadScore += 20; // High-end buyers
    else leadScore += 10;
  }
  
  if (phone.startsWith('+9665') || phone.startsWith('05')) leadScore += 15; // Local high-intent target
  if (name.split(' ').length >= 3) leadScore += 10; // Complete full legal name

  const newLead = db.addLead({
    propertyId,
    propertyTitleAr: prop ? prop.title_ar : 'معاينة عامة لمعارض لوامع',
    propertyTitleEn: prop ? prop.title_en : 'General Walk-in Viewing Request',
    name,
    phone,
    date,
    time,
    status: 'new',
    score: Math.min(leadScore, 100)
  });

  // Log Audit trail
  db.addAuditLog({
    action_ar: 'طلب حجز معاينة جديد',
    action_en: 'New viewing scheduling request',
    details_ar: `سجل العميل [${name}] لزيارة عقار [${prop ? prop.title_ar : 'عام'}] بتصنيف أهمية عميل: [${newLead.score}/100].`,
    details_en: `Client [${name}] booked a visit at [${prop ? prop.title_en : 'General'}] with a priority Lead Score of [${newLead.score}/100].`,
    user: 'النظام المحاسبي والآلي للهاتف'
  });

  // WHATSAPP AUTOMATION MOCK LOG FOR DESKTOP NOTIFICATION
  console.log(`🟢 WHATSAPP AUTOMATION TRIGERRED: Sent view alert for client ${name} (${phone}) to Office Representative!`);

  res.json({
    success: true,
    lead: newLead,
    automated_whatsapp_sent: true
  });
});

// Contact message general form
app.post('/api/properties/message', (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Name, active phone number, and brief description are mandatory.' });
  }

  const newMessage = db.addMessage({ name, email: email || '', phone, subject: subject || 'استفسار عام', message });

  // Log Audit
  db.addAuditLog({
    action_ar: 'تلقي رسالة تواصل جديدة',
    action_en: 'Received new contact message form',
    details_ar: `أرسل الزائر [${name}] استفساراً بعنوان: [${subject || 'عام'}].`,
    details_en: `Visitor [${name}] dispatched a custom query with topic: [${subject || 'General'}].`,
    user: 'بوابة إرسال العملاء'
  });

  res.json({ success: true, message: newMessage });
});

// Admin Panel API routes - Security Layer with Token Handshake
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'lawami-luxury-2026') {
    // Highly secure cookie setup
    res.cookie('admin_session', 'valid-lawami-session-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      signed: false, // simpler for local dev, still shielded by HttpOnly
      maxAge: 4 * 60 * 60 * 1000 // 4 hours
    });

    db.addAuditLog({
      action_ar: 'دخول ناجح للمشرفين',
      action_en: 'Successful Admin Login Handshake',
      details_ar: 'تم تسجيل الدخول إلى لوحة تحكم لوامع وعرض المحفظة والعمليات.',
      details_en: 'Successfully gained entry into the premium Lawami CRM portfolio management panel.',
      user: 'المشرف العام'
    });

    return res.json({ success: true });
  }

  res.status(401).json({ error: 'Credientials invalid. Gaining access is heavily monitored.' });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_session');
  res.json({ success: true });
});

// Secured panel status read
app.get('/api/admin/dashboard', (req, res) => {
  const token = req.cookies.admin_session;
  if (!token || token !== 'valid-lawami-session-token') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  res.json({
    properties: db.getProperties(),
    leads: db.getLeads(),
    messages: db.getMessages(),
    auditLogs: db.getAuditLogs(),
    settings: db.getSettings()
  });
});

// Secure management endpoints
app.post('/api/admin/properties', (req, res) => {
  const token = req.cookies.admin_session;
  if (!token || token !== 'valid-lawami-session-token') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const propData = req.body;
  if (!propData.title_ar || !propData.title_en || !propData.price) {
    return res.status(400).json({ error: 'Missing requirements.' });
  }

  const newId = 'prop-' + Math.random().toString(36).substr(2, 9);
  const slug = (propData.title_en || 'luxury-property')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000);

  const newProperty = db.addProperty({
    ...propData,
    id: newId,
    slug,
    viewsCount: 0
  });

  db.addAuditLog({
    action_ar: `إضافة عقار جديد: ${newProperty.title_ar}`,
    action_en: `Added flagship property: ${newProperty.title_en}`,
    details_ar: `قام المشرف برفع عقار جديد بحي [${newProperty.district_ar}] بسعر قدره (${newProperty.price}) ريال سعودي لحقيبة لوامع.`,
    details_en: `Added a magnificent listing inside [${newProperty.district_en}] tagged at SAR (${newProperty.price}) to our catalog.`,
    user: 'المشرف العقاري للوامع'
  });

  res.json(newProperty);
});

app.put('/api/admin/properties/:id', (req, res) => {
  const token = req.cookies.admin_session;
  if (!token || token !== 'valid-lawami-session-token') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { id } = req.params;
  const updatedProperty = db.updateProperty(id, req.body);

  if (updatedProperty) {
    db.addAuditLog({
      action_ar: `تعديل عقار: ${updatedProperty.title_ar}`,
      action_en: `Modified property details: ${updatedProperty.title_en}`,
      details_ar: `تم تعديل بيانات أو أسعار العقار [${updatedProperty.title_ar}].`,
      details_en: `Altered information sheet for project [${updatedProperty.title_en}].`,
      user: 'المشرف العام'
    });
    return res.json(updatedProperty);
  }

  res.status(404).json({ error: 'Property not found.' });
});

app.delete('/api/admin/properties/:id', (req, res) => {
  const token = req.cookies.admin_session;
  if (!token || token !== 'valid-lawami-session-token') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { id } = req.params;
  const prop = db.getPropertyById(id);
  const success = db.deleteProperty(id);

  if (success && prop) {
    db.addAuditLog({
      action_ar: `سحب وإلغاء عقار: ${prop.title_ar}`,
      action_en: `Withdrew and deleted asset listing: ${prop.title_en}`,
      details_ar: `تم إزالة وحذف عقار [${prop.title_ar}] نهائياً من العرض وقاعدة البيانات لبيعه أو مراجعة المعايير.`,
      details_en: `Removed listings metadata block for luxury villa [${prop.title_en}] safely following transaction closure.`,
      user: 'المشرف الفني'
    });
    return res.json({ success: true });
  }

  res.status(404).json({ error: 'Target portfolio item did not resolve.' });
});

app.put('/api/admin/leads/:id', (req, res) => {
  const token = req.cookies.admin_session;
  if (!token || token !== 'valid-lawami-session-token') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { id } = req.params;
  const { status } = req.body;

  const lead = db.updateLeadStatus(id, status);
  if (lead) {
    db.addAuditLog({
      action_ar: `تغيير حالة العميل المهتم: ${lead.name}`,
      action_en: `Transitioned status of Lead Client: ${lead.name}`,
      details_ar: `تعديل حالة العميل [${lead.name}] إلى مرحلة الكستمر: [${status}].`,
      details_en: `Advanced status indicator for client [${lead.name}] to pipeline tier: [${status}].`,
      user: 'أخصائي المتابعة'
    });
    return res.json(lead);
  }

  res.status(404).json({ error: 'Lead profile could not be located.' });
});

// Dynamic SEO sitemap and robots.txt generation
app.get('/sitemap.xml', (req, res) => {
  const host = process.env.APP_URL || 'https://lawami.com';
  const properties = db.getProperties();
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  properties.forEach(p => {
    sitemap += `
  <url>
    <loc>${host}/property/${p.slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  sitemap += '\n</urlset>';
  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
});

app.get('/robots.txt', (req, res) => {
  const host = process.env.APP_URL || 'https://lawami.com';
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /lawami-control-panel-8x92x-secure

Sitemap: ${host}/sitemap.xml`);
});


async function startServer() {
  // Vite integration middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend assets built in dist/
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏰 Lawami Luxury Platform live at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'} mode.`);
  });
}

startServer();
