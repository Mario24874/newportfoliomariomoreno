import React from 'react';

export interface SkillItem {
  name: string;
  icon?: React.ElementType; // For potential icons
}

export interface SkillCategory {
  title: string;
  skills: SkillItem[];
  description?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  liveUrl?: string;
  repoUrl?: string;
}

export interface NavItem {
  name: string;
  href: string;
  key: string;
}

// Consultation scheduling types
export interface ConsultationRequest {
  name: string;
  email: string;
  phone?: string;
  consultationType: 'ai-development' | 'web-development' | 'automation' | 'other';
  preferredDate: string; // ISO format date-time
  duration: '30' | '60'; // minutes
  message?: string;
  timezone?: string;
}

export interface ConsultationResponse {
  success: boolean;
  message: string;
  eventId?: string;
  meetingLink?: string;
  error?: string;
}

export interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
}