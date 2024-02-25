import { ticketList } from "./api.js";
import { openEditModal } from './modalEdit.js';

document.addEventListener('DOMContentLoaded', function() {
    const cardsContainer = document.querySelector('.cards-container');

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
        ticketPriority.innerText = 'Prioridad: ' + ticket.id;

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
        switch (ticket.id) {
            case 'baja': 
                ticketCard.classList.add('bajo');
                ticketPriority.classList.add('bajo');
                break;
            case 'media':
                ticketCard.classList.add('medio');
                ticketPriority.classList.add('medio');
                break;
            case 'alta':
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
        cardsContainer.innerHTML = ''; // Limpiar el contenedor

        ticketList.forEach(ticket => {
            const ticketCard = createTicketCard(ticket);
            cardsContainer.appendChild(ticketCard);
        });
    }

    // Renderizar los tickets al cargar la página
    renderTickets(ticketList);
});