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

function getUDat(){
    if (isset($_SESSION['user_id'])) {
        $UID = $_SESSION['user_id'];
        global $mysqli;
        $stmt = $mysqli->query("SELECT * FROM users WHERE U_id = '$UID'");
        $userData = $stmt->fetch_assoc();
        if ($userData) {
            return $userData;
        } else {
            return false;
        }
    }
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
    $userData = getUDat();
    if ($userData != false) { 
        if ($userData['permission'] > 1) {
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
    }
}

if (isset($_POST['register'])) {
    $email = trim($_POST['email']);
    $uname = trim($_POST['username']);
    $pw = $_POST['password'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendReposne('fail', 'invalid email format');
    }
    if (strlen($pw) < 8) {
        sendReposne('fail', 'password must be at least 8 characters');
    }

    $stmt = $mysqli->prepare("INSERT INTO users (Username, Email, pasword) VALUES (?, ?, ?)");
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
    $pw = $_POST['password'];

    $stmt = $mysqli->query("SELECT * FROM users WHERE Username = '$uname'");
    $userData = $stmt->fetch_assoc();
    if ($userData) {
        if (password_verify($pw, $userData['pasword'])) {
            $_SESSION['user_id'] = $userData['U_id'];
            sendReposne('success','Login successful');
        } else {
            sendReposne('error', $userData['pasword']);
        }
    } else{
        sendReposne('error', 'Invalid username or password');
    }
    $stmt->close();
    exit;
}
if (isset($_GET['logged_in'])) {
    if (isset($_SESSION['user_id'])) {
        $UID = $_SESSION['user_id'];
        $stmt = $mysqli->query("SELECT * FROM users WHERE U_id = '$UID'");
        $userData = $stmt->fetch_assoc();
        if ($userData) {
            sendReposne('success', json_encode($userData));
        } else {
            sendReposne('error', $UID);   
        }
    } else {
        sendReposne('fail', 'Failed to login');
    }
}
?>