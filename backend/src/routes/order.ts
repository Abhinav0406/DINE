import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Type definitions for staged ordering
interface OrderMetadata {
  current_stage?: string;
  is_staged_order?: boolean;
  is_finalized?: boolean;
  timestamp?: string;
  finalized_at?: string;
}

interface ItemMetadata {
  stage?: string;
  notes?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  created_at: string;
  menu_items?: {
    name: string;
    image_url?: string;
    description?: string;
  };
}

interface StageItems {
  starters: Array<OrderItem & { stage: string; notes?: string }>;
  main_course: Array<OrderItem & { stage: string; notes?: string }>;
  desserts: Array<OrderItem & { stage: string; notes?: string }>;
}

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

// Create a new order session for staged ordering
router.post('/session', async (req, res) => {
  try {
    console.log('Received session creation request:', req.body);
    const { table_id } = req.body;

    if (!table_id) {
      console.error('Missing table_id in request');
      return res.status(400).json({ error: 'table_id is required' });
    }

    // Generate session order number
    const orderNumber = `SESS${Date.now().toString().slice(-6)}`;
    console.log('Generated order number:', orderNumber);

    // Create initial order with staged flag - using status_text instead of status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: 'default-restaurant-id',
        table_id,
        order_number: orderNumber,
        status: 'pending', // Use pending initially
        status_text: 'staged', // Add a text field for actual status
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        special_instructions: JSON.stringify({
          is_staged_order: true,
          current_stage: 'starters',
          timestamp: new Date().toISOString()
        }),
        payment_status: 'pending',
        estimated_time: 0
      })
      .select()
      .single();

    if (orderError) {
      console.error('Supabase error creating order:', orderError);
      return res.status(400).json({ 
        error: orderError.message,
        details: orderError
      });
    }

    console.log('Created order:', order);

    // Update table status
    const { error: tableError } = await supabase
      .from('tables')
      .update({ status: 'occupied' })
      .eq('id', table_id);

    if (tableError) {
      console.error('Error updating table status:', tableError);
      // Don't return here, we still want to return the session
    }

    const responseData = {
      message: 'Order session created successfully',
      session: {
        id: order.id,
        orderNumber: order.order_number,
        tableId: order.table_id,
        stage: 'starters',
        status: 'staged' // Return the staged status to frontend
      }
    };

    console.log('Sending response:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Create order session error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
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

// Add items to staged order
router.post('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { items, stage } = req.body;

    // First, get the current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Calculate totals for new items
    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const totalPrice = item.unit_price * item.quantity;
      subtotal += totalPrice;
      return {
        order_id: id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: totalPrice,
        special_instructions: JSON.stringify({
          stage,
          notes: item.notes
        })
      };
    });

    // Add new items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      return res.status(400).json({ error: itemsError.message });
    }

    // Update order totals and metadata
    const tax_amount = subtotal * 0.18;
    const total_amount = subtotal + tax_amount;
    const metadata = JSON.parse(order.special_instructions || '{}');
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        subtotal: order.subtotal + subtotal,
        tax_amount: order.tax_amount + tax_amount,
        total_amount: order.total_amount + total_amount,
        special_instructions: JSON.stringify({
          ...metadata,
          current_stage: stage,
          last_updated: new Date().toISOString()
        })
      })
      .eq('id', id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({
      message: 'Items added successfully',
      items: orderItems
    });
  } catch (error) {
    console.error('Add items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Finalize staged order
router.post('/:id/finalize', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    // First get the current order to check its status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Parse current metadata
    const currentMetadata = JSON.parse(currentOrder.special_instructions || '{}');

    // Update order with finalized status and payment info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        payment_method,
        special_instructions: JSON.stringify({
          ...currentMetadata,
          is_staged_order: true,
          is_finalized: true,
          finalized_at: new Date().toISOString()
        }),
        status: 'pending', // Change to pending so kitchen can see it
        status_text: 'finalized' // Keep track that this was a staged order
      })
      .eq('id', id)
      .select()
      .single();

    if (orderError) {
      return res.status(400).json({ error: orderError.message });
    }

    res.json({
      message: 'Order finalized successfully',
      order
    });
  } catch (error) {
    console.error('Finalize order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order stage (stored in special_instructions as metadata)
router.patch('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const validStages = ['starters', 'main_course', 'desserts', 'finalized'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    // Store stage info in special_instructions as JSON metadata
    const stageMetadata = JSON.stringify({ 
      current_stage: stage,
      is_staged_order: true,
      timestamp: new Date().toISOString()
    });

    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        special_instructions: stageMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Order stage updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove items from order (for editing previous stages)
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;

    // Verify order is not finalized by checking special_instructions metadata
    const { data: order } = await supabase
      .from('orders')
      .select('special_instructions')
      .eq('id', id)
      .single();

    let isFinalized = false;
    try {
      const metadata = JSON.parse(order?.special_instructions || '{}');
      isFinalized = metadata.is_finalized === true;
    } catch (e) {
      // If special_instructions is not JSON, assume not finalized
    }

    if (isFinalized) {
      return res.status(400).json({ error: 'Cannot modify finalized order' });
    }

    // Remove the item
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
      .eq('order_id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Recalculate totals
    const { data: allItems } = await supabase
      .from('order_items')
      .select('total_price')
      .eq('order_id', id);

    const subtotal = allItems?.reduce((sum, item) => sum + item.total_price, 0) || 0;
    const tax_amount = subtotal * 0.18;
    const total_amount = subtotal + tax_amount;

    // Update order totals
    await supabase
      .from('orders')
      .update({ 
        subtotal, 
        tax_amount, 
        total_amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order items by stage
router.get('/:id/items/:stage', async (req, res) => {
  try {
    const { id, stage } = req.params;

    // Get all items for the order
    const { data: allItems, error } = await supabase
      .from('order_items')
      .select(`
        *,
        menu_items (
          name,
          image_url,
          description
        )
      `)
      .eq('order_id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Filter items by stage from special_instructions metadata
    const stageItems = allItems?.filter(item => {
      try {
        const metadata = JSON.parse(item.special_instructions || '{}');
        return metadata.stage === stage;
      } catch (e) {
        return false;
      }
    }) || [];

    res.json(stageItems);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get staged order status
router.get('/:id/stages', async (req, res) => {
  try {
    const { id } = req.params;

    // Get order with all items
    const { data: order, error: orderError } = await supabase
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
        )
      `)
      .eq('id', id)
      .single();

    if (orderError) {
      return res.status(400).json({ error: orderError.message });
    }

    // Parse order stage metadata
    let orderMetadata: OrderMetadata = {};
    try {
      orderMetadata = JSON.parse(order.special_instructions || '{}') as OrderMetadata;
    } catch (e) {
      orderMetadata = {};
    }

    // Group items by stage
    const stageItems: StageItems = {
      starters: [],
      main_course: [],
      desserts: []
    };

    order.order_items?.forEach((item: OrderItem) => {
      try {
        const itemMetadata: ItemMetadata = JSON.parse(item.special_instructions || '{}') as ItemMetadata;
        const stage = itemMetadata.stage || 'starters';
        
        if (stage in stageItems) {
          const stageKey = stage as keyof StageItems;
          stageItems[stageKey].push({
            ...item,
            stage,
            notes: itemMetadata.notes
          });
        }
      } catch (e) {
        // Default to starters if parsing fails
        stageItems.starters.push({
          ...item,
          stage: 'starters',
          notes: item.special_instructions || undefined
        });
      }
    });

    res.json({
      order: {
        ...order,
        current_stage: orderMetadata.current_stage || 'starters',
        is_finalized: orderMetadata.is_finalized || false,
        is_staged_order: orderMetadata.is_staged_order || false
      },
      stageItems
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 