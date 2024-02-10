//array de datios provisional en lo que se genera una api de conexion
const users = [
    {email: 'example1@live.com',
    password: '12345'},
    {email: 'example2@live.com',
    password: '5263'},
    {email: 'example3@live.com',
    password: '5869'},
];

//funcion de validacion de datos 
function validationLogIn(email, password) {
    for( let user of users){
        if(user.email === email && user.password === password){
            return true;
        }
    }
    return false;
}

//Control de evento para el inicio de sesion
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); //Para evitar que el formulario se envie de manera automatica.

    //Obtiene los valores
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    //validacion para correcion de datos o para redireccionamiento
    if(validationLogIn(email, password)) {
        window.location.assign('../views/index.html')
    } else{
        document.getElementById('card--message').innerText = 'Credenciales incorrectas';
    }
});