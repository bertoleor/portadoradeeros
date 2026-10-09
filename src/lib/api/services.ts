'use server';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';

import { mapServiceRow } from '@/lib/api/mappers';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createReadClient } from '@/lib/supabase/readonly';
import { createClient } from '@/lib/supabase/server';

import type { Service } from '@/types';

const SERVICES_CACHE_TAG = 'public-services';

const fetchVisibleServices = unstable_cache(
  async (): Promise<Service[]> => {
    // Cookie-free anon read (RLS is_visible = true) — role-independent, so a
    // shared cache key is safe: it can never leak hidden services because RLS
    // already filters to visible ones for the anon role.
    const supabase = createReadClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching visible services:', error.message);
      return [];
    }

    return (data || []).map(mapServiceRow);
  },
  ['public-services'],
  { tags: [SERVICES_CACHE_TAG], revalidate: 300 }
);

/**
 * FETCH VISIBLE SERVICES (public/cacheable)
 *
 * Returns only `is_visible = true` services for anonymous visitors. Uses the
 * cookie-free anon read client so it can be safely cached under one key —
 * RLS guarantees the result is always the public view.
 */
export async function getVisibleServices(): Promise<Service[]> {
  return fetchVisibleServices();
}

/**
 * FETCH ALL SERVICES (admin, RLS-dependent — NOT cached)
 *
 * Uses the cookie-aware server client so RLS resolves the admin view: an
 * authenticated admin sees every service (hidden ones included), which the
 * admin calendar and service editor need. This function is intentionally NOT
 * wrapped in `unstable_cache`: a shared cache key would collapse the two
 * authorization views into one stale result. Stale admin data is instead
 * cleared by revalidatePath/revalidateTag on mutation.
 */
export async function getServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error.message);
    return [];
  }

  return (data || []).map(mapServiceRow);
}

/**
 * FETCH SINGLE SERVICE BY SLUG
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('services').select('*').eq('slug', slug).single();

  if (error || !data) {
    console.error(`Error fetching service ${slug}:`, error?.message);
    return null;
  }

  return mapServiceRow(data);
}

/**
 * CREATE SERVICE
 */
export async function createService(data: Omit<Service, 'id'>): Promise<Service> {
  await requireAdmin();

  const supabase = await createClient();

  // Transform camelCase keys to backend snake_case
  const dbPayload = {
    slug: data.slug,
    title: data.title,
    short_description: data.shortDescription,
    description: data.description,
    price: data.price,
    duration: data.duration,
    is_visible: data.isVisible,
    icon: data.icon,
    images: data.images || [],
  };

  const { data: newRow, error } = await supabase
    .from('services')
    .insert([dbPayload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create service: ${error.message}`);
  }

  revalidateTag(SERVICES_CACHE_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
  return mapServiceRow(newRow);
}

/**
 * UPDATE SERVICE
 */
export async function updateService(id: string, updates: Partial<Service>): Promise<Service> {
  await requireAdmin();

  const supabase = await createClient();

  const dbPayload: Record<string, unknown> = {};
  if (updates.slug !== undefined) {
    dbPayload.slug = updates.slug;
  }
  if (updates.title !== undefined) {
    dbPayload.title = updates.title;
  }
  if (updates.shortDescription !== undefined) {
    dbPayload.short_description = updates.shortDescription;
  }
  if (updates.description !== undefined) {
    dbPayload.description = updates.description;
  }
  if (updates.price !== undefined) {
    dbPayload.price = updates.price;
  }
  if (updates.duration !== undefined) {
    dbPayload.duration = updates.duration;
  }
  if (updates.isVisible !== undefined) {
    dbPayload.is_visible = updates.isVisible;
  }
  if (updates.icon !== undefined) {
    dbPayload.icon = updates.icon;
  }
  if (updates.images !== undefined) {
    dbPayload.images = updates.images;
  }

  const { data: updatedRow, error } = await supabase
    .from('services')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update service: ${error.message}`);
  }

  revalidateTag(SERVICES_CACHE_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
  return mapServiceRow(updatedRow);
}

/**
 * DELETE SERVICE
 */
export async function deleteService(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete service: ${error.message}`);
  }

  revalidateTag(SERVICES_CACHE_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
}
