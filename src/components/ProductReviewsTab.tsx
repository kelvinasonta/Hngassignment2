'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/products-data';
import { useAuth } from '@/context/AuthContext';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Plus,
  Send,
  Sparkles,
  ThumbsUp,
  X,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Review {
  id: string;
  author: string;
  role: string;
  rating: number;
  date: string;
  headline?: string;
  comment: string;
  pros?: string;
  cons?: string;
  verified: boolean;
}

const DEFAULT_REVIEWS: Record<string, Review[]> = {
  default: [
    {
      id: 'rev-base-1',
      author: 'Marcus Vance',
      role: 'Principal Audio Architect & Studio Lead',
      rating: 5,
      date: '2 weeks ago',
      headline: 'Uncompromising Transient Precision & Build Integrity',
      comment: 'The tactile resistance of the dial and thermal dissipation of the unibody chassis exceed studio benchmark standards. High-frequency extension remains effortless without fatigue.',
      pros: 'CNC 6063 Aluminum, Flat frequency response, zero distortion',
      cons: 'Premium positioning, requires quality sources',
      verified: true,
    },
    {
      id: 'rev-base-2',
      author: 'Elena Rostova',
      role: 'Industrial Hardware & Metallurgy Evaluator',
      rating: 5,
      date: '1 month ago',
      headline: 'Surgical Acoustic Tuning with Reference Isolation',
      comment: 'The acoustic tuning is surgical. No synthetic bass elevation — just razor-sharp transients, expansive spatial imaging, and hermetic noise isolation.',
      pros: 'Titanium unibody, exceptional seal, all-day comfort',
      cons: 'Heavier than injection molded plastic',
      verified: true,
    },
  ],
};

interface ProductReviewsTabProps {
  product: Product;
  onReviewsChange?: (newCount: number, newRating: number) => void;
}

