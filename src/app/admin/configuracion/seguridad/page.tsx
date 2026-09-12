'use client';

import { Save, ShieldAlert, Mail, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';
import { createClient } from '@/lib/supabase/client';

export default function SeguridadConfiguracion() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();
  const supabase = createClient();

  const [seguridad, setSeguridad] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSeguridad(prev => ({ ...prev, email: session.user.email || '' }));
      }
      setIsLoading(false);
    }
    void getSession();
  }, [supabase.auth]);

  const handleSave = async () => {
    // Basic validation
    if (seguridad.newPassword && seguridad.newPassword !== seguridad.confirmPassword) {
      error('Las contraseñas no coinciden.');
      return;
    }
    
    if (seguridad.newPassword && seguridad.newPassword.length < 6) {
      error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    if (!seguridad.currentPassword) {
      error('Debes ingresar tu contraseña actual para confirmar los cambios.');
      return;
    }
    
    setIsSaving(true);
    
    // 1. Re-authenticate or check current password before updating sensitive data
    const { data: userData } = await supabase.auth.getUser();
    const oldEmail = userData.user?.email;
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: oldEmail || seguridad.email,
      password: seguridad.currentPassword,
    });

    if (signInError) {
      setIsSaving(false);
      error('Contraseña actual incorrecta.');
      return;
    }

    // 2. Prepare updates
    const updates: { email?: string; password?: string } = {};
    if (seguridad.email && seguridad.email !== oldEmail) updates.email = seguridad.email;
    if (seguridad.newPassword) updates.password = seguridad.newPassword;

    if (Object.keys(updates).length === 0) {
      setIsSaving(false);
      success('No se detectaron cambios.');
      return;
    }

    // 3. Update User
    const { error: updateError } = await supabase.auth.updateUser(updates);

    setIsSaving(false);
    
    if (updateError) {
      console.error('Error updating security settings:', updateError);
      error(`Hubo un error: ${updateError.message}`);
    } else {
      success('Datos de seguridad actualizados correctamente.');
      if (updates.email) {
        success('Se ha enviado un correo de confirmación a tu nueva dirección.');
      }
      setSeguridad(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    }
  };

  const updateField = (field: keyof typeof seguridad, value: string) => {
    setSeguridad(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-medium text-black text-center sm:text-left">Seguridad y Correo</h2>
          <p className="text-black/50 text-xs sm:text-sm mt-1 text-center sm:text-left">
            Cambia tu correo de acceso y/o tu contraseña.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading || !seguridad.currentPassword}
          className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 w-full sm:w-auto"
        >
          {isSaving ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <><Save size={16} /> Guardar Cambios</>
          )}
        </button>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-900 rounded-xl mb-8 border border-amber-100">
        <ShieldAlert size={20} className="shrink-0 mt-0.5 text-amber-600" />
        <p className="text-xs sm:text-sm leading-relaxed">
          <b>Atención:</b> Por seguridad, debés ingresar tu contraseña actual para realizar cualquier cambio de acceso. Si cambiás el correo, deberás confirmarlo antes de volver a ingresar.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-black/20 border-t-black animate-spin" />
        </div>
      ) : (
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-6 md:p-8" onSubmit={(e) => e.preventDefault()}>
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-black/5 pb-2">
              <Mail size={14} /> Acceso (Email)
            </h3>
            <div className="max-w-md">
              <label htmlFor="email" className="block text-[10px] font-bold text-black/40 mb-2 uppercase tracking-widest">Correo Electrónico de Admin</label>
              <Input 
                id="email"
                type="email"
                value={seguridad.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="bg-gray-50/50 h-10 text-sm"
                placeholder="admin@email.com"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-6 pt-4">
            <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-black/5 pb-2">
              <Lock size={14} /> Cambio de Contraseña
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="newPassword" className="block text-[10px] font-bold text-black/40 mb-2 uppercase tracking-widest">Nueva Contraseña</label>
                <Input 
                  id="newPassword"
                  type="password"
                  value={seguridad.newPassword}
                  onChange={(e) => updateField('newPassword', e.target.value)}
                  placeholder="••••••••"
                  className="bg-gray-50/50 h-10 text-sm tracking-widest placeholder:tracking-normal"
                />
                <p className="mt-2 text-[10px] text-black/30 font-medium italic">Dejá en blanco si no querés cambiarla.</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] font-bold text-black/40 mb-2 uppercase tracking-widest">Confirmar Nueva Contraseña</label>
                <Input 
                  id="confirmPassword"
                  type="password"
                  value={seguridad.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="bg-gray-50/50 h-10 text-sm tracking-widest placeholder:tracking-normal"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 pt-6 border-t border-black/5">
            <div className="max-w-md">
              <label htmlFor="currentPassword" className="block text-[10px] font-bold text-black/60 mb-2 uppercase tracking-widest">Contraseña Actual <span className="text-red-500">*</span></label>
              <Input 
                id="currentPassword"
                type="password"
                value={seguridad.currentPassword}
                onChange={(e) => updateField('currentPassword', e.target.value)}
                className="border-black/20 focus:border-black h-10 text-sm tracking-widest"
                required
                placeholder="Necesaria para cualquier cambio"
              />
              <p className="mt-2 text-[10px] text-red-500/60 font-medium italic">Campo requerido para validar los cambios.</p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
