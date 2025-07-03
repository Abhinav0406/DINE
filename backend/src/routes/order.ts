import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const {
      customer_id,
      table_id,
      items,
      special_instructions,
      payment_method
    } = req.body;

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.unit_price * item.quantity;
    }
    
    const tax_amount = subtotal * 0.18; // 18% tax
    const total_amount = subtotal + tax_amount;

    // Generate order number
    const orderNumber = `ORD${Date.now().toString().slice(-6)}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: 'default-restaurant-id',
        customer_id,
        table_id,
        order_number: orderNumber,
        subtotal,
        tax_amount,
        total_amount,
        special_instructions,
        payment_method,
        estimated_time: 25
      })
      .select()
      .single();

    if (orderError) {
      return res.status(400).json({ error: orderError.message });
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      special_instructions: item.special_instructions
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      return res.status(400).json({ error: itemsError.message });
    }

    // Update table status
    if (table_id) {
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', table_id);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...order,
        items: orderItems
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, customer_id, date, limit = 50 } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (
            name,
            image_url
          )
        ),
        tables (
          table_number
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (status) {
      query = query.eq('status', status);
    }

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
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

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (
            name,
            image_url,
            description
          )
        ),
        tables (
          table_number,
          capacity
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // If order is completed, free up the table
    if (status === 'completed' && data.table_id) {
      await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', data.table_id);
    }

    res.json({
      message: 'Order status updated successfully',
      order: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let query = supabase
      .from('orders')
      .select('total_amount, status, created_at');

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

    const analytics = {
      total_orders: data.length,
      total_revenue: data.reduce((sum, order) => sum + order.total_amount, 0),
      completed_orders: data.filter(order => order.status === 'completed').length,
      pending_orders: data.filter(order => order.status === 'pending').length,
      preparing_orders: data.filter(order => order.status === 'preparing').length,
      ready_orders: data.filter(order => order.status === 'ready').length
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 