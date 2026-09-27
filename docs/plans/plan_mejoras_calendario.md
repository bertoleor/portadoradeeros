# Plan: Mejoras del Calendario
> Parte de: [[projects/eros/README|README]] · Relacionados: [[EROS-plan-2026-09-14]] · [[INDICE-PLANS]] · [[AUDITORIA_CALENDARIO_2024]]

## Estado Actual
- Solo vista de mes
- Modal para crear turnos manuales (ya existe)
- No hay eventos de disponibilidad/bloqueo
- No hay vistas por día ni por semana

---

## Funcionalidades Solicitadas

### 1. Vistas del Calendario
- **Vista Mes**: Actual (grid de mes completo)
- **Vista Semana**: 7 días con bloques de horario
- **Vista Día**: Un solo día con todos los turnos

### 2. Turnos Externos
- Ya existe el modal para crear turnos manualmente
- Se accede desde el botón "+" en el calendario

### 3. Eventos de Disponibilidad
- Crear eventos que bloquean horarios/días
- Tipos de eventos:
  - Bloqueo de horario (ej: no atender X día)
  - Turno ocupado (reservado sin cliente)
  - Evento personal

---

## Estructura de Datos

### Appointment (ya existe)
```
- id
- client_name
- client_email
- client_phone
- appointment_date
- status: pending/confirmed/cancelled/completed
- notes
- service_id
```

### BlockedTime (nuevo)
```
- id
- title
- date (o date_start + date_end para rangos)
- time_start
- time_end
- type: blocked/occupied/event
- is_all_day: boolean
- color: string
```

---

## UI Propuesta

### Selector de Vista
Tres botones: Mes | Semana | Día

### Calendario - Vista Mes
- Similar al actual
- Días con eventos bloqueados se muestran de diferente color

### Calendario - Vista Semana
- Columnas: 7 días (Lun-Dom)
- Filas: Horas del día (ej: 9:00 - 20:00)
- Celdas con turnos y eventos

### Calendario - Vista Día
- Un solo día
- Lista vertical de turnos/eventos
- Más detalle por cada turno

### Modal de Evento (nuevo)
- Título
- Tipo (bloqueo/ocupado/evento)
- Fecha(s)
- Hora inicio / hora fin
- Descripción
- Color

---

## Tareas de Implementación

### Fase 1: Estructura Base
- [ ] Agregar tipo BlockedTime al schema de Supabase
- [ ] Crear API para blocked times (CRUD)
- [ ] Agregar estado de vista (mes/semana/día)

### Fase 2: Vistas
- [ ] Implementar selector de vista
- [ ] Crear componente de calendario por semana
- [ ] Crear componente de calendario por día
- [ ] Mejorar vista de mes con eventos

### Fase 3: Eventos de Disponibilidad
- [ ] Crear modal para crear eventos
- [ ] Mostrar eventos en el calendario
- [ ] Permitir editar/eliminar eventos

### Fase 4: UI/UX
- [ ] Estilos para cada tipo de evento
- [ ] Leyenda del calendario
- [ ] Responsive design

---

## Consideraciones

1. **Horarios de trabajo**: Los eventos deben respetar los horarios configurados en "Horarios de Trabajo"
2. **Servicios existentes**: Los turnos de clientes deben tener prioridad sobre eventos
3. **Colores sugeridos**:
   - Turno confirmado: Verde
   - Turno pendiente: Amarillo
   - Bloqueo: Rojo
   - Evento personal: Azul