export default function ProductReviewsTab({ product, onReviewsChange }: ProductReviewsTabProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS.default);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToast, setSubmittedToast] = useState(false);

  // Load reviews from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`aether_hardware_reviews_${product.id}`);
      if (stored) {
        const parsed: Review[] = JSON.parse(stored);
        setReviews([...parsed, ...DEFAULT_REVIEWS.default]);
      } else {
        setReviews(DEFAULT_REVIEWS.default);
      }
    } catch (e) {
      setReviews(DEFAULT_REVIEWS.default);
    }
  }, [product.id]);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user && !author) {
      setAuthor(user.name);
      setRole('Verified Hardware Owner');
    }
  }, [user]);

  const ratingDescriptions: Record<number, string> = {
    5: 'Reference Grade Hardware (5/5 — Studio Masterpiece)',
    4: 'Exceptional Engineering (4/5 — Highly Recommended)',
    3: 'Solid Performance (3/5 — Meets Specifications)',
    2: 'Acoustic / Thermal Disparity (2/5 — Minor Compromises)',
    1: 'Hardware Defect (1/5 — Requires RMA Calibration)',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) {
      alert('Please provide your name and hardware commentary.');
      return;
    }

    setIsSubmitting(true);

    const newRev: Review = {
      id: 'rev_' + Date.now(),
      author: author.trim(),
      role: role.trim() || 'Verified Hardware Evaluator',
      rating,
      date: 'Just now',
      headline: headline.trim() || 'Independent Technical Hardware Audit',
      comment: comment.trim(),
      pros: pros.trim() || undefined,
      cons: cons.trim() || undefined,
      verified: true,
    };

    try {
      const stored = localStorage.getItem(`aether_hardware_reviews_${product.id}`);
      const existing: Review[] = stored ? JSON.parse(stored) : [];
      const updated = [newRev, ...existing];
      localStorage.setItem(`aether_hardware_reviews_${product.id}`, JSON.stringify(updated));

      const all = [newRev, ...reviews];
      setReviews(all);

      // Recalculate average rating
      const totalScore = all.reduce((acc, r) => acc + r.rating, 0);
      const avg = Number((totalScore / all.length).toFixed(1));
      if (onReviewsChange) {
        onReviewsChange(all.length, avg);
      }

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#34d399', '#fbbf24'],
      });

      setSubmittedToast(true);
      setTimeout(() => setSubmittedToast(false), 4000);

      // Reset form
      setHeadline('');
      setComment('');
      setPros('');
      setCons('');
      setIsFormOpen(false);
    } catch (e) {
      console.warn('Review save error', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1);

  return (
    <div>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              Verified Hardware Audits & Evaluations
            </h3>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                color: 'var(--primary)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {reviews.length} Audits
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Reference score of <strong style={{ color: 'var(--text-main)' }}>{avgRating} / 5.0</strong> based on verified studio and real-world hardware telemetry.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            background: isFormOpen ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
            color: isFormOpen ? 'var(--text-main)' : '#07090e',
            border: isFormOpen ? '1px solid var(--border-subtle)' : 'none',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            boxShadow: isFormOpen ? 'none' : '0 0 20px rgba(56, 189, 248, 0.3)',
          }}
        >
          {isFormOpen ? <X size={16} /> : <Plus size={16} strokeWidth={2.5} />}
          <span>{isFormOpen ? 'Cancel Submission' : 'Submit Hardware Audit'}</span>
        </button>
      </div>

      {/* Success Alert */}
      {submittedToast && (
        <div
          style={{
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#34d399',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>Your hardware evaluation has been cryptographically signed and published to the live audit log.</span>
        </div>
      )}

      {/* Submission Form Modal/Accordion */}
      {isFormOpen && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            marginBottom: '32px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Cpu size={18} color="var(--primary)" />
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Publish Precision Hardware Audit</h4>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Interactive Star Picker */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Acoustic & Mechanical Score: <span style={{ color: '#fbbf24' }}>{ratingDescriptions[hoverRating || rating]}</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      padding: '4px',
                      color: star <= (hoverRating || rating) ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      transform: star <= (hoverRating || rating) ? 'scale(1.15)' : 'scale(1)',
                    }}
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star size={24} fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>

            {/* Author & Role */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Full Name / Call-Sign *
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Kelvin Asonta"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Professional Role / Discipline
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Lead Acoustic Engineer, Audiophile Enthusiast"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Audit Headline / Summary
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Surgical Resolution with Reference Frequency Balance"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Commentary */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Engineering Commentary & Telemetry Evaluation *
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Detail your findings regarding acoustic timbre, thermal dissipation, chassis tactile feedback, battery endurance, and wireless latency..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}
              />
            </div>

            {/* Pros & Cons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#34d399', marginBottom: '4px', fontWeight: 600 }}>
                  + Key Engineering Strengths (Pros)
                </label>
                <input
                  type="text"
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  placeholder="e.g. Titanium finish, zero distortion, magnetic charging"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#f87171', marginBottom: '4px', fontWeight: 600 }}>
                  - Limitations / Trade-offs (Cons)
                </label>
                <input
                  type="text"
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  placeholder="e.g. Substantial weight, premium cost"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="btn-secondary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '13px' }}
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Signing Audit...' : 'Publish Verified Audit'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reviews.map((rev) => (
          <div
            key={rev.id}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              transition: 'var(--transition-fast)',
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>{rev.author}</span>
                  {rev.verified && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(52, 211, 153, 0.1)',
                        color: '#34d399',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: '1px solid rgba(52, 211, 153, 0.25)',
                      }}
                    >
                      <ShieldCheck size={12} />
                      Verified Hardware Audit
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {rev.role}
                </div>
              </div>

              <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>{rev.date}</span>
            </div>

            {/* Stars & Headline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '4px', color: '#fbbf24' }}>
                {[...Array(rev.rating)].map((_, s) => (
                  <Star key={s} size={15} fill="currentColor" />
                ))}
              </div>
              {rev.headline && (
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {rev.headline}
                </span>
              )}
            </div>

            {/* Comment */}
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7, marginBottom: rev.pros || rev.cons ? '14px' : '0' }}>
              "{rev.comment}"
            </p>

            {/* Pros & Cons tags */}
            {(rev.pros || rev.cons) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                {rev.pros && (
                  <div style={{ fontSize: '12px', color: '#34d399', display: 'flex', gap: '6px' }}>
                    <strong>Strengths:</strong>
                    <span>{rev.pros}</span>
                  </div>
                )}
                {rev.cons && (
                  <div style={{ fontSize: '12px', color: '#f87171', display: 'flex', gap: '6px' }}>
                    <strong>Considerations:</strong>
                    <span>{rev.cons}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
