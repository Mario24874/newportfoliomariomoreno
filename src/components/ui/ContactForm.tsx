import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import { HiX, HiMail } from 'react-icons/hi';
import emailjs from '@emailjs/browser';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import { EMAILJS_CONFIG } from '@/config/emailjs';

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ open, onClose }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setStatus({ type: 'error', message: t.contact?.form?.nameRequired || 'Name is required' });
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setStatus({ type: 'error', message: t.contact?.form?.emailInvalid || 'Valid email is required' });
      return false;
    }
    if (!formData.message.trim()) {
      setStatus({ type: 'error', message: t.contact?.form?.messageRequired || 'Message is required' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone,
        message: formData.message,
        to_email: EMAILJS_CONFIG.TO_EMAIL,
      };

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID, 
        EMAILJS_CONFIG.TEMPLATE_ID, 
        templateParams, 
        EMAILJS_CONFIG.PUBLIC_KEY
      );
      
      setStatus({ 
        type: 'success', 
        message: t.contact?.form?.successMessage || 'Message sent successfully! I\'ll get back to you soon.' 
      });
      
      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '', message: '' });
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('EmailJS Error:', error);
      setStatus({ 
        type: 'error', 
        message: t.contact?.form?.errorMessage || 'Failed to send message. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phone: '', message: '' });
    setStatus({ type: null, message: '' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3 },
        sx: {
          borderRadius: 3,
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HiMail size={24} color="#3b82f6" />
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
            {t.contact?.form?.title || 'Send me a message'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <HiX size={20} />
        </IconButton>
      </DialogTitle>

      <form ref={formRef} onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {t.contact?.form?.subtitle || 'I\'d love to hear from you. Send me a message and I\'ll respond as soon as possible.'}
          </Typography>

          {status.message && (
            <Alert 
              severity={status.type || 'info'} 
              sx={{ mb: 2 }}
              onClose={() => setStatus({ type: null, message: '' })}
            >
              {status.message}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="name"
              label={t.contact?.form?.name || 'Full Name'}
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              disabled={isLoading}
            />

            <TextField
              name="email"
              label={t.contact?.form?.email || 'Email Address'}
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              disabled={isLoading}
            />

            <TextField
              name="phone"
              label={t.contact?.form?.phone || 'Phone Number (Optional)'}
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              disabled={isLoading}
            />

            <TextField
              name="message"
              label={t.contact?.form?.message || 'Your Message'}
              value={formData.message}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              disabled={isLoading}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={isLoading}
            sx={{ mr: 1 }}
          >
            {t.contact?.form?.cancel || 'Cancel'}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : <HiMail />}
            sx={{ minWidth: 120 }}
          >
            {isLoading 
              ? (t.contact?.form?.sending || 'Sending...') 
              : (t.contact?.form?.send || 'Send Message')
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ContactForm;