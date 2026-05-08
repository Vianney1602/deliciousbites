import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createFeedbackItem, getFeedbackItems } from '../lib/localStore';
import { publishLiveEvent, subscribeToLiveEvents } from '../lib/liveEvents';

const specials = ['No Maida', 'No Preservatives', 'No Sugar', 'No Gluten'];

const HomePage = () => {
  const { user } = useAuth();
  const [feedbackForm, setFeedbackForm] = useState({ message: '', rating: 5 });
  const [feedbackItems, setFeedbackItems] = useState(() => getFeedbackItems());

  useEffect(() => {
    const unsub = subscribeToLiveEvents((event) => {
      if (event.type === 'feedback-changed') {
        setFeedbackItems(getFeedbackItems());
      }
    });

    return unsub;
  }, []);

  const approvedFeedback = useMemo(
    () => feedbackItems.filter((item) => item.approved).slice(0, 6),
    [feedbackItems]
  );

  const handleSubmitFeedback = (event) => {
    event.preventDefault();

    if (!user || !feedbackForm.message.trim()) return;

    createFeedbackItem({
      name: user.name,
      userId: user.id,
      message: feedbackForm.message.trim(),
      rating: Number(feedbackForm.rating)
    });

    setFeedbackForm({ message: '', rating: 5 });
    publishLiveEvent('feedback-changed', { source: 'home-page' });
  };

  return (
    <>
      {/* Additional content section */}
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12 space-y-12">
        {/* Hero Section with Background */}
        <section className="grid md:grid-cols-2 gap-8 items-center relative">
          {/* Background Image Placeholder */}
          <div className="absolute inset-0 -z-10 opacity-10 rounded-3xl overflow-hidden">
            <img src="/images/background-placeholder.jpg" alt="pictures" className="w-full h-full object-cover" />
          </div>
          
          <div className="space-y-4" data-anim>
            <p className="text-xs uppercase tracking-[0.25em] text-bakeryBrown/65">DELICIOUS BITES</p>
            <h1 className="font-display text-4xl md:text-5xl text-bakeryBrown leading-tight">
              Baking memories,
              <span className="text-bakeryPrimary"> one bite at a time.</span>
            </h1>
            <p className="text-bakeryBrown/75 max-w-xl">
              Discover premium home-baked cupcakes, brownies, chocolates, and celebration
              cakes with clean ingredients and handcrafted flavors.
            </p>
            <div className="flex flex-wrap gap-2">
              {specials.map((special) => (
                <span key={special} className="chip">{special}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/menu" className="btn-primary">Explore Menu</Link>
              <Link to="/about" className="btn-outline">About</Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-bakeryPink/50 bg-white/80 p-6 md:p-8 shadow-lg" data-anim>
            <h2 className="font-display text-2xl text-bakeryBrown">House Favorites</h2>
            <ul className="mt-4 space-y-2 text-sm text-bakeryBrown/80">
              <li>Signature Pistachio Chocolate Truffles</li>
              <li>Eggless Classic Brownie Slabs</li>
              <li>Seasonal Fruitcake Collection</li>
              <li>Custom Theme Cakes for Events</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4" data-anim>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-display text-2xl text-bakeryBrown">Customer Reviews</h2>
            <p className="text-xs text-bakeryBrown/60">Visible only after admin approval</p>
          </div>
          {approvedFeedback.length === 0 ? (
            <p className="card p-4 text-sm text-bakeryBrown/70">No approved reviews yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedFeedback.map((item) => (
                <article key={item.id} className="card p-4">
                  <p className="text-xs text-bakeryBrown/60">{new Date(item.createdAt).toLocaleDateString()}</p>
                  <p className="mt-2 text-sm text-bakeryBrown/85">{item.message}</p>
                  <p className="mt-3 text-xs font-semibold text-bakeryPrimary">
                    {item.name} · {item.rating}/5
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5 md:p-6" data-anim>
          <h2 className="font-display text-2xl text-bakeryBrown">Share Your Feedback</h2>
          <p className="text-sm text-bakeryBrown/70 mt-1">
            Your feedback is sent to admin and can be published on the home page after approval.
          </p>

          {!user ? (
            <div className="mt-4 text-sm text-bakeryBrown/70">
              Please <Link to="/login" className="text-bakeryPrimary underline">sign in</Link> to post feedback.
            </div>
          ) : (
            <form className="mt-4 grid md:grid-cols-[1fr,130px] gap-3" onSubmit={handleSubmitFeedback}>
              <textarea
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, message: e.target.value }))}
                className="input-field min-h-[90px] rounded-2xl"
                placeholder="Tell us what you loved..."
              />
              <div className="space-y-3">
                <label className="block text-xs text-bakeryBrown/80">
                  Rating
                  <select
                    value={feedbackForm.rating}
                    onChange={(e) => setFeedbackForm((prev) => ({ ...prev, rating: e.target.value }))}
                    className="input-field mt-1"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn-primary w-full">Submit Feedback</button>
              </div>
            </form>
          )}
        </section>
      </main>
    </>
  );
};

export default HomePage;
