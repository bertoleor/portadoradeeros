'use server';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';

export interface BlockedTime {
  id: string;
  title: string;
  description?: string;
  date: string;
  time_start?: string;
  time_end?: string;
  is_all_day: boolean | null;
  type: 'blocked' | 'occupied' | 'event';
  color: string;
}

export async function getBlockedTimes(): Promise<BlockedTime[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching blocked times:', error.message);
    return [];
  }

  return (data || []) as BlockedTime[];
}

export async function getBlockedTimesByMonth(year: number, month: number): Promise<BlockedTime[]> {
  const supabase = await createClient();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching blocked times:', error.message);
    return [];
  }

  return (data || []) as BlockedTime[];
}

export async function createBlockedTime(data: Omit<BlockedTime, 'id'>): Promise<BlockedTime> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: newRow, error } = await supabase
    .from('blocked_times')
    .insert([data])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create blocked time: ${error.message}`);
  }

  return newRow as BlockedTime;
}

export async function updateBlockedTime(
  id: string,
  updates: Partial<BlockedTime>
): Promise<BlockedTime> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: updatedRow, error } = await supabase
    .from('blocked_times')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update blocked time: ${error.message}`);
  }

  return updatedRow as BlockedTime;
}

export async function deleteBlockedTime(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from('blocked_times').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete blocked time: ${error.message}`);
  }
}
