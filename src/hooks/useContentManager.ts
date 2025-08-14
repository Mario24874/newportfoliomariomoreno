import { useState, useEffect, useCallback } from 'react';
import { Project, SkillCategory } from '@/types';
import { fetchDynamicContent, updatePortfolioContent, isN8nConfigured } from '@/api/n8n';

interface ContentState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing dynamic portfolio content with n8n integration
 */
export function useContentManager() {
  const [projects, setProjects] = useState<ContentState<Project[]>>({
    data: null,
    loading: false,
    error: null
  });

  const [skills, setSkills] = useState<ContentState<SkillCategory[]>>({
    data: null,
    loading: false,
    error: null
  });

  const [profile, setProfile] = useState<ContentState<any>>({
    data: null,
    loading: false,
    error: null
  });

  // Load content from n8n or fallback to local data
  const loadContent = useCallback(async (contentType: 'projects' | 'skills' | 'profile') => {
    if (!isN8nConfigured()) {
      console.warn('n8n not configured, using local content');
      return;
    }

    const setState = contentType === 'projects' ? setProjects : 
                    contentType === 'skills' ? setSkills : setProfile;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchDynamicContent(contentType);
      if (data) {
        setState({ data, loading: false, error: null });
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Failed to load content' }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  }, []);

  // Update content and sync with n8n
  const updateContent = useCallback(async (
    contentType: 'projects' | 'skills' | 'profile',
    data: any
  ): Promise<boolean> => {
    if (!isN8nConfigured()) {
      console.warn('n8n not configured, content update will not be synced');
      return false;
    }

    try {
      const success = await updatePortfolioContent(contentType, data);
      if (success) {
        // Refresh local content after successful update
        await loadContent(contentType);
      }
      return success;
    } catch (error) {
      console.error('Error updating content:', error);
      return false;
    }
  }, [loadContent]);

  // Add new project
  const addProject = useCallback(async (project: Omit<Project, 'id'>): Promise<boolean> => {
    const newProject: Project = {
      ...project,
      id: `proj_${Date.now()}`
    };

    const currentProjects = projects.data || [];
    const updatedProjects = [...currentProjects, newProject];
    
    return await updateContent('projects', updatedProjects);
  }, [projects.data, updateContent]);

  // Update existing project
  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<boolean> => {
    const currentProjects = projects.data || [];
    const updatedProjects = currentProjects.map(project => 
      project.id === projectId ? { ...project, ...updates } : project
    );
    
    return await updateContent('projects', updatedProjects);
  }, [projects.data, updateContent]);

  // Remove project
  const removeProject = useCallback(async (projectId: string): Promise<boolean> => {
    const currentProjects = projects.data || [];
    const updatedProjects = currentProjects.filter(project => project.id !== projectId);
    
    return await updateContent('projects', updatedProjects);
  }, [projects.data, updateContent]);

  // Add new skill category
  const addSkillCategory = useCallback(async (category: SkillCategory): Promise<boolean> => {
    const currentSkills = skills.data || [];
    const updatedSkills = [...currentSkills, category];
    
    return await updateContent('skills', updatedSkills);
  }, [skills.data, updateContent]);

  // Update skill category
  const updateSkillCategory = useCallback(async (title: string, updates: Partial<SkillCategory>): Promise<boolean> => {
    const currentSkills = skills.data || [];
    const updatedSkills = currentSkills.map(category => 
      category.title === title ? { ...category, ...updates } : category
    );
    
    return await updateContent('skills', updatedSkills);
  }, [skills.data, updateContent]);

  // Update profile information
  const updateProfile = useCallback(async (profileData: any): Promise<boolean> => {
    return await updateContent('profile', profileData);
  }, [updateContent]);

  // Initialize content loading
  useEffect(() => {
    if (isN8nConfigured()) {
      loadContent('projects');
      loadContent('skills');
      loadContent('profile');
    }
  }, [loadContent]);

  return {
    // State
    projects: projects.data,
    skills: skills.data,
    profile: profile.data,
    
    // Loading states
    isLoadingProjects: projects.loading,
    isLoadingSkills: skills.loading,
    isLoadingProfile: profile.loading,
    
    // Error states
    projectsError: projects.error,
    skillsError: skills.error,
    profileError: profile.error,
    
    // Actions
    loadContent,
    addProject,
    updateProject,
    removeProject,
    addSkillCategory,
    updateSkillCategory,
    updateProfile,
    
    // Utilities
    isN8nConfigured: isN8nConfigured()
  };
}