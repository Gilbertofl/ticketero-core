import { api, } from './api.js';
import { getActiveSession } from './auth.js';
const PRIORITIES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
const STATUSES = ['ABIERTO', 'EN_PROCESO', 'RESUELTO'];
let ticketsState = [];
let paginationState = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    currentDate: new Date().toISOString().slice(0, 10),
    hasPrev: false,
    hasNext: false,
};
let selectedDateFilter = new Date().toISOString().slice(0, 10);
let notificationCount = 0;
function getPriorityCssClass(priority) {
    switch (priority) {
        case 'BAJA':
            return 'bajo';
        case 'MEDIA':
            return 'medio';
        case 'ALTA':
            return 'alto';
        case 'CRITICA':
            return 'critico';
    }
}
function getStatusCssClass(status) {
    switch (status) {
        case 'ABIERTO':
            return 'status-abierto';
        case 'EN_PROCESO':
            return 'status-en_proceso';
        case 'RESUELTO':
            return 'status-resuelto';
    }
}
function formatIsoDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleString('es-MX', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function showToast(title, body) {
    const container = document.getElementById('toastContainer');
    if (!container)
        return;
    const toast = document.createElement('div');
    toast.classList.add('toast-notification');
    const toastTitle = document.createElement('div');
    toastTitle.classList.add('toast-title');
    toastTitle.textContent = title;
    const toastBody = document.createElement('div');
    toastBody.classList.add('toast-body');
    toastBody.textContent = body;
    toast.append(toastTitle, toastBody);
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}
function addNotificationToTray(title, body) {
    const list = document.getElementById('notificationList');
    const badge = document.getElementById('notificationBadge');
    if (list) {
        const emptyMsg = list.querySelector('.notification-empty');
        if (emptyMsg)
            emptyMsg.remove();
        const item = document.createElement('li');
        item.classList.add('notification-item');
        const itemTitle = document.createElement('div');
        itemTitle.classList.add('notification-item-title');
        itemTitle.textContent = title;
        const itemBody = document.createElement('div');
        itemBody.classList.add('notification-item-body');
        itemBody.textContent = body;
        item.append(itemTitle, itemBody);
        list.prepend(item);
    }
    notificationCount++;
    if (badge) {
        badge.textContent = String(notificationCount);
        badge.style.display = 'flex';
    }
}
function initSseListener() {
    const session = getActiveSession();
    if (!session)
        return;
    const sseUrl = `/api/notifications/stream?role=${encodeURIComponent(session.role)}&email=${encodeURIComponent(session.email)}`;
    const eventSource = new EventSource(sseUrl);
    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_TICKET' || data.type === 'STATUS_UPDATE') {
                const title = data.title || 'Alerta de Ticket';
                const body = data.body || '';
                showToast(title, body);
                addNotificationToTray(title, body);
                // Auto-refresco reactivo instantáneo si estamos viendo hoy
                void loadTicketsWithCurrentFilter();
            }
        }
        catch (err) {
            console.warn('Error al procesar evento SSE:', err);
        }
    };
    eventSource.onerror = () => {
        // Reconexión automática nativa de EventSource
    };
}
function openLightbox(imageUrl) {
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImage');
    if (modal && img) {
        img.src = imageUrl;
        modal.style.display = 'flex';
    }
}
/**
 * Tarjeta de ticket estilizada con indicador vertical de prioridad
 */
