// Configuración de la imagen de fondo del Hero
export const getHeroBackgroundConfig = (isDark: boolean = true) => ({
  // Imagen de fondo del portfolio
  imageUrl: '/images/background-portfolio-new.jpg',

  // Configuración de efectos visuales
  effects: {
    blur: 1, // px — reducido de 2 a 1 para mayor nitidez
    brightness: isDark ? 0.85 : 0.65, // más brillante para mejor visibilidad
    scale: 1.05, // para evitar bordes al aplicar blur
  },

  // Configuración de overlay gradients
  overlay: {
    // Gradiente principal (de arriba a abajo) — menos opaco para mostrar más la imagen
    primary: isDark
      ? 'from-gray-900/60 via-gray-900/20 to-gray-900/70'
      : 'from-gray-50/60 via-gray-100/20 to-gray-50/70',

    // Configuración de fade en los bordes
    edges: {
      horizontal: { start: 25, end: 75 }, // porcentajes
      vertical: { start: 20, end: 80 },
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },

    // Configuración del vignette — reducido para mostrar más imagen
    vignette: {
      innerTransparency: 40, // porcentaje — aumentado de 30 a 40 (más área transparente)
      outerOpacity: isDark ? 0.4 : 0.25, // reducido: dark 0.6→0.4, light 0.4→0.25
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
