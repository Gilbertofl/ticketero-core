const ticketList = [];

ticketList.push({
    name: 'peras manzanas 1',
    description: "texto de prueba 1",
    date: '24/02/2024',
    owner: 'Sponder',
    id: 'baja' /* verde */
});
ticketList.push({
    name: 'ya no se',
    description: "texto de prueba 2",
    date: '29/02/2024',
    owner: 'Sponder',
    id: 'media' /* verde */
});
ticketList.push({
    name: 'ya basta freezer',
    description: "texto de prueba 3",
    date: '17/02/2024',
    owner: 'Sponder',
    id: 'alta' /* verde */
});

const users = [
    {email: 'example1@live.com',
    password: '12345',
    id: 1},
    {email: 'example2@live.com',
    password: '5263',
    id: 2},
    {email: 'example3@live.com',
    password: '5869',
    id: 3},
    {email: 'example4@live.com',
    password: '1234',
    id: 1},
    {email: 'example5@live.com',
    password: '1234',
    id: 2}, //Error para id y salir a un area de 404 

]


export { ticketList, users };

