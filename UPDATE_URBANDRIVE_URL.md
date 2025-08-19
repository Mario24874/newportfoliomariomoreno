# Actualizar URL de UrbanDrive PWA

## Instrucciones para después del despliegue:

1. **Ubicar el archivo**: `src/sections/MobileAppsSection.tsx`

2. **Buscar la línea**: 
   ```typescript
   pwaUrl: '#' // Placeholder - will be updated after deployment
   ```

3. **Reemplazar con la URL real**:
   ```typescript
   pwaUrl: 'https://tu-url-urbandrive.netlify.app' // URL real después del despliegue
   ```

## Cambios realizados:

✅ **UrbanDrive es ahora una PWA** (Progressive Web App)
✅ **Botón azul** con icono de globo en lugar de descarga
✅ **Texto "Abrir Aplicación Web"** en lugar de "Descargar"
✅ **Información adicional** que indica que es PWA
✅ **Se abre en nueva ventana** con `target="_blank"`

## Para otros desarrolladores:

- **ItaliantoApp**: Sigue siendo APK download
- **BTU Calculator**: Sigue siendo APK download  
- **UrbanDrive**: Ahora es PWA con enlace web

Solo necesitas actualizar la URL `pwaUrl` una vez que tengas la URL de la aplicación desplegada.