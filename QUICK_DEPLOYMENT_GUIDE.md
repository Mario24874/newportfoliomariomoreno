# 🚀 Guía Rápida de Deployment - Sistema de Agendamiento

**Tiempo estimado:** 30-40 minutos
**Última actualización:** 30 de Enero, 2025

---

## 📋 Pre-requisitos

✅ Código ya implementado y testeado
✅ Build exitoso (comprobado)
✅ Variables en `.env` configuradas
✅ Cuenta de n8n activa: https://mariomoreno.app.n8n.cloud
✅ Portfolio desplegado en Netlify

---

## 🎯 Pasos para Deployment

### **PASO 1: Importar Workflow en n8n** (10 minutos)

1. **Abrir n8n**
   - Ve a: https://mariomoreno.app.n8n.cloud
   - Inicia sesión

2. **Importar el workflow**
   - Click en "+ Add workflow" (esquina superior izquierda)
   - Click en los 3 puntos (⋮) en la esquina superior derecha
   - Selecciona "Import from File"
   - Selecciona el archivo: `n8n-consultation-scheduling-workflow.json`
   - Click "Import"

3. **Verificar nodos importados**
   - Deberías ver 11 nodos conectados
   - El flujo debe verse como un diagrama conectado

---

### **PASO 2: Configurar Credenciales de Google** (10 minutos)

#### **Google Calendar**

1. **Nodo: "Check Calendar Availability"**
   - Click en el nodo
   - En "Credential to connect with", click "Create New"
   - Selecciona "Google Calendar OAuth2 API"
   - Click "Sign in with Google"
   - Autoriza acceso a Google Calendar
   - Selecciona tu calendario
   - Click "Save"

2. **Copiar credencial a otros nodos**
   - En el nodo "Create Calendar Event"
   - Selecciona la misma credencial que creaste

#### **Gmail**

1. **Nodo: "Send Confirmation Email"**
   - Click en el nodo
   - En "Credential to connect with", click "Create New"
   - Selecciona "Gmail OAuth2"
   - Click "Sign in with Google"
   - Autoriza acceso a Gmail
   - Click "Save"

2. **Copiar credencial a otros nodos**
   - En el nodo "Send Error Notification"
   - Selecciona la misma credencial Gmail

---

### **PASO 3: Configurar Email de Confirmación** (5 minutos)

1. **Nodo: "Send Confirmation Email"**
   - Verifica que el template HTML esté completo
   - Revisa que las variables estén bien formateadas:
     - `{{ $('Process & Validate Data').item.json.attendeeName }}`
     - `{{ $json.hangoutLink }}`
   - Verifica tu email en "To": debe ser la expresión que extrae el email del cliente

2. **Nodo: "Send Error Notification"**
   - Cambia "To" a tu email: `marioivanmorenopineda@gmail.com`

---

### **PASO 4: Activar el Workflow** (1 minuto)

1. **Guardar cambios**
   - Click en "Save" (esquina superior derecha)
   - Nombre sugerido: "Portfolio Consultation Scheduling"

2. **Activar workflow**
   - Toggle en la esquina superior derecha debe estar en **ACTIVE** (azul)
   - Si está en "Inactive" (gris), click para activar

3. **Verificar webhook URL**
   - Click en el nodo "Webhook - Receive Consultation Request"
   - Verifica que la URL sea:
     ```
     https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno
     ```
   - Si es diferente, copia la URL real

---

### **PASO 5: Configurar Variable en Netlify** (5 minutos)

1. **Acceder a Netlify**
   - Ve a: https://app.netlify.com
   - Selecciona tu sitio del portfolio

2. **Agregar variable de entorno**
   - Ve a: **Site settings** → **Environment variables**
   - Click "Add a variable" → "Add a single variable"

3. **Configurar variable**
   ```
   Key: VITE_N8N_CONSULTATION_WEBHOOK_URL
   Value: https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno
   ```
   - Click "Create variable"

4. **Trigger redeploy**
   - Ve a: **Deploys** (en el menú superior)
   - Click "Trigger deploy" → "Deploy site"
   - Espera ~2-3 minutos a que complete

---

### **PASO 6: Testing en Producción** (10 minutos)

#### **Test 1: Probar el webhook directamente desde n8n**

1. En n8n, click en el nodo "Webhook - Receive Consultation Request"
2. Click en "Listen for test event"
3. En otra pestaña, abre tu portfolio en producción
4. Navega a "AI Demos" → Click "Programar una Consulta"
5. Completa el formulario con datos de prueba:
   ```
   Nombre: Test User
   Email: tu_email@gmail.com
   Tipo: AI Development
   Fecha: Mañana a las 10:00 AM
   Duración: 30 minutos
   ```
