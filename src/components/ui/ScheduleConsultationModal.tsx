import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaCheckCircle,
  FaSpinner,
  FaInfoCircle
} from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { scheduleConsultation, getAvailableSlots } from '@/api/n8n';

interface ScheduleConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  consultationType: 'ai-development' | 'web-development' | 'automation' | 'other';
  preferredDate: string;
  preferredTime: string;
  duration: '30' | '60';
  message: string;
}

const ScheduleConsultationModal: React.FC<ScheduleConsultationModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    consultationType: 'ai-development',
    preferredDate: '',
    preferredTime: '',
    duration: '30',
    message: ''
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Info, Step 2: Date/Time

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          consultationType: 'ai-development',
          preferredDate: '',
          preferredTime: '',
          duration: '30',
          message: ''
        });
        setIsSubmitted(false);
        setError('');
        setStep(1);
      }, 300);
    }
  }, [isOpen]);

  // Load available slots when date changes
  useEffect(() => {
    if (formData.preferredDate) {
      loadAvailableSlots(formData.preferredDate);
    }
  }, [formData.preferredDate]);

  const loadAvailableSlots = async (date: string) => {
    const result = await getAvailableSlots(date);
    if (result.success && result.slots) {
      setAvailableSlots(result.slots);
    }
  };

  const consultationTypes = {
    'ai-development': language === 'es' ? 'Desarrollo de IA' : 'AI Development',
    'web-development': language === 'es' ? 'Desarrollo Web' : 'Web Development',
    'automation': language === 'es' ? 'Automatización' : 'Automation',
    'other': language === 'es' ? 'Otro' : 'Other'
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateStep1 = (): boolean => {
    if (!formData.name.trim()) {
      setError(language === 'es' ? 'El nombre es requerido' : 'Name is required');
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError(language === 'es' ? 'Email válido es requerido' : 'Valid email is required');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.preferredDate) {
      setError(language === 'es' ? 'Selecciona una fecha' : 'Please select a date');
      return false;
    }
    if (!formData.preferredTime) {
      setError(language === 'es' ? 'Selecciona una hora' : 'Please select a time');
      return false;
    }

    // Validate date is not in the past
    const selectedDateTime = new Date(`${formData.preferredDate}T${formData.preferredTime}`);
    if (selectedDateTime < new Date()) {
      setError(language === 'es' ? 'La fecha debe ser futura' : 'Date must be in the future');
      return false;
    }

    // Validate business hours (9 AM - 6 PM)
    const hours = parseInt(formData.preferredTime.split(':')[0]);
    if (hours < 9 || hours >= 18) {
      setError(language === 'es'
        ? 'Horario disponible: 9:00 AM - 6:00 PM'
        : 'Available hours: 9:00 AM - 6:00 PM'
      );
      return false;
    }

    // Validate not weekend
    const dayOfWeek = selectedDateTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setError(language === 'es'
        ? 'No disponible los fines de semana'
        : 'Not available on weekends'
      );
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);
    setError('');

    try {
      const preferredDateTime = `${formData.preferredDate}T${formData.preferredTime}:00`;

      const result = await scheduleConsultation({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        consultationType: formData.consultationType,
        preferredDate: preferredDateTime,
        duration: formData.duration,
        message: formData.message,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      if (result.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(result.error || (language === 'es'
          ? 'Error al agendar. Intenta de nuevo.'
          : 'Error scheduling. Please try again.')
        );
      }
    } catch (err) {
      setError(language === 'es'
        ? 'Error de conexión. Verifica tu internet.'
        : 'Connection error. Check your internet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  const renderSuccessState = () => (
    <div className="text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        <FaCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
      </motion.div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">
        {language === 'es' ? '¡Consulta Agendada!' : 'Consultation Scheduled!'}
      </h3>
      <p className="text-gray-600 mb-2">
        {language === 'es'
          ? 'Recibirás un email de confirmación pronto con los detalles y enlace de reunión.'
          : 'You will receive a confirmation email soon with details and meeting link.'
        }
      </p>
      <p className="text-sm text-gray-500">
        {language === 'es'
          ? 'Fecha: ' + new Date(`${formData.preferredDate}T${formData.preferredTime}`).toLocaleString(language)
          : 'Date: ' + new Date(`${formData.preferredDate}T${formData.preferredTime}`).toLocaleString(language)
        }
      </p>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <FaUser className="mr-2 text-blue-500" />
          {language === 'es' ? 'Nombre Completo' : 'Full Name'} *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
          placeholder={language === 'es' ? 'Tu nombre' : 'Your name'}
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <FaEnvelope className="mr-2 text-blue-500" />
          {language === 'es' ? 'Email' : 'Email'} *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
          placeholder={language === 'es' ? 'tu@email.com' : 'your@email.com'}
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <FaPhone className="mr-2 text-blue-500" />
          {language === 'es' ? 'Teléfono (Opcional)' : 'Phone (Optional)'}
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
          placeholder="+58 412 1234567"
        />
      </div>

      {/* Consultation Type */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <FaBriefcase className="mr-2 text-blue-500" />
          {language === 'es' ? 'Tipo de Consulta' : 'Consultation Type'} *
        </label>
        <select
          name="consultationType"
          value={formData.consultationType}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
        >
          {Object.entries(consultationTypes).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <FaInfoCircle className="mr-2 text-blue-500" />
          {language === 'es' ? 'Mensaje (Opcional)' : 'Message (Optional)'}
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white text-gray-900 placeholder-gray-400"
          placeholder={language === 'es'
            ? 'Cuéntame sobre tu proyecto o necesidades...'
            : 'Tell me about your project or needs...'
          }
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      {/* Date */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <FaCalendarAlt className="mr-2 text-blue-500" />
          {language === 'es' ? 'Fecha Preferida' : 'Preferred Date'} *
        </label>
        <input
          type="date"
          name="preferredDate"
          value={formData.preferredDate}
          onChange={handleChange}
          min={getMinDate()}
          max={getMaxDate()}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {language === 'es'
            ? 'Disponible: Lunes a Viernes'
            : 'Available: Monday to Friday'
          }
        </p>
      </div>

      {/* Time */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <FaClock className="mr-2 text-blue-500" />
          {language === 'es' ? 'Hora Preferida' : 'Preferred Time'} *
        </label>
        <input
          type="time"
          name="preferredTime"
          value={formData.preferredTime}
          onChange={handleChange}
          min="09:00"
          max="18:00"
          step="1800"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {language === 'es'
            ? 'Horario: 9:00 AM - 6:00 PM (Hora Venezuela)'
            : 'Hours: 9:00 AM - 6:00 PM (Venezuela Time)'
          }
        </p>
      </div>

      {/* Duration */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <FaClock className="mr-2 text-blue-500" />
          {language === 'es' ? 'Duración' : 'Duration'}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, duration: '30' }))}
            className={`px-4 py-3 rounded-lg border-2 transition-all ${
              formData.duration === '30'
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            30 {language === 'es' ? 'minutos' : 'minutes'}
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, duration: '60' }))}
            className={`px-4 py-3 rounded-lg border-2 transition-all ${
              formData.duration === '60'
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            60 {language === 'es' ? 'minutos' : 'minutes'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center text-sm">
          <FaInfoCircle className="mr-2" />
          {language === 'es' ? 'Importante' : 'Important'}
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• {language === 'es'
            ? 'Recibirás confirmación por email con enlace de Google Meet'
            : 'You will receive email confirmation with Google Meet link'
          }</li>
          <li>• {language === 'es'
            ? 'Si el horario no está disponible, te contactaré para reagendar'
            : 'If time slot is not available, I will contact you to reschedule'
          }</li>
        </ul>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
            >
              <FaTimes className="w-5 h-5 text-gray-700" />
            </button>

            {/* Scrollable Content */}
            <div className="max-h-[90vh] overflow-y-auto">
              {isSubmitted ? (
                <div className="p-8">
                  {renderSuccessState()}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCalendarAlt className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {language === 'es' ? 'Programar una Consulta' : 'Schedule a Consultation'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'es'
                        ? 'Agenda una sesión para discutir tu proyecto de IA'
                        : 'Book a session to discuss your AI project'
                      }
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        step === 1 ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        1
                      </div>
                      <div className={`w-16 h-1 ${step === 2 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        step === 2 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        2
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Form Steps */}
                  {step === 1 ? renderStep1() : renderStep2()}

                  {/* Actions */}
                  <div className="mt-6 flex justify-between">
                    {step === 2 && (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {language === 'es' ? 'Anterior' : 'Previous'}
                      </button>
                    )}

                    {step === 1 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                      >
                        {language === 'es' ? 'Siguiente' : 'Next'}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            {language === 'es' ? 'Agendando...' : 'Scheduling...'}
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="mr-2" />
                            {language === 'es' ? 'Agendar Consulta' : 'Schedule Consultation'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleConsultationModal;
