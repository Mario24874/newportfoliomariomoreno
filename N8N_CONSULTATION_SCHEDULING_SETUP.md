# 📅 Sistema de Agendamiento de Consultas - Configuración n8n

## 🎯 Descripción General

Sistema completo de agendamiento de consultas que integra:
- ✅ Formulario visual en el portfolio
- ✅ Validación de datos y horarios
- ✅ Integración con Google Calendar
- ✅ Confirmación automática por email
- ✅ Generación de enlaces Google Meet

---

## 📡 Webhook URL

```
https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno
```

---

## 🔧 Configuración del Flujo n8n Optimizado

### **Paso 1: Actualizar el Nodo Webhook**

1. Abre tu flujo en n8n
2. Edita el nodo **"Webhook"**
3. Configuración:
   - **Path**: `agendas-consultas-mario-moreno`
   - **Method**: `POST`
   - **Response Mode**: `When Last Node Finishes`
   - **Response Data**: `Last Node Output`

---

### **Paso 2: Agregar Nodo Function - Extraer y Validar Datos**

Después del Webhook, agrega un nodo **"Function"** llamado **"Process Consultation Data"**:

```javascript
// Extract data from webhook
const query = $input.item.json.QUERY || '';
const data = $input.item.json.data || {};

// Parse consultation data
const consultationData = {
  name: data.name || '',
  email: data.email || '',
  phone: data.phone || '',
  consultationType: data.consultationType || 'other',
  preferredDate: data.preferredDate || '',
  duration: parseInt(data.duration) || 30,
  message: data.message || '',
  timezone: data.timezone || 'America/Caracas'
};

// Validate required fields
if (!consultationData.name || !consultationData.email || !consultationData.preferredDate) {
  throw new Error('Missing required fields: name, email, or preferredDate');
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(consultationData.email)) {
  throw new Error('Invalid email format');
}

// Parse date and calculate end time
const startDate = new Date(consultationData.preferredDate);
const endDate = new Date(startDate.getTime() + consultationData.duration * 60000);

// Validate date is in the future
if (startDate < new Date()) {
  throw new Error('Consultation date must be in the future');
}

// Validate business hours (9 AM - 6 PM)
const hours = startDate.getHours();
if (hours < 9 || hours >= 18) {
  throw new Error('Consultations are only available between 9 AM and 6 PM');
}

// Validate not weekend
const dayOfWeek = startDate.getDay();
if (dayOfWeek === 0 || dayOfWeek === 6) {
  throw new Error('Consultations are not available on weekends');
}

// Prepare calendar event data
const eventData = {
  summary: `Consulta: ${consultationData.consultationType} - ${consultationData.name}`,
  description: `
Tipo de Consulta: ${consultationData.consultationType}
Cliente: ${consultationData.name}
Email: ${consultationData.email}
Teléfono: ${consultationData.phone || 'No proporcionado'}
Duración: ${consultationData.duration} minutos

Mensaje del cliente:
${consultationData.message || 'Sin mensaje adicional'}

---
Agendado automáticamente desde el portfolio
  `.trim(),
  startDateTime: startDate.toISOString(),
  endDateTime: endDate.toISOString(),
  attendeeEmail: consultationData.email,
  attendeeName: consultationData.name
};

return {
  json: {
    ...consultationData,
    ...eventData,
    originalQuery: query
  }
};
```

---

### **Paso 3: Actualizar Nodo AI Agent (Opcional)**

Si quieres usar el AI Agent para procesamiento adicional:

**Configuración del Prompt:**
```
Eres un asistente que valida solicitudes de consulta.

Datos recibidos:
- Nombre: {{ $json.name }}
- Email: {{ $json.email }}
- Tipo: {{ $json.consultationType }}
- Fecha: {{ $json.preferredDate }}

Tu tarea:
1. Confirmar que los datos son válidos
2. Generar un mensaje de confirmación personalizado
3. Si hay conflictos, sugerir horarios alternativos

Responde en el idioma del cliente.
```

---

### **Paso 4: Configurar "Create Event" en Google Calendar**

Edita el nodo **"Create an event in Google Calendar"**:

**Configuración:**
- **Calendar**: Selecciona tu calendario (usar Resource Locator)
- **Start**: `{{ $json.startDateTime }}`
- **End**: `{{ $json.endDateTime }}`
- **Summary**: `{{ $json.summary }}`
- **Description**: `{{ $json.description }}`

