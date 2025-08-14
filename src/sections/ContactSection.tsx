import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, IconButton, Box } from '@mui/material';
import { FaEnvelope, FaWhatsapp, FaLinkedin, FaGithub } from 'react-icons/fa';
import { YOUR_WHATSAPP_NUMBER, YOUR_EMAIL, YOUR_LINKEDIN_URL, YOUR_GITHUB_URL } from '@/data/portfolioData';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import ContactForm from '@/components/ui/ContactForm';

const ContactSection: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const whatsappLink = `https://wa.me/${YOUR_WHATSAPP_NUMBER.replace(/\D/g, '')}`; // Ensure only digits and '+' for the number

  return (
    <section id="contact" className="py-16 sm:py-24 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-blue-400">{t.contact.title}</h2>
          <p className="mt-4 text-lg text-gray-300">{t.contact.description}</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto bg-gray-800/50 backdrop-blur-sm border border-white/10 p-8 rounded-xl shadow-2xl text-center"
        >
          <p className="text-gray-300 mb-6">
            {t.contact.additionalInfo}
          </p>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Button
              onClick={() => setIsContactFormOpen(true)}
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<FaEnvelope />}
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              sx={{
                py: 1.5,
                fontSize: '1.125rem',
                fontWeight: 600,
              }}
            >
              {t.contact.email}
            </Button>
            
            <Button
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              color="success"
              size="large"
              fullWidth
              startIcon={<FaWhatsapp />}
              component={motion.a}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              sx={{
                py: 1.5,
                fontSize: '1.125rem',
                fontWeight: 600,
              }}
            >
              {t.contact.whatsapp}
            </Button>
          </Box>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-gray-400 mb-4">
              {t.contact.connectWith}
            </p>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
              <IconButton
                href={YOUR_LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                component={motion.a}
                whileHover={{ scale: 1.2 }}
                sx={{
                  color: 'text.secondary',
                  fontSize: '1.5rem',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  }
                }}
              >
                <FaLinkedin />
              </IconButton>
              <IconButton
                href={YOUR_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                component={motion.a}
                whileHover={{ scale: 1.2 }}
                sx={{
                  color: 'text.secondary',
                  fontSize: '1.5rem',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  }
                }}
              >
                <FaGithub />
              </IconButton>
              {/* Add more social links if needed */}
            </Box>
          </div>
        </motion.div>
      </div>

      {/* Contact Form Modal */}
      <ContactForm 
        open={isContactFormOpen} 
        onClose={() => setIsContactFormOpen(false)} 
      />
    </section>
  );
};

export default ContactSection;