<?php
// Datos de conexión a la base de datos
$servername = "localhost"; // Nombre del servidor
$username = "root"; // Nombre de usuario de la base de datos
$password = ""; // Contraseña de la base de datos
$database = "prueba"; // Nombre de la base de datos

// Crear una conexión
$conn = new mysqli($servername, $username, $password, $database);

// Verificar la conexión
if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

// Verificar si se recibieron datos del formulario
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Procesar los datos del formulario
    $reason = $_POST["form-Title"];
    $description = $_POST["form-Descrip"];
    $priority = $_POST["priorityType"];
    $date = $_POST["date"];
    $owner = $_POST["owner"];

    // Preparar la consulta SQL para insertar los datos del ticket
    $sql = "INSERT INTO tickets (reason, description, priority, date, owner) VALUES ('$reason', '$description', '$priority', '$date', '$owner')";

    if ($conn->query($sql) === TRUE) {
        // Si la consulta se ejecutó correctamente, devolver los datos del ticket como confirmación
        $response = array(
            "reason" => $reason,
            "description" => $description,
            "priority" => $priority,
            "date" => $date,
            "owner" => $owner
        );

        // Devolver la respuesta en formato JSON
        header('Content-Type: application/json');
        echo json_encode($response);
    } else {
        // Si ocurrió un error al ejecutar la consulta, devolver un mensaje de error en formato JSON
        $error_response = array(
            "error" => "Error al crear el ticket: " . $conn->error
        );

        // Devolver el mensaje de error en formato JSON
        header('Content-Type: application/json');
        echo json_encode($error_response);
    }
} else {
    // Si no es una solicitud POST, devolver un mensaje de error en formato JSON
    $error_response = array(
        "error" => "Error: Se esperaba una solicitud POST"
    );

    // Devolver el mensaje de error en formato JSON
    header('Content-Type: application/json');
    echo json_encode($error_response);
}

// Cerrar la conexión
$conn->close();
?>
