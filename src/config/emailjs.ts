// Configuración de EmailJS
// IMPORTANTE: Debes configurar estos valores en https://emailjs.com

export const EMAILJS_CONFIG = {
  // Service ID de EmailJS
  SERVICE_ID: 'service_xuq7s3h',
  
  // Template ID de EmailJS
  TEMPLATE_ID: 'template_o41bvpk',
  
  // Public Key de EmailJS
  PUBLIC_KEY: 'sMxe6UVQQ9fu3NNNm',
  
  // Email de destino (tu email)
  TO_EMAIL: 'marioivanmorenopineda@gmail.com',
};

// Instrucciones de configuración:
// 1. Ve a https://emailjs.com y crea una cuenta
// 2. Crea un nuevo servicio de email (Gmail, Outlook, etc.)
// 3. Crea un template de email con estas variables:
//    - {{from_name}} - Nombre del remitente
//    - {{from_email}} - Email del remitente
//    - {{phone}} - Teléfono (opcional)
//    - {{message}} - Mensaje
//    - {{to_email}} - Tu email (marioivanmorenopineda@gmail.com)
// 4. Obtén tu Public Key en Account > API Keys
// 5. Reemplaza los valores arriba con los reales