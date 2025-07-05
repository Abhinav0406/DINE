import { supabase } from './lib/supabase';

async function testStagedOrder() {
  try {
    console.log('1. Getting available table...');
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'available')
      .limit(1);

    if (tableError || !tables || tables.length === 0) {
      console.error('Error getting table:', tableError || 'No available tables');
      return;
    }

    const table = tables[0];
    console.log('Found table:', table);

    console.log('\n2. Creating staged order...');
    const response = await fetch('http://localhost:4000/api/orders/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table_id: table.id
      }),
    });

    const data = await response.json();
    console.log('Response:', data);

    if (!response.ok) {
      throw new Error(`Failed to create staged order: ${JSON.stringify(data)}`);
    }

    console.log('\n3. Verifying order in database...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', data.session.id)
      .single();

    if (orderError) {
      console.error('Error verifying order:', orderError);
      return;
    }

    console.log('Order in database:', order);
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testStagedOrder(); 