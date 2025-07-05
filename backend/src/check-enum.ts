import { supabase } from './lib/supabase';

async function checkEnum() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .limit(1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    // Query to check enum values
    const { data: enumData, error: enumError } = await supabase
      .rpc('get_enum_values', { enum_name: 'order_status' });

    if (enumError) {
      console.error('Error getting enum values:', enumError);
      return;
    }

    console.log('Current order_status enum values:', enumData);
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkEnum(); 