# 🔧 Guía de Troubleshooting - Sistema de Agendamiento

**Fecha:** 30 de Enero, 2025
**Versión:** v2.1.2
**Sistema:** Consultation Scheduling System

---

## 📋 Índice

1. [Problemas de Frontend](#problemas-de-frontend)
2. [Problemas de n8n Workflow](#problemas-de-n8n-workflow)
3. [Problemas de Google Calendar](#problemas-de-google-calendar)
4. [Problemas de Email](#problemas-de-email)
5. [Problemas de Variables de Entorno](#problemas-de-variables-de-entorno)
6. [Errores Comunes y Soluciones](#errores-comunes-y-soluciones)

---

## 🖥️ Problemas de Frontend

### **Problema: Modal no se abre al hacer click en el botón**

**Síntomas:**
- Click en "Programar una Consulta" no hace nada
- No hay errores en console

**Causas Posibles:**
1. Estado del modal no conectado correctamente
2. Evento onClick no configurado
3. Error de importación del componente

**Solución:**
```typescript
// Verifica en src/sections/DemosSection.tsx

// 1. Importación correcta
import ScheduleConsultationModal from '@/components/ui/ScheduleConsultationModal';

// 2. Estado declarado
const [consultationModalOpen, setConsultationModalOpen] = useState(false);

// 3. Botón conectado
<button onClick={() => setConsultationModalOpen(true)}>
  Programar una Consulta
</button>

// 4. Modal renderizado
<ScheduleConsultationModal
  isOpen={consultationModalOpen}
  onClose={() => setConsultationModalOpen(false)}
/>
```

**Verificación:**
```bash
# Abre DevTools Console y ejecuta:
console.log('Modal state:', consultationModalOpen);
```

---

### **Problema: Texto invisible en inputs (texto blanco)**

**Síntomas:**
- Al escribir en campos del formulario, no se ve el texto
- Placeholders visibles pero texto del usuario invisible

**Causa:**
- Faltan clases de color explícitas en Tailwind CSS

**Solución:**
Todos los inputs deben tener estas clases:
```css
bg-white text-gray-900 placeholder-gray-400
```

**Ubicación:** `src/components/ui/ScheduleConsultationModal.tsx:261, 278, 295, 310, 329, 354, 379`

**Verificación:**
Inspecciona el input en DevTools y verifica que tenga:
```css
background-color: rgb(255, 255, 255);
color: rgb(17, 24, 39);
```

---

### **Problema: Validación no funciona correctamente**

**Síntomas:**
- Formulario se envía con datos inválidos
- Errores no se muestran al usuario

**Debug:**
```typescript
// Agrega console.logs en las funciones de validación
const validateStep1 = (): boolean => {
  console.log('Validating Step 1:', formData);
  if (!formData.name.trim()) {
    console.log('Validation failed: name is empty');
    setError(language === 'es' ? 'El nombre es requerido' : 'Name is required');
    return false;
  }
  // ...
  return true;
};
```

**Verificaciones:**
1. Email regex: `/\S+@\S+\.\S+/` debe pasar con emails válidos
2. Fecha futura: `selectedDateTime < new Date()` detecta fechas pasadas
3. Horario laboral: `hours >= 9 && hours < 18`
4. Días laborales: `dayOfWeek !== 0 && dayOfWeek !== 6`

---

### **Problema: Formulario se envía pero no hay respuesta**

**Síntomas:**
- Loading spinner infinito
- No aparece mensaje de éxito ni error

**Debug:**
```typescript
// Abre src/api/n8n.ts y agrega logs
export async function scheduleConsultation(consultationData: any) {
  console.log('Sending to webhook:', CONSULTATION_WEBHOOK_URL);
  console.log('Payload:', consultationData);

  try {
    const response = await fetch(CONSULTATION_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);

    return { success: true, response: result };
  } catch (error) {
    console.error('Fetch error:', error);
    return { success: false, error: error.message };
  }
}
```

**Verificaciones:**
1. ¿El webhook URL está configurado correctamente?
2. ¿n8n workflow está activo (toggle azul)?
3. ¿Hay errores de CORS? (revisa Network tab)
4. ¿El webhook responde 200 OK?

---

## ⚙️ Problemas de n8n Workflow

### **Problema: Webhook no recibe datos**

**Síntomas:**
- n8n Executions muestra "No items"
- Workflow no se ejecuta al enviar formulario

**Verificaciones:**
```bash
# 1. URL correcta del webhook
https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno

# 2. Método HTTP correcto
POST (no GET)

# 3. Test directo con curl
curl -X POST https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno \
  -H "Content-Type: application/json" \
  -d '{
    "QUERY": "Test",
    "data": {
      "name": "Test User",
      "email": "test@example.com",
      "preferredDate": "2025-02-01T10:00:00"
    }
  }'
```

**Solución:**
1. Ve a n8n → Workflow Settings
2. Verifica que el workflow está **Activo** (toggle azul)
3. Click en Webhook node → Copy URL
4. Compara con `VITE_N8N_CONSULTATION_WEBHOOK_URL`

---

### **Problema: "Missing required fields" en validación**

**Síntomas:**
- Workflow falla en "Process & Validate Data"
- Error: "Missing required fields: name, email, or preferredDate"

**Causa:**
Extracción incorrecta de datos del webhook

**Solución (CRÍTICA):**
```javascript
// En nodo "Process & Validate Data" - Línea 1-3
// CORRECTO:
const body = $input.item.json.body || $input.item.json;
const query = body.QUERY || '';
const data = body.data || {};

// INCORRECTO (no usar):
const query = $input.item.json.QUERY; // ❌ undefined
const data = $input.item.json.data;   // ❌ undefined
```

**Debug en n8n:**
1. Click en nodo "Webhook" después de una ejecución
2. Ve a "Output" tab
3. Verifica estructura: `{ body: { QUERY: "...", data: {...} } }`
4. Ajusta el código según la estructura real

---

### **Problema: Detección de disponibilidad siempre falla**

**Síntomas:**
- Siempre dice "slot ocupado" aunque esté libre
- O siempre dice "slot disponible" aunque esté ocupado

**Causas Posibles:**

**Causa 1: Expresión incorrecta en IF node**
```javascript
// ❌ INCORRECTO:
{{ $json.length }}

// ✅ CORRECTO:
{{ $json.eventsFound }}
```

**Causa 2: Google Calendar retorna [{}]**
- Google Calendar API retorna array con objeto vacío en lugar de array vacío
- Necesitas el nodo "Filter Valid Events"

**Solución Completa:**
```javascript
// Nodo "Filter Valid Events" (debe existir)
const events = $input.all();

const validEvents = events.filter(item => {
  const event = item.json;
  // Solo eventos reales tienen 'id' y 'kind'
  return event && event.id && event.kind === 'calendar#event';
});

if (validEvents.length === 0) {
  return [{
    json: {
      eventsFound: 0,
      hasConflict: false,
      message: 'No events found in this time slot'
    }
  }];
}

return validEvents.map(item => ({
  json: {
    ...item.json,
    eventsFound: validEvents.length,
    hasConflict: true
  }
}));
```

**Nodo IF "Time Slot Available?":**
```
Field: Number
Value 1: ={{ $json.eventsFound }}
Operation: equal
Value 2: 0
```

---

### **Problema: Errores de sintaxis de n8n expressions**

**Síntomas:**
- Variables muestran `{{ $json.name }}` literal en lugar del valor
- Error: "Cannot read property 'X' of undefined"

**Reglas de n8n Expressions:**

**En HTML/Text (Gmail node):**
```html
<!-- ❌ INCORRECTO (no evalúa): -->
<p>Hola {{ $json.name }}</p>

<!-- ✅ CORRECTO (evalúa): -->
<p>Hola ={{ $json.name }}</p>
```

**En campos JSON/Código:**
```javascript
// ❌ INCORRECTO:
{{ $json.name }}

// ✅ CORRECTO:
={{ $json.name }}
```

**Referencias a nodos anteriores:**
```javascript
// ❌ INCORRECTO (contexto actual):
{{ $json.email }}

// ✅ CORRECTO (nodo específico):
{{ $('Process & Validate Data').item.json.email }}
```

**Contar items:**
```javascript
// ❌ INCORRECTO:
{{ $json.length }}

// ✅ CORRECTO:
{{ $input.all().length }}
```

---

### **Problema: Always Output Data no activado**

**Síntomas:**
- Workflow se detiene si un nodo no retorna datos
- "Check Calendar Availability" no pasa datos al siguiente nodo

**Solución:**
1. Click en nodo "Check Calendar Availability"
2. Ve a "Settings" tab (ícono de engranaje)
3. Scroll hasta "Node Settings"
4. ✅ Activa "Always Output Data"
5. Save

**Por qué es necesario:**
Google Calendar retorna `[]` o `[{}]` cuando no hay eventos. Sin "Always Output Data", n8n detiene el workflow.

---

## 📅 Problemas de Google Calendar

### **Problema: No se crea el evento en Calendar**

**Síntomas:**
- Workflow completa sin errores
- Email se envía
- Pero no hay evento en Google Calendar

**Verificaciones:**
1. **Credenciales conectadas:**
   - n8n → Credentials → Google Calendar
   - Status debe ser "Connected"
   - Reconecta si es necesario

2. **Permisos correctos:**
   - Scope: `https://www.googleapis.com/auth/calendar`
   - Scope: `https://www.googleapis.com/auth/calendar.events`

3. **Calendar ID correcto:**
   ```
   Calendar: primary
   ```

4. **Formato de fechas:**
   ```javascript
   Start: ={{ $('Process & Validate Data').item.json.startDateTime }}
   End: ={{ $('Process & Validate Data').item.json.endDateTime }}

   // Debe ser ISO 8601: "2025-02-01T10:00:00Z"
   ```

**Debug:**
```javascript
// En nodo "Process & Validate Data", verifica formato:
console.log('Start:', startDate.toISOString());
console.log('End:', endDate.toISOString());
```

---

### **Problema: Google Meet link no se genera**

**Síntomas:**
- Evento se crea correctamente
- Pero no tiene enlace de Google Meet

**Causa:**
Configuración incorrecta de Conference Data

**Solución:**
En nodo "Create Calendar Event" → Additional Fields:

1. ✅ Activa "Add Conference Data"
2. En "Conference Data", usa este JSON:
```json
{
  "createRequest": {
    "requestId": "={{ $('Process & Validate Data').item.json.email }}-{{ $now.toUnixInteger() }}",
    "conferenceSolutionKey": {
      "type": "hangoutsMeet"
    }
  }
}
```

3. ✅ Activa "Send Updates: all"

**Verificación:**
El evento creado debe tener:
```javascript
{
  "hangoutLink": "https://meet.google.com/xxx-xxxx-xxx",
  "conferenceData": { ... }
}
```

---

### **Problema: Eventos se crean duplicados**

**Síntomas:**
- Al agendar, se crean 2 o más eventos iguales

**Causas:**
1. Usuario hace doble-click en botón submit
2. Workflow se ejecuta múltiples veces

**Soluciones:**

**Frontend:**
```typescript
// Ya implementado en ScheduleConsultationModal.tsx:534
<button
  type="submit"
  disabled={isLoading}  // ✓ Deshabilita durante submit
  className="... disabled:opacity-50"
>
```

**n8n:**
Agrega idempotency check al inicio:
```javascript
// Nodo "Check Duplicate" (después de Webhook)
const email = $json.body.data.email;
const date = $json.body.data.preferredDate;
const key = `${email}-${date}`;

// Guardar en variable global o Redis
// Si existe, retornar error de duplicado
```

---

## 📧 Problemas de Email

### **Problema: Email no llega al destinatario**

**Síntomas:**
- Workflow completa exitosamente
- Evento en Calendar creado
- Pero no llega email de confirmación

**Verificaciones:**

**1. Credenciales Gmail:**
```bash
n8n → Credentials → Gmail API
Status: Connected ✓
```

**2. Permisos correctos:**
```
Scope: https://www.googleapis.com/auth/gmail.send
```

**3. Configuración del nodo Gmail:**
```
To: {{ $('Process & Validate Data').item.json.attendeeEmail }}
Subject: ✅ Consulta Confirmada - Mario Moreno AI Developer
Email Type: HTML
Message: [Tu template HTML]
```

**4. Verificar spam:**
- Revisa carpeta de Spam/Junk
- Agrega marioivanmorenopineda@gmail.com a contactos

**5. Test directo:**
```bash
# En Gmail node, prueba con email fijo
To: tu-email@example.com
```

---

### **Problema: Email llega pero sin formato (texto plano)**

**Síntomas:**
- Email llega pero muestra HTML crudo
- No se ven estilos ni colores

**Causa:**
Email Type configurado como "Text" en lugar de "HTML"

**Solución:**
```
n8n → Send Confirmation Email node
Email Type: HTML  ← Debe ser HTML, no Text
```

---

### **Problema: Variables no se reemplazan en email (muestra {{ }}})**

**Síntomas:**
```
Email recibido:
"Hola {{ $json.name }}, tu consulta de {{ $json.type }}..."
```

**Causa:**
Falta el `=` al inicio de las expresiones

**Solución:**
```html
<!-- ❌ INCORRECTO: -->
<p>Hola {{ $('Process & Validate Data').item.json.attendeeName }}</p>

<!-- ✅ CORRECTO: -->
<p>Hola ={{ $('Process & Validate Data').item.json.attendeeName }}</p>
```

**Verificación masiva:**
Busca todos los `{{ ` y reemplaza con `={{ ` en el HTML template.

---

### **Problema: Fecha/hora mal formateadas en email**

**Síntomas:**
```
Email muestra: "2025-02-01T10:00:00.000Z"
En lugar de: "01/02/2025 - 10:00 AM"
```

**Solución:**
```html
<!-- Fecha legible (DD/MM/YYYY): -->
<p><strong>Fecha:</strong> ={{ $json.start.dateTime.split('T')[0].split('-').reverse().join('/') }}</p>

<!-- Hora legible (HH:MM): -->
<p><strong>Hora:</strong> ={{ $json.start.dateTime.split('T')[1].substring(0, 5) }}</p>
```

**Resultado:**
```
Fecha: 01/02/2025
Hora: 10:00
```

---

## 🔐 Problemas de Variables de Entorno

### **Problema: VITE_N8N_CONSULTATION_WEBHOOK_URL undefined**

**Síntomas:**
- Console error: "Cannot read property of undefined"
- Fetch fails con URL inválida

**Verificación Local:**
```bash
# .env file debe existir en root del proyecto
cat .env

# Debe contener:
VITE_N8N_CONSULTATION_WEBHOOK_URL=https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno
```

**Verificación en Netlify:**
```bash
# Netlify Dashboard
Site Settings → Environment Variables
Key: VITE_N8N_CONSULTATION_WEBHOOK_URL
Value: https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno
```

**IMPORTANTE:**
- Variables Vite deben empezar con `VITE_`
- Después de agregar variable, **Trigger Redeploy** en Netlify

---

### **Problema: Variable configurada pero no se usa**

**Debug:**
```typescript
// Agrega en src/api/n8n.ts
console.log('Webhook URL:', import.meta.env.VITE_N8N_CONSULTATION_WEBHOOK_URL);
console.log('All env vars:', import.meta.env);
```

**Verificar en producción:**
```javascript
// Abre DevTools Console en tu sitio en producción
console.log(import.meta.env);
// Debe mostrar: VITE_N8N_CONSULTATION_WEBHOOK_URL
```

---

## ❌ Errores Comunes y Soluciones

### **Error: "attendee.split is not a function"**

**Ubicación:** n8n → Create Calendar Event → Attendees

**Causa:** Campo espera string, recibe objeto

**Solución:**
```javascript
// ❌ INCORRECTO:
Attendees: [{{ $('Process & Validate Data').item.json.attendeeEmail }}]

// ❌ INCORRECTO:
Attendees: { "email": "{{ ... }}" }

// ✅ CORRECTO (string simple):
Attendees: {{ $('Process & Validate Data').item.json.attendeeEmail }}
```

---

### **Error: "Cannot read property 'json' of undefined"**

**Ubicación:** Cualquier nodo que referencia nodo anterior

**Causa:** Nombre del nodo incorrecto o nodo no ejecutado

**Solución:**
```javascript
// Verifica nombre exacto del nodo (case-sensitive)
$('Process & Validate Data').item.json.email

// Si el nodo se llama "Process and Validate Data" (and vs &), fallará
// Copia el nombre exacto desde n8n
```

---

### **Error: "Workflow is not active"**

**Síntomas:** Webhook no responde, 404 error

**Solución:**
1. Abre n8n workflow
2. Verifica toggle en esquina superior derecha
3. Debe estar **AZUL** (activo)
4. Si está gris, click para activar

---

### **Error: CORS block en browser console**

**Síntomas:**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Causa:** n8n no permite el origen del request

**Solución:**
n8n generalmente permite todos los orígenes. Si hay error:
1. Verifica que el webhook está en modo **POST**
2. Verifica que Response Mode es **lastNode**
3. Contacta soporte de n8n si persiste

---

### **Error: "Date must be in the future"**

**Síntomas:** Validación falla aunque fecha es futura

**Causa:** Problemas de timezone

**Debug:**
```typescript
// En ScheduleConsultationModal.tsx
const selectedDateTime = new Date(`${formData.preferredDate}T${formData.preferredTime}`);
console.log('Selected:', selectedDateTime.toISOString());
console.log('Now:', new Date().toISOString());
console.log('Is future?', selectedDateTime > new Date());
```

**Solución:**
```typescript
// Envía timezone explícito
timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
// Ejemplo: "America/Caracas"
```

---

## 🧪 Herramientas de Debug

### **1. n8n Execution Log**

```bash
# Ve a n8n
Executions → Click en ejecución reciente
→ Ve nodo por nodo
→ Verifica Input y Output de cada uno
```

### **2. Browser DevTools**

```javascript
// Console
console.log('Form data:', formData);
console.log('Response:', result);

// Network tab
→ Filtra por "webhook"
→ Ve Request Payload
→ Ve Response
→ Verifica Status Code (debe ser 200)
```

### **3. Test directo con cURL**

```bash
curl -X POST https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno \
  -H "Content-Type: application/json" \
  -d '{
    "QUERY": "Debug test",
    "data": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+58 412 1234567",
      "consultationType": "ai-development",
      "preferredDate": "2025-02-15T10:00:00",
      "duration": "30",
      "message": "Testing",
      "timezone": "America/Caracas"
    }
  }'
```

### **4. Postman / Insomnia**

Importa esta colección:
```json
{
  "method": "POST",
  "url": "https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "QUERY": "Test from Postman",
    "data": {
      "name": "Mario Test",
      "email": "marioivanmorenopineda@gmail.com",
      "preferredDate": "2025-02-20T14:00:00",
      "duration": "60",
      "consultationType": "ai-development",
      "timezone": "America/Caracas"
    }
  }
}
```

---

## 📞 Soporte Adicional

Si ninguna solución funciona:

1. **Revisa documentación completa:**
   - `FINAL_IMPLEMENTATION_REPORT_2025-01-30.md`
   - `N8N_CONSULTATION_SCHEDULING_SETUP.md`
   - `BUGFIXES_2025-01-30.md`

2. **Exporta el workflow:**
   ```bash
   n8n → Settings → Download workflow
   Compara con n8n-consultation-scheduling-workflow.json
   ```

3. **Reimporta workflow limpio:**
   ```bash
   n8n → Import from file
   Selecciona: n8n-consultation-scheduling-workflow.json
   Reconfigura credenciales
   ```

4. **Contacto:**
   - Email: marioivanmorenopineda@gmail.com
   - LinkedIn: mario-moreno-9916043b

---

## ✅ Checklist de Verificación Completa

Usa esto para verificar que todo está configurado correctamente:

### **Frontend:**
- [ ] Modal se abre al click
- [ ] Texto visible en todos los inputs (bg-white text-gray-900)
- [ ] Validaciones funcionan correctamente
- [ ] Loading spinner aparece al submit
- [ ] Mensaje de éxito se muestra cuando completa
- [ ] Modal se cierra automáticamente después de éxito

### **Variables de Entorno:**
- [ ] `.env` tiene `VITE_N8N_CONSULTATION_WEBHOOK_URL`
- [ ] Netlify tiene la variable configurada
- [ ] Variable se lee correctamente en console

### **n8n Workflow:**
- [ ] Workflow activo (toggle azul)
- [ ] Webhook path correcto: `agendas-consultas-mario-moreno`
- [ ] Webhook method: POST
- [ ] Webhook Response Mode: lastNode
- [ ] Credenciales Google Calendar conectadas
- [ ] Credenciales Gmail conectadas
- [ ] Nodo "Always Output Data" activo en Check Calendar
- [ ] Expresiones usan `={{ }}` en HTML

### **Testing:**
- [ ] Test local funciona (npm run dev)
- [ ] Deploy en Netlify exitoso
- [ ] Test E2E: agendar consulta
- [ ] Evento aparece en Google Calendar
- [ ] Email de confirmación llega
- [ ] Email tiene datos correctos (no {{ }})
- [ ] Google Meet link se genera

---

**Última actualización:** 30 de Enero, 2025
**Estado:** ✅ Documentación completa
**Versión del sistema:** v2.1.2
