//array de datos provisional en lo que se genera una api de conexion
const users = [
    {email: 'example1@live.com',
    password: '12345',
    id: 1},
    {email: 'example2@live.com',
    password: '5263',
    id: 2},
    {email: 'example3@live.com',
    password: '5869',
    id: 3}, //Error para id y salir a un area de 404 
];

//funcion de validacion de datos 
function validationLogIn(email, password) {
    for( let user of users){
        if(user.email === email && user.password === password){
            return user.id;
        }
    }
    return null;
}

//Control de evento para el inicio de sesion
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); //Para evitar que el formulario se envie de manera automatica.

    //Obtiene los valores
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    //validacion para correcion de datos o para redireccionamiento
    const userId = validationLogIn(email, password);

    if(userId) {
        switch(userId) {
            case 1: 
                window.location.assign('../views/inicio.html');
                break;
            case 2:
                window.location.assign('../views/index.html');
                break;
            default:
                window.location.assign('../views/404.html');
        }
    }else{
       document.getElementById('text--message').innerText = '*Credenciales incorrectas*';
    }

    
    
})