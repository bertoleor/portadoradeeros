'use client';

import { useEffect } from 'react';

const handleUpdatefound = (registration: ServiceWorkerRegistration) => {
  const newWorker = registration.installing;
  if (!newWorker) return;

  const onStateChange = () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      console.log('PWA: New version available');
    }
  };

  newWorker.addEventListener('statechange', onStateChange);
};

const registerSW = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    // Limpiar SWs con scope incorrecto (versiones anteriores)
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      if (reg.scope !== `${location.origin}/admin/`) {
        console.log('PWA: removing old SW with scope:', reg.scope);
        await reg.unregister();
      }
    }

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/admin/',
    });
    console.log('PWA: Service Worker registered with scope /admin/');
    registration.addEventListener('updatefound', () => handleUpdatefound(registration));
  } catch (error) {
    console.warn('PWA: registration failed:', error);
  }
};

export function PWAHandler() {
  useEffect(() => {
    if (globalThis.window === undefined) return;

    if (document.readyState === 'complete') {
      void registerSW();
    } else {
      globalThis.window.addEventListener('load', () => void registerSW());
    }
  }, []);

  return null;
}
