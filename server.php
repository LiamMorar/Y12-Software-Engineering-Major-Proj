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

if (isset($_GET['tags'])) {
    $result = $mysqli->query("SELECT DISTINCT tag FROM disorder_tags");
    $tags = [];
    while ($row = $result->fetch_assoc()) {
      $tags[] = $row['tag'];
    }
    echo json_encode($tags);
    exit;
}

if (isset($_POST['addDisorder'])) {
    $name = $mysqli->real_escape_string($_POST['disorderName']);
    $desc = $mysqli->real_escape_string($_POST['description']);
    $tags = explode(',', $_POST['tags']);
    $mysqli->query("INSERT INTO disorders (name, description) VALUES ('$name', '$desc')");
    $disorderId = $mysqli->insert_id;
    foreach ($tags as $tag) {
      $tag = trim($mysqli->real_escape_string($tag));
      if ($tag) {
        $mysqli->query("INSERT INTO disorder_tags (disorderId, tag) VALUES ('$disorderId', '$tag')");
      }
    }
    header("Location: index.html");
    exit;
}

function getDisorder($fQuery) {
    global $mysqli;
    $stmt = $mysqli->query($fQuery);
    $respons = $stmt->fetch_assoc();
    $stmt->close();
    $id = $respons["id"];
    $result = $mysqli->query("SELECT tag FROM disorder_tags WHERE disorderId = '$id'");
    $tags = [];
    while ($row = $result->fetch_assoc()) {
        $tags[] = $row;
    }
    echo json_encode(["name" => $respons['name'], "description" => $respons['description'], "tags" => json_encode($tags)]);
}

function getAllDisorder($fQuery) {
    global $mysqli;
    $stmt = $mysqli->query($fQuery . "AND approved = 1");
    $respons = $stmt->fetch_all(MYSQLI_ASSOC);
    $entries =[];
    foreach ($respons as $dis){
        $id = $dis["id"];
        $result = $mysqli->query("SELECT tag FROM disorder_tags WHERE disorderId = '$id'");
        $tags = [];
        while ($row = $result->fetch_assoc()) {
            $tags[] = $row;
        }
        array_push($entries,json_encode(["name" => $dis['name'], "id" => $dis['id'], "tags" => json_encode($tags)]));
    }
/*    $stmt->close();
    $id = $respons["id"];
    $result = $mysqli->query("SELECT tag FROM disorder_tags WHERE disorderId = '$id'");
    $tags = [];
    while ($row = $result->fetch_assoc()) {
        $tags[] = $row;
    }
    echo json_encode(["name" => $respons['name'], "description" => $respons['description'], "tags" => json_encode($tags)]);*/
    echo json_encode($entries);
}

if (isset($_GET['getDisorder'])){
    $id = intval($_GET['getDisorder']);
    getDisorder("SELECT * FROM disorders WHERE id = '$id'");
}

