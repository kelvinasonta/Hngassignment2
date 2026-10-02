'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

interface Review {
  id: string;
  product_id: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_buyer: boolean;
  created_at: string;
  products?: {
    name: string;
    image: string;
    category_label?: string;
  };
}

interface Product {
  id: string;
  name: string;
  category: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const fetchReviewsAndProducts = async () => {
    try {
      setIsLoading(true);
      const [revRes, prodRes] = await Promise.all([
        fetch('/api/account/reviews'),
        fetch('/api/products'),
      ]);

      const revData = await revRes.json();
      if (revRes.ok && revData.success) {
        setReviews(revData.data?.reviews || []);
      }

      const prodData = await prodRes.json();
      if (prodRes.ok && prodData.success) {
        const prodList = prodData.data?.products || [];
        setProducts(prodList);
        if (prodList.length > 0) {
          setSelectedProductId(prodList[0].id);
        }
      }
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsAndProducts();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setMessage({ text: 'Please select a product to review.', isError: true });
      return;
    }
    if (comment.trim().length < 5) {
      setMessage({ text: 'Comment must be at least 5 characters long.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/account/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          rating,
          title,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit review');
      }

      setMessage({ text: 'Review published successfully!', isError: false });
      setShowAddForm(false);
      setTitle('');
      setComment('');
      setRating(5);
      fetchReviewsAndProducts();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error submitting review', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
            Product Reviews & Feedback
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Share your hardware acoustic and engineering impressions with the AETHER community.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setMessage(null);
          }}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          {showAddForm ? 'Cancel' : (
            <>
              <Plus size={16} /> Write Review
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            background: message.isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
            border: `1px solid ${message.isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
            color: message.isError ? '#fca5a5' : '#34d399',
          }}
        >
          {message.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Review Submission Form Modal / Accordion */}
      {showAddForm && (
        <form
          onSubmit={handleSubmitReview}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            marginBottom: '28px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--primary)" /> Author Hardware Evaluation
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="rev-product">
                Select Hardware Product
              </label>
              <select
                id="rev-product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="form-input"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Acoustic & Build Rating</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: (hoverRating || rating) >= star ? '#fbbf24' : 'var(--text-dim)',
                      transition: 'transform 0.1s, color 0.1s',
                    }}
                  >
                    <Star
                      size={24}
                      fill={(hoverRating || rating) >= star ? '#fbbf24' : 'none'}
                    />
                  </button>
                ))}
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  {rating === 5 ? '5.0 / 5.0 (Reference Standard)' : `${rating}.0 / 5.0`}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rev-title">
                Review Headline
              </label>
              <input
                id="rev-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Masterclass in transient response and titanium build"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rev-comment">
                Detailed Feedback *
              </label>
              <textarea
                id="rev-comment"
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Detail your experience with acoustic resonance, wireless latency, daily ergonomics, and finish..."
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'Publishing...' : 'Submit Evaluation'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          Loading your published reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <Star size={36} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No Hardware Reviews Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '380px', margin: '0 auto 20px' }}>
            Share your unvarnished thoughts on devices you own. Reviews help other audiophiles and engineers make informed purchasing decisions.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '8px 18px' }}
          >
            <Plus size={16} /> Write First Review
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {rev.products?.image && (
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#000',
                      }}
                    >
                      <Image
                        src={rev.products.image}
                        alt={rev.products.name || 'Product'}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                      {rev.products?.name || 'AETHER Device'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < rev.rating ? '#fbbf24' : 'none'}
                          color={i < rev.rating ? '#fbbf24' : 'var(--text-dim)'}
                        />
                      ))}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        {rev.rating}.0 / 5.0
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {rev.is_verified_buyer && (
                    <span
                      style={{
                        background: 'rgba(52, 211, 153, 0.1)',
                        color: '#34d399',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid rgba(52, 211, 153, 0.2)',
                      }}
                    >
                      <CheckCircle2 size={11} /> VERIFIED BUYER
                    </span>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {new Date(rev.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                {rev.title}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
