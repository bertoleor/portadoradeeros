"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Ban,
	Calendar as CalendarIcon,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	Edit,
	MessageSquare,
	Plus,
	Trash2,
	User,
	X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button, DatePicker, Select, TimePicker } from "@/components/ui";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FocusTrap } from "@/components/ui/FocusTrap";
import { useToast } from "@/components/ui/ToastProvider";
import {
	cancelAppointment,
	completeAppointment,
	confirmAppointment,
	createAppointmentAdmin,
	deleteAppointment,
	getAppointments,
} from "@/lib/api/appointments";
import {
	createBlockedTime,
	deleteBlockedTime,
	getBlockedTimes,
	updateBlockedTime,
	type BlockedTime,
} from "@/lib/api/blocked-times";
import { getServices } from "@/lib/api/services";
import { createClient } from "@/lib/supabase/client";

import { NewApptModal } from "@/components/admin/NewApptModal";

import type { Service } from "@/types";

interface Appointment {
	id: string;
	client_name: string;
	client_email: string;
	appointment_date: string;
	status: string;
	notes: string | null;
	services: { title: string; duration?: number } | null;
}

type ViewMode = "month" | "week" | "day";

// ── Block Time Modal ─────────────────────────────────────────────────────────────
interface BlockModalProps {
	readonly selectedDate?: string;
	readonly editingBlock?: BlockedTime | null;
	readonly onClose: () => void;
	readonly onCreated: () => void;
}

