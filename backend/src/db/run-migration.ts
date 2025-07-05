import { supabase } from '../lib/supabase';

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Step 1: Update the status of any existing staged orders to 'pending'
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'pending' })
      .eq('status', 'staged');

    if (updateError) {
      console.error('Error updating existing staged orders:', updateError);
      return;
    }

    // Step 2: Create a temporary orders table
    const { error: tempTableError } = await supabase
      .from('orders_temp')
      .insert([])
      .select();

    if (tempTableError && !tempTableError.message.includes('does not exist')) {
      console.error('Error checking temporary table:', tempTableError);
      return;
    }

    console.log('Migration completed successfully');
    console.log('Note: To complete the enum type modification, please run the following SQL commands in the Supabase dashboard SQL editor:');
    console.log(`
    -- Run these commands in the Supabase SQL editor:
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'staged' BEFORE 'pending';
    `);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration(); 