import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const {
      order_id,
      customer_id,
      rating,
      comment,
      service_rating,
      food_rating,
      ambiance_rating
    } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        restaurant_id: 'default-restaurant-id',
        order_id,
        customer_id,
        rating,
        comment,
        service_rating,
        food_rating,
        ambiance_rating
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all feedback
router.get('/', async (req, res) => {
  try {
    const { limit = 50, rating, date_from, date_to } = req.query;

    let query = supabase
      .from('feedback')
      .select(`
        *,
        orders (
          order_number,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (rating) {
      query = query.eq('rating', parseInt(rating as string));
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feedback by order ID
router.get('/order/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;

    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        orders (
          order_number,
          created_at
        )
      `)
      .eq('order_id', order_id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feedback analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let query = supabase
      .from('feedback')
      .select('rating, service_rating, food_rating, ambiance_rating, created_at');

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (data.length === 0) {
      return res.json({
        total_feedback: 0,
        average_rating: 0,
        average_service_rating: 0,
        average_food_rating: 0,
        average_ambiance_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }

    const analytics = {
      total_feedback: data.length,
      average_rating: (data.reduce((sum, feedback) => sum + feedback.rating, 0) / data.length).toFixed(1),
      average_service_rating: (data.reduce((sum, feedback) => sum + (feedback.service_rating || 0), 0) / data.length).toFixed(1),
      average_food_rating: (data.reduce((sum, feedback) => sum + (feedback.food_rating || 0), 0) / data.length).toFixed(1),
      average_ambiance_rating: (data.reduce((sum, feedback) => sum + (feedback.ambiance_rating || 0), 0) / data.length).toFixed(1),
      rating_distribution: {
        1: data.filter(f => f.rating === 1).length,
        2: data.filter(f => f.rating === 2).length,
        3: data.filter(f => f.rating === 3).length,
        4: data.filter(f => f.rating === 4).length,
        5: data.filter(f => f.rating === 5).length
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent feedback with comments
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        orders (
          order_number
        )
      `)
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 