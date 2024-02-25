import { ticketList } from "./api.js";

const editFormContainer = document.getElementById('editFormContainer');
const modalEdit = document.getElementById('modalEdit');

// Función para abrir el modal de edición con los datos del ticket seleccionado
function openEditModal(ticket) {
    // Configurar el contenido del formulario de edición
    editFormContainer.innerHTML = `
        <label for="name">Razón:</label>
        <input type="text" id="name" name="name" value="${ticket.name}">
        <label for="description">Descripción:</label>
        <input type="text" id="description" name="description" value="${ticket.description}">
        <label for="priority">Prioridad:</label>
        <input type="text" id="priority" name="priority" value="${ticket.id}">
        <label for="date">Fecha:</label>
        <input type="text" id="date" name="date" value="${ticket.date}">
        <label for="owner">Presentado por:</label>
        <input type="text" id="owner" name="owner" value="${ticket.owner}">
    `;

    // Mostrar el modal de edición
    modalEdit.style.display = 'block';
}

// Manejador de evento para el botón "Cerrar"
modalEdit.addEventListener('click', function(event) {
    if (event.target.classList.contains('close')) {
        modalEdit.style.display = 'none';
    }
});

// Función para actualizar el ticket 
function updateTicket() {

    console.log('Ticket actualizado');
    modalEdit.style.display = 'none';
}

export { openEditModal };
