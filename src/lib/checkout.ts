import { supabase } from './supabase';
import { BANGLADESH_DIVISIONS } from '../data/bangladeshLocations';

export async function getDeliveryHierarchy() {
  try {
    const { data: divisions } = await supabase.from('divisions').select('*');
    const { data: districts } = await supabase.from('districts').select('*');
    const { data: thanas } = await supabase.from('thanas').select('*');
    const { data: zones } = await supabase.from('delivery_zones').select('*');

    if (divisions && divisions.length > 0 && districts && districts.length > 0 && thanas && thanas.length > 0) {
      return { divisions, districts, thanas, zones: zones || [] };
    }
  } catch (err) {
    console.warn('Database hierarchy fallback used:', err);
  }

  // Robust Bangladesh fallback from complete dataset
  const fallbackDivisions: any[] = [];
  const fallbackDistricts: any[] = [];
  const fallbackThanas: any[] = [];

  BANGLADESH_DIVISIONS.forEach((div) => {
    fallbackDivisions.push({ id: div.id, name: div.name });
    div.districts.forEach((dist) => {
      fallbackDistricts.push({ id: dist.id, divisionId: div.id, name: dist.name });
      dist.thanas.forEach((th) => {
        fallbackThanas.push({ id: th.id, districtId: dist.id, name: th.name });
      });
    });
  });

  return {
    divisions: fallbackDivisions,
    districts: fallbackDistricts,
    thanas: fallbackThanas,
    zones: [
      { id: 'zone-1', name: 'Inside Dhaka', fee: 70 },
      { id: 'zone-2', name: 'Outside Dhaka', fee: 130 }
    ]
  };
}

export async function placeOrder(orderData: any) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select('id, order_number')
    .single();

  if (error) throw error;
  return data;
}
