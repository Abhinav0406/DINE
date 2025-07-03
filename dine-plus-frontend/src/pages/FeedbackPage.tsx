import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Star, Send, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FeedbackPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentOrder, currentTable } = useStore();

  const [ratings, setRatings] = useState({
    overall: 0,
    food: 0,
    service: 0,
    ambiance: 0,
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentOrder || !currentTable) {
    navigate('/tables');
    return null;
  }

  const handleRatingChange = (category: keyof typeof ratings, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ratings.overall === 0) {
      alert('Please provide an overall rating');
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert feedback into Supabase
      const { data, error } = await supabase
        .from('feedback')
        .insert([
          {
            order_id: currentOrder.id,
            table_id: currentTable.id,
            overall_rating: ratings.overall,
            food_rating: ratings.food,
            service_rating: ratings.service,
            ambiance_rating: ratings.ambiance,
            comment: comment,
            created_at: new Date().toISOString(),
          },
        ]);
      if (error) {
        console.error('Supabase feedback error:', error);
        alert('Failed to submit feedback. Please try again.');
        return;
      }
      // On success, navigate to thank you
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating: React.FC<{
    rating: number;
    onRatingChange: (rating: number) => void;
    label: string;
  }> = ({ rating, onRatingChange, label }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`p-1 rounded transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            <Star className="w-8 h-8 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">How was your experience?</h1>
            <p className="mt-2 text-gray-600">
              Order #{currentOrder.order_number} • Table {currentTable.table_number}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Overall Rating */}
          <div className="card p-6">
            <div className="text-center mb-6">
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Overall Experience</h2>
            </div>
            
            <StarRating
              rating={ratings.overall}
              onRatingChange={(rating) => handleRatingChange('overall', rating)}
              label="How would you rate your overall experience?"
            />
          </div>

          {/* Detailed Ratings */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tell us more</h3>
            
            <div className="space-y-6">
              <StarRating
                rating={ratings.food}
                onRatingChange={(rating) => handleRatingChange('food', rating)}
                label="Food Quality"
              />
              
              <StarRating
                rating={ratings.service}
                onRatingChange={(rating) => handleRatingChange('service', rating)}
                label="Service"
              />
              
              <StarRating
                rating={ratings.ambiance}
                onRatingChange={(rating) => handleRatingChange('ambiance', rating)}
                label="Ambiance"
              />
            </div>
          </div>

          {/* Comments */}
          <div className="card p-6">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Share your feedback
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you loved or how we can improve..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none h-32"
            />
          </div>

          {/* Order Summary */}
          <div className="card p-6 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-3">Your Order</h4>
            <div className="space-y-2">
              {currentOrder.order_items?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.menu_item_id}</span>
                  <span>₹{item.total_price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{currentOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={ratings.overall === 0 || isSubmitting}
            className={`w-full py-4 text-lg font-medium rounded-lg transition-all ${
              ratings.overall === 0 || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white transform hover:scale-105'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Send className="w-5 h-5 mr-2" />
                Submit Feedback
              </div>
            )}
          </button>

          {/* Skip Option */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/thank-you')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage; 