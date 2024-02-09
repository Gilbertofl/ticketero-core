const cardsContainer = document.querySelector('.cards-container');

//Array list -> esto es provisional para saber como se vera la maqueta una vez conectada ala API

const ticketList = [];

ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
});
ticketList.push({
    name: 'item de prueba',
    description: "texto de prueba",
    owner: 'Sponder',
    id: 1 /* rojo*/
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

        const ticketOwner = document.createElement('p');
        ticketOwner.innerText = 'Presentado por: ' + ticket.owner;



        //maquetacion
        cardsContainer.appendChild(ticketCard);

        ticketCard.append(ticketTitle, ticketDescp, ticketOwner);

    }
}

renderTicket(ticketList);