**Opciones Adicionales (Options):**
- **Send Updates**: `all` (para notificar a asistentes)
- **Add Attendees**: Activar
  - Email: `{{ $json.attendeeEmail }}`
  - Name: `{{ $json.attendeeName }}`
- **Add Conference Data**: Activar (para crear Google Meet)
  - **Create Request**: `true`
  - **Conference Solution**: `hangoutsMeet`

---

### **Paso 5: Agregar Verificación de Conflictos (RECOMENDADO)**

**ANTES** del nodo "Create Event", agrega:

#### A) Nodo "Get many events in Google Calendar"
```javascript
// Configuración:
Calendar: Tu calendario
Time Min: {{ $json.startDateTime }}
Time Max: {{ $json.endDateTime }}
```

#### B) Nodo "IF" - Verificar Disponibilidad
```javascript
// Condición:
{{ $json.items.length }} === 0

// Si TRUE: continúa con Create Event
// Si FALSE: envía email de conflicto
```

---

### **Paso 6: Configurar Nodo Gmail - Confirmación**

Después de crear el evento, agrega nodo **"Gmail"** o **"Send Email"**:

**Configuración:**
- **To**: `{{ $json.attendeeEmail }}`
- **Subject**: `✅ Consulta Confirmada - Mario Moreno AI Developer`
- **Email Type**: `HTML`

**HTML Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Consulta Confirmada!</h1>
      <p>Tu sesión ha sido agendada exitosamente</p>
    </div>

    <div class="content">
      <p>Hola <strong>{{ $json.attendeeName }}</strong>,</p>

      <p>Tu consulta de <strong>{{ $json.consultationType }}</strong> ha sido confirmada.</p>

      <div class="details">
        <h3>📅 Detalles de la Consulta:</h3>
        <p><strong>Fecha:</strong> {{ $json.startDateTime | date: "DD/MM/YYYY" }}</p>
        <p><strong>Hora:</strong> {{ $json.startDateTime | date: "HH:mm" }} (Hora Venezuela)</p>
        <p><strong>Duración:</strong> {{ $json.duration }} minutos</p>
        <p><strong>Tipo:</strong> {{ $json.consultationType }}</p>
      </div>

      <p><strong>📹 Enlace de Reunión:</strong></p>
      <p>Recibirás un enlace de Google Meet en la invitación de calendario.</p>

      <a href="{{ $json.meetingLink }}" class="button">🔗 Unirse a la Reunión</a>

      <h3>📝 Qué esperar:</h3>
      <ul>
        <li>Revisaremos tus necesidades y objetivos</li>
        <li>Discutiremos soluciones de IA personalizadas</li>
        <li>Responderé todas tus preguntas</li>
        <li>Definiremos próximos pasos si decides avanzar</li>
      </ul>

      <h3>🔔 Recordatorios:</h3>
      <p>Recibirás recordatorios automáticos:</p>
      <ul>
        <li>24 horas antes de la consulta</li>
        <li>1 hora antes de la consulta</li>
      </ul>

      <p><strong>¿Necesitas reagendar?</strong><br>
      Responde a este email o contáctame por WhatsApp: +584120526989</p>

      <p>¡Espero con interés nuestra conversación!</p>

      <p>Saludos,<br>
      <strong>Mario Moreno</strong><br>
      AI Developer & Innovation Engineer</p>
    </div>

    <div class="footer">
      <p>📧 marioivanmorenopineda@gmail.com | 💼 <a href="https://linkedin.com/in/mario-moreno-9916043b">LinkedIn</a></p>
      <p>Este email fue generado automáticamente. Por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
```

---

### **Paso 7: Nodo de Respuesta al Frontend**

Agrega un nodo **"Respond to Webhook"** al final:

```javascript
{
  "success": true,
  "message": "Consulta agendada exitosamente. Revisa tu email para confirmar.",
  "eventId": "{{ $json.id }}",
  "meetingLink": "{{ $json.hangoutLink }}",
  "startTime": "{{ $json.startDateTime }}",
  "endTime": "{{ $json.endDateTime }}"
}
```

---

### **Paso 8: Manejo de Errores**

Agrega un nodo **"Error Trigger"** que capture errores:

```javascript
{
  "success": false,
  "error": "{{ $json.error.message }}",
  "message": "No pudimos agendar tu consulta. Por favor intenta de nuevo o contáctanos directamente."
}
```

---

## 🔄 Flujo Completo (Orden de Nodos)

```
1. Webhook (Recibe datos)
   ↓
2. Function (Valida y procesa datos)
   ↓
