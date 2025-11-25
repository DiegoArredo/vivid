/**
 * Calendar.js: Funcionalidad interactiva del calendario
 */

class InteractiveCalendar {
    constructor(eventsByMonth) {
        this.eventsByMonth = eventsByMonth || {};
        this.currentDate = new Date();
        this.selectedDate = new Date();
        
        // Inicializar después de que el DOM esté completamente listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
        // Actualizar sidebar con el día de hoy por defecto
        this.updateSidebar();
    }

    setupEventListeners() {
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        const todayBtn = document.getElementById('today-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousMonth();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextMonth();
            });
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.goToToday();
            });
        }
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Actualizar título del mes
        this.updateMonthDisplay(year, month);

        // Limpiar grid
        const daysGrid = document.getElementById('days-grid');
        if (!daysGrid) return;
        daysGrid.innerHTML = '';

        // Obtener primer día del mes y número de días
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Mes anterior (días grises)
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const cell = this.createDayCell(dayNum, 'other-month', null, null);
            daysGrid.appendChild(cell);
        }

        // Mes actual
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            const events = this.getEventsForDay(monthKey, day);
            
            // Determinar clases CSS
            let classes = [];
            
            if (date.getTime() === today.getTime()) {
                classes.push('today');
            } else if (this.selectedDate && date.getTime() === new Date(this.selectedDate).setHours(0, 0, 0, 0)) {
                // Solo agregar 'selected' si no es hoy
                classes.push('selected');
            }

            const cell = this.createDayCell(day, classes.join(' '), events, date);
            daysGrid.appendChild(cell);
        }

        // Próximo mes (días grises)
        const remainingCells = 42 - (firstDay + daysInMonth); // 6 filas × 7 días
        for (let day = 1; day <= remainingCells; day++) {
            const cell = this.createDayCell(day, 'other-month', null, null);
            daysGrid.appendChild(cell);
        }
    }

    createDayCell(day, classes = '', events = null, fullDate = null) {
        const cell = document.createElement('div');
        cell.className = `day-cell ${classes}`.trim();
        
        let html = `<div class="day-number">${day}</div>`;

        // Mostrar indicadores de eventos
        if (events && events.length > 0) {
            html += '<div class="event-indicator">';
            
            // Mostrar hasta 2 puntos
            for (let i = 0; i < Math.min(events.length, 2); i++) {
                html += '<div class="event-dot"></div>';
            }
            
            // Si hay más de 2 eventos, mostrar el contador
            if (events.length > 2) {
                html += `<div class="event-count">+${events.length - 2}</div>`;
            }
            html += '</div>';
        }

        cell.innerHTML = html;

        // Agregar event listener si es un día válido del mes actual
        if (fullDate && !classes.includes('other-month')) {
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectDate(new Date(fullDate));
                this.renderCalendar();
            });
            
            cell.addEventListener('mouseenter', () => {
                cell.style.transform = 'translateY(-2px)';
            });
            
            cell.addEventListener('mouseleave', () => {
                cell.style.transform = 'translateY(0)';
            });
        }

        return cell;
    }

    getEventsForDay(monthKey, day) {
        if (!this.eventsByMonth[monthKey]) {
            return [];
        }
        
        return this.eventsByMonth[monthKey].filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day;
        });
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.selectedDate.setHours(0, 0, 0, 0);
        this.updateSidebar();
    }

    updateSidebar() {
        if (!this.selectedDate) return;

        const monthKey = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}`;
        const day = this.selectedDate.getDate();
        const events = this.getEventsForDay(monthKey, day);

        // Actualizar fecha seleccionada en el sidebar
        const dateDisplay = document.querySelector('.selected-date');
        if (dateDisplay) {
            const optionsDate = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            const formattedDate = this.selectedDate.toLocaleDateString('es-ES', optionsDate);
            dateDisplay.innerHTML = `<strong>${formattedDate}</strong>`;
        }

        // Actualizar lista de eventos
        const eventsList = document.getElementById('day-events');
        if (!eventsList) return;

        if (events.length === 0) {
            eventsList.innerHTML = '<div class="no-events-message">No hay eventos programados para este día</div>';
        } else {
            let html = '';
            events.forEach(event => {
                html += `
                    <div class="event-item" onclick="window.location.href='/evento/${event.id}/'" style="cursor: pointer;">
                        <div class="event-item-name">${event.name}</div>
                        <div class="event-item-time">🕐 ${event.time_formatted || 'Sin hora'}</div>
                        <div class="event-item-location">📍 ${event.location || 'Sin ubicación'}</div>
                    </div>
                `;
            });
            eventsList.innerHTML = html;
        }
    }

    updateMonthDisplay(year, month) {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const display = document.querySelector('.month-display');
        if (display) {
            display.textContent = `${monthNames[month]} de ${year}`;
        }
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.renderCalendar();
        this.updateSidebar();
    }
}
