import { openEditModal } from './modalEdit.js';

document.addEventListener('DOMContentLoaded', function() {
    const cardsContainer = document.querySelector('.cards-container');

    // Hacer una solicitud GET a tu script PHP que devuelve los datos de la base de datos
    fetch('../temporal/connection.php')
      .then(response => response.json())
      .then(data => {
        // Aquí puedes trabajar con los datos recibidos
        console.log(data); // Mostrar los datos en la consola, por ejemplo

        renderTickets(data); // Llama a la función para renderizar los tickets con los datos obtenidos
      })
      .catch(error => console.error('Error al obtener los datos:', error));

    // Función para crear una tarjeta de ticket
    function createTicketCard(ticket) {
        const ticketCard = document.createElement('div');
        ticketCard.classList.add('ticket-card', 'card');

        const ticketTitle = document.createElement('h5');
        ticketTitle.classList.add('card-title');
        ticketTitle.innerText = 'Razón: ' + ticket.name;

        const ticketDescp = document.createElement('p');
        ticketDescp.classList.add('card-text');
        ticketDescp.innerText = 'Descripción: ' + ticket.description;

        const ticketPriority = document.createElement('p');
        ticketPriority.classList.add('ticketPriority');
        ticketPriority.innerText = 'Prioridad: ' + ticket.priority;

        const ticketDate = document.createElement('p');
        ticketDate.classList.add('ticketDate');
        ticketDate.innerText = 'Fecha: ' + ticket.date;

        const ticketOwner = document.createElement('p');
        ticketOwner.innerText = 'Presentado por: ' + ticket.owner;

        const ticketButton = document.createElement('button');
        ticketButton.classList.add('button-descrip');
        ticketButton.setAttribute('data-ticket-id', ticket.id);
        ticketButton.innerText = 'Editar';

        // Manejador de evento para el botón de edición
        const editButton = ticketButton;
        editButton.addEventListener('click', function() {
            openEditModal(ticket);
        });

        // Validación de prioridad de datos
        switch (ticket.priority) {
            case 'BAJA': 
                ticketCard.classList.add('bajo');
                ticketPriority.classList.add('bajo');
                break;
            case 'MEDIA':
                ticketCard.classList.add('medio');
                ticketPriority.classList.add('medio');
                break;
            case 'ALTA':
                ticketCard.classList.add('alto');
                ticketPriority.classList.add('alto');
                break;
            default:
                console.log("Error: no válida");
                break;
        }

        // Agregar elementos a la tarjeta de ticket
        ticketCard.append(ticketTitle, ticketDescp, ticketPriority, ticketDate, ticketOwner, ticketButton);

        return ticketCard;
    }

    // Función para renderizar los tickets
    function renderTickets(ticketList) {
        cardsContainer.innerHTML = ''; 

        ticketList.forEach(ticket => {
            const ticketCard = createTicketCard(ticket);
            cardsContainer.appendChild(ticketCard);
        });
    }
});