3. Get many events (Verifica disponibilidad) [OPCIONAL]
   ↓
4. IF (Hay conflicto?)
   ├─ TRUE → Email de conflicto
   └─ FALSE ↓
5. Create Event (Google Calendar)
   ↓
6. Gmail (Confirmación al cliente)
   ↓
7. Gmail (Notificación interna) [OPCIONAL]
   ↓
8. Respond to Webhook (Respuesta al frontend)

[En paralelo: Error Trigger para manejar fallos]
```

---

## 🧪 Testing del Flujo

### **Test 1: Validación de Campos**
```javascript
// Payload de prueba (debe fallar)
{
  "data": {
    "name": "",
    "email": "invalid-email",
    "preferredDate": "2024-01-01T10:00:00"
  }
}
```
✅ **Resultado esperado**: Error de validación

### **Test 2: Agendamiento Exitoso**
```javascript
// Payload de prueba (debe funcionar)
{
  "QUERY": "Agendar consulta de prueba",
  "data": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+584121234567",
    "consultationType": "ai-development",
    "preferredDate": "2025-11-15T14:00:00",
    "duration": "30",
    "message": "Quiero discutir un proyecto de IA",
    "timezone": "America/Caracas"
  }
}
```
✅ **Resultado esperado**:
- Evento creado en Google Calendar
- Email de confirmación enviado
- Response JSON con success=true

### **Test 3: Conflicto de Horario**
- Crea un evento manual en Google Calendar
- Intenta agendar en el mismo horario
✅ **Resultado esperado**: Notificación de conflicto

---

## 🔐 Variables de Entorno (Portfolio)

Agrega en tu archivo `.env`:

```bash
VITE_N8N_CONSULTATION_WEBHOOK_URL=https://mariomoreno.app.n8n.cloud/webhook/agendas-consultas-mario-moreno
```

O si ya está configurado en el código, puedes omitir esta variable (usa el default).

---

## 📊 Mejoras Opcionales (Futuro)

### 1. **Sistema de Recordatorios Automáticos**
- Agregar workflow separado que revise eventos próximos
- Enviar emails 24h y 1h antes
- Usar nodo "Schedule Trigger"

### 2. **Dashboard de Analytics**
- Trackear tipos de consultas más solicitados
- Horarios más populares
- Tasa de conversión

### 3. **Integración con CRM**
- Guardar leads en Airtable/Google Sheets
- Sincronizar con HubSpot o Pipedrive

### 4. **Cancelación/Reagendamiento**
- Agregar enlaces únicos en el email
- Webhook para cancelar/modificar eventos

### 5. **Verificación de Disponibilidad en Tiempo Real**
- Mostrar slots disponibles en el frontend
- Implementar endpoint GET en n8n
- Cachear resultados para mejorar performance

---

## 🐛 Troubleshooting

### **Problema: Error 400 - Bad Request**
✅ **Solución**: Verifica que el payload tenga la estructura correcta con `QUERY` y `data`

### **Problema: Evento se crea pero sin Google Meet**
✅ **Solución**:
- Verifica que "Add Conference Data" esté activado
- Usa `conferenceSolution: hangoutsMeet`
- Asegúrate de que tu cuenta tenga permisos de Google Meet

### **Problema: Email no se envía**
✅ **Solución**:
- Verifica credenciales de Gmail en n8n
- Revisa que el nodo Gmail esté después de Create Event
- Confirma que `{{ $json.attendeeEmail }}` tiene un valor válido

### **Problema: Horarios fuera de rango**
✅ **Solución**:
- El frontend ya valida 9 AM - 6 PM
- Agrega validación adicional en el nodo Function
- Considera diferencias de zona horaria

---

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa los logs de ejecución en n8n (Executions)
2. Verifica la consola del navegador (F12) para errores del frontend
3. Prueba el webhook manualmente con Postman/Thunder Client

---

## ✅ Checklist de Configuración

- [ ] Webhook configurado con path correcto
- [ ] Nodo Function con validación de datos
- [ ] Google Calendar API conectado
- [ ] Nodo Create Event configurado con Google Meet
- [ ] Gmail/Send Email configurado para confirmaciones
- [ ] Error handling implementado
- [ ] Variables de entorno configuradas en portfolio
- [ ] Flujo testeado con datos de prueba
- [ ] Email de confirmación validado
- [ ] Deploy del portfolio con cambios

---

**Última actualización:** 2025-01-30
**Versión del flujo:** v1.0
**Estado:** ✅ Listo para producción
