//array de datos provisional en lo que se genera una api de conexion
import { users } from './api.js';

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
    // const userId = validationLogIn(email, password);
    const user = users.find(user => user.email === email && user.password === password);

    if(user) {

        localStorage.setItem('userEmail_' + user.id, user.email);
        localStorage.setItem('userId', user.id)

        switch(user.id) {
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