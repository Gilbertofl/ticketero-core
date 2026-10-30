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
    // Recuperar los datos del ticket del formulario
    $name = $_POST["name"];
    $description = $_POST["description"];
    $priority = $_POST["priority"];
    $date = $_POST["date"];
    $owner = $_POST["owner"];
    $id = $_POST["id"];

    // Actualizar el ticket en la base de datos
    $sql = "UPDATE tickets SET name='$name', description='$description', priority='$priority', date='$date', owner='$owner' WHERE id = $id";

    if ($conn->query($sql) === TRUE) {
        // Si la consulta se ejecutó correctamente, devolver una respuesta de éxito en formato JSON
        $response = array(
            "success" => true,
            "message" => "Ticket actualizado correctamente"
        );

        // Devolver la respuesta en formato JSON
        header('Content-Type: application/json');
        echo json_encode($response);
    } else {
        // Si ocurrió un error al ejecutar la consulta, devolver un mensaje de error en formato JSON
        $error_response = array(
            "success" => false,
            "message" => "Error al actualizar el ticket: " . $conn->error
        );

        // Devolver el mensaje de error en formato JSON
        header('Content-Type: application/json');
        echo json_encode($error_response);
    }
} else {
    // Si no es una solicitud POST, devolver un mensaje de error en formato JSON
    $error_response = array(
        "success" => false,
        "message" => "Error: Se esperaba una solicitud POST"
    );

    // Devolver el mensaje de error en formato JSON
    header('Content-Type: application/json');
    echo json_encode($error_response);
}

// Cerrar la conexión
$conn->close();
?>
