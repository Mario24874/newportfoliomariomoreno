// Configuración de la imagen de fondo del Hero
export const getHeroBackgroundConfig = (isDark: boolean = true) => ({
  // Imagen de fondo del portfolio
  imageUrl: '/images/background-portfolio.png',
  
  // Configuración de efectos visuales
  effects: {
    blur: 2, // px
    brightness: isDark ? 0.7 : 0.5, // Más oscura en modo claro para mejor contraste
    scale: 1.05, // para evitar bordes al aplicar blur
  },
  
  // Configuración de overlay gradients
  overlay: {
    // Gradiente principal (de arriba a abajo)
    primary: isDark 
      ? 'from-gray-900/80 via-gray-900/40 to-gray-900/90'
      : 'from-gray-50/80 via-gray-100/40 to-gray-50/90',
    
    // Configuración de fade en los bordes
    edges: {
      horizontal: { start: 25, end: 75 }, // porcentajes
      vertical: { start: 20, end: 80 },
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
    
    // Configuración del vignette
    vignette: {
      innerTransparency: 30, // porcentaje
      outerOpacity: isDark ? 0.6 : 0.4,
      backgroundColor: isDark ? 'rgba(15, 23, 42, ' : 'rgba(248, 250, 252, ',
    }
  }
});

// Configuración por defecto (modo oscuro)
export const HERO_BACKGROUND_CONFIG = getHeroBackgroundConfig(true);

// Función auxiliar para generar el estilo de fade en bordes
export const generateEdgeFadeStyle = (isDark: boolean = true) => {
  const config = getHeroBackgroundConfig(isDark).overlay.edges;
  return `
    linear-gradient(to right, ${config.backgroundColor} 0%, transparent ${config.horizontal.start}%, transparent ${config.horizontal.end}%, ${config.backgroundColor} 100%),
    linear-gradient(to bottom, ${config.backgroundColor} 0%, transparent ${config.vertical.start}%, transparent ${config.vertical.end}%, ${config.backgroundColor} 100%)
  `;
};

// Función auxiliar para generar el estilo de vignette
export const generateVignetteStyle = (isDark: boolean = true) => {
  const config = getHeroBackgroundConfig(isDark).overlay.vignette;
  return `radial-gradient(ellipse at center, transparent ${config.innerTransparency}%, ${config.backgroundColor}${config.outerOpacity}) 100%)`;
};