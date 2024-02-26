//Funcion de modal -> genera el modal al clickear el boton
import { ticketList } from "./api.js";

const btnNew = document.querySelector('.newPetition');
const modalNew = document.getElementById('myModal');

btnNew.addEventListener('click', function() {
    modalNew.style.display = 'block';
});


//Funcion de maquetacion de modal
const formContainerNew = document.getElementById('formContainerNew');

function generateFormNew() {

    formContainerNew.innerHTML = ''; //->Resetea el ticket
     
    const form = document.createElement('form');
    form.id = 'myForm';
    
    // inicio -> Razón
    const formTitle = document.createElement('div');
    formTitle.classList.add('form-title');
    
    const titleLabel = document.createElement('p');
    titleLabel.textContent = 'Razón';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'form-Title';
    titleInput.name = 'form-Title';
    titleInput.placeholder = 'Ejemplo: error de accesos o pagina lenta';

    form.appendChild(formTitle);
    formTitle.append(titleLabel, titleInput);
    // fin -> Razón

    // inicio -> Descripción
    const formDescrip = document.createElement('div');
    formDescrip.classList.add('form-descrip');

    const descripLabel = document.createElement('p');
    descripLabel.textContent = 'Descripcion: ';

    const descripInput = document.createElement('textarea');
    descripInput.id = 'form-Descrip';
    descripInput.name = 'form-Descrip';
    descripInput.placeholder = 'Ejemplo: lleva demasiado tiempo en espera';

    form.appendChild(formDescrip);
    formDescrip.append(descripLabel, descripInput);
    // fin -> Descripción

    // inicio -> Prioridad
    const formPriority = document.createElement('div');
    formPriority.classList.add('form-priority');

    const priorityLabel = document.createElement('p');
    priorityLabel.textContent = 'Prioridad';

    const priorityInput = document.createElement('select');
    priorityInput.id = 'priorityType';
    priorityInput.name = 'priorityType';

    const optionA = document.createElement('option');
    optionA.text = 'ALTA';
    priorityInput.add(optionA);

    const optionB = document.createElement('option');
    optionB.text = 'MEDIA';
    priorityInput.add(optionB);

    const optionC = document.createElement('option');
    optionC.text = 'BAJA';
    priorityInput.add(optionC);

    form.appendChild(formPriority);
    formPriority.append(priorityLabel, priorityInput);
    // fin -> Prioridad

    // inicio -> Fecha
    const formDate = document.createElement('div');
    formDate.classList.add('form-date');

    const dateLabel = document.createElement('p');
    dateLabel.textContent = 'Fecha';

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'date';
    dateInput.name = 'date';

    form.appendChild(formDate);
    formDate.append(dateLabel, dateInput);
    // fin -> Fecha

    // inicio -> Propietario
    const formOwner = document.createElement('div');
    formOwner.classList.add('form-owner');

    const ownerLabel = document.createElement('p');
    ownerLabel.textContent = 'Hecho por '
    form.appendChild(ownerLabel);

    const ownerInput = document.createElement('input');
    ownerInput.type = 'text';
    ownerInput.id = 'owner';
    ownerInput.name = 'owner';
    ownerInput.placeholder = 'Nombre del responsable del ticket';

    form.appendChild(formOwner);
    formOwner.append(ownerLabel, ownerInput)
    // fin -> Propietario

    // inicio -> generacion completa
    formContainerNew.appendChild(form);

}

window.addEventListener('DOMContentLoaded', generateFormNew);

//funcion de envio y cancelado de tickets


function submitForm() {

    const name = document.getElementById('form-Title').value;
    const description = document.getElementById('form-Descrip').value;
    const priority = document.getElementById('priorityType').value;
    const date = document.getElementById('date').value;
    const owner = document.getElementById('owner').value;

    ticketList.push({
        name: name,
        description: description,
        priority: priority,
        date: date,
        owner: owner
    });
    console.log('ticketList actualizado:', ticketList);

    console.log('Formulario enviado');
}

function closeModalNew() {
    console.log('Modal cerrado');
    let modal = document.getElementById('myModal');
    modal.style.display = 'none';
}


const submitButton = document.getElementById('submitButton');
const cancelButton = document.getElementById('cancelButton');

submitButton.addEventListener('click', function() {
    submitForm();
});

cancelButton.addEventListener('click', function() {
    closeModalNew();
});
