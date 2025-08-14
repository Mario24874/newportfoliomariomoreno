// API integration for n8n automation workflows
import { Project, SkillCategory } from '@/types';

// Environment variables for n8n integration
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Generic webhook payload interface
export interface WebhookPayload {
  type: string;
  data: any;
  timestamp: number;
  source: 'portfolio';
}

// Contact form data interface
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
}

// Portfolio content update interface
export interface PortfolioUpdate {
  type: 'project' | 'skill' | 'profile';
  action: 'create' | 'update' | 'delete';
  id: string;
  data: any;
}

// Analytics event interface
export interface AnalyticsEvent {
  event: string;
  properties: {
    page?: string;
    section?: string;
    action?: string;
    value?: string | number;
  };
}

/**
 * Send contact form data to n8n webhook
 */
export async function sendContactForm(data: ContactFormData): Promise<boolean> {
  try {
    const payload: WebhookPayload = {
      type: 'contact_form',
      data,
      timestamp: Date.now(),
      source: 'portfolio'
    };

    const response = await fetch(`${N8N_WEBHOOK_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending contact form:', error);
    return false;
  }
}

/**
 * Send portfolio content updates to n8n for automation
 */
export async function sendPortfolioUpdate(update: PortfolioUpdate): Promise<boolean> {
  try {
    const payload: WebhookPayload = {
      type: 'portfolio_update',
      data: update,
      timestamp: Date.now(),
      source: 'portfolio'
    };

    const response = await fetch(`${N8N_WEBHOOK_URL}/portfolio-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending portfolio update:', error);
    return false;
  }
}

/**
 * Send analytics events to n8n for processing
 */
export async function trackEvent(event: AnalyticsEvent): Promise<boolean> {
  try {
    const payload: WebhookPayload = {
      type: 'analytics_event',
      data: event,
      timestamp: Date.now(),
      source: 'portfolio'
    };

    const response = await fetch(`${N8N_WEBHOOK_URL}/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Error tracking event:', error);
    return false;
  }
}

/**
 * Fetch dynamic content from n8n (for content management)
 */
export async function fetchDynamicContent(contentType: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content/${contentType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${contentType} content`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${contentType} content:`, error);
    return null;
  }
}

/**
 * Update portfolio content via n8n automation
 */
export async function updatePortfolioContent(
  contentType: 'projects' | 'skills' | 'profile',
  data: Project[] | SkillCategory[] | any
): Promise<boolean> {
  try {
    const payload: WebhookPayload = {
      type: 'content_update',
      data: {
        contentType,
        content: data
      },
      timestamp: Date.now(),
      source: 'portfolio'
    };

    const response = await fetch(`${N8N_WEBHOOK_URL}/content-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating portfolio content:', error);
    return false;
  }
}

/**
 * Utility function to check if n8n webhook is configured
 */
export function isN8nConfigured(): boolean {
  return !!N8N_WEBHOOK_URL;
}

/**
 * Utility function to get n8n webhook URL
 */
export function getN8nWebhookUrl(): string | undefined {
  return N8N_WEBHOOK_URL;
}

/**
 * Send chat message to n8n and get AI response
 */
export async function sendChatMessage(message: string, conversationId: string = 'portfolio-chat'): Promise<{ success: boolean; response?: string }> {
  try {
    const payload: WebhookPayload = {
      type: 'chat_message',
      data: {
        message,
        conversationId,
        platform: 'portfolio'
      },
      timestamp: Date.now(),
      source: 'portfolio'
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        response: data.message || data.response || 'Mensaje recibido correctamente.'
      };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('Error sending chat message:', error);
    return { success: false };
  }
}

/**
 * Send WhatsApp message via n8n webhook (legacy function)
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const payload: WebhookPayload = {
      type: 'whatsapp_message',
      data: {
        phoneNumber,
        message,
        platform: 'whatsapp'
      },
      timestamp: Date.now(),
      source: 'portfolio'
    };

    const response = await fetch(`${N8N_WEBHOOK_URL}/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}