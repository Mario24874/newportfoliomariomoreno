import React, { useState } from 'react';

const API_URL = 'https://app.mariomoreno.work/api/analytics/review';

type Step = 'idle' | 'open' | 'submitting' | 'done' | 'error';

export const ReviewWidget: React.FC = () => {
  const [step, setStep] = useState<Step>('idle');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setStep('submitting');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment || undefined, reviewer_name: name || undefined }),
      });
      setStep(res.ok ? 'done' : 'error');
    } catch {
      setStep('error');
    }
  }

  function reset() {
    setStep('idle');
    setRating(0);
    setHovered(0);
    setName('');
    setComment('');
  }

  const activeRating = hovered || rating;

  return (
    <>
      {/* Floating trigger button */}
      {step === 'idle' && (
        <button
          onClick={() => setStep('open')}
          title="Dejar una valoración"
          style={{
            position: 'fixed', bottom: 24, left: 24, zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 999,
            background: '#0f172a', border: '1px solid #334155',
            color: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span style={{ fontSize: 16 }}>⭐</span>
          Valorar
        </button>
      )}

      {/* Modal */}
      {(step === 'open' || step === 'submitting' || step === 'done' || step === 'error') && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) reset(); }}
        >
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16,
            padding: 28, width: '100%', maxWidth: 400,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {step === 'done' ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <h3 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>
                  ¡Gracias por tu valoración!
                </h3>
                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
                  Tu reseña será revisada y publicada pronto.
                </p>
                <button onClick={reset} style={{
                  padding: '8px 20px', borderRadius: 8, background: '#1e293b',
                  color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: 13,
                }}>
                  Cerrar
                </button>
              </div>
            ) : step === 'error' ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
                <h3 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>
                  Algo salió mal
                </h3>
                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
                  Intenta de nuevo más tarde.
                </p>
                <button onClick={reset} style={{
                  padding: '8px 20px', borderRadius: 8, background: '#1e293b',
                  color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: 13,
                }}>
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>
                    ¿Cómo valoras mi portfolio?
                  </h3>
                  <button type="button" onClick={reset} style={{
                    background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1,
                  }}>✕</button>
                </div>

                {/* Stars */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      style={{
                        fontSize: 36, background: 'none', border: 'none', cursor: 'pointer',
                        color: s <= activeRating ? '#f59e0b' : '#334155',
                        transform: s <= activeRating ? 'scale(1.1)' : 'scale(1)',
                        transition: 'color 0.1s, transform 0.1s',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 13, color: '#94a3b8' }}>
                    {['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'][rating]}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Tu nombre (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, marginBottom: 10,
                    background: '#020617', border: '1px solid #1e293b', color: '#f8fafc',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <textarea
                  placeholder="Comentario (opcional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, marginBottom: 16,
                    background: '#020617', border: '1px solid #1e293b', color: '#f8fafc',
                    fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />

                <button
                  type="submit"
                  disabled={rating === 0 || step === 'submitting'}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 8,
                    background: rating === 0 ? '#1e293b' : '#6366f1',
                    color: rating === 0 ? '#475569' : '#fff',
                    border: 'none', cursor: rating === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                >
                  {step === 'submitting' ? 'Enviando...' : 'Enviar valoración'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewWidget;
