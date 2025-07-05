import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Get all tables
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('tables')
      .select('*')
      .order('table_number');

    if (status) {
      query = query.eq('status', status);
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

// Get table by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update table status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'occupied', 'reserved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('tables')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Table status updated successfully',
      table: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available tables by capacity
router.get('/available/:capacity', async (req, res) => {
  try {
    const { capacity } = req.params;

    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'available')
      .gte('capacity', parseInt(capacity))
      .order('capacity')
      .order('table_number');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reserve table
router.post('/:id/reserve', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id } = req.body;

    // Check if table is available
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('id', id)
      .single();

    if (tableError) {
      return res.status(400).json({ error: tableError.message });
    }

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    if (table.status !== 'available') {
      return res.status(400).json({ error: 'Table is not available' });
    }

    // Reserve the table
    const { data, error } = await supabase
      .from('tables')
      .update({ status: 'reserved' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Table reserved successfully',
      table: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get table occupancy stats
router.get('/analytics/occupancy', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('status');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const stats = {
      total_tables: data.length,
      available: data.filter(table => table.status === 'available').length,
      occupied: data.filter(table => table.status === 'occupied').length,
      reserved: data.filter(table => table.status === 'reserved').length,
      occupancy_rate: ((data.filter(table => table.status === 'occupied').length + data.filter(table => table.status === 'reserved').length) / data.length * 100).toFixed(1)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset all tables to available
router.post('/reset-all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tables')
      .update({ status: 'available' })
      .neq('status', 'available')
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'All tables reset to available successfully',
      tables: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 