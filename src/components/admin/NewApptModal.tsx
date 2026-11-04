"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import { useState } from "react";

import { Button, DatePicker, Select, TimePicker } from "@/components/ui";
import { useToast } from "@/components/ui/ToastProvider";
import { createAppointmentAdmin } from "@/lib/api/appointments";
import { zonedWallClockMs } from "@/lib/timezone";

import type { Service } from "@/types";

interface FormData {
	clientName: string;
	clientSurname: string;
	clientEmail: string;
	clientPhone: string;
	serviceId: string;
	date: string;
	time: string;
	notes: string;
}

interface NewApptModalProps {
	readonly services: Service[];
	readonly defaultName?: string;
	readonly defaultEmail?: string;
	readonly selectedDate?: string; // pre-fill date from calendar click
	readonly onClose: () => void;
	readonly onCreated: () => void;
}

export function NewApptModal({
	services,
	defaultName = "",
	defaultEmail = "",
	selectedDate,
	onClose,
	onCreated,
}: NewApptModalProps) {
	const { success, error: toastError } = useToast();
	const [form, setForm] = useState<FormData>({
		clientName: defaultName,
		clientSurname: "",
		clientEmail: defaultEmail,
		clientPhone: "",
		serviceId: services[0]?.id ?? "",
		date: selectedDate ?? "",
		time: "",
		notes: "",
	});
	const [saving, setSaving] = useState(false);
	const selectedService = services.find((s) => s.id === form.serviceId);

	const endTime = (() => {
		if (!form.time || !selectedService) {
			return "--:--";
		}
		const [h, m] = form.time.split(":").map(Number);
		const end = new Date();
		end.setHours(h, m + (selectedService.duration || 60), 0);
		return end.toLocaleTimeString("es-AR", {
			hour: "2-digit",
			minute: "2-digit",
		});
	})();

	const handleSubmit = async () => {
		// Validate all required fields
		const missing: string[] = [];
		if (!form.clientName.trim()) {
			missing.push("nombre");
		}
		if (!form.clientSurname.trim()) {
			missing.push("apellido");
		}
		if (!form.clientPhone.trim()) {
			missing.push("teléfono");
		}
		if (!form.clientEmail.trim()) {
			missing.push("email");
		}
		if (!form.date) {
			missing.push("fecha");
		}
		if (!form.time) {
			missing.push("hora");
		}
		if (!form.serviceId) {
			missing.push("servicio");
		}

		if (missing.length > 0) {
			toastError(`Completá los campos obligatorios: ${missing.join(", ")}`);
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(form.clientEmail)) {
			toastError("Ingresá un email válido.");
			return;
		}

		// Validate phone format (at least 8 digits)
		const phoneDigits = form.clientPhone.replaceAll(/\D/g, "");
		if (phoneDigits.length < 8) {
			toastError("Ingresá un número de teléfono válido.");
			return;
		}

		// EROS-D1 (ADR-0002): the picker works in ART wall-clock, so the
		// submitted instant must be built with the canonical helper — never
		// `new Date(y, m-1, d, hh, mm)`, which resolves in the BROWSER's
		// local timezone and drifts for any client outside UTC-3.
		const apptDate = new Date(zonedWallClockMs(form.date, form.time));
		if (Number.isNaN(apptDate.getTime())) {
			toastError("Fecha u hora inválida.");
			return;
		}

		setSaving(true);
		const fullName = `${form.clientName.trim()} ${form.clientSurname.trim()}`.trim();
		try {
			const result = await createAppointmentAdmin({
				serviceId: form.serviceId,
				serviceName: selectedService?.title ?? "",
				serviceDuration: selectedService?.duration ?? 60,
				clientName: fullName,
				clientEmail: form.clientEmail.trim(),
				clientPhone: form.clientPhone.trim(),
				appointmentDate: apptDate,
				notes: form.notes || undefined,
			});
			if (result.ok) {
				success("Turno creado. Confirmación enviada al cliente.");
				onCreated();
				onClose();
			} else {
				toastError(result.error.message ?? "Error al crear el turno.");
			}
		} catch (err) {
			toastError((err as Error)?.message || "Error al crear el turno.");
		}
		setSaving(false);
	};

	return (
		<>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="fixed inset-0 bg-black/30 z-[60]"
			/>
			<motion.div
				initial={{ opacity: 0, scale: 0.96 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.96 }}
				className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white/85 backdrop-blur-2xl rounded-xl z-[70] border border-white/60 overflow-hidden"
			>
				<div className="p-4 border-b border-[rgba(15,15,20,0.08)] flex items-center justify-between">
					<h3 className="font-medium text-gray-900">Nuevo Turno</h3>
					<button
						onClick={onClose}
						aria-label="Cerrar"
						className="p-1.5 hover:bg-gray-100 rounded-lg"
					>
						<X size={16} className="text-gray-500" />
					</button>
				</div>
				<div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label
								htmlFor="appt-name"
								className="text-xs font-medium text-gray-600 block mb-1.5"
							>
								Nombre *
							</label>
							<input
								id="appt-name"
								type="text"
								value={form.clientName}
								onChange={(e) =>
									setForm((f) => ({ ...f, clientName: e.target.value }))
								}
								className="w-full px-3 py-2 text-sm border border-[rgba(15,15,20,0.12)] rounded-xl bg-white/60 focus:outline-none focus:border-[rgba(15,15,20,0.35)] transition-colors"
								placeholder="Juan"
							/>
						</div>
						<div>
							<label
								htmlFor="appt-surname"
								className="text-xs font-medium text-gray-600 block mb-1.5"
							>
								Apellido *
							</label>
							<input
								id="appt-surname"
								type="text"
								value={form.clientSurname}
								onChange={(e) =>
									setForm((f) => ({ ...f, clientSurname: e.target.value }))
								}
								className="w-full px-3 py-2 text-sm border border-[rgba(15,15,20,0.12)] rounded-xl bg-white/60 focus:outline-none focus:border-[rgba(15,15,20,0.35)] transition-colors"
								placeholder="Pérez"
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label
								htmlFor="appt-phone"
								className="text-xs font-medium text-gray-600 block mb-1.5"
							>
								Teléfono *
							</label>
							<input
								id="appt-phone"
								type="tel"
								value={form.clientPhone}
								onChange={(e) =>
									setForm((f) => ({ ...f, clientPhone: e.target.value }))
								}
								className="w-full px-3 py-2 text-sm border border-[rgba(15,15,20,0.12)] rounded-xl bg-white/60 focus:outline-none focus:border-[rgba(15,15,20,0.35)] transition-colors"
								placeholder="+54 11..."
							/>
						</div>
						<div>
							<label
								htmlFor="appt-email"
								className="text-xs font-medium text-gray-600 block mb-1.5"
							>
								Email *
							</label>
							<input
								id="appt-email"
								type="email"
								value={form.clientEmail}
								onChange={(e) =>
									setForm((f) => ({ ...f, clientEmail: e.target.value }))
								}
								className="w-full px-3 py-2 text-sm border border-[rgba(15,15,20,0.12)] rounded-xl bg-white/60 focus:outline-none focus:border-[rgba(15,15,20,0.35)] transition-colors"
								placeholder="juan@email.com"
							/>
						</div>
					</div>

					{/* Service */}
					<div>
						<Select
							id="appt-service"
							label="Servicio *"
							value={form.serviceId}
							onChange={(value) => setForm((f) => ({ ...f, serviceId: value }))}
							options={services.map((s) => ({
								value: s.id,
								label: `${s.title} (${s.duration} min)`,
							}))}
							placeholder="Seleccionar servicio..."
						/>
					</div>

					{/* Date & time */}
					<div className="grid grid-cols-2 gap-3">
						<DatePicker
							id="appt-date"
							label="Fecha *"
							value={form.date}
							onChange={(value) => setForm((f) => ({ ...f, date: value }))}
							min={new Date().toISOString().split("T")[0]}
						/>
						<TimePicker
							label="Hora *"
							value={form.time}
							onChange={(value) => setForm((f) => ({ ...f, time: value }))}
						/>
					</div>

					{/* Duration hint */}
					{selectedService && form.time && (
						<p className="text-xs text-gray-500 flex items-center gap-1">
							<Clock size={12} /> Termina a las {endTime}
						</p>
					)}

					{/* Notes */}
					<div>
						<label
							htmlFor="appt-notes"
							className="text-[10px] font-bold uppercase tracking-wider text-black/40 block mb-1.5"
						>
							Notas
						</label>
						<textarea
							id="appt-notes"
							rows={2}
							value={form.notes}
							onChange={(e) =>
								setForm((f) => ({ ...f, notes: e.target.value }))
							}
							className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-xl focus:outline-none focus:border-black resize-none"
						/>
					</div>
				</div>
				<div className="p-4 md:p-6 border-t border-[rgba(15,15,20,0.08)] flex gap-3">
					<button
						onClick={onClose}
						className="btn-outline flex-1 py-3 text-sm min-h-0"
					>
						Cancelar
					</button>
					<Button
						onClick={handleSubmit}
						disabled={saving}
						className="btn-primary flex-1 h-12 text-sm min-h-0"
					>
						{saving ? "Guardando..." : "Crear Turno"}
					</Button>
				</div>
			</motion.div>
		</>
	);
}