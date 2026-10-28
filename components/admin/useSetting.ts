'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useToast } from './ui';

/** Loads one settings group and saves it back. */
export function useSetting<T>(key: string) {
  const toast = useToast();
  const [value, setValue] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api<T>('GET', `/api/admin/settings/${key}`).then(setValue).catch((e) => toast(e.message, 'err'));
  }, [key, toast]);
  const save = async (v: T | null = value) => {
    setSaving(true);
    try {
      setValue(await api<T>('PUT', `/api/admin/settings/${key}`, v));
      toast('Saved. The menu is updated.');
      return true;
    } catch (e) {
      toast((e as Error).message, 'err');
      return false;
    } finally {
      setSaving(false);
    }
  };
  return { value, setValue, save, saving };
}