6. Click "Agendar Consulta"
7. Vuelve a n8n → Deberías ver "Webhook received" ✓

#### **Test 2: Verificar ejecución completa**

1. En n8n, ve a **Executions** (menú lateral izquierdo)
2. Deberías ver una ejecución reciente
3. Click en ella para ver detalles
4. Verifica que todos los nodos se ejecutaron exitosamente (verde)
5. Si hay errores (rojo), click en el nodo para ver el error

#### **Test 3: Verificar resultados**

**Email:**
- [ ] Recibiste email de confirmación en tu inbox
- [ ] Email tiene el formato HTML correcto
- [ ] Contiene enlace de Google Meet

**Google Calendar:**
- [ ] Abre Google Calendar
- [ ] Verifica que el evento se creó
- [ ] Evento tiene Google Meet adjunto
- [ ] Tu email está como asistente

**Frontend:**
- [ ] Modal mostró "¡Consulta Agendada!" ✓
- [ ] Modal se cerró automáticamente
- [ ] No hay errores en la consola del navegador (F12)

---

## 🐛 Troubleshooting Rápido

### ❌ **Error: "Webhook not configured"**
**Solución:**
1. Verifica que agregaste la variable en Netlify
2. Verifica que hiciste redeploy después de agregar la variable
3. Espera 2-3 minutos para que Netlify procese

### ❌ **Error: "HTTP 404" o "HTTP 500"**
**Solución:**
1. Verifica que el workflow esté **ACTIVE** en n8n
2. Verifica que la URL del webhook sea correcta
3. Ve a Executions en n8n y revisa el error específico

### ❌ **Evento se crea pero sin Google Meet**
**Solución:**
1. En n8n, abre el nodo "Create Calendar Event"
2. Ve a "Additional Fields"
3. Verifica que "Conference Data" esté configurado:
   ```json
   {
     "createRequest": {
       "requestId": "...",
       "conferenceSolutionKey": {
         "type": "hangoutsMeet"
       }
     }
   }
   ```

### ❌ **Email no se envía**
**Solución:**
1. Verifica que las credenciales de Gmail estén conectadas
2. En n8n, re-autentica Gmail (Settings → Credentials)
3. Verifica que el email del destinatario sea correcto

### ❌ **Horario fuera de rango**
**Solución:**
- El frontend valida 9 AM - 6 PM automáticamente
- Si ves este error, verifica la zona horaria del usuario

---

## ✅ Checklist Final

Antes de considerar el deployment completo:

- [ ] Workflow importado en n8n
- [ ] Credenciales de Google Calendar configuradas
- [ ] Credenciales de Gmail configuradas
- [ ] Workflow activado (toggle azul)
- [ ] Variable de entorno agregada en Netlify
- [ ] Redeploy completado en Netlify
- [ ] Test con datos de prueba exitoso
- [ ] Email de confirmación recibido
- [ ] Evento creado en Google Calendar con Google Meet
- [ ] No hay errores en consola del navegador

---

## 📊 Métricas de Éxito

**Si completaste todos los pasos correctamente:**

✅ Botón "Programar una Consulta" funcional
✅ Modal se abre y cierra correctamente
✅ Formulario valida datos
✅ Webhook de n8n recibe datos
✅ Evento se crea en Google Calendar
✅ Email de confirmación se envía
✅ Google Meet se genera automáticamente

**Tasa de éxito esperada:** 95%+

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa logs:**
   - n8n: Executions → Click en la ejecución fallida
   - Netlify: Deploys → Function logs
   - Browser: F12 → Console

2. **Consulta documentación:**
   - `N8N_CONSULTATION_SCHEDULING_SETUP.md` - Guía detallada
   - `IMPLEMENTATION_LOG_2025-01-30.md` - Registro completo

3. **Contacta al equipo:**
   - Email: marioivanmorenopineda@gmail.com
   - GitHub Issues: (si aplica)

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu sistema de agendamiento estará completamente funcional y tus visitantes podrán agendar consultas directamente desde el portfolio.

**Próximos pasos sugeridos:**
1. Monitorear las primeras consultas agendadas
2. Ajustar horarios disponibles según necesidad
3. Implementar mejoras de Fase 2 (ver IMPLEMENTATION_LOG)

---

**Creado por:** Claude Code + Mario Moreno
**Versión:** v1.0
**Fecha:** 2025-01-30
