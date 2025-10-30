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
 * Uses the bot-portfolio webhook endpoint with correct payload structure
 * @param message - The user's message
 * @param conversationId - Unique identifier for the conversation (for memory persistence)
 */
export async function sendChatMessage(message: string, conversationId: string = 'portfolio-chat'): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    if (!N8N_WEBHOOK_URL) {
      console.warn('N8N webhook URL is not configured');
      return {
        success: false,
        error: 'Webhook not configured'
      };
    }

    // Structure expected by the bot-portfolio webhook with conversationId for memory
    const payload = {
      data: {
        message: message,
        conversationId: conversationId
      }
    };

    console.log('Sending to n8n:', { url: N8N_WEBHOOK_URL, conversationId, messagePreview: message.substring(0, 50) });

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('n8n response received:', data);
      return {
        success: true,
        response: data.message || data.output || data.text || 'Mensaje recibido correctamente.'
      };
    } else {
      const errorText = await response.text();
      console.error('Webhook response error:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
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

// Consultation scheduling webhook URL
const CONSULTATION_WEBHOOK_URL = import.meta.env.VITE_N8N_CONSULTATION_WEBHOOK_URL ||
  'https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno';

/**
 * Schedule a consultation via n8n workflow
 * Sends data to the Google Calendar integration workflow
 */
export async function scheduleConsultation(consultationData: {
  name: string;
  email: string;
  phone?: string;
  consultationType: string;
  preferredDate: string;
  duration: string;
  message?: string;
  timezone?: string;
}): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    console.log('Scheduling consultation:', {
      url: CONSULTATION_WEBHOOK_URL,
      name: consultationData.name,
      date: consultationData.preferredDate
    });

    // Construct the query message for the AI Agent
    const query = `Agendar consulta para ${consultationData.name} (${consultationData.email}) - Tipo: ${consultationData.consultationType} - Fecha preferida: ${consultationData.preferredDate} - Duración: ${consultationData.duration} minutos${consultationData.phone ? ` - Teléfono: ${consultationData.phone}` : ''}${consultationData.message ? ` - Mensaje: ${consultationData.message}` : ''}`;

    const payload = {
      QUERY: query,
      data: {
        name: consultationData.name,
        email: consultationData.email,
        phone: consultationData.phone || '',
        consultationType: consultationData.consultationType,
        preferredDate: consultationData.preferredDate,
        duration: consultationData.duration,
        message: consultationData.message || '',
        timezone: consultationData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    const response = await fetch(CONSULTATION_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Consultation scheduled successfully:', data);
      return {
        success: true,
        response: data
      };
    } else {
      const errorText = await response.text();
      console.error('Consultation scheduling failed:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }
  } catch (error) {
    console.error('Error scheduling consultation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Get available time slots (placeholder - implement based on Google Calendar integration)
 */
export async function getAvailableSlots(date: string): Promise<{ success: boolean; slots?: string[]; error?: string }> {
  // This is a placeholder. In production, this would query n8n to get available slots from Google Calendar
  // For now, return mock business hours
  try {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        success: true,
        slots: []
      };
    }

    // Return business hours slots: 9 AM - 6 PM (Venezuela Time)
    const slots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    return {
      success: true,
      slots
    };
  } catch (error) {
    console.error('Error getting available slots:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Utility function to check if consultation webhook is configured
 */
export function isConsultationWebhookConfigured(): boolean {
  return !!CONSULTATION_WEBHOOK_URL;
}