import { supabase } from './supabase';

// In-memory cache to prevent redundant customer lookups
const customerIdCache = new Map<string, string>();

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Ensures a customer record exists in the 'customers' table and returns its valid UUID primary key.
 */
export async function ensureCustomerRecord(
  userId: string,
  email?: string | null,
  fullName?: string | null,
  phone?: string | null
): Promise<string> {
  if (!userId) return '';

  if (customerIdCache.has(userId)) {
    return customerIdCache.get(userId)!;
  }

  const isUserUuid = isUUID(userId);

  try {
    // 1. Try finding by ID if userId is a valid UUID
    if (isUserUuid) {
      const { data: customerById } = await supabase
        .from('customers')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (customerById?.id) {
        customerIdCache.set(userId, customerById.id);
        return customerById.id;
      }
    }

    // 2. Try finding by firebase_uid (which stores string UIDs like Firebase Auth IDs)
    const { data: customerByUid } = await supabase
      .from('customers')
      .select('id')
      .eq('firebase_uid', userId)
      .maybeSingle();

    if (customerByUid?.id) {
      customerIdCache.set(userId, customerByUid.id);
      return customerByUid.id;
    }

    // 3. Try finding by email
    if (email) {
      const { data: customerByEmail } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (customerByEmail?.id) {
        customerIdCache.set(userId, customerByEmail.id);
        return customerByEmail.id;
      }
    }

    // 4. Create customer record
    const displayName = fullName || (email ? email.split('@')[0] : 'Valued Customer');
    const customerEmail = email || `user_${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}@customer.store`;

    const insertPayload: any = {
      firebase_uid: userId,
      full_name: displayName,
      email: customerEmail,
      phone: phone || null,
    };

    // Only supply 'id' if it's already a valid UUID, otherwise Postgres defaultRandom() will generate one
    if (isUserUuid) {
      insertPayload.id = userId;
    }

    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert(insertPayload)
      .select('id')
      .maybeSingle();

    if (newCustomer?.id) {
      customerIdCache.set(userId, newCustomer.id);
      return newCustomer.id;
    }

    if (insertError) {
      console.warn('Customer record creation notice:', insertError.message);
    }

    // Fallback query in case insert completed or conflicted
    const { data: fallbackCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('firebase_uid', userId)
      .maybeSingle();

    if (fallbackCustomer?.id) {
      customerIdCache.set(userId, fallbackCustomer.id);
      return fallbackCustomer.id;
    }

    return userId;
  } catch (err) {
    console.warn('ensureCustomerRecord fallback:', err);
    return userId;
  }
}
