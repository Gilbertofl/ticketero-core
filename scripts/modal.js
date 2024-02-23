let btn = document.querySelector('.newPetition');
let modal = document.getElementById('myModal');

let closeBtn = modal.querySelector('.close');

btn.addEventListener('click', function() {
    modal.style.display = 'block';
});

closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

window.addEventListener('click', function(event) {
    if(event.target == modal) {
        modal.style.display = 'none';
    }
});