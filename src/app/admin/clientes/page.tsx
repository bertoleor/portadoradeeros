"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Calendar,
	ChevronRight,
	Mail,
	Phone,
	Plus,
	Search,
	Users,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/ToastProvider";
import {
	createAppointmentAdmin,
	getClients,
	type ClientRecord,
} from "@/lib/api/appointments";
import { getServices } from "@/lib/api/services";

import { NewApptModal } from "@/components/admin/NewApptModal";

import type { Service } from "@/types";

const statusLabel: Record<string, { text: string; className: string }> = {
	pending: {
		text: "Pendiente",
		className: "bg-orange-50 text-orange-600 border-orange-100",
	},
	confirmed: {
		text: "Confirmado",
		className: "bg-green-50 text-green-700 border-green-100",
	},
	completed: {
		text: "Completado",
		className: "bg-blue-50 text-blue-700 border-blue-100",
	},
	cancelled: {
		text: "Cancelado",
		className: "bg-red-50 text-red-600 border-red-100",
	},
};

// ──────────────────────────────────────────────────────────────────────────────
// Client History Modal
// ──────────────────────────────────────────────────────────────────────────────
interface ClientModalProps {
	readonly client: ClientRecord;
	readonly onClose: () => void;
	readonly onNewAppt: () => void;
}

