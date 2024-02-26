import { ticketList } from "./api.js";

const editFormContainer = document.getElementById('editFormContainer');
const modalEdit = document.getElementById('modalEdit');

// Función para abrir el modal de edición con los datos del ticket seleccionado
function openEditModal(ticket) {

    // Configurar el contenido del formulario de edición
    editFormContainer.innerHTML = `
        <form id='formEdit'>
        <div class="form-title">
        <p for="name">Razón:</p>
        <input type="text" id="name" name="name" value="${ticket.name}">
        </div>

        <div class="form-descrip">
        <p for="description">Descripción:</p>
        <textarea type="text" id="description" name="description">${ticket.description}</textarea>
        </div>

        <div class="form-priority">
        <p for="priority">Prioridad:</p>
        <select id="priority" name="priority">
            <option value="optionA" ${ticket.priority === 'optionA' ? 'selected' : ''}>ALTA</option>
            <option value="optionB" ${ticket.priority === 'optionB' ? 'selected' : ''}>MEDIA</option>
            <option value="optionC" ${ticket.priority === 'optionC' ? 'selected' : ''}>BAJA</option>
        </select>
        </div>

        <div class="form-date">
        <p for="date">Fecha:</p>
        <input type="text" id="date" name="date" value="${ticket.date}" readonly>
        </div>

        <div class="form-owner">
        <p for="owner">Presentado por:</p>
        <input type="text" id="owner" name="owner" value="${ticket.owner}">
        </div>
        </form>
    `;

    // Mostrar el modal de edición
    modalEdit.style.display = 'block';
}

//funcion de ectualización y cancelado de tickets

function updateTicket() {
    console.log('formulario actualizado');
}

function cancelTicket(){
    console.log('Modificacion cancelada');
    let modalEdit = document.getElementById('modalEdit');
    modalEdit.style.display = 'none';
}

const updateButton = document.getElementById('updateButton');
const cancelUpdate = document.querySelector('.close');

updateButton.addEventListener('click', function() {
    updateTicket();
});

cancelUpdate.addEventListener('click', function() {
    cancelTicket();
});

//Datos exportado para su modificacion
export { openEditModal };
