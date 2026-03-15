'use server';

import { createClient } from '@/lib/supabase/server';
import { Service } from '@/types';

/**
 * Helper to map DB snake_case columns to frontend camelCase properties
 */
function mapDBToService(dbRow: Record<string, unknown>): Service {
  return {
    id: dbRow.id as string,
    slug: dbRow.slug as string,
    title: dbRow.title as string,
    shortDescription: dbRow.short_description as string,
    description: (dbRow.description as string) || '',
    price: dbRow.price as number,
    duration: dbRow.duration as number,
    isVisible: dbRow.is_visible as boolean,
    icon: dbRow.icon as string,
    images: (dbRow.images as string[]) || [],
  };
}

/**
 * FETCH ALL SERVICES
 * Retrieves all services from Supabase.
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

  return (data || []).map(mapDBToService);
}

/**
 * FETCH SINGLE SERVICE BY SLUG
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error(`Error fetching service ${slug}:`, error?.message);
    return null;
  }

  return mapDBToService(data);
}

/**
 * CREATE SERVICE
 */
export async function createService(data: Omit<Service, 'id'>): Promise<Service> {
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

  return mapDBToService(newRow);
}

/**
 * UPDATE SERVICE
 */
export async function updateService(id: string, updates: Partial<Service>): Promise<Service> {
  const supabase = await createClient();

  const dbPayload: Record<string, unknown> = {};
  if (updates.slug !== undefined) dbPayload.slug = updates.slug;
  if (updates.title !== undefined) dbPayload.title = updates.title;
  if (updates.shortDescription !== undefined) dbPayload.short_description = updates.shortDescription;
  if (updates.description !== undefined) dbPayload.description = updates.description;
  if (updates.price !== undefined) dbPayload.price = updates.price;
  if (updates.duration !== undefined) dbPayload.duration = updates.duration;
  if (updates.isVisible !== undefined) dbPayload.is_visible = updates.isVisible;
  if (updates.icon !== undefined) dbPayload.icon = updates.icon;
  if (updates.images !== undefined) dbPayload.images = updates.images;

  const { data: updatedRow, error } = await supabase
    .from('services')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update service: ${error.message}`);
  }

  return mapDBToService(updatedRow);
}

/**
 * DELETE SERVICE
 */
export async function deleteService(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete service: ${error.message}`);
  }
}
