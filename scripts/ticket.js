const cardsContainer = document.querySelector('.cards-container');

//Array list -> esto es provisional para saber como se vera la maqueta una vez conectada ala API

const ticketList = [];


ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'baja' /* verde */
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'media' /* amarillo */
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'alta' /* rojo*/
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'alta' /* rojo*/
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'alta' /* rojo*/
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'alta' /* rojo*/
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'baja' /* verde */
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'baja' /* verde */
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'media' /* amarillo */
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'media' /* amarillo */
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'media' /* amarillo */
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 'media' /* amarillo */
});



//Encapsulamiento de datos para la funcion de maquetado
function renderTicket(arr) {
    for(ticket of arr) {
        const ticketCard = document.createElement('div');
        ticketCard.classList.add('ticket-card');
        ticketCard.classList.add('card');

        const ticketTitle = document.createElement('h5');
        ticketTitle.classList.add('card-title');
        ticketTitle.innerText = 'Razon: ' + ticket.name;

        const ticketDescp = document.createElement('p');
        ticketDescp.classList.add('card-text');
        ticketDescp.innerText = 'Descripcion: ' + ticket.description;

        const ticketPriority = document.createElement('p');
        ticketPriority.classList.add('ticketPriority');
        ticketPriority.innerText = 'Prioridad: ' + ticket.id;

        const ticketOwner = document.createElement('p');
        ticketOwner.innerText = 'Presentado por: ' + ticket.owner;

        const ticketButton = document.createElement('button');
        ticketButton.classList.add('button-descrip');
        ticketButton.innerText = 'Modificar';

        //validacion de prioridad de datos
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
                console.log("Error: no valida");
                break;
        }
 
        //maquetacion
        cardsContainer.appendChild(ticketCard);

        ticketCard.append(ticketTitle, ticketDescp, ticketPriority, ticketOwner, ticketButton);

    }
}

renderTicket(ticketList);