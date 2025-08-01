<?php
//debugstuff
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

//connect to SQL
$mysqli = new mysqli("localhost", "root", "root", "sfoftmajorProj");

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

//cookie parameters
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

//get USer Data function
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

//get all unique tags from the disorder tags table
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
    //get user data
    $userData = getUDat();
    if ($userData != false) {
        //if banned is false
        if ($userData['banned'] == 0) {
            $name = $mysqli->real_escape_string($_POST['disorderName']);
            $desc = $mysqli->real_escape_string($_POST['description']);
            $tags = explode(',', $_POST['tags']);
            //do the query
            $mysqli->query("INSERT INTO disorders (name, description) VALUES ('$name', '$desc')");
            //get the ID from the query
            $disorderId = $mysqli->insert_id;
            foreach ($tags as $tag) {
                $tag = trim($mysqli->real_escape_string($tag));
                //every tag in the tag array add a new one into the disorder tags table
                if ($tag) {
                    $mysqli->query("INSERT INTO disorder_tags (disorderId, tag) VALUES ('$disorderId', '$tag')");
                }
            }
            //go it after adding it
            header("Location: disorder.html?id=$disorderId");
            exit;
        }
    }
}

//function to get one individual entry with the tags
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

//function to get all entries with tags included
function getAllDisorder($fQuery) {
    global $mysqli;
    $stmt = $mysqli->query($fQuery . "AND approved = 1 LIMIT 200");
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

//delete
if (isset($_GET['deleteDisorder'])) {
    //check if logged in
    $userData = getUDat();
    if ($userData != false) { 
        //only mods can delete
        if ($userData['permission'] > 1) {
            $disid = intval($_GET['deleteDisorder']);
            //delete tags then the entry
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

function doesaccountthingexist($val,$typ){
    global $mysqli;
    $stmt = $mysqli->query("SELECT * FROM users WHERE '$typ' = '$val'");
    $dat = $stmt->fetch_assoc();
    if ($dat){
        return true;
    } else {
        return false;
    }
}

if (isset($_POST['register'])) {
    $email = trim($_POST['email']);
    $uname = trim($_POST['username']);
    $pw = $_POST['password'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendReposne('fail', 'Invalid email format');
        exit;
    }
    if (strlen($pw) < 8) {
        sendReposne('fail', 'Password must be at least 8 characters');
        exit;
    }
    if (doesaccountthingexist($uname, 'Username')){
        sendReposne('fail', 'User with that username already exists');
        exit;
    }
    if (doesaccountthingexist($email, 'Email')){
        sendReposne('fail', 'User with that email already exists');
        exit;
    }

    if (testValid($email) && testValid($uname) && testValid($pw)){
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

if (isset($_GET['GetForums'])) {
    $limit = intval($_GET['GetForums']);
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $offset = ($page - 1) * $limit;
    $countRes = $mysqli->query("SELECT COUNT(*) FROM forumposts WHERE approved = 1");
    $totRow = $countRes->fetch_assoc();
    $total = intval($totRow['COUNT(*)']);
    //Select all the forum posts that are approved that are withinthe range
    $stmt = $mysqli->prepare("SELECT * FROM forumposts WHERE approved = 1 ORDER BY DateMade DESC LIMIT ? OFFSET ?");
    $stmt->bind_param("ii", $limit, $offset);
    $stmt->execute();
    $forums = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    sendReposne('success', json_encode([
        'forums' => $forums,
        'total'  => $total,
        'page'   => $page,
        'limit'  => $limit,
    ]));
}


if (isset($_POST['postForumTitle'])){
    $title = $_POST['postForumTitle'];
    $desc = $_POST['postForumDesc'];
    $userId = getUDat()['U_id'];
    $showUser = 1;
    if ($_POST['anonymouseMode']){
        $showUser = 0;
    };
    if ($getUDat()){
        $mysqli->query("INSERT INTO forumposts (FTitle, FDesc, U_id, ShowUser) VALUES ('$title', '$desc', '$userId', '$showUser')");
        $forumid = $mysqli->insert_id;
        header("Location: forumpage.html?forumid=$forumid");
    }
}

if (isset($_GET['getForumInfo'])){
    $fpid = $_GET['getForumInfo'];
    $stmt = $mysqli->query("SELECT * FROM forumposts WHERE fP_Id = '$fpid'"); 
    $forums = $stmt->fetch_assoc();
    if ($forums['ShowUser'] > 0){
        $udat = getUDat();
        if ($udat){
            if ($udat['U_id'] != $forums['U_id']){
                unset($forums['U_id']);
            };
        };
    }
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
        if ($userdat['banned'] == 0){
            $usid = $userdat["U_id"];
            $mysqli->query("INSERT INTO comments (forumid, comment, posterid) VALUES ('$forumid', '$comment', '$usid')");
            header("Location: forumpage.html?forumid=$forumid");
        } else {
            header("Location: index.html");
        }
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
    sendReposne("success", json_encode($edits));
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

        sendReposne('success', 'Edit approved.');
    } else {
        sendReposne('error', 'Edit not found.');
    }
    exit;
}

if (isset($_GET['dontApproveEdit'])) {
    $editId = intval($_GET['dontApproveEdit']);
    $mysqli->query("DELETE FROM edits WHERE ed_Id = $editId");
    sendReposne("success", "Edit denied");
}


if (isset($_POST['propoEdit'])) {
    $disorderId = intval($_POST['disorderId']);
    $title = $_POST['title'];
    $desc = $_POST['desc'];
    $tags = $_POST['tags'];
    $userId = $_SESSION['user_id'];

    $stmt = $mysqli->prepare("INSERT INTO edits (disorderid, userid, name, desription, tags) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("iisss", $disorderId, $userId, $title, $desc, $tags);
}


if (isset($_GET['deleteforumpost'])){
    $userdat = getUDat();
    if ($userdat['permission'] > 1){
            $fpid = $_GET['deleteforumpost'];
            $mysqli->query("DELETE FROM forumposts WHERE fP_Id = '$fpid'");
            $mysqli->query("DELETE FROM comments WHERE forumid = '$fpid'");
            sendReposne('success', "done.");
    } else {
        sendReposne('error', "You don't have correct permissions.");
    }
}

if (isset($_POST['changePw'])){
    $userdat = getUDat();
    if (password_verify($_POST['olPw'],$userdat['pasword'])){
        if ($userdat){
            $pw1 = $_POST['newPw1'];
            $pw2 = $_POST['newPw2'];
            if ($pw1 == $pw2){
                $pw = password_hash($pw1, PASSWORD_DEFAULT);
                $stmt = $mysqli->prepare("UPDATE users SET pasword = ? WHERE U_id = ?");
                $stmt->bind_param("si", $pw, $userid);
                $stmt->execute();
                sendReposne('success', "password Changed");
            } else {
                sendReposne('error', "Passwords don't match.");
            }
        }
    } else {
	sendReposne('error', 'Wrong password.');
    }
}

if (isset($_GET['updateSettings'])) {
    $userdat = getUDat();
    if (!$userdat) {
        sendReposne('error', 'not logged in');
    } else{
        $userid = $userdat['U_id'];
        $newSettings = $_GET['updateSettings'];
        $stmt = $mysqli->prepare("UPDATE users SET settings = ? WHERE U_id = ?");
        $stmt->bind_param("si", $newSettings, $userid);
        $stmt->execute();
    };
};

if (isset($_GET['runcmd'])) {
    $userdat = getUDat();
    if (!$userdat) {
        sendReposne('error', 'not logged in');
    } else {
        if ($userdat['permission'] > 2){
            $cmdargs = json_decode($_GET['runcmd']);
            if ($cmdargs[0] == 'ban') {
                $banee = $cmdargs[1];
                $stmt = $mysqli->prepare("UPDATE users SET banned = 1 WHERE Username = '$banee'");
                if ($stmt->execute()){
                    sendReposne('success', 'Successfully banned '. $cmdargs[1]);
                }
            } else if ($cmdargs[0] == 'banEmail') {
                $banee = $cmdargs[1];
                $stmt = $mysqli->prepare("UPDATE users SET banned = 1 WHERE Email = '$banee'");
                $stmt->bind_param("i",$cmdargs[1]);
                if ($stmt->execute()){
                    sendReposne('success', 'Successfully banned '. $cmdargs[1]);
                }
            } else if ($cmdargs[0] == 'unban') {
                $banee = $cmdargs[1];
                $stmt = $mysqli->prepare("UPDATE users SET banned = 0 WHERE Username = '$banee'");
                if ($stmt->execute()){
                    sendReposne('success', 'Successfully banned '. $cmdargs[1]);
                }
            } else if ($cmdargs[0] == 'unbanEmail') {
                $banee = $cmdargs[1];
                $stmt = $mysqli->prepare("UPDATE users SET banned = 0 WHERE Email = '$banee'");
                $stmt->bind_param("i",$cmdargs[1]);
                if ($stmt->execute()){
                    sendReposne('success', 'Successfully banned '. $cmdargs[1]);
                }
            } else if ($cmdargs[0] == 'help'){
                sendReposne('success', 'list of commands: </br>> /ban <username>: bans a user based on username </br>>  /banEmail <email>: bans a user based on email');
            };
        }
        sendReposne('error', 'Incorrect permissions.');
    }
}
?>