if (isset($_GET['tag'])) {
    $tag = $mysqli->real_escape_string($_GET['tag']);
    getAllDisorder("SELECT d.name, d.id
      FROM disorders d
      JOIN disorder_tags t ON d.id = t.disorderId
      WHERE t.tag = '$tag'");
}

if (isset($_GET['search'])) {
    $search = $mysqli->real_escape_string($_GET['search']);
    getAllDisorder("SELECT * FROM disorders WHERE name LIKE '%$search%'");
}

if (isset($_GET['deleteDisorder'])) {
    $userData = getUDat();
    if ($userData != false) { 
        if ($userData['permission'] > 1) {
            $disid = intval($_GET['deleteDisorder']);
            $mysqli->query("DELETE FROM disorder_tags WHERE disorderId = '$disid'");
            $mysqli->query("DELETE FROM disorders WHERE id = '$disid'");
            sendReposne('success', 'Done');  
        } else {
            sendReposne('error', 'no perms');
        }
    } else {
        sendReposne('error', 'notloggedin');     
    }
}

/*if (isset($_POST['editDisorder'])){
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
        } else {
            sendReposne('error', 'no perms');
        }
    } else {
        sendReposne('error', 'notloggedin');     
    }
}*/

function testValid($iput) {
    if (is_string($iput)){
        if (empty($iput)) {
            return false;
        };
        if (!preg_match('/^[\x00-\x7F]*$/', $iput)) {
            return false;
        }

        $blacklist = ['"',"'",'`','\\','(',')','[',']','{','}','+','-','=','/','&','|','!',"\n","\r","\0"];
        foreach ($blacklist as $char) {
            if (strpos($iput, $char) !== false) {
                return false;
            }
        }

        return true;
    } else {
        return false;
    }
}

function validateInput($input) {
    //Reject Empty Input
    if (empty($input)) {
        return "Input cannot be empty";
        //placeholder return to simulate rejecting input
    };

    //Reject lengths above 100 or below 3
    if (strlen($input) > 100) {
        return "Input exceeds maximum allowed length";
        //Placeholder return to simulate rejecting input
    } else if (strlen($input) < 3) {
        return "Input doesnt surpass minimum length";
        //Placeholder return to simulate rejecting input
    };

    //Reject non-ASCII characters
    if (!preg_match('/^[\x00-\x7F]*$/', $input)) {
        return "Input must contain only ASCII characters.";
        //Placeholder return to simulate rejecting input
    }

    //Define harmful characters in array
    $blacklist = ['"',"'",'`','\\','(',')','[',']','{','}','+','-','=','/','&','|','!',"\n","\r","\0"];
    //Reject harmful characters
    foreach ($blacklist as $char) {
        //For every disallowed character check if in input
        if (strpos($input, $char) !== false) {
            return "Input contains disallowed characters.";
            //Placeholder return to simulate rejecting input
        }
    }

    //Specified whitelisted characters for alphanumeric and a few symbols
    if (!preg_match('/^[a-zA-Z0-9_\-@.]+$/', $input)) {
        return "Input contains invalid characters.";
        //Placeholder return to simulate rejecting input
    };

    return "Input is valid.";
   //Placeholder return to simulate not rejecting input
}


if (isset($_POST['register'])) {
    $email = trim($_POST['email']);
    $uname = trim($_POST['username']);
    $pw = $_POST['password'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendReposne('fail', 'invalid email format');
        exit;
    }
    if (strlen($pw) < 8) {
        sendReposne('fail', 'password must be at least 8 characters');
        exit;
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
            sendReposne('error', 'Invalid username or password');
        }
    } else{
        $stmt = $mysqli->query("SELECT * FROM users WHERE Email = '$uname'");
        $userData = $stmt->fetch_assoc();
        if ($userData) {
            if (password_verify($pw, $userData['pasword'])) {
                $_SESSION['user_id'] = $userData['U_id'];
                sendReposne('success','Login successful');
            } else {
                sendReposne('error', 'Invalid username or password');
            }
        } else{
            sendReposne('error', 'Invalid username or password');
        }
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

if (isset($_GET['logout'])){
    session_destroy();
}

if (isset($_POST['usersettings'])){
    $userData = getUDat();
    $updatesetts = $_POST['settings'];
}

if (isset($_GET['GetForums'])){
    $stmt = $mysqli->query("SELECT * FROM forumposts WHERE approved = 1"); 
    $forums = $stmt->fetch_all(MYSQLI_ASSOC);  
    sendReposne('success', json_encode($forums));
}

if (isset($_POST['postForumTitle'])){
    $title = $_POST['postForumTitle'];
    $desc = $_POST['postForumDesc'];
    $mysqli->query("INSERT INTO forumposts (FTitle, FDesc) VALUES ('$title', '$desc')");
    $forumid = $mysqli->insert_id;
    header("Location: forumpage.html?forumid=$forumid");
}

if (isset($_GET['getForumInfo'])){
    $fpid = $_GET['getForumInfo'];
    $stmt = $mysqli->query("SELECT * FROM forumposts WHERE fP_Id = '$fpid'"); 
    $forums = $stmt->fetch_assoc();
    $stmt = $mysqli->query("SELECT * FROM comments WHERE forumid = '$fpid'"); 
    $comments = $stmt->fetch_all(MYSQLI_ASSOC);  
    sendReposne('success',json_encode(["forum" => $forums, "comments" => $comments]));
}

if (isset($_GET['simpleudat'])){
    $uid = $_GET['simpleudat'];
    $stmt = $mysqli->query("SELECT * FROM users WHERE U_id = '$uid'");
    $userData = $stmt->fetch_assoc();
    if ($userData){
        sendReposne('success', json_encode(['name' => $userData['Username'], 'role' => $userData['permission']]));
    } else {
        sendReposne('error', 'Couldnt Get User Info');
    }
}

if (isset($_POST['addcomment'])){
    $comment = $_POST['comment'];
    $forumid = $_POST['forumId'];
    $userdat = getUDat();
    if ($userdat){
        $usid = $userdat["U_id"];
        $mysqli->query("INSERT INTO comments (forumid, comment, posterid) VALUES ('$forumid', '$comment', '$usid')");
        header("Location: forumpage.html?forumid=$forumid");
    } else {
        header("Location: login.html");
    }
}

if (isset($_GET['approveCreate'])) {
    $userdat = getUDat();
    if ($userdat){
        if ($userdat['permission'] > 2){
            $idtoapprove = $_GET['approveCreate'];
            $mysqli->query("UPDATE disorders SET approved = 1 WHERE id = '$idtoapprove'");
            sendReposne('success', 'Approved entry');
        }
    }
}

if (isset($_GET['dontApproveCreate'])) {
    $userdat = getUDat();
    if ($userdat){
        if ($userdat['permission'] > 2){
            $idtoapprove = $_GET['dontApproveCreate'];
            $mysqli->query("DELETE FROM disorders WHERE id = '$idtoapprove'");
            sendReposne('success', 'Denied entry');
        }
    }
}

if (isset($_GET['allUnapproved'])) {
    $userdat = getUDat();
    if ($userdat){
        if ($userdat['permission'] > 2){
            $stmt = $mysqli->query("SELECT * FROM disorders WHERE approved = 0 LIMIT 5");
            $unapproved = $stmt->fetch_all(MYSQLI_ASSOC);
            sendReposne('success', json_encode($unapproved));
        } else {
            sendReposne('error', "You don't have coorect permissions");
        }
    } else {
        sendReposne('error', "Not signed in");
    }
}

if (isset($_GET['approveForum'])) {
    $userdat = getUDat();
    if ($userdat){
        if ($userdat['permission'] > 2){
            $idtoapprove = $_GET['approveForum'];
            $mysqli->query("UPDATE forumposts SET approved = 1 WHERE fP_Id = '$idtoapprove'");
            sendReposne('success', 'Approved post');
        }
    }
}

if (isset($_GET['dontApproveForum'])) {
    $userdat = getUDat();
    if ($userdat){
        if ($userdat['permission'] > 2){
            $idtoapprove = $_GET['dontApproveForum'];
            $mysqli->query("DELETE FROM forumposts WHERE fP_Id = '$idtoapprove'");
            sendReposne('success', message: 'Denied post');
        }
    }
}

if (isset($_GET['allUnapprovedForum'])) {
    $userdat = getUDat();
    if ($userdat){
        if ($userdat['permission'] > 2){
            $stmt = $mysqli->query("SELECT * FROM forumposts WHERE approved = 0 LIMIT 10");
            $unapproved = $stmt->fetch_all(MYSQLI_ASSOC);
            sendReposne('success', json_encode($unapproved));
        } else {
            sendReposne('error', "You don't have coorect permissions");
        }
    } else {
        sendReposne('error', "Not signed in");
    }
}

if (isset($_GET['allUnapprovedEdits'])) {
    $result = $mysqli->query("SELECT * FROM edits WHERE approved = 0");
    $edits = [];
    while ($row = $result->fetch_assoc()) {
        $edits[] = $row;
    }
    echo json_encode(["status" => "success", "message" => json_encode($edits)]);
    exit;
}

if (isset($_GET['approveEdit'])) {
    $editId = intval($_GET['approveEdit']);
    $edit = $mysqli->query("SELECT * FROM edits WHERE ed_Id = $editId")->fetch_assoc();
    if ($edit) {
        $disid = $edit['disorderid'];

        $stmt = $mysqli->prepare("UPDATE disorders SET name = ?, description = ? WHERE id = ?");
        $stmt->bind_param("ssi", $edit['name'], $edit['desription'], $disid);
        $stmt->execute();

        $mysqli->query("UPDATE edits SET approved = 1 WHERE ed_Id = $editId");

        $mysqli->query("DELETE FROM disorder_tags WHERE disorderId = '$disid'");

            if (!empty($edit['tags'])) {
                $tags = explode(',', $edit['tags']);
                foreach ($tags as $tag) {
                    $t = trim($mysqli->real_escape_string($tag));
                    if ($t !== '') {
                        $mysqli->query("INSERT INTO disorder_tags (disorderId, tag) VALUES ('$disid', '$t')");
                    }
                }
            }

        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "fail", "message" => "Edit not found."]);
    }
    exit;
}

if (isset($_GET['dontApproveEdit'])) {
    $editId = intval($_GET['dontApproveEdit']);
    $mysqli->query("DELETE FROM edits WHERE ed_Id = $editId");
    echo json_encode(["status" => "success"]);
    exit;
}


if (isset($_POST['propoEdit'])) {
    $disorderId = intval($_POST['disorderId']);
    $title = $_POST['title'];
    $desc = $_POST['desc'];
    $tags = $_POST['tags'];
    $userId = $_SESSION['user_id'];

    $stmt = $mysqli->prepare("INSERT INTO edits (disorderid, userid, name, desription, tags) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("iisss", $disorderId, $userId, $title, $desc, $tags);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Edit proposed"]);
    } else {
        echo json_encode(["status" => "fail", "message" => "Couldnt propose"]);
    }
    exit;
}

?>