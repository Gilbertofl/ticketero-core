<?php
// Datos de conexión a la base de datos
$servername = "localhost"; // Nombre del servidor
$username = "root"; // Nombre de usuario de la base de datos
$password = ""; // Contraseña de la base de datos
$database = "prueba"; // Nombre de la base de datos

// Crear una conexión
$conn = new mysqli($servername, $username, $password, $database);

// Comprobar la conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Consulta SQL para seleccionar todos los datos de la tabla tickets
$sql = "SELECT * FROM tickets";
$result = $conn->query($sql);

// Verificar si hay resultados
if ($result->num_rows > 0) {
    // Crear un array para almacenar los datos
    $ticketList = array();

    // Almacenar los datos de cada fila en el array
    while($row = $result->fetch_assoc()) {
        $ticketList[] = $row;
    }
    
    // Convertir el array a formato JSON y mostrarlo
    echo json_encode($ticketList);
} else {
    echo json_encode(["error" => "No se encontraron resultados"]);
}

// Cerrar la conexión
$conn->close();
?>
