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