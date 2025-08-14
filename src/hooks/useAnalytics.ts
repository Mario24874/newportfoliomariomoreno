import { useEffect, useCallback } from 'react';
import { trackEvent, AnalyticsEvent } from '@/api/n8n';

/**
 * Custom hook for tracking analytics events
 */
export function useAnalytics() {
  // Track page view
  const trackPageView = useCallback((page: string) => {
    const event: AnalyticsEvent = {
      event: 'page_view',
      properties: {
        page,
        action: 'view'
      }
    };
    
    trackEvent(event);
  }, []);

  // Track user interaction
  const trackInteraction = useCallback((action: string, section?: string, value?: string | number) => {
    const event: AnalyticsEvent = {
      event: 'user_interaction',
      properties: {
        action,
        section,
        value
      }
    };
    
    trackEvent(event);
  }, []);

  // Track form submission
  const trackFormSubmission = useCallback((formType: string, success: boolean) => {
    const event: AnalyticsEvent = {
      event: 'form_submission',
      properties: {
        action: 'submit',
        section: formType,
        value: success ? 'success' : 'error'
      }
    };
    
    trackEvent(event);
  }, []);

  // Track project view
  const trackProjectView = useCallback((projectId: string, projectTitle: string) => {
    const event: AnalyticsEvent = {
      event: 'project_view',
      properties: {
        action: 'view',
        section: 'projects',
        value: projectId
      }
    };
    
    trackEvent(event);
  }, []);

  // Track external link clicks
  const trackExternalLink = useCallback((url: string, context: string) => {
    const event: AnalyticsEvent = {
      event: 'external_link_click',
      properties: {
        action: 'click',
        section: context,
        value: url
      }
    };
    
    trackEvent(event);
  }, []);

  return {
    trackPageView,
    trackInteraction,
    trackFormSubmission,
    trackProjectView,
    trackExternalLink
  };
}

/**
 * Hook for tracking section visibility (for scroll-based analytics)
 */
export function useSectionTracking(sectionId: string) {
  const { trackInteraction } = useAnalytics();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackInteraction('section_view', sectionId);
          }
        });
      },
      {
        threshold: 0.5 // Track when 50% of the section is visible
      }
    );

    const element = document.getElementById(sectionId);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [sectionId, trackInteraction]);
}