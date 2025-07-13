<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$mysqli = new mysqli("localhost", "root", "root", "sfoftmajorProj");

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

$cookie_Params = session_get_cookie_params();
session_set_cookie_params([
    'lifetime' => 0,
    'path' => $cookie_Params["path"],
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();

function sendReposne($status, $message) {
    echo json_encode(array('status' => $status, 'message' => $message));
    exit;
}

if (isset($_GET['search'])) {
    $search = $mysqli->real_escape_string($_GET['search']);
    $result = $mysqli->query("SELECT id, name FROM disorders WHERE name LIKE '%$search%'");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

if (isset($_GET['tags'])) {
    $result = $mysqli->query("SELECT DISTINCT tag FROM disorder_tags");
    $tags = [];
    while ($row = $result->fetch_assoc()) {
      $tags[] = $row['tag'];
    }
    echo json_encode($tags);
    exit;
}

if (isset($_GET['tag'])) {
    $tag = $mysqli->real_escape_string($_GET['tag']);
    $query = "
      SELECT d.id, d.name
      FROM disorders d
      JOIN disorder_tags t ON d.id = t.disorderId
      WHERE t.tag = '$tag'
    ";
    $result = $mysqli->query($query);
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

if (isset($_POST['addDisorder'])) {
    $name = $mysqli->real_escape_string($_POST['disorderName']);
    $desc = $mysqli->real_escape_string($_POST['description']);
    $tags = explode(',', $_POST['tags']);
    $mysqli->query("INSERT INTO disorders (name, description) VALUES ($name, $desc)");
    $disorderId = $mysqli->insert_id;
    foreach ($tags as $tag) {
      $tag = trim($mysqli->real_escape_string($tag));
      if ($tag) {
        $mysqli->query("INSERT INTO disorder_tags (disorderId, tag) VALUES ($disorderId, $tag)");
      }
    }
    header("Location: index.html");
    exit;
}

if (isset($_GET['getDisorder'])){
    $id = intval($_GET['getDisorder']);
    $stmt = $mysqli->prepare("SELECT name, description FROM disorders WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->bind_result($name, $description);
    $respons = [];
    if ($stmt->fetch()) {
        $respons['name'] = $name;
        $respons['desc'] = $description;
    } else {
        echo json_encode(["error" => "Disorder not found."]);
    }
    $stmt->close();

    $result = $mysqli->query("SELECT tag FROM disorder_tags WHERE disorderId = '$id'");
    $tags = [];
    while ($row = $result->fetch_assoc()) {
        $tags[] = $row;
    }
    echo json_encode(["name" => $respons['name'], "description" => $respons['desc'], "tags" => json_encode($tags)]);
}

if (isset($_POST['editDisorder'])){
    $disid = intval($_POST['disorderId']);
    $name = $mysqli->real_escape_string($_POST['title']);
    $desc = $mysqli->real_escape_string($_POST['desc']);
    $mysqli->query("UPDATE disorders SET name = '$name', description = '$desc' WHERE id = '$disid'");
    $mysqli->query("DELETE FROM disorder_tags WHERE disorderId = '$disid'");

    if (!empty($_POST['tags'])) {
        $tags = explode(',', $_POST['tags']);
        foreach ($tags as $tag) {
            $t = trim($mysqli->real_escape_string($tag));
            if ($t !== '') {
                $mysqli->query("INSERT INTO disorder_tags (disorderId, tag) VALUES ('$disid', '$t')");
            }
        }
    }

    sendReposne('success', 'edi');
}

if (isset($_POST['register'])) {
    $email = trim($_POST['email']);
    $uname = trim($_POST['username']);
    $pw = $_POST['password'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendReposne('error', 'invalid email format');
    }
    if (strlen($pw) < 8) {
        sendReposne('error', 'password must be at least 8 characters');
    }

    $stmt = $mysqli->prepare(
        "INSERT INTO users (Username, Email, pasword) VALUES (?, ?, ?)"
    );
    $hashed = password_hash($pw, PASSWORD_DEFAULT);
    $stmt->bind_param('sss', $uname, $email, $hashed);

    if ($stmt->execute()) {
        $_SESSION['user_id'] = $mysqli->insert_id;
        sendReposne('success', 'Registration successful');
    } else {
        sendReposne('error', 'Registration failed: ' . $stmt->error);
    }
}


if (isset($_POST['login'])) {
    $uname = trim($_POST['username']);
    $pw    = $_POST['password'];
    
    $query = "SELECT U_id, Username, pasword FROM users WHERE Username = $uname";
    
    $reslt = $mysqli->query($query);

    sendReposne('success', $reslt);

    if ($stmt->num_rows === 1) {
        if (true) {
            $_SESSION['user_id'] = $reslt;
            sendReposne('success', $reslt);
        }
    } else {
        sendReposne('error', 'Invalid credentials');
    }
}
?>