function ClientModal({ client, onClose, onNewAppt }: ClientModalProps) {
	return (
		<>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
			/>
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 16 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 16 }}
				className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[85vh] bg-white/85 backdrop-blur-2xl rounded-3xl shadow-2xl z-[70] border border-white/60 overflow-hidden flex flex-col"
			>
				<div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0">
					<div>
						<h3 className="font-medium text-black">{client.name}</h3>
						<p className="text-xs text-black/40">{client.email}</p>
					</div>
					<button
						onClick={onClose}
						aria-label="Cerrar"
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
					>
						<X size={18} className="text-black/40" />
					</button>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-3 divide-x divide-black/5 border-b border-black/5 shrink-0">
					{[
						{ label: "Turnos", value: client.totalAppointments },
						{ label: "Teléfono", value: client.phone ?? "—" },
						{
							label: "Último turno",
							value: new Date(client.lastAppointment).toLocaleDateString(
								"es-AR",
								{
									day: "numeric",
									month: "short",
								},
							),
						},
					].map((s) => (
						<div key={s.label} className="p-4 text-center">
							<p className="text-lg font-light text-black">{s.value}</p>
							<p className="text-[10px] uppercase tracking-widest text-black/30 mt-0.5">
								{s.label}
							</p>
						</div>
					))}
				</div>

				{/* Appointment history */}
				<div className="flex-1 overflow-y-auto p-6 space-y-3">
					<p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-4">
						Historial de Turnos
					</p>
					{client.appointments.map((appt) => {
						const badge = statusLabel[appt.status] ?? statusLabel.pending;
						return (
							<div
								key={appt.id}
								className="flex items-center justify-between p-4 rounded-xl border border-black/5 bg-gray-50/50"
							>
								<div>
									<p className="text-sm font-medium text-black">
										{appt.serviceTitle ?? "Servicio"}
									</p>
									<p className="text-xs text-black/40 mt-0.5">
										{new Date(appt.appointment_date).toLocaleDateString(
											"es-AR",
											{
												day: "numeric",
												month: "long",
												year: "numeric",
											},
										)}
										{" — "}
										{new Date(appt.appointment_date).toLocaleTimeString(
											"es-AR",
											{
												hour: "2-digit",
												minute: "2-digit",
											},
										)}
									</p>
								</div>
								<span
									className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.className}`}
								>
									{badge.text}
								</span>
							</div>
						);
					})}
				</div>

				<div className="p-6 border-t border-black/5 shrink-0">
					<Button
						onClick={onNewAppt}
						className="btn-primary w-full h-11 text-sm min-h-0 flex items-center justify-center gap-2"
					>
						<Plus size={16} /> Agendar nuevo turno
					</Button>
				</div>
			</motion.div>
		</>
	);
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminClientesPage() {
	const [clients, setClients] = useState<ClientRecord[]>([]);
	const [services, setServices] = useState<Service[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(
		null,
	);
	const [showNewAppt, setShowNewAppt] = useState(false);
	const [newApptDefaults, setNewApptDefaults] = useState({
		name: "",
		email: "",
	});

	const loadData = useCallback(async () => {
		setIsLoading(true);
		const [c, s] = await Promise.all([getClients(), getServices()]);
		setClients(c);
		setServices(s.filter((sv) => sv.isVisible));
		setIsLoading(false);
	}, []);

	useEffect(() => {
		let active = true;
		async function load() {
			if (active) {
				await loadData();
			}
		}
		load();
		return () => {
			active = false;
		};
	}, [loadData]);

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		if (!q) {
			return clients;
		}
		return clients.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.email?.toLowerCase().includes(q) ||
				false ||
				(c.phone ?? "").includes(q),
		);
	}, [clients, search]);

	const openNewApptForClient = (client: ClientRecord) => {
		setSelectedClient(null);
		setNewApptDefaults({ name: client.name, email: client.email });
		setShowNewAppt(true);
	};

	return (
		<div className="p-6 md:p-10 max-w-[1200px] mx-auto w-full">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				{/* Header */}
				<div className="flex items-start justify-between gap-4 mb-10">
					<div>
						<h1 className="text-3xl font-light tracking-tight text-black mb-1">
							Clientes
						</h1>
						<p className="text-black/50 font-light text-sm">
							{clients.length}{" "}
							{clients.length === 1
								? "cliente registrado"
								: "clientes registrados"}
						</p>
					</div>
					<Button
						onClick={() => {
							setNewApptDefaults({ name: "", email: "" });
							setShowNewAppt(true);
						}}
						className="btn-primary rounded-xl h-10 px-5 text-xs min-h-0 flex items-center gap-2 shrink-0"
					>
						<Plus size={15} /> Nuevo Turno
					</Button>
				</div>

				{/* Search */}
				<div className="relative mb-6">
					<Search
						size={16}
						className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
					/>
					<input
						type="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar por nombre, email o teléfono…"
						className="w-full pl-10 pr-4 py-3 border border-black/10 rounded-2xl text-sm focus:outline-none focus:border-black transition-colors bg-white"
					/>
				</div>

				{/* Table / List */}
				{(() => {
					if (isLoading) {
						return (
							<div className="space-y-3">
								{[1, 2, 3, 4].map((i) => (
									<div
										key={`skeleton-${i}`}
										className="h-16 bg-gray-50 rounded-2xl animate-pulse"
									/>
								))}
							</div>
						);
					}

					if (filtered.length === 0) {
						return (
							<div className="py-24 text-center">
								<Users size={48} className="mx-auto text-black/10 mb-4" />
								<p className="text-black/30 italic text-sm">
									{search
										? "Sin resultados."
										: "Todavía no hay clientes registrados."}
								</p>
							</div>
						);
					}

					return (
						<div className="space-y-2">
							{filtered.map((client) => (
								<motion.div
									key={client.email}
									layout
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									onClick={() => setSelectedClient(client)}
									className="flex items-center justify-between p-5 bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl hover:border-white/70 hover:shadow-sm transition-all cursor-pointer group"
								>
									<div className="flex items-center gap-4 min-w-0">
										<div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm shrink-0">
											{client.name.charAt(0).toUpperCase()}
										</div>
										<div className="min-w-0">
											<p className="font-medium text-sm text-black truncate">
												{client.name}
											</p>
											<p className="text-xs text-black/40 truncate flex items-center gap-2 mt-0.5">
												<Mail size={11} />
												{client.email}
												{client.phone && (
													<>
														<Phone size={11} />
														{client.phone}
													</>
												)}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-6 shrink-0">
										<div className="hidden sm:block text-right">
											<p className="text-xs font-medium text-black">
												{client.totalAppointments}{" "}
												{client.totalAppointments === 1 ? "turno" : "turnos"}
											</p>
											<p className="text-[10px] text-black/30 mt-0.5">
												<Calendar size={10} className="inline mr-1" />
												{new Date(client.lastAppointment).toLocaleDateString(
													"es-AR",
													{
														day: "numeric",
														month: "short",
														year: "numeric",
													},
												)}
											</p>
										</div>
										<ChevronRight
											size={16}
											className="text-black/20 group-hover:text-black/50 group-hover:translate-x-0.5 transition-all"
										/>
									</div>
								</motion.div>
							))}
						</div>
					);
				})()}
			</motion.div>

			{/* Modals */}
			<AnimatePresence>
				{selectedClient && (
					<ClientModal
						key="client-modal"
						client={selectedClient}
						onClose={() => setSelectedClient(null)}
						onNewAppt={() => openNewApptForClient(selectedClient)}
					/>
				)}
				{showNewAppt && (
					<NewApptModal
						key="new-appt-modal"
						services={services}
						defaultName={newApptDefaults.name}
						defaultEmail={newApptDefaults.email}
						onClose={() => setShowNewAppt(false)}
						onCreated={loadData}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