function createTicketCardElement(ticket, onEdit) {
    const card = document.createElement('div');
    const priorityClass = getPriorityCssClass(ticket.priority);
    card.classList.add('ticket-card', priorityClass);
    const topRow = document.createElement('div');
    topRow.classList.add('card-top-row');
    const statusBadge = document.createElement('span');
    statusBadge.classList.add('ticket-status-badge', getStatusCssClass(ticket.status));
    statusBadge.textContent = ticket.status.replace('_', ' ');
    const priorityEl = document.createElement('span');
    priorityEl.classList.add('ticketPriority', priorityClass);
    priorityEl.textContent = ticket.priority;
    topRow.append(statusBadge, priorityEl);
    const contentGroup = document.createElement('div');
    const titleEl = document.createElement('h5');
    titleEl.textContent = ticket.title;
    const descEl = document.createElement('p');
    descEl.classList.add('card-text');
    descEl.textContent = ticket.description;
    contentGroup.append(titleEl, descEl);
    if (ticket.imageUrl) {
        const thumbContainer = document.createElement('div');
        thumbContainer.classList.add('ticket-thumb-container');
        const thumbImg = document.createElement('img');
        thumbImg.classList.add('ticket-thumb');
        thumbImg.src = ticket.imageUrl;
        thumbImg.alt = 'Evidencia';
        thumbImg.loading = 'lazy';
        thumbImg.addEventListener('click', () => {
            if (ticket.imageUrl)
                openLightbox(ticket.imageUrl);
        });
        const thumbText = document.createElement('span');
        thumbText.classList.add('ticket-thumb-text');
        thumbText.textContent = 'Ver foto adjunta';
        thumbText.addEventListener('click', () => {
            if (ticket.imageUrl)
                openLightbox(ticket.imageUrl);
        });
        thumbContainer.append(thumbImg, thumbText);
        contentGroup.appendChild(thumbContainer);
    }
    const footer = document.createElement('div');
    footer.classList.add('card-footer');
    const metaGroup = document.createElement('div');
    metaGroup.classList.add('ticket-meta');
    const dateSpan = document.createElement('span');
    dateSpan.textContent = formatIsoDate(ticket.createdAt);
    const ownerSpan = document.createElement('span');
    ownerSpan.textContent = `Por: ${ticket.owner}`;
    metaGroup.append(dateSpan, ownerSpan);
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.classList.add('button-descrip');
    editBtn.textContent = 'Gestionar';
    editBtn.addEventListener('click', () => onEdit(ticket));
    footer.append(metaGroup, editBtn);
    card.append(topRow, contentGroup, footer);
    return card;
}
function renderListInContainer(container, list, emptyMessage, onEdit) {
    container.replaceChildren();
    if (list.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.classList.add('empty-state');
        emptyEl.textContent = emptyMessage;
        container.appendChild(emptyEl);
        return;
    }
    const fragment = document.createDocumentFragment();
    for (const ticket of list) {
        fragment.appendChild(createTicketCardElement(ticket, onEdit));
    }
    container.appendChild(fragment);
}
function createFieldWrapper(labelText, inputId) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('modal-field');
    const label = document.createElement('label');
    label.htmlFor = inputId;
    label.textContent = labelText;
    wrapper.appendChild(label);
    return { wrapper, label };
}
function openTicketModal(mode, ticket, onSaved) {
    const modal = document.getElementById('ticketModal');
    const modalTitle = document.getElementById('modalTitle');
    const formContainer = document.getElementById('modalFormContainer');
    const session = getActiveSession();
    if (!modal || !modalTitle || !formContainer || !session)
        return;
    modalTitle.textContent = mode === 'CREATE' ? 'Crear Nueva Petición' : 'Gestionar Ticket';
    formContainer.replaceChildren();
    const form = document.createElement('form');
    form.classList.add('modal-form');
    const titleGroup = createFieldWrapper('Razón / Título:', 'modalTicketTitle');
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'modalTicketTitle';
    titleInput.name = 'title';
    titleInput.required = true;
    titleInput.placeholder = 'Ejemplo: Falla de VPN o lentitud';
    titleInput.value = ticket ? ticket.title : '';
    titleGroup.wrapper.appendChild(titleInput);
    const descGroup = createFieldWrapper('Descripción detallada:', 'modalTicketDescription');
    const descTextarea = document.createElement('textarea');
    descTextarea.id = 'modalTicketDescription';
    descTextarea.name = 'description';
    descTextarea.required = true;
    descTextarea.placeholder = 'Describe la situación con claridad';
    descTextarea.value = ticket ? ticket.description : '';
    descGroup.wrapper.appendChild(descTextarea);
    const priorityGroup = createFieldWrapper('Prioridad:', 'modalTicketPriority');
    const prioritySelect = document.createElement('select');
    prioritySelect.id = 'modalTicketPriority';
    prioritySelect.name = 'priority';
    for (const prio of PRIORITIES) {
        const opt = document.createElement('option');
        opt.value = prio;
        opt.textContent = prio;
        if (ticket && ticket.priority === prio) {
            opt.selected = true;
        }
        prioritySelect.appendChild(opt);
    }
    priorityGroup.wrapper.appendChild(prioritySelect);
    form.append(titleGroup.wrapper, descGroup.wrapper, priorityGroup.wrapper);
    let statusSelect = null;
    if (mode === 'EDIT' && ticket) {
        const statusGroup = createFieldWrapper('Estado actual:', 'modalTicketStatus');
        statusSelect = document.createElement('select');
        statusSelect.id = 'modalTicketStatus';
        statusSelect.name = 'status';
        for (const st of STATUSES) {
            const opt = document.createElement('option');
            opt.value = st;
            opt.textContent = st.replace('_', ' ');
            if (ticket.status === st) {
                opt.selected = true;
            }
            statusSelect.appendChild(opt);
        }
        statusGroup.wrapper.appendChild(statusSelect);
        form.appendChild(statusGroup.wrapper);
    }
    const imageGroup = createFieldWrapper('Adjuntar foto / captura (opcional):', 'modalTicketImage');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'modalTicketImage';
    fileInput.accept = 'image/*';
    imageGroup.wrapper.appendChild(fileInput);
    form.appendChild(imageGroup.wrapper);
    const ownerGroup = createFieldWrapper('Presentado por:', 'modalTicketOwner');
    const ownerInput = document.createElement('input');
    ownerInput.type = 'text';
    ownerInput.id = 'modalTicketOwner';
    ownerInput.name = 'owner';
    ownerInput.required = true;
    ownerInput.value = ticket ? ticket.owner : session.email;
    if (session.role === 'CLIENTE') {
        ownerInput.readOnly = true;
    }
    ownerGroup.wrapper.appendChild(ownerInput);
    form.appendChild(ownerGroup.wrapper);
    const errorText = document.createElement('p');
    errorText.style.color = '#E63946';
    errorText.style.margin = '0';
    errorText.style.fontSize = '13px';
    errorText.style.fontWeight = '600';
    form.appendChild(errorText);
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.classList.add('modal-buttons');
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.classList.add('btn-cancel');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.classList.add('btn-submit');
    submitBtn.textContent = mode === 'CREATE' ? 'Crear Incidencia' : 'Guardar Cambios';
    buttonsWrapper.append(cancelBtn, submitBtn);
    form.appendChild(buttonsWrapper);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorText.textContent = '';
        submitBtn.disabled = true;
        try {
            let finalImageUrl = ticket ? ticket.imageUrl : null;
            if (fileInput.files && fileInput.files.length > 0) {
                finalImageUrl = await api.uploadImage(fileInput.files[0]);
            }
            if (mode === 'CREATE') {
                const created = await api.createTicket({
                    title: titleInput.value.trim(),
                    description: descTextarea.value.trim(),
                    priority: prioritySelect.value,
                    owner: ownerInput.value.trim(),
                    imageUrl: finalImageUrl,
                });
                modal.style.display = 'none';
                onSaved(created);
            }
            else if (ticket) {
                const updated = await api.updateTicket(ticket.id, {
                    title: titleInput.value.trim(),
                    description: descTextarea.value.trim(),
                    priority: prioritySelect.value,
                    status: statusSelect ? statusSelect.value : ticket.status,
                    owner: ownerInput.value.trim(),
                    imageUrl: finalImageUrl,
                });
                modal.style.display = 'none';
                onSaved(updated);
            }
        }
        catch (err) {
            errorText.textContent =
                err instanceof Error ? err.message : 'Error al guardar el ticket.';
        }
        finally {
            submitBtn.disabled = false;
        }
    });
    formContainer.appendChild(form);
    modal.style.display = 'block';
}
function updatePaginationControls() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('paginationInfo');
    if (prevBtn)
        prevBtn.disabled = !paginationState.hasPrev;
    if (nextBtn)
        nextBtn.disabled = !paginationState.hasNext;
    if (pageInfo) {
        pageInfo.textContent = `Página ${paginationState.page} de ${paginationState.totalPages} (${paginationState.total} total)`;
    }
}
function renderAllViews() {
    const clientContainer = document.getElementById('clientTicketsContainer');
    const availableContainer = document.getElementById('availableTicketsContainer');
    const activeContainer = document.getElementById('activeTicketsContainer');
    const handleEdit = (ticket) => {
        openTicketModal('EDIT', ticket, (updatedTicket) => {
            ticketsState = ticketsState.map((item) => item.id === updatedTicket.id ? updatedTicket : item);
            renderAllViews();
        });
    };
    if (clientContainer) {
        renderListInContainer(clientContainer, ticketsState, 'No hay incidencias para la fecha seleccionada.', handleEdit);
    }
    if (availableContainer) {
        const openTickets = ticketsState.filter((t) => t.status === 'ABIERTO');
        renderListInContainer(availableContainer, openTickets, 'No hay tickets abiertos para atender.', handleEdit);
    }
    if (activeContainer) {
        const activeTickets = ticketsState.filter((t) => t.status !== 'ABIERTO');
        renderListInContainer(activeContainer, activeTickets, 'No hay tickets en proceso o resueltos para esta fecha.', handleEdit);
    }
    updatePaginationControls();
}
async function loadTicketsWithCurrentFilter() {
    const session = getActiveSession();
    if (!session)
        return;
    try {
        const filterOptions = {
            page: paginationState.page,
            limit: paginationState.limit,
            date: selectedDateFilter,
        };
        if (session.role === 'CLIENTE') {
            filterOptions.owner = session.email;
        }
        const response = await api.getTickets(filterOptions);
        ticketsState = response.data;
        paginationState = response.pagination;
        renderAllViews();
    }
    catch (error) {
        console.error('Error al cargar tickets:', error);
    }
}
async function initTicketsModule() {
    const session = getActiveSession();
    if (!session)
        return;
    // Iniciar receptor de Server-Sent Events en tiempo real
    initSseListener();
    // Control de bandeja de notificaciones en el navbar
    const bellBtn = document.getElementById('notificationBellBtn');
    const tray = document.getElementById('notificationDropdown');
    const badge = document.getElementById('notificationBadge');
    if (bellBtn && tray) {
        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tray.classList.toggle('show');
            if (badge && tray.classList.contains('show')) {
                notificationCount = 0;
                badge.style.display = 'none';
            }
        });
        window.addEventListener('click', () => {
            tray.classList.remove('show');
        });
    }
    // Manejo de Modal de Tickets
    const modal = document.getElementById('ticketModal');
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    // Manejo de Lightbox para fotos
    const lightbox = document.getElementById('lightboxModal');
    const lightboxClose = document.getElementById('lightboxClose');
    if (lightbox && lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.style.display = 'none';
        });
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
            }
        });
    }
    // Botón Crear Ticket
    const newTicketButton = document.getElementById('newTicketButton');
    if (newTicketButton) {
        newTicketButton.addEventListener('click', () => {
            openTicketModal('CREATE', null, () => {
                paginationState.page = 1;
                selectedDateFilter = new Date().toISOString().slice(0, 10);
                const dateInput = document.getElementById('filterDateInput');
                if (dateInput)
                    dateInput.value = selectedDateFilter;
                void loadTicketsWithCurrentFilter();
            });
        });
    }
    // Filtros de fecha y paginación
    const dateInput = document.getElementById('filterDateInput');
    const todayBtn = document.getElementById('filterTodayBtn');
    const allDatesBtn = document.getElementById('filterAllDatesBtn');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (dateInput) {
        dateInput.value = selectedDateFilter;
        dateInput.addEventListener('change', () => {
            selectedDateFilter = dateInput.value || 'all';
            paginationState.page = 1;
            void loadTicketsWithCurrentFilter();
        });
    }
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            selectedDateFilter = new Date().toISOString().slice(0, 10);
            if (dateInput)
                dateInput.value = selectedDateFilter;
            paginationState.page = 1;
            todayBtn.classList.add('active');
            if (allDatesBtn)
                allDatesBtn.classList.remove('active');
            void loadTicketsWithCurrentFilter();
        });
    }
    if (allDatesBtn) {
        allDatesBtn.addEventListener('click', () => {
            selectedDateFilter = 'all';
            if (dateInput)
                dateInput.value = '';
            paginationState.page = 1;
            allDatesBtn.classList.add('active');
            if (todayBtn)
                todayBtn.classList.remove('active');
            void loadTicketsWithCurrentFilter();
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (paginationState.hasPrev) {
                paginationState.page--;
                void loadTicketsWithCurrentFilter();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (paginationState.hasNext) {
                paginationState.page++;
                void loadTicketsWithCurrentFilter();
            }
        });
    }
    await loadTicketsWithCurrentFilter();
}
document.addEventListener('DOMContentLoaded', () => {
    void initTicketsModule();
});
