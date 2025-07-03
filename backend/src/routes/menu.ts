import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Get all menu categories
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all menu items
router.get('/items', async (req, res) => {
  try {
    const { category_id } = req.query;
    
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name
        )
      `)
      .eq('is_available', true)
      .order('sort_order');

    if (category_id) {
      query = query.eq('category_id', category_id);
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

// Get menu item by ID
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update menu item availability (admin only)
router.patch('/items/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Menu item availability updated',
      item: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search menu items
router.get('/search', async (req, res) => {
  try {
    const { q, category, vegetarian, spicy } = req.query;

    let query = supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name
        )
      `)
      .eq('is_available', true);

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (vegetarian === 'true') {
      query = query.eq('is_vegetarian', true);
    }

    if (spicy === 'true') {
      query = query.eq('is_spicy', true);
    }

    const { data, error } = await query.order('sort_order');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 