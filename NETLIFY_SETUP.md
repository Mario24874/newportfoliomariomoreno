# Instrucciones de Configuración para Netlify

## Variables de Entorno Requeridas

En el Dashboard de Netlify, ve a **Site Settings > Environment variables** y agrega:

```
VITE_ELEVENLABS_AGENT_ID=Aik3gpbr6ipxdLFAKBTu
VITE_N8N_WEBHOOK_URL=https://n8n-magnetraffic-n8n.jdaoel.easypanel.host/webhook/bot-portfolio
```

**⚠️ IMPORTANTE:** 
- NO uses comillas alrededor de los valores
- Asegúrate de que no haya espacios extra
- Los valores deben ser exactamente como se muestra arriba

## Configuración de Build

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18 o superior

## Headers de Seguridad

Los headers están configurados en `netlify.toml` y `_headers` para permitir:
- ElevenLabs widget y API
- Google Fonts
- Conexiones WebSocket para el chat de voz

## Verificación Post-Deploy

Después del deploy, verifica en la consola del navegador:
1. Que no haya errores de CSP
2. Que el Agent ID aparezca sin comillas dobles extra
3. Que la URL del API de ElevenLabs no tenga `%22` (comillas codificadas)

## Troubleshooting

Si el widget no aparece:
1. Verifica las variables de entorno en Netlify Dashboard
2. Revisa la consola del navegador para errores
3. El widget debería mostrar un fallback si no puede cargar
4. Haz "Clear cache and deploy" si es necesario