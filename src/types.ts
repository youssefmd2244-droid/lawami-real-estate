export type PropertyType = 'villa' | 'apartment' | 'penthouse' | 'land' | 'palace';

export type PropertyStatus = 'available' | 'new' | 'special_offer' | 'price_reduced' | 'reserved' | 'sold' | 'rented' | 'negotiating';

export interface Property {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  originalPrice?: number; // for "تم تخفيض السعر"
  area: number; // in sqm
  bedrooms: number;
  bathrooms: number;
  type: PropertyType;
  district_ar: string;
  district_en: string;
  region_ar: 'شمال الرياض' | 'شرق الرياض' | 'غرب الرياض' | 'جنوب الرياض' | 'وسط الرياض' | 'الدرعية';
  region_en: 'North Riyadh' | 'East Riyadh' | 'West Riyadh' | 'South Riyadh' | 'Central Riyadh' | 'Diriyah';
  images: string[];
  videoUrl?: string;
  amenities_ar: string[];
  amenities_en: string[];
  features_ar: string[];
  features_en: string[];
  status: PropertyStatus;
  badges: string[]; // ['new', 'special_offer', 'price_reduced']
  viewsCount: number;
  whatsappClicks: number;
  callClicks: number;
  viewingRequestsCount: number;
}

export type LeadStatus = 'new' | 'follow_up' | 'interested' | 'visited' | 'deal_closed' | 'archived';

export interface Lead {
  id: string;
  propertyId?: string;
  propertyTitleAr?: string;
  propertyTitleEn?: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  status: LeadStatus;
  score: number; // 0 to 100 Lead Scoring
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface WebsiteSettings {
  whatsapp_number: string;
  call_number: string;
  address_ar: string;
  address_en: string;
  about_ar: string;
  about_en: string;
  experience_years: number;
  client_count: number;
  premium_properties_count: number;
}

export interface AuditLog {
  id: string;
  action_ar: string;
  action_en: string;
  details_ar: string;
  details_en: string;
  user: string;
  timestamp: string;
}

export interface SmartSearchQuery {
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  region?: string;
  district?: string;
  minArea?: number;
  bedrooms?: number;
}
