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
            <option value="ALTA" ${ticket.priority === 'ALTA' ? 'selected' : ''}>ALTA</option>
            <option value="MEDIA" ${ticket.priority === 'MEDIA' ? 'selected' : ''}>MEDIA</option>
            <option value="BAJA" ${ticket.priority === 'BAJA' ? 'selected' : ''}>BAJA</option>
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

// Función para actualizar un ticket
function updateTicket() {
    const form = document.getElementById('formEdit');
    const formData = new FormData(form);

    fetch('../temporal/conn_refres.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Ticket actualizado:', data);
        
        modalEdit.style.display = 'none';
    })
    .catch(error => console.error('Error al actualizar el ticket:', error));
}

// Función para cancelar la modificación de un ticket
function cancelTicket(){
    console.log('Modificación cancelada');
    modalEdit.style.display = 'none';
}

const updateButton = document.getElementById('updateButton');
const cancelButton = document.querySelector('.close');

updateButton.addEventListener('click', function() {
    updateTicket();
});

cancelButton.addEventListener('click', function() {
    cancelTicket();
});

export { openEditModal };