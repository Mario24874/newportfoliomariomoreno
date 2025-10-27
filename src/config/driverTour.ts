import { DriveStep } from 'driver.js';

export interface TourTranslations {
  doneBtnText: string;
  closeBtnText: string;
  nextBtnText: string;
  prevBtnText: string;
  steps: DriveStep[];
}

export const tourConfig: Record<'en' | 'es', TourTranslations> = {
  en: {
    doneBtnText: 'Done',
    closeBtnText: 'Close',
    nextBtnText: 'Next',
    prevBtnText: 'Previous',
    steps: [
      {
        element: 'header',
        popover: {
          title: 'Welcome to My Portfolio! 👋',
          description: 'Let me show you around! This quick tour will help you navigate through my work and experience.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#language-toggle',
        popover: {
          title: 'Language Selector 🌐',
          description: 'Switch between English and Spanish at any time. The entire portfolio adapts to your preferred language.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#theme-toggle',
        popover: {
          title: 'Theme Toggle 🌓',
          description: 'Choose between light and dark mode for a comfortable viewing experience.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#hero-section',
        popover: {
          title: 'Introduction 👨‍💻',
          description: 'Here you\'ll find a quick overview of who I am and what I do as an AI Developer and Innovation Engineer.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#skills-section',
        popover: {
          title: 'Skills & Technologies 🛠️',
          description: 'Explore my technical expertise across multiple domains including programming languages, frameworks, AI, and more.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#projects-section',
        popover: {
          title: 'Featured Projects 🚀',
          description: 'Check out my latest AI-powered projects and innovative solutions. Each project includes live demos and source code links.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#demos-section',
        popover: {
          title: 'AI Demos 🤖',
          description: 'Experience cutting-edge AI technology! Try my voice assistant or chat with my WhatsApp bot.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#mobile-apps-section',
        popover: {
          title: 'Mobile Applications 📱',
          description: 'Download my mobile apps for Android and iOS. Experience AI technology on your device!',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#contact-section',
        popover: {
          title: 'Get In Touch 📬',
          description: 'Ready to collaborate? Contact me through the form or connect via WhatsApp, LinkedIn, or email.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#whatsapp-widget',
        popover: {
          title: 'Quick Contact 💬',
          description: 'Click here anytime to chat with me directly on WhatsApp!',
          side: 'left',
          align: 'center'
        }
      }
    ]
  },
  es: {
    doneBtnText: 'Finalizar',
    closeBtnText: 'Cerrar',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    steps: [
      {
        element: 'header',
        popover: {
          title: '¡Bienvenido a Mi Portafolio! 👋',
          description: '¡Déjame mostrarte todo! Este tour rápido te ayudará a navegar por mi trabajo y experiencia.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#language-toggle',
        popover: {
          title: 'Selector de Idioma 🌐',
          description: 'Cambia entre inglés y español en cualquier momento. Todo el portafolio se adapta a tu idioma preferido.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#theme-toggle',
        popover: {
          title: 'Cambio de Tema 🌓',
          description: 'Elige entre modo claro y oscuro para una experiencia de visualización cómoda.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#hero-section',
        popover: {
          title: 'Introducción 👨‍💻',
          description: 'Aquí encontrarás una descripción rápida de quién soy y qué hago como Desarrollador IA e Ingeniero de Innovación.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#skills-section',
        popover: {
          title: 'Habilidades y Tecnologías 🛠️',
          description: 'Explora mi experiencia técnica en múltiples dominios incluyendo lenguajes de programación, frameworks, IA y más.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#projects-section',
        popover: {
          title: 'Proyectos Destacados 🚀',
          description: 'Mira mis últimos proyectos potenciados por IA y soluciones innovadoras. Cada proyecto incluye demos en vivo y enlaces al código fuente.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#demos-section',
        popover: {
          title: 'Demos de IA 🤖',
          description: '¡Experimenta tecnología IA de vanguardia! Prueba mi asistente de voz o chatea con mi bot de WhatsApp.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#mobile-apps-section',
        popover: {
          title: 'Aplicaciones Móviles 📱',
          description: 'Descarga mis aplicaciones móviles para Android e iOS. ¡Experimenta la tecnología IA en tu dispositivo!',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#contact-section',
        popover: {
          title: 'Contáctame 📬',
          description: '¿Listo para colaborar? Contáctame a través del formulario o conéctate vía WhatsApp, LinkedIn o correo electrónico.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#whatsapp-widget',
        popover: {
          title: 'Contacto Rápido 💬',
          description: '¡Haz clic aquí en cualquier momento para chatear conmigo directamente en WhatsApp!',
          side: 'left',
          align: 'center'
        }
      }
    ]
  }
};
