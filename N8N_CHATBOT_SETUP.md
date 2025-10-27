# 🤖 Configuración del Chatbot con n8n

## 📡 Nueva URL del Webhook
```
https://mariomoreno.app.n8n.cloud/webhook/bot-portfolio
```

---

## ⚠️ PROBLEMA CRÍTICO IDENTIFICADO: Memoria de Conversación

### 🔴 **Problema Actual**
En tu flujo de n8n, el nodo **"Simple Memory1"** tiene esta configuración:
```javascript
sessionKey: "={{ $json.body.data.message }}"
```

**Esto causa:**
- ❌ Cada mensaje crea una sesión nueva
- ❌ El bot NO recuerda conversaciones anteriores
- ❌ No hay contexto entre mensajes
- ❌ El usuario debe repetir información constantemente

### ✅ **Solución: Actualizar el Flujo de n8n**

#### **Paso 1: Abrir n8n Editor**
1. Ve a: https://mariomoreno.app.n8n.cloud
2. Abre el workflow **"bot-portfolio"**

#### **Paso 2: Modificar el Nodo "Simple Memory1"**
1. Haz clic en el nodo **"Simple Memory1"**
2. En el campo **"Session Key"**, cambia de:
   ```javascript
   ={{ $json.body.data.message }}
   ```
   A:
   ```javascript
   ={{ $json.body.data.conversationId || 'portfolio-default' }}
   ```

3. **Guarda el flujo** (Save en la esquina superior derecha)

#### **Paso 3: Activar el Flujo**
- Asegúrate de que el toggle esté en **ACTIVE** (azul)

---

## 📊 Estructura del Payload Actualizado

### **Request del Frontend al Webhook:**
```json
{
  "data": {
    "message": "Hola, ¿qué servicios ofreces?",
    "conversationId": "portfolio-1234567890-abc123"
  }
}
```

### **Response del Webhook al Frontend:**
```json
{
  "message": "¡Hola! Ofrezco desarrollo de aplicaciones con IA, automatización con n8n..."
}
```

---

## 🔄 Cómo Funciona el Sistema de Conversación

### **1. Primera Visita del Usuario**
- Se genera un `conversationId` único: `portfolio-1234567890-abc123`
- Se guarda en `localStorage` del navegador
- Todos los mensajes usan este mismo ID

### **2. Mensajes Subsecuentes**
- El frontend envía el mismo `conversationId`
- n8n usa este ID como `sessionKey` en Simple Memory
- El bot **recuerda** toda la conversación anterior

### **3. Limpiar Conversación**
- Usuario hace clic en el botón 🗑️ en el chatbot
- Se genera un **nuevo** `conversationId`
- La conversación comienza desde cero

---

## 🧪 Cómo Probar que Funciona

### **Test 1: Memoria de Contexto**
1. Abre el chatbot en tu portfolio
2. Envía: "Mi nombre es Juan"
3. Espera respuesta
4. Envía: "¿Cuál es mi nombre?"
5. ✅ **Debe responder:** "Tu nombre es Juan"

### **Test 2: Conversación Continua**
1. Pregunta: "¿Qué servicios ofreces?"
2. Luego pregunta: "¿Cuánto cuesta el primero?"
3. ✅ **Debe entender** que "el primero" se refiere al primer servicio mencionado

### **Test 3: Persistencia**
1. Envía varios mensajes
2. Cierra el chatbot
3. Ábrelo de nuevo
4. ✅ **El historial debe estar guardado**
5. Envía otro mensaje
6. ✅ **El bot debe recordar la conversación anterior**

---

## 🎨 Mejoras Implementadas en el Frontend

### ✅ **Sistema de ConversationId**
```typescript
// Generación automática y persistente
const conversationId = `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
localStorage.setItem('portfolio_conversation_id', conversationId);
```

### ✅ **Payload Mejorado**
```typescript
const payload = {
  data: {
    message: userMessage,
    conversationId: conversationId  // ← NUEVO
  }
};
```

### ✅ **Logs de Debug**
```typescript
console.log('Sending to n8n:', {
  url: N8N_WEBHOOK_URL,
  conversationId,
  messagePreview: message.substring(0, 50)
});
```

---

## 🔧 Troubleshooting

### **Problema: Bot no recuerda conversaciones**
1. ✅ Verifica que el nodo "Simple Memory1" use `conversationId`
2. ✅ Revisa la consola del navegador (F12) y busca logs de `conversationId`
3. ✅ Verifica que el flujo esté **ACTIVE** en n8n

### **Problema: Error 404 o 500**
1. ✅ Verifica que la URL sea: `https://mariomoreno.app.n8n.cloud/webhook/bot-portfolio`
2. ✅ Asegúrate de que el flujo esté guardado y activo
3. ✅ Revisa los logs en n8n (Executions)

### **Problema: "Webhook not configured"**
1. ✅ En Netlify: **Site Settings → Environment Variables**
2. ✅ Agrega: `VITE_N8N_WEBHOOK_URL=https://mariomoreno.app.n8n.cloud/webhook/bot-portfolio`
3. ✅ Redeploy el sitio

---

## 📈 Métricas de Mejora

| Característica | Antes | Después |
|---------------|-------|---------|
| **Memoria** | ❌ No funciona | ✅ Persistente |
| **ConversationId** | ❌ No existe | ✅ Implementado |
| **Debug Logs** | ❌ Básicos | ✅ Detallados |
| **Contexto** | ❌ Se pierde | ✅ Se mantiene |
| **UX** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 Próximos Pasos

### **1. Actualizar n8n (CRÍTICO)**
- [ ] Cambiar `sessionKey` en "Simple Memory1"
- [ ] Guardar y activar el flujo
- [ ] Probar con los tests descritos arriba

### **2. Actualizar Netlify**
- [ ] Agregar variable: `VITE_N8N_WEBHOOK_URL=https://mariomoreno.app.n8n.cloud/webhook/bot-portfolio`
- [ ] Trigger redeploy

### **3. Verificar**
- [ ] Abrir portfolio en producción
- [ ] Probar el chatbot
- [ ] Verificar que recuerde conversaciones

---

## 💡 Mejoras Opcionales (Futuro)

1. **Analytics de Conversaciones**
   - Agregar node en n8n para guardar métricas
   - Tracking de preguntas frecuentes

2. **Respuestas Enriquecidas**
   - Botones interactivos
   - Cards con imágenes
   - Links a proyectos

3. **Multi-idioma en el Prompt**
   - Detectar idioma del usuario
   - Adaptar respuestas EN/ES

4. **Rate Limiting**
   - Limitar mensajes por minuto
   - Prevenir spam

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en consola del navegador (F12)
2. Revisa las ejecuciones en n8n Dashboard
3. Verifica las variables de entorno en Netlify

---

**Última actualización:** 2025-01-27
**Versión del flujo:** bot-portfolio v2.0
**Nueva instancia n8n:** mariomoreno.app.n8n.cloud
