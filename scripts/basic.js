//Recuperacion de datos para mostrado de datos por usuario
const userId = localStorage.getItem('userId');

if (userId) {

    const userEmail = localStorage.getItem('userEmail_' + userId);

    if (userEmail) {
        document.querySelector('.user-email').textContent = userEmail;
    }
}


//Funcion del boton de cierre y mostrado
function toggleDropdown() {
    const dropdownContent = document.getElementById('dropdownContent');
    dropdownContent.classList.toggle('show');
}

function logout() {
    window.location.href = '../login.html';
}

