'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { Save } from 'lucide-react';
import { getAdminSettings, updateAdminSettings } from '@/lib/api/settings';
import { useToast } from '@/components/ui/ToastProvider';

export default function BankConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    bankOwner: '',
    bankName: '',
    cbu: '',
    alias: '',
  });

  useEffect(() => {
    async function loadSettings() {
      const settings = await getAdminSettings();
      if (settings) {
        setFormData({
          bankOwner: settings.bankDetails.bankOwner || '',
          bankName: settings.bankDetails.bankName || '',
          cbu: settings.bankDetails.cbu || '',
          alias: settings.bankDetails.alias || '',
        });
      }
      setIsLoading(false);
    }
    loadSettings();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Server action
    const result = await updateAdminSettings({
      bankOwner: formData.bankOwner.trim(),
      bankName: formData.bankName.trim(),
      bankCbu: formData.cbu.trim(),
      bankAlias: formData.alias.trim(),
    });

    setIsSaving(false);

    if (result.success) {
      success('Datos bancarios guardados con éxito');
    } else {
      error(result.error || 'Error al guardar los datos');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-black/5 rounded w-1/4"></div>
        <div className="h-32 bg-black/5 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-black/5 shadow-sm overflow-hidden">
      <h2 className="text-xl font-medium tracking-tight mb-1">Datos de Transferencia</h2>
      <p className="text-xs sm:text-sm text-black/50 mb-8">
        Configurá la cuenta bancaria donde los clientes depositarán para confirmar sus turnos.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="bankOwner">Titular de la cuenta</Label>
          <Input 
            id="bankOwner"
            value={formData.bankOwner}
            onChange={(e) => handleChange('bankOwner', e.target.value)}
            placeholder="Ej: Jacqueline Pérez"
            required
            className="bg-gray-50/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bankName">Nombre del Banco o Entidad</Label>
          <Input 
            id="bankName"
            value={formData.bankName}
            onChange={(e) => handleChange('bankName', e.target.value)}
            placeholder="Ej: Banco Nación / MercadoPago"
            required
            className="bg-gray-50/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cbu">CBU o CVU</Label>
          <Input 
            id="cbu"
            value={formData.cbu}
            onChange={(e) => handleChange('cbu', e.target.value)}
            placeholder="Los 22 dígitos"
            required
            className="bg-gray-50/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="alias">Alias</Label>
          <Input 
            id="alias"
            value={formData.alias}
            onChange={(e) => handleChange('alias', e.target.value)}
            placeholder="tu.alias.mp"
            required
            className="bg-gray-50/50"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSaving} className="w-full sm:w-auto gap-2 rounded-xl h-10 px-6 text-sm">
            <Save size={18} />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
