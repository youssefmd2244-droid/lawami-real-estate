import fs from 'fs';
import path from 'path';
import { Property, Lead, ContactMessage, WebsiteSettings, AuditLog } from './src/types';
import { initialProperties, defaultWebsiteSettings } from './src/data/initialProperties';

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'db', 'database.json');

interface DatabaseSchema {
  properties: Property[];
  leads: Lead[];
  messages: ContactMessage[];
  settings: WebsiteSettings;
  auditLogs: AuditLog[];
}

class LocalDB {
  private data: DatabaseSchema = {
    properties: [],
    leads: [],
    messages: [],
    settings: defaultWebsiteSettings,
    auditLogs: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
        
        // Ensure settings, leads, etc always exist to prevent blank fields
        if (!this.data.properties || this.data.properties.length === 0) {
          this.data.properties = initialProperties;
        }
        if (!this.data.settings) {
          this.data.settings = defaultWebsiteSettings;
        }
        if (!this.data.leads) this.data.leads = [];
        if (!this.data.messages) this.data.messages = [];
        if (!this.data.auditLogs) this.data.auditLogs = [];
      } else {
        // Bootstrap the initial file
        this.data = {
          properties: initialProperties,
          leads: [],
          messages: [],
          settings: defaultWebsiteSettings,
          auditLogs: [
            {
              id: 'log-init',
              action_ar: 'تهيئة النظام وتثبيت البيانات الأولية',
              action_en: 'System initialization and seeding defaults',
              details_ar: 'تم تهيئة قاعدة البيانات المحلية بستة مشاريع عقارية فاخرة في الرياض.',
              details_en: 'Initialized the database sheet with six flagship luxury listings in Riyadh.',
              user: 'النظام التقني لقسم لوامع العالي',
              timestamp: new Date().toISOString()
            }
          ]
        };
        this.save();
      }
    } catch (e) {
      console.error('Error initializing database file:', e);
      // Fallback in-memory
      this.data = {
        properties: initialProperties,
        leads: [],
        messages: [],
        settings: defaultWebsiteSettings,
        auditLogs: []
      };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing to database json:', e);
    }
  }

  public getProperties(): Property[] {
    return this.data.properties;
  }

  public getPropertyById(id: string): Property | undefined {
    return this.data.properties.find(p => p.id === id);
  }

  public getPropertyBySlug(slug: string): Property | undefined {
    return this.data.properties.find(p => p.slug === slug);
  }

  public addProperty(property: Omit<Property, 'viewsCount' | 'whatsappClicks' | 'callClicks' | 'viewingRequestsCount'> & { viewsCount?: number }): Property {
    const newProperty: Property = {
      ...property,
      viewsCount: property.viewsCount || 0,
      whatsappClicks: 0,
      callClicks: 0,
      viewingRequestsCount: 0
    };
    this.data.properties.unshift(newProperty);
    this.save();
    return newProperty;
  }

  public updateProperty(id: string, updated: Partial<Property>): Property | undefined {
    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.properties[idx] = { ...this.data.properties[idx], ...updated };
      this.save();
      return this.data.properties[idx];
    }
    return undefined;
  }

  public deleteProperty(id: string): boolean {
    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.properties.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Analytics helper functions
  public incrementPropertyStat(id: string, stat: 'viewsCount' | 'whatsappClicks' | 'callClicks' | 'viewingRequestsCount') {
    const prop = this.data.properties.find(p => p.id === id);
    if (prop) {
      prop[stat] = (prop[stat] || 0) + 1;
      this.save();
    }
  }

  public getLeads(): Lead[] {
    return this.data.leads || [];
  }

  public addLead(lead: Omit<Lead, 'id' | 'createdAt'>): Lead {
    const id = 'lead-' + Math.random().toString(36).substr(2, 9);
    const newLead: Lead = {
      ...lead,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.leads.unshift(newLead);
    this.save();
    return newLead;
  }

  public updateLeadStatus(id: string, status: Lead['status']): Lead | undefined {
    const idx = this.data.leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.leads[idx].status = status;
      this.save();
      return this.data.leads[idx];
    }
    return undefined;
  }

  public getMessages(): ContactMessage[] {
    return this.data.messages || [];
  }

  public addMessage(msg: Omit<ContactMessage, 'id' | 'createdAt'>): ContactMessage {
    const id = 'msg-' + Math.random().toString(36).substr(2, 9);
    const newMessage: ContactMessage = {
      ...msg,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.messages.unshift(newMessage);
    this.save();
    return newMessage;
  }

  public getSettings(): WebsiteSettings {
    return this.data.settings;
  }

  public updateSettings(updated: Partial<WebsiteSettings>): WebsiteSettings {
    this.data.settings = { ...this.data.settings, ...updated };
    this.save();
    return this.data.settings;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs || [];
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const id = 'log-' + Math.random().toString(36).substr(2, 9);
    const newLog: AuditLog = {
      ...log,
      id,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(newLog);
    this.save();
    return newLog;
  }
}

export const db = new LocalDB();