function BlockModal({
	selectedDate,
	editingBlock,
	onClose,
	onCreated,
}: BlockModalProps) {
	const { success, error: toastError } = useToast();
	const isEditing = !!editingBlock;

	// Initialize form with existing data if editing, otherwise defaults
	const [form, setForm] = useState({
		title: editingBlock?.title ?? "",
		date: editingBlock?.date ?? selectedDate ?? "",
		timeStart: editingBlock?.time_start ?? "",
		timeEnd: editingBlock?.time_end ?? "",
		isAllDay: editingBlock?.is_all_day ?? true,
		type: (editingBlock?.type as "blocked" | "occupied" | "event") ?? "blocked",
	});
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		if (!form.title || !form.date) {
			toastError("Completá el título y la fecha");
			return;
		}

		const getBlockColor = () => {
			if (form.type === "blocked") {
				return "#ef4444";
			}
			if (form.type === "occupied") {
				return "#f59e0b";
			}
			return "#3b82f6";
		};

		setSaving(true);
		try {
			if (isEditing && editingBlock) {
				// Update existing blocked time
				await updateBlockedTime(editingBlock.id, {
					title: form.title,
					date: form.date,
					time_start: form.isAllDay ? undefined : form.timeStart || undefined,
					time_end: form.isAllDay ? undefined : form.timeEnd || undefined,
					is_all_day: form.isAllDay,
					type: form.type,
					color: getBlockColor(),
				});
				success("Bloqueo actualizado correctamente");
			} else {
				// Create new blocked time
				await createBlockedTime({
					title: form.title,
					date: form.date,
					time_start: form.isAllDay ? undefined : form.timeStart || undefined,
					time_end: form.isAllDay ? undefined : form.timeEnd || undefined,
					is_all_day: form.isAllDay,
					type: form.type,
					color: getBlockColor(),
				});
				success("Bloqueo creado correctamente");
			}
			onCreated();
			onClose();
		} catch {
			toastError(isEditing ? "Error al actualizar el bloqueo" : "Error al crear el bloqueo");
		} finally {
			setSaving(false);
		}
	};

	const titleRef = React.useRef<HTMLHeadingElement | null>(null);
	const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
	const firstInputRef = React.useRef<HTMLInputElement | null>(null);
	const triggerRef = React.useRef<HTMLButtonElement | null>(null);

	return (
		<FocusTrap
			isActive={true}
			onEscape={onClose}
			autoFocus={true}
			initialFocusRef={firstInputRef}
			returnFocusRef={triggerRef}
		>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="fixed inset-0 bg-black/30 z-[60]"
				role="presentation"
			/>
			<motion.div
				initial={{ opacity: 0, scale: 0.96 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.96 }}
				className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white/85 backdrop-blur-2xl rounded-3xl z-[70] border border-white/60 overflow-hidden"
			>
				<div className="p-4 border-b border-[rgba(15,15,20,0.08)] flex items-center justify-between">
					<h3
						ref={titleRef}
						className="font-medium text-gray-900"
					>
						{isEditing ? "Editar Bloqueo" : "Bloquear Fecha"}
					</h3>
					<button
						ref={closeButtonRef}
						onClick={onClose}
						aria-label="Cerrar"
						className="p-1.5 hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2"
					>
						<X size={16} className="text-gray-500" aria-hidden="true" />
					</button>
				</div>
				<div className="p-4 space-y-3">
					<div>
						<label
							htmlFor="block-title"
							className="text-xs font-medium text-gray-600 block mb-1.5"
						>
							Titulo *
						</label>
						<input
							id="block-title"
							type="text"
							value={form.title}
							onChange={(e) =>
								setForm((f) => ({ ...f, title: e.target.value }))
							}
							className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
							placeholder="Ej: No atiendo, Turno reservado, etc."
						/>
					</div>
					<div>
						<Select
							id="block-type"
							label="Tipo"
							value={form.type}
							onChange={(value) =>
								setForm((f) => ({
									...f,
									type: value as "blocked" | "occupied" | "event",
								}))
							}
							options={[
								{ value: "blocked", label: "Bloqueo (no atiendo)" },
								{ value: "occupied", label: "Ocupado (reservado)" },
								{ value: "event", label: "Evento personal" },
							]}
							placeholder="Seleccionar tipo..."
						/>
					</div>
					<div>
						<DatePicker
							id="block-date"
							label="Fecha *"
							value={form.date}
							onChange={(value) => setForm((f) => ({ ...f, date: value }))}
						/>
					</div>
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="allDay"
							checked={form.isAllDay}
							onChange={(e) =>
								setForm((f) => ({ ...f, isAllDay: e.target.checked }))
							}
							className="rounded border-gray-200"
						/>
						<label htmlFor="allDay" className="text-sm text-gray-600">
							Todo el dia
						</label>
					</div>
					{!form.isAllDay && (
						<div className="grid grid-cols-2 gap-3">
							<TimePicker
								label="Hora inicio"
								value={form.timeStart}
								onChange={(value) =>
									setForm((f) => ({ ...f, timeStart: value }))
								}
							/>
							<TimePicker
								label="Hora fin"
								value={form.timeEnd}
								onChange={(value) => setForm((f) => ({ ...f, timeEnd: value }))}
							/>
						</div>
					)}
				</div>
				<div className="p-6 border-t border-[rgba(15,15,20,0.08)] flex gap-3">
					<button
						onClick={onClose}
						className="btn-outline flex-1 py-3 text-sm min-h-0"
					>
						Cancelar
					</button>
					<Button
						onClick={handleSubmit}
						disabled={saving}
						className={isEditing
							? "flex-1 bg-blue-500/20 border border-blue-300/40 text-blue-700 rounded-full h-12 text-sm hover:bg-blue-500/30 transition-all"
							: "flex-1 bg-red-500/20 border border-red-300/40 text-red-600 rounded-full h-12 text-sm hover:bg-red-500/30 transition-all"}
					>
						{saving ? "Guardando..." : isEditing ? "Actualizar" : "Bloquear"}
					</Button>
				</div>
			</motion.div>
		</FocusTrap>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminCalendario() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [viewMode, setViewMode] = useState<ViewMode>("month");
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
	const [services, setServices] = useState<Service[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedDay, setSelectedDay] = useState<number | null>(null);
	const [selectedAppointment, setSelectedAppointment] =
		useState<Appointment | null>(null);
	const [showNewAppt, setShowNewAppt] = useState(false);
	const [showBlockModal, setShowBlockModal] = useState(false);
	const [selectedDateForBlock, setSelectedDateForBlock] = useState<
		string | null
	>(null);
	const [editingBlock, setEditingBlock] = useState<BlockedTime | null>(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const { success, error: toastError } = useToast();

	const loadData = async (isMounted = true) => {
		const [data, blocked, svc] = await Promise.all([
			getAppointments(),
			getBlockedTimes(),
			getServices(),
		]);
		if (!isMounted) {
			return;
		}
		setAppointments(data || []);
		setBlockedTimes(blocked || []);
		setServices(svc.filter((sv) => sv.isVisible));
		setIsLoading(false);
	};

	useEffect(() => {
		let mounted = true;

		const initData = async () => {
			await loadData(mounted);
		};

		void initData();

		// ── Realtime: Appointments ──────────────────────────────────────
		const supabase = createClient();
		const channel = supabase
			.channel("admin-calendar-sync")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "appointments" },
				() => {
					void getAppointments()
						.then((data) => {
							if (mounted) {
								setAppointments(data || []);
							}
							return undefined;
						})
						.catch(() => undefined);
				},
			)
			.subscribe();

		return () => {
			mounted = false;
			supabase.removeChannel(channel);
		};
	}, []);

	const selectedDateStr = selectedDay
		? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
		: undefined;

	const daysInMonth = (year: number, month: number) =>
		new Date(year, month + 1, 0).getDate();
	const firstDayOfMonth = (year: number, month: number) =>
		new Date(year, month, 1).getDay();

	const prevMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
		setSelectedDay(null);
	};

	const nextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);
		setSelectedDay(null);
	};

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();
	const totalDays = daysInMonth(year, month);
	const startOffset = firstDayOfMonth(year, month);

	const monthNames = [
		"Enero",
		"Febrero",
		"Marzo",
		"Abril",
		"Mayo",
		"Junio",
		"Julio",
		"Agosto",
		"Septiembre",
		"Octubre",
		"Noviembre",
		"Diciembre",
	];

	const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

	const appointmentsInMonth = appointments.filter((app) => {
		const d = new Date(app.appointment_date);
		return d.getFullYear() === year && d.getMonth() === month;
	});

	const getAppointmentsForDay = (day: number) => {
		return appointmentsInMonth.filter((app) => {
			const d = new Date(app.appointment_date);
			return d.getDate() === day;
		});
	};

	// ── View Helpers ─────────────────────────────────────────────────────────────

	// Get week days for current week view
	const getWeekDays = () => {
		const startOfWeek = new Date(currentDate);
		startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
		const days: Date[] = [];
		for (let i = 0; i < 7; i++) {
			const day = new Date(startOfWeek);
			day.setDate(startOfWeek.getDate() + i);
			days.push(day);
		}
		return days;
	};

	// Get hours for day view (8am to 8pm)
	const dayHours = Array.from({ length: 13 }, (_, i) => i + 8);

	// Check if a specific hour has an appointment
	const getAppointmentAtHour = (date: Date, hour: number) => {
		return appointments.find((app) => {
			const d = new Date(app.appointment_date);
			return (
				d.getDate() === date.getDate() &&
				d.getMonth() === date.getMonth() &&
				d.getFullYear() === date.getFullYear() &&
				d.getHours() === hour
			);
		});
	};

	// Check if date is blocked
	const isDateBlocked = (date: Date) => {
		return blockedTimes.some((bt) => {
			const d = new Date(bt.date);
			return (
				d.getDate() === date.getDate() &&
				d.getMonth() === date.getMonth() &&
				d.getFullYear() === date.getFullYear()
			);
		});
	};

	const handleConfirm = async (id: string) => {
		try {
			const res = await confirmAppointment(id);
			if (res.ok) {
				setAppointments((prev) =>
					prev.map((a) => (a.id === id ? { ...a, status: "confirmed" } : a)),
				);
				if (selectedAppointment?.id === id) {
					setSelectedAppointment({
						...selectedAppointment,
						status: "confirmed",
					});
				}
				success("Turno confirmado exitosamente.");
			} else {
				toastError("Error al confirmar el turno.");
			}
		} catch {
			toastError("Error al confirmar el turno.");
		}
	};

	const handleComplete = async (id: string) => {
		try {
			const res = await completeAppointment(id);
			if (res.ok) {
				setAppointments((prev) =>
					prev.map((a) => (a.id === id ? { ...a, status: "completed" } : a)),
				);
				if (selectedAppointment?.id === id) {
					setSelectedAppointment({
						...selectedAppointment,
						status: "completed",
					});
				}
				success("Turno marcado como completado.");
			} else {
				toastError("Error al completar el turno.");
			}
		} catch {
			toastError("Error al completar el turno.");
		}
	};

	const handleCancel = async (id: string, reason?: string) => {
		try {
			const res = await cancelAppointment(id, reason);
			if (res.ok) {
				setAppointments((prev) =>
					prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)),
				);
				if (selectedAppointment?.id === id) {
					setSelectedAppointment({
						...selectedAppointment,
						status: "cancelled",
					});
				}
				success("Turno cancelado. Se ha notificado al cliente.");
			} else {
				toastError("Error al cancelar el turno.");
			}
		} catch {
			toastError("Error al cancelar el turno.");
		}
	};

	const handleDelete = async (id: string) => {
		try {
			const res = await deleteAppointment(id);
			if (res.ok) {
				setAppointments((prev) => prev.filter((a) => a.id !== id));
				setSelectedAppointment(null);
				success("Turno eliminado permanentemente.");
			} else {
				toastError("Error al eliminar el turno.");
			}
		} catch {
			toastError("Error al eliminar el turno.");
		}
	};

	const handleDeleteBlock = async (id: string) => {
		try {
			await deleteBlockedTime(id);
			setBlockedTimes((prev) => prev.filter((bt) => bt.id !== id));
			success("Bloqueo eliminado.");
		} catch {
			toastError("Error al eliminar el bloqueo.");
		}
	};

	const handleEditBlock = (block: BlockedTime) => {
		setEditingBlock(block);
		setSelectedDateForBlock(block.date);
		setShowBlockModal(true);
	};

	return (
		<div className="p-6 md:p-10 max-w-[1200px] mx-auto w-full">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
					<div>
						<h1 className="text-3xl font-light tracking-tight text-black mb-1">
							Calendario Maestro
						</h1>
						<p className="text-black/50 font-light text-sm">
							Gestioná tus próximas sesiones y disponibilidad.
						</p>
					</div>
					<div className="flex items-center gap-3">
						{/* View Selector */}
						<div className="flex items-center bg-white p-1 rounded-lg border border-black/5 shadow-sm">
							{(["month", "week", "day"] as const).map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => setViewMode(v)}
									className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
										viewMode === v
											? "bg-[rgba(15,15,20,0.78)] text-white shadow-sm"
											: "text-black/50 hover:text-black hover:bg-white/50 backdrop-blur-sm"
									}`}
								>
									{v === "month" && "Mes"}
									{v === "week" && "Semana"}
									{v === "day" && "Día"}
								</button>
							))}
						</div>
						<Button
							onClick={() => setShowNewAppt(true)}
							className="btn-primary h-9 px-4 text-xs min-h-0 py-0 flex items-center gap-1.5"
						>
							<Plus size={14} /> Nuevo Turno
						</Button>
						<Button
							onClick={() => {
								const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay || new Date().getDate()).padStart(2, "0")}`;
								setSelectedDateForBlock(dateStr);
								setShowBlockModal(true);
							}}
							variant="outline"
							className="border border-red-300/40 text-red-500 hover:bg-red-50/50 rounded-full h-9 px-3 text-xs flex items-center gap-1.5 transition-all bg-red-500/10"
						>
							<Ban size={14} /> Bloquear
						</Button>
						<div className="flex items-center bg-white p-1 rounded-xl border border-black/5 shadow-sm">
							<button
								onClick={prevMonth}
								aria-label="Mes anterior"
								className="p-2 hover:bg-white/50 backdrop-blur-sm rounded-lg transition-all text-black/60"
							>
								<ChevronLeft size={18} />
							</button>
							<span className="font-medium text-sm min-w-[120px] text-center">
								{monthNames[month]} {year}
							</span>
							<button
								onClick={nextMonth}
								aria-label="Mes siguiente"
								className="p-2 hover:bg-white/50 backdrop-blur-sm rounded-lg transition-all text-black/60"
							>
								<ChevronRight size={18} />
							</button>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* Calendar Grid */}
					<div className="lg:col-span-3 bg-white/35 backdrop-blur-xl border border-white/50 rounded-2xl p-6 overflow-hidden">
						{/* Month View */}
						{viewMode === "month" && (
							<div className="grid grid-cols-7 gap-px bg-black/5 border border-black/5 rounded-xl overflow-hidden shadow-inner">
								{dayLabels.map((day) => (
									<div
										key={day}
										className="bg-gray-50 py-3 text-center text-[10px] font-bold text-black/40 uppercase tracking-widest"
									>
										{day}
									</div>
								))}

								{Array.from({ length: 42 }).map((_, i) => {
									const dayNumber = i - startOffset + 1;
									const isCurrentMonth =
										dayNumber > 0 && dayNumber <= totalDays;
									const dayAppointments = isCurrentMonth
										? getAppointmentsForDay(dayNumber)
										: [];
									const isToday =
										isCurrentMonth &&
										dayNumber === new Date().getDate() &&
										month === new Date().getMonth() &&
										year === new Date().getFullYear();

									return (
										<button
											type="button"
											key={`${year}-${month}-${i}`}
											onClick={() =>
												isCurrentMonth && setSelectedDay(dayNumber)
											}
											className={`min-h-[110px] bg-white p-2 transition-all hover:bg-gray-50/80 cursor-pointer relative group text-left w-full ${
												isCurrentMonth ? "" : "bg-gray-50/30"
											} ${selectedDay === dayNumber ? "ring-2 ring-inset ring-black/10 bg-black/[0.02]" : ""}`}
										>
											<span
												className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 transition-colors ${(() => {
													if (isToday) {
														return "bg-[rgba(15,15,20,0.55)] text-white backdrop-blur-sm";
													}
													if (isCurrentMonth) {
														return "text-black/60";
													}
													return "text-black/20";
												})()}`}
											>
												{isCurrentMonth ? dayNumber : ""}
											</span>

											{/* Blocked Day Indicator */}
											{isCurrentMonth &&
												blockedTimes.some((bt) => {
													const d = new Date(bt.date);
													return (
														d.getDate() === dayNumber &&
														d.getMonth() === month &&
														d.getFullYear() === year
													);
												}) && (
													<div
														className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-400"
														title="Día bloqueado"
													/>
												)}

											<div className="space-y-1">
												{dayAppointments.slice(0, 3).map((app, idx) => (
													<button
														key={`${app.id}-${idx}`}
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															setSelectedAppointment(app);
														}}
														className={`text-[9px] px-2 py-1 rounded-md truncate border transition-all w-full text-left cursor-pointer ${
															app.status === "confirmed"
																? "bg-green-50 text-green-700 border-green-100"
																: "bg-orange-50 text-orange-700 border-orange-100"
														} hover:shadow-sm hover:translate-y-[-1px]`}
													>
														<span className="font-bold mr-1">
															{new Date(app.appointment_date).getHours()}:00
														</span>
														{app.services?.title}
													</button>
												))}
												{dayAppointments.length > 3 && (
													<div className="text-[8px] text-black/30 text-center font-medium">
														+ {dayAppointments.length - 3} más
													</div>
												)}
											</div>
										</button>
									);
								})}
							</div>
						)}

						{/* Week View */}
						{viewMode === "week" && (
							<div className="overflow-x-auto">
								<div className="min-w-[700px]">
									{/* Week header */}
									<div className="grid grid-cols-8 gap-2 mb-4">
										<div className="p-2"></div>
										{getWeekDays().map((day) => (
											<div
												key={day.toISOString()}
												className={`text-center p-2 rounded-lg ${day.toDateString() === new Date().toDateString() ? "bg-white/55 backdrop-blur-md border border-white/50 text-[rgba(15,15,20,0.88)]" : "bg-white/20 backdrop-blur-sm"}`}
											>
												<div className="text-xs font-medium">
													{dayLabels[day.getDay()]}
												</div>
												<div className="text-lg font-bold">{day.getDate()}</div>
											</div>
										))}
									</div>
									{/* Week grid */}
									<div className="space-y-1">
										{dayHours.map((hour) => (
											<div key={hour} className="grid grid-cols-8 gap-2">
												<div className="text-xs text-black/40 text-right pr-2 py-3">
													{hour}:00
												</div>
												{getWeekDays().map((day) => {
													const app = getAppointmentAtHour(day, hour);
													const blocked = isDateBlocked(day);
													return (
														<button
															key={`${day.toISOString()}-${hour}`}
															type="button"
															className={`min-h-[50px] border rounded-lg p-1 transition-all cursor-pointer w-full text-left ${(() => {
																if (blocked) {
																	return "bg-red-50 border-red-200";
																}
																if (app) {
																	return app.status === "confirmed"
																		? "bg-green-50 border-green-200"
																		: "bg-orange-50 border-orange-200";
																}
																return "bg-white border-gray-100 hover:border-gray-300";
															})()}`}
															onClick={() => {
																if (app) {
																	setSelectedAppointment(app);
																} else {
																	setSelectedDay(day.getDate());
																	setCurrentDate(new Date(day));
																}
															}}
														>
															{app && (
																<div className="text-[10px] truncate font-medium">
																	{hour}:00 -{" "}
																	{app.services?.title || "Servicio"}
																</div>
															)}
															{blocked && !app && (
																<div className="text-[10px] text-red-500 truncate">
																	Bloqueado
																</div>
															)}
														</button>
													);
												})}
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{/* Day View */}
						{viewMode === "day" && (
							<div className="max-w-2xl mx-auto">
								<div className="text-center mb-6">
									<h3 className="text-lg font-medium">
										{selectedDay
											? `${selectedDay} de ${monthNames[month]}`
											: `${new Date().getDate()} de ${monthNames[month]}`}
									</h3>
									<p className="text-sm text-black/40">{year}</p>
								</div>
								<div className="space-y-2">
									{dayHours.map((hour) => {
										const dateToCheck = selectedDay
											? new Date(year, month, selectedDay, hour)
											: new Date(year, month, new Date().getDate(), hour);
										const app = getAppointmentAtHour(dateToCheck, hour);
										const blocked = isDateBlocked(dateToCheck);
										return (
											<button
												key={hour}
												type="button"
												className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all ${(() => {
													if (blocked) {
														return "bg-red-50 border-red-200";
													}
													if (app) {
														return app.status === "confirmed"
															? "bg-green-50 border-green-200"
															: "bg-orange-50 border-orange-200";
													}
													return "bg-white border-gray-100 hover:border-gray-300 cursor-pointer";
												})()}`}
												onClick={() => {
													if (app) {
														setSelectedAppointment(app);
													} else if (!blocked) {
														setShowNewAppt(true);
													}
												}}
											>
												<div className="w-16 text-sm font-medium text-black/60">
													{hour}:00
												</div>
												<div className="flex-1">
													{(() => {
														if (app) {
															return (
																<div className="flex items-center justify-between">
																	<div>
																		<div className="font-medium text-sm">
																			{app.client_name}
																		</div>
																		<div className="text-xs text-black/50">
																			{app.services?.title}
																		</div>
																	</div>
																	<span
																		className={`text-xs px-2 py-1 rounded-full ${
																			app.status === "confirmed"
																				? "bg-green-100 text-green-700"
																				: "bg-orange-100 text-orange-700"
																		}`}
																	>
																		{app.status === "confirmed"
																			? "Confirmado"
																			: "Pendiente"}
																	</span>
																</div>
															);
														}
														if (blocked) {
															return (
																<div className="text-sm text-red-500">
																	Día bloqueado
																</div>
															);
														}
														return (
															<div className="text-sm text-black/40">
																Disponible - Click para agendar
															</div>
														);
													})()}
												</div>
											</button>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* Agenda Sidebar */}
					<div className="space-y-6">
						<div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 sticky top-6">
							<h3 className="font-medium text-black mb-6 flex items-center gap-2">
								<CalendarIcon size={18} className="text-black/40" />
								Día: {selectedDay || new Date().getDate()} de{" "}
								{monthNames[month]}
								{isLoading && (
									<span className="ml-auto w-3 h-3 rounded-full border border-black/20 border-t-black/60 animate-spin" />
								)}
							</h3>

							<div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
								{selectedDay &&
								getAppointmentsForDay(selectedDay).some(() => true) ? (
									getAppointmentsForDay(selectedDay)
										.sort(
											(a, b) =>
												new Date(a.appointment_date).getTime() -
												new Date(b.appointment_date).getTime(),
										)
										.map((app) => (
											<button
												key={app.id}
												type="button"
												onClick={() => setSelectedAppointment(app)}
												className="flex gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group w-full text-left"
											>
												<div
													className={`w-1 bg-black rounded-full transition-all group-hover:w-1.5 ${
														app.status === "confirmed"
															? "bg-green-500"
															: "bg-orange-500"
													}`}
												/>
												<div className="flex-1">
													<p className="font-medium text-sm text-black">
														{app.services?.title}
													</p>
													<p className="text-xs text-black/50 mt-0.5">
														{app.client_name}
													</p>
													<p className="text-[10px] font-medium text-black/40 mt-2 flex items-center gap-1">
														<Clock size={12} />{" "}
														{new Date(app.appointment_date).toLocaleTimeString(
															"es-AR",
															{
																hour: "2-digit",
																minute: "2-digit",
															},
														)}
													</p>
												</div>
											</button>
										))
								) : (
									<div className="py-10 text-center">
										<p className="text-sm text-black/30 italic">
											No hay turnos para este día.
										</p>
									</div>
								)}
							</div>

							{/* Bloqueos del día seleccionado */}
							{selectedDay &&
								blockedTimes.some((bt) => {
									const d = new Date(bt.date);
									return (
										d.getDate() === selectedDay &&
										d.getMonth() === month &&
										d.getFullYear() === year
									);
								}) && (
									<div className="mt-4 pt-4 border-t border-black/5">
										<p className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-3">
											Bloqueos
										</p>
										{blockedTimes
											.filter((bt) => {
												const d = new Date(bt.date);
												return (
													d.getDate() === selectedDay &&
													d.getMonth() === month &&
													d.getFullYear() === year
												);
											})
											.map((bt) => (
												<div
																	key={bt.id}
																	className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100 mb-2"
																>
																	<div>
																		<p className="text-xs font-medium text-red-700">
																			{bt.title}
																		</p>
																		<p className="text-[10px] text-red-400 mt-0.5">
																			{bt.is_all_day
																				? "Todo el día"
																				: `${bt.time_start} — ${bt.time_end}`}
																		</p>
																	</div>
																	<div className="flex items-center gap-1">
																		<button
																			type="button"
																			onClick={() => handleEditBlock(bt)}
																			className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-400 hover:text-blue-600"
																			aria-label="Editar bloqueo"
																			title="Editar bloqueo"
																		>
																			<Edit size={14} />
																		</button>
																		<button
																			type="button"
																			onClick={() => handleDeleteBlock(bt.id)}
																			className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-400 hover:text-red-600"
																			aria-label="Eliminar bloqueo"
																			title="Eliminar bloqueo"
																		>
																			<Trash2 size={14} />
																		</button>
																	</div>
																</div>
											))}
									</div>
								)}
						</div>
					</div>
				</div>
			</motion.div>

			{/* New Appointment Modal */}
			<AnimatePresence>
				{showNewAppt && (
					<NewApptModal
						key="new-appt"
						services={services}
						selectedDate={selectedDateStr}
						onClose={() => setShowNewAppt(false)}
						onCreated={loadData}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
						{showBlockModal && (
							<BlockModal
								key="block-modal"
								selectedDate={selectedDateForBlock || undefined}
								editingBlock={editingBlock}
								onClose={() => {
									setShowBlockModal(false);
									setSelectedDateForBlock(null);
									setEditingBlock(null);
								}}
								onCreated={loadData}
							/>
						)}
					</AnimatePresence>

			{/* Appointment Detail Modal */}
			<AnimatePresence>
				{selectedAppointment && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setSelectedAppointment(null)}
							className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden border border-black/5"
						>
							<div className="p-6 border-b border-black/5 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div
										className={`w-2 h-2 rounded-full ${selectedAppointment.status === "confirmed" ? "bg-green-500" : "bg-orange-500"}`}
									/>
									<h3 className="font-medium text-black">
										Detalles de la Sesión
									</h3>
								</div>
								<button
									onClick={() => setSelectedAppointment(null)}
									aria-label="Cerrar detalles"
									className="p-2 hover:bg-gray-100 rounded-full transition-colors"
								>
									<X size={18} className="text-black/40" />
								</button>
							</div>

							<div className="p-8 space-y-6">
								<div className="flex items-start gap-4">
									<div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
										<User size={20} className="text-black/40" />
									</div>
									<div>
										<p className="text-xs text-black/40 font-medium uppercase tracking-wider mb-1">
											Cliente
										</p>
										<p className="text-lg font-medium text-black">
											{selectedAppointment.client_name}
										</p>
										<p className="text-sm text-black/50">
											{selectedAppointment.client_email}
										</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl">
									<div>
										<p className="text-[10px] text-black/40 font-bold uppercase mb-1">
											Fecha
										</p>
										<p className="text-sm font-medium text-black">
											{new Date(
												selectedAppointment.appointment_date,
											).toLocaleDateString("es-AR", {
												day: "numeric",
												month: "long",
											})}
										</p>
									</div>
									<div>
										<p className="text-[10px] text-black/40 font-bold uppercase mb-1">
											Hora
										</p>
										<p className="text-sm font-medium text-black">
											{new Date(
												selectedAppointment.appointment_date,
											).toLocaleTimeString("es-AR", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								</div>

								<div>
									<p className="text-xs text-black/40 font-medium uppercase tracking-wider mb-2">
										Servicio
									</p>
									<p className="text-md font-medium text-black">
										{selectedAppointment.services?.title}
									</p>
								</div>

								{selectedAppointment.notes && (
									<div>
										<p className="text-xs text-black/40 font-medium uppercase mb-2 flex items-center gap-1">
											<MessageSquare size={14} /> Notas del Consultante
										</p>
										<p className="text-sm text-black/70 italic bg-gray-50/50 p-4 rounded-xl border border-black/5">
											&quot;{selectedAppointment.notes}&quot;
										</p>
									</div>
								)}

								<div className="pt-4 flex gap-3">
									{selectedAppointment.status === "confirmed" ? (
										<Button
											onClick={() => handleComplete(selectedAppointment.id)}
											className="flex-1 bg-green-500/20 border border-green-300/40 text-green-700 rounded-full h-12 text-sm hover:bg-green-500/30 transition-all"
										>
											<CheckCircle2 size={18} className="mr-2" /> Marcar como
											Completado
										</Button>
									) : (
										<Button
											onClick={() => handleConfirm(selectedAppointment.id)}
											className="btn-primary flex-1 h-12 text-sm min-h-0"
										>
											<CheckCircle2 size={18} className="mr-2" /> Confirmar Pago
											y Turno
										</Button>
									)}
								</div>

								{/* Cancel button - always show except for cancelled/completed */}
								{selectedAppointment.status !== "cancelled" &&
									selectedAppointment.status !== "completed" && (
										<div className="pt-3">
											<button
												onClick={() => {
													if (
														confirm(
															"¿Estás segura de que quieres cancelar este turno? Se notificará al cliente.",
														)
													) {
														handleCancel(selectedAppointment.id);
													}
												}}
												className="w-full py-3 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors"
											>
												Cancelar Turno
											</button>
										</div>
									)}

								{/* Delete button - always visible now */}
								<div className="pt-3">
									<button
										onClick={() => setDeleteModalOpen(true)}
										className="w-full py-2.5 text-red-400 text-xs font-medium hover:bg-red-50 rounded-xl transition-colors opacity-70 hover:opacity-100 border border-transparent hover:border-red-100 flex items-center justify-center gap-2"
									>
										<Trash2 size={12} />
										Eliminar registro permanentemente
									</button>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			<ConfirmModal
				isOpen={deleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				onConfirm={async () => {
					if (selectedAppointment) {
						await handleDelete(selectedAppointment.id);
						setDeleteModalOpen(false);
					}
				}}
				title="¿Eliminar turno permanentemente?"
				description={
					selectedAppointment?.status === "confirmed"
						? "ATENCIÓN: Este turno está CONFIRMADO. Si lo eliminas, no habrá registro histórico. Te sugerimos 'Cancelar' si quieres mantener el registro."
						: "Esta acción eliminará todos los datos de este turno de forma irreversible."
				}
				confirmText="Sí, eliminar"
				isDestructive={true}
			/>
		</div>
	);
}
