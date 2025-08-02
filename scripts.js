//i keep speling wrong
const json = JSON;


var roleNames = ['Member', 'Contributer', 'Moderator', 'Admin'];

var searchInput = document.getElementById('searchInput');
var tagContainer = document.getElementById('tagContainer');
var results = document.getElementById('results');
var disorderDescription = document.getElementById("disorderDescription");
var disorderId = new URLSearchParams(window.location.search).get("id");
var disorderSearch = new URLSearchParams(window.location.search).get("search");
var user = false;


//removed
var divDefs = [];
var divDefSep = 'icantusesymbolssoitsgonnabelongtext';
let activeDiv = null;
let editingDivIndex = null;
//removed

function loginTest() {
    fetch('server.php?logged_in=1')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                user = JSON.parse(data.message);
                if (document.getElementById('loginsignup')) {
                    document.getElementById('loginsignup').innerHTML = '<li><a href="account.html">Account</a></li>'
                }
                if (user.permission > 1 && !document.getElementById('adminheaderbut')) {
                    document.getElementsByClassName('navlinks')[0].innerHTML += '<li><a id="adminheaderbut" href="admin.html">Admin</a></li>'
                }
                if (window.location.href.includes('account.html')) {
                    loadsettings();
                }
                settings = JSON.parse(user.settings);
                onloadUser();
                return true;
            } else if (data.status === 'fail') {
                if (document.getElementsByClassName('testLogin').length > 0) {
                    if (!document.getElementById('genericModalBg')) {
                        opengenericmodal('<b>Log in to get the full experience</b></br><a href="login.html">Login</a> <br>or <br><a href="register.html">Register</a></br>Its free and i dont sell your information');
                    }
                }
                if (document.getElementsByClassName('forceLogin').length > 0) {
                    window.location.href = 'login.html'
                }
                onloadUser();
                return false;
            }
        })
        .catch(err => {
            onloadUser();
            return false;
        });
}

var settings = [];

var defaultSettings = {
    forumResultsPerPage: 10,
    showTimestamp: true
};

var doSettOnce = false;

function loadsettings() {
    if (user && !doSettOnce) {
        //console.log('loafsettings')
        settings = JSON.parse(user.settings);
        var cont = document.getElementById('settingsContainer');

        Object.entries(defaultSettings).forEach(([key, val]) => {
            var kee = (key)
            if (settings[kee] == undefined) {
                console.log(kee)
                settings[kee] = val;
            }
        })

        Object.entries(settings).forEach(([key, val]) => {
            //console.log(setting)
            //console.log(settings[setting])
            var label = document.createElement('label');
            label.setAttribute('for', `setting${key}`);
            label.textContent = key;

            //input types
            let input;
            if (typeof val === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = val;
            } else if (!isNaN(val)) {
                input = document.createElement('input');
                input.type = 'number';
                input.addEventListener('change', () => {
                    input.value = Math.trunc(input.value);
                })
                input.value = val;
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = val;
            }

            input.id = `setting${key}`;
            input.dataset.settingKey = key;
            cont.appendChild(label);
            cont.appendChild(input);
            cont.appendChild(document.createElement('br'));
        });

        //show account info
        if (document.getElementById('accUsername')) {
            document.getElementById('accUsername').textContent = user.Username;
            document.getElementById('accEmail').textContent = user.Email;
            document.getElementById('accRole').textContent = roleNames[user.permission] || 'Unknown';
        }
        //do settings only once
        doSettOnce = true;
    }
}

function saveSettings() {
    var newSettings = {};
    var inputs = document.querySelectorAll('#settingsContainer input');

    inputs.forEach(input => {
        var key = input.dataset.settingKey;
        if (input.type === 'checkbox') {
            newSettings[key] = input.checked;
        } else if (input.type === 'number') {
            newSettings[key] = parseFloat(input.value);
        } else {
            newSettings[key] = input.value;
        }
    });

    fetch('server.php?updateSettings=' + JSON.stringify(newSettings))
}

//first login test
loginTest();

function search(searchFor) {
    //GET method the server php for string
    fetch(`server.php?search=${searchFor}`)
        .then(res => res.json())
        .then(data => {
            //clear results div
            results.innerHTML = '';
            data.forEach((dat) => {
                //for each result run the function creating the div
                var da = JSON.parse(dat);
                addDisToSearch(da.id, da.name, da.tags)
            })
        });
}

var tags = [];

if (tagContainer) {
    fetch(`server.php?tags=1`)
        .then(res => res.json())
        .then(tags => {
            //add "all" tag as the first tag
            tags.unshift('all');
            //for every tag make a span
            tagContainer.innerHTML = tags.map(tag =>
                `<span class="tagclicky" onclick="fitlerTag('${tag}')">${tag}</span>`
            ).join('');
        });
}

//function to filter by tag
function fitlerTag(tag) {
    
    var t = tag
    if (t == 'all') {
        //if tag is all then set search to blank
        search('')
        tags = [];
        //window.location.href = 'search.html';
    } else {
        if (tags.includes(t)) {
            tags.splice(tags.indexOf(t), 1);
        } else {
            tags.push(t)
        };
        document.querySelectorAll('.tagclicky').forEach((t) => {
            if (tags.includes(t.innerText)) {
                console.log(t)
                t.className = 'tagclicky selected';
            } else {
                t.className = 'tagclicky';
            }
        })
        tags.forEach((tag) => {
        })
        if (tags.length < 1) {
            search('')
        } else {
            fetch(`server.php?searchtag=${json.stringify(tags)}`)
                .then(res => res.json())
                .then(data => {
                    //clear results and for each retrieved entry run the addDisToSearch function
                    results.innerHTML = '';
                    data.forEach((dat) => {
                        var da = JSON.parse(dat)
                        addDisToSearch(da.id, da.name, da.tags)
                    })
                });
        }
    }
}

function addDisToSearch(id, name, tags) {
    //create the element to append
    var entryEl = document.createElement('div')
    entryEl.innerHTML = `<a href="disorder.html?id=${id}"><b>${name}</b></a><ul></ul>`;
    entryEl.className = 'disorder-entry'
    results.appendChild(entryEl)
    //get the tags in JSON
    var tagss = JSON.parse(tags);
    tagss.forEach((tag) => {
        //console.log(tag)
        //for each tag
        var tagli = document.createElement('li')
        tagli.innerHTML = `<span class="tag" onclick="fitlerTag('${tag.tag}')">${tag.tag}</span>`
        entryEl.getElementsByTagName('ul')[0].append(tagli)
    })
    //if sometimes doesnt work but if the users perms mod or above allow to delete
    function addoptions() {
        if (user.permission > 1) {
            //create options div
            var options = document.createElement('div')
            var deletebutton = document.createElement('button')
            deletebutton.className = 'logout-button'
            deletebutton.innerText = 'delete';
            //add the delete button
            options.append(deletebutton);
            deletebutton.addEventListener('click', () => {
                deleteDisorder(id, name);
            })
            entryEl.append(options)
        }
    }
    if (user) {
        addoptions();
    }
}

// Code from side project: Gamble Classroom
function opengenericmodal(inner) {
    //this code is from a chrome extension so it creates all the divs and doesnt use classes just styles
    var bg = document.createElement('div');
    bg.style = `
    position: fixed; top:0; left:0; width:100vw; height:100vh;
    background: rgba(0,0,0,0.6); z-index:10000;
  `;
    bg.id = 'genericModalBg';
    bg.addEventListener('click', () => document.body.removeChild(wraper));
    var wraper = document.createElement('div');
    wraper.id = 'genericModal';
    wraper.style = `
    position: fixed; top:0; left:0; width:100vw; height:100vh;
    display: flex; align-items: center; justify-content: center;
    z-index: 10001;
  `;
    var box = document.createElement('div');
    box.style = `
    background: white; border-radius: 10px;
    padding: 20px; max-width: 80vw; max-height: 80vh;
    overflow-y: auto; text-align: center;
    box-shadow: 0 0 15px rgba(0,0,0,0.3);
    z-index: 10001;
  `;
    box.innerHTML = inner;

    wraper.appendChild(bg);
    wraper.appendChild(box);
    document.body.appendChild(wraper);
}


function deleteDisorder(id, name) {
    if (user.permission > 1) {
        //make sure theres a warning for deleting
        var confirm = window.confirm('Are you 100 percent sure you want to delete ' + name + ', id of ' + id + ' ?');
        if (confirm) {
            //if user confirms
            fetch('server.php?deleteDisorder=' + id)
                .then(() => {
                    //set the search to all
                    search('')
                })
        }
    }
}

var tagsContainer = document.getElementById("disorderTags");

document.addEventListener('DOMContentLoaded', () => {
    //login test, for some reason there needs to be one before DOMcontent loaded and after
    loginTest();
})

//reusablehtmlcode
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("header")) {
        //if header div found then add the real header
        fetch("reusable/header.html")
            .then((response) => response.text())
            .then((data) => {
                document.getElementById("header").innerHTML = data;
            });
    }
    if (document.getElementById('footer')) {
        //if header div found then add the real header
        fetch("reusable/footer.html")
            .then((response) => response.text())
            .then((data) => {
                document.getElementById("footer").innerHTML = data;
            });
    }
});

//edit stuff

var editable = document.getElementById('disorderDescription');
var titleEdit = document.getElementById('disorderTitle');
var tb = document.getElementById('editorToolbar');

function getRange() {
    //get selection
    var sel = window.getSelection();
    if (sel.rangeCount > 0) {
        //if range count is over 0 then get the first
        return sel.getRangeAt(0);
    }
    var range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    return range;
}

//add tags around selected text
function makeSel(tagName) {
    var range = getRange();
    if (range.collapsed) return;
    //create wrap element
    var wrappa = document.createElement(tagName);
    wrappa.appendChild(range.extractContents());
    //insert the wrapping element around the range
    range.insertNode(wrappa);
    var sel = window.getSelection();
    sel.removeAllRanges();
    var newRang = document.createRange();
    newRang.selectNodeContents(wrappa);
    sel.addRange(newRang);
}

if (tb) {
    tb.addEventListener('click', e => {
        var cmd = e.target.dataset.cmd;
        //changes the selection based on cmd custom attribute (proof i can do switch statements and custom attributes)
        if (!cmd) return;
        switch (cmd) {
            case 'bold':
                makeSel('strong');
                break;
            case 'it':
                makeSel('em');
                break;
            case 'ul':
                makeSel('u');
                break;
            case 'ulist':
                makeSel('li');
                break;
        }
        editable.focus();
    });

    //remove the tag element
    function remvTag(e) {
        e.currentTarget.remove();
        //editdis()
    }

    function editdis() {
        var storedDesc = disorderDescription.innerHTML;

        //create params for edit post
        var params = new URLSearchParams();
        //params.append('editDisorder', '1');
        params.append('propoEdit', '1');
        params.append('disorderId', disorderId);
        params.append('title', document.getElementById('disorderTitle').innerHTML);
        params.append('desc', storedDesc);

        //get all tag spans and create and array of tags + filter and trim, then append the array to the posts params
        var tagSpans = document.querySelectorAll('#disorderTags .tag');
        var tags = Array.from(tagSpans)
            .map(s => s.innerText.trim())
            .filter(t => t.length > 0);
        params.append('tags', tags.join(','));

        //send edit POST with the earlier params
        return fetch('server.php', {
            method: 'POST',
            body: params
        })
            .then(res => res.json())
            .then(data => {
                if (data.status != 'success') {
                    //send error message if not successfully
                    opengenericmodal('Failed to edit entry: <br>' + data.message);
                }
            })
    }

    var editMode = false;

    function edittoggle(e) {
        //toggle edit mode
        editMode = !editMode

        //make the title and main editable stuff editable
        editable.contentEditable = editMode;
        titleEdit.contentEditable = editMode;

        //set toolbar visibility based on editmode
        tb.style.display = editMode ? 'flex' : 'none';

        if (editMode) {

            //focus on the editable
            editable.focus();

            //editable.addEventListener('input', editdis)
            //titleEdit.addEventListener('input', editdis)

            tagsContainer.querySelectorAll('.tag').forEach(span => {
                span.setAttribute('contenteditable', false);
                span.style.cursor = 'pointer';
                //if you click on the tag in edit mode then remove the tag
                //for a later update add a dedicated remove button the the element
                span.addEventListener('click', remvTag);
            });
            var input = document.createElement('input');
            input.id = 'newTagInput';
            input.placeholder = 'New tag';
            var btn = document.createElement('button');
            btn.id = 'addTagBtn';
            btn.innerText = 'Add';
            btn.addEventListener('click', () => {
                var v = input.value.trim();
                //if the tag value isnt valid then dont add it
                if (!v) return;
                //create a tag element
                var tagspan = document.createElement('span');
                tagspan.className = 'tag';
                tagspan.innerText = v;
                tagspan.style.cursor = 'pointer';
                tagspan.addEventListener('click', remvTag);
                //put the tag above the input
                tagsContainer.insertBefore(tagspan, input);
                input.value = '';
                //editdis()
            });
            //add the tag creating stuff
            tagsContainer.appendChild(input);
            tagsContainer.appendChild(btn);

            //set the buttons text to say save so people know you have to save your changes
            e.target.innerText = 'save';
        } else {
            //editable.removeEventListener('input', editdis);
            //titleEdit.removeEventListener('input', editdis)

            tagsContainer.querySelectorAll('.tag').forEach(tagspan => {
                tagspan.removeEventListener('click', remvTag);
                tagspan.style.cursor = '';
            });
            var oldInput = document.getElementById('newTagInput');
            var oldBtn = document.getElementById('addTagBtn');
            if (oldInput) oldInput.remove();
            if (oldBtn) oldBtn.remove();

            //set the buttons text to say edit again
            e.target.innerText = 'edit';

            //save changes
            editdis();
        }
    }
}

//login signup functions
function login(username, password) {
    //create params for the post and add inputs from page to it
    var params = new URLSearchParams();
    params.append('login', '1');
    params.append('username', username);
    params.append('password', password);

    fetch('server.php', {
        method: 'POST',
        body: params
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                //if successful then open homepage
                window.location.href = 'index.html';
            } else {
                //display error messages for logging in
                document.getElementsByClassName('error-message')[0].innerHTML = data.message;
            }
        })
        .catch(err => {
            console.error('Login error:', err);
            //I cant remember why or whats gonna catch
            throw err;
        });
}

function register(username, email, password) {
    //create params for the post and add inputs from page to it
    var params = new URLSearchParams();
    params.append('register', '1');
    params.append('username', username);
    params.append('password', password);
    params.append('email', email);

    fetch('server.php', {
        method: 'POST',
        body: params
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                //if successfully registered then open the homepage
                window.location.href = 'index.html';
            } else {
                //display the error message like if pw too short or etc
                document.getElementsByClassName('error-message')[0].innerHTML = data.message;
            }
        })
}

//logout function that reloads the page
function logout() {
    fetch('server.php?logout=1')
        .then(window.location.reload());
}


//used to be a modal btw
if (document.getElementById('cahngepw')) {
    document.getElementById('cahngepw').addEventListener('click', () => {
        if (document.getElementById('changepwmodal').className == 'changepwmodalhidden') {
            document.getElementById('changepwmodal').className = 'changepwmodal';
        } else {
            document.getElementById('changepwmodal').className = 'changepwmodalhidden';
        }
    });
}

//change password function
if (document.getElementById('changePassword')) {
    document.getElementById('changePassword').addEventListener('click', () => {
        //create params for the post and add stuff to it
        var params = new URLSearchParams();
        params.append('changePw', '1');
        params.append('olPw', document.getElementById('olPw').value);
        params.append('newPw1', document.getElementById('newPw1').value);
        params.append('newPw2', document.getElementById('newPw2').value);
        //do a post with the earlier params
        fetch('server.php', {
            method: 'POST',
            body: params
        })
            .then(res => res.json)
            .then(data => {
                if (data.status == 'success') {
                    opengenericmodal('Password changed successfully <br> <a onclick="refreshpage()">refresh page</a>');
                } else {
                    document.getElementById('passwordError').innerText = data.message;
                }
            })
    });
}

function refreshpage() {
    window.location.reload();
}

var forumId = new URLSearchParams(window.location.search).get("forumid");

var forumresults = document.getElementById('forumsresults');
var forumtitle = document.getElementById('forumtitleshow');

function loadforumposts(page = 1) {
    var resperpage = settings.forumResultsPerPage || 10
    fetch(`server.php?GetForums=${resperpage}&page=${page}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                var paylod = JSON.parse(data.message);
                var forums = paylod.forums;
                var total = paylod.total;
                var curr = paylod.page;
                var limit = paylod.limit;
                var pages = Math.ceil(total / limit);

                forumresults.innerHTML = '';

                forums.forEach(forum => {
                    //create a div containing both the options and the link
                    var divwithboth = document.createElement('div')
                    forumresults.appendChild(divwithboth)
                    //if user is admin or above then allow them to delete forum posts
                    if (user.permission > 2) {
                        divwithboth.innerHTML += '<button onclick="deleteforum(' + forum.fP_Id + ')"></button>';
                    };
                    //add the forum post to the html as a link that can be clicked
                    divwithboth.innerHTML += `<a class="forumPost" href="forumpage.html?forumid=${forum.fP_Id}"><b>${forum.FTitle}</b> <br> <span>${forum.FDesc}</span></a>`
                });
                
                let pager = document.createElement('div');
                pager.className = 'pager';
                if (curr > 1) {
                    let prev = document.createElement('button');
                    prev.textContent = '<';
                    pager.appendChild(prev);
                    prev.addEventListener('click', () => {
                        loadforumposts(curr - 1);
                    });
                }
                if (isFinite(pages)) {
                    for (let p = 1; p <= pages; p++) {
                        let btn = document.createElement('button');
                        btn.textContent = p;
                        pager.appendChild(btn);
                        if (p === curr) {
                            btn.disabled = true;
                        }
                        btn.addEventListener('click', () => {
                            loadforumposts(p);
                        });
                    }
                }
                if (curr < pages) {
                    let next = document.createElement('button');
                    next.textContent = '>';
                    pager.appendChild(next);
                    next.addEventListener('click', () => {
                        loadforumposts(curr + 1);
                    });
                }
                if (pages > 0) {
                    var pgbar = document.getElementById('pagebar')
                    pgbar.innerHTML = '';
                    var bdcr = pgbar.getBoundingClientRect();
                    //pgbar.style.top = ((limit - forums.length) * 170) + 'px';
                    forumresults.style.minHeight = ((limit - forums.length) * 170) + 'px';
                    pgbar.appendChild(pager);
                }
            }
        });
}

//delete forum post
function deleteforum(id) {
    fetch('server.php?deleteforumpost=' + id)
        .then(res => res.json())
        .then(data => {
            if (data.status == 'success') {
                //if successful then say deleted and reload all the forumposts
                opengenericmodal('Forum page deleted.');
                loadforumposts();
            } else {
                //if error then show the message like if someone tries to delete without the right perms then it tells them
                opengenericmodal(data.message);
            }
        })
}

var adminpg = document.getElementById('admin');

function adminpgload() {
    if (user) {
        if (user.permission > 1) {
            adminpg.innerHTML = '';
            //load all the create entries that need to be approved
            fetch('server.php?allUnapproved=1')
                .then(res => res.json())
                .then(dat => {
                    if (dat.status == 'success') {
                        var TBA = json.parse(dat.message);
                        TBA.forEach((entToBeApproved) => {
                            var ETBADiv = document.createElement('div')
                            ETBADiv.className = 'ETBADiv'
                            var desc = entToBeApproved.description.includes(divDefSep) ? entToBeApproved.description.split(divDefSep)[1] : entToBeApproved.description;
                            ETBADiv.innerHTML = `<div class="inner"><H3>${entToBeApproved.name}</H3><p>${desc}</p></div><div class="sider"><button onclick="aprovecreate(${entToBeApproved.id}, true)">approve</button><button onclick="aprovecreate(${entToBeApproved.id}, false)">denied</button></div>`
                            adminpg.append(ETBADiv)
                        })
                    };
                })
            //load all the edits on entries that need to be approved
            fetch('server.php?allUnapprovedEdits=1')
                .then(res => res.json())
                .then(dat => {
                    if (dat.status == 'success') {
                        var edits = JSON.parse(dat.message);
                        edits.forEach((edit) => {
                            var edDiv = document.createElement('div');
                            edDiv.className = 'editApproval';

                            //console.log(edit)

                            edDiv.innerHTML = `
                    <div class="inner">
                        <h3>Proposed Edit: ${edit.name}</h3>
                        <p>${edit.desription}</p>
                        <p>Tags: ${edit.tags}</p>
                        <p>Disorder ID: ${edit.disorderid}</p>
                    </div>
                    <div class="sider">
                        <button onclick="approveEdit(${edit.ed_Id}, true)">Approve</button>
                        <button onclick="approveEdit(${edit.ed_Id}, false)">Deny</button>
                    </div>`;
                            adminpg.appendChild(edDiv);
                        });
                    }
                });
            //load all the create forum posts that need to be approved
            fetch('server.php?allUnapprovedForum=1')
                .then(res => res.json())
                .then(dat => {
                    if (dat.status == 'success') {
                        var TBA = json.parse(dat.message);
                        TBA.forEach((FToBeApproved) => {
                            var ForDiv = document.createElement('div')
                            ForDiv.className = 'ForDiv'
                            ForDiv.innerHTML = `<div class="inner"><H3>${FToBeApproved.FTitle}</H3><p>${FToBeApproved.FDesc}</p></div><div class="sider"><button onclick="aproveforum(${FToBeApproved.fP_Id}, true)">approve</button><button onclick="aproveforum(${FToBeApproved.fP_Id}, false)">denied</button></div>`
                            adminpg.append(ForDiv)
                        })
                    };
                })
        }
    }
}

//approve like the creation of entries in admin page
function aprovecreate(id,t) {
    if (user) {
        if (user.permission > 1) {
            var apOrNo = t ? 'a' : 'dontA';
            fetch('server.php?' + apOrNo +'pproveCreate=' + id)
                .then(res => res.json())
                .then(data => {
                    if (data.status == 'success') {
                        //if no errors refresh the list of stuff needing approval
                        adminpgload()
                    }
                })
        }
    }
}

//approve forum posts in admin page
function aproveforum(id, t) {
    if (user) {
        if (user.permission > 1) {
            var apOrNo = t ? 'a' : 'dontA';
            fetch('server.php?' + apOrNo + 'pproveForum=' + id)
                .then(res => res.json())
                .then(data => {
                    if (data.status == 'success') {
                        //if no errors refresh the list of stuff needing approval
                        adminpgload()
                    }
                })
        }
    }
}

//in the create swtich between the two create modes
function selectTab(selector,e) {
    var pTabs = document.querySelectorAll('.postTab');
    //hide allof the tabs
    pTabs.forEach((t) => {
        t.style.display = 'none';
    })
    //set the one thats being selected to be visble
    document.getElementById(selector).style.display = 'block';
    if (e) {
        var pTabsButtons = document.getElementsByClassName('tabSwitchinBar')[0].querySelectorAll('button');
        pTabsButtons.forEach((tbut) => {
            tbut.className = ' ';
        })
        e.target.className = 'selectedtab';
    }
}


//approve edit in admin page
function approveEdit(id, t) {
    if (user) {
        if (user.permission > 1) {
            var apOrNo = t ? 'a' : 'dontA';
            fetch('server.php?' + apOrNo + 'pproveEdit=' + id)
                .then(res => res.json())
                .then(data => {
                    if (data.status == 'success') {
                        //if no errors refresh the list of stuff needing approval
                        adminpgload()
                    }
                })
        }
    }
}


//coolbg effect
//note: its called a plexus effect

if (document.getElementsByClassName('bgcanvas').length > 0) {
    var bgcanvas = document.getElementsByClassName('bgcanvas')[0];
    var ctxbg = bgcanvas.getContext('2d');

    var w = bgcanvas.width
    var h = bgcanvas.height
    var speed = 2;
    var siz = {mix:1,max:2}

    //this is really just to prove i can do classes
    class Particle {
        varructor() {
            this.reset();
        }
        reset() {
            //set the default stuff
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() * speed) - (speed / 2);
            this.vy = (Math.random() * speed) - (speed / 2);
            this.size = Math.random() * (siz.max - siz.mix) + siz.mix;
        }
        update() {
            //update position by velocity
            this.x += this.vx;
            this.y += this.vy;
            //bounce off edges if its too close
            if (this.x < 0 || this.x > w) this.vx *= -1;
            if (this.y < 0 || this.y > h) this.vy *= -1;
        }
        draw() {
            //drawing the individual points didnt look as good
            ctxbg.beginPath();
            //ctxbg.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctxbg.fill();
        }
    }

    var particles = [];
    var pcount = 1000;
    for (let i = 0; i < pcount; i++) {
        particles.push(new Particle());
    }

    function draw() {
        ctxbg.clearRect(0, 0, bgcanvas.width, bgcanvas.height)

        ctxbg.strokeStyle = 'rgba(50, 100, 150, 0.2)';
        for (let i = 0; i < particles.length; i++) {
            //for each particle
            var p1 = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                var p2 = particles[j];
                //get distance
                dx = p1.x - p2.x;
                dy = p1.y - p2.y;
                dist = Math.sqrt(dx * dx + dy * dy);
                //if distance is below 200 then draw a line between them
                if (dist < 200) {
                    ctxbg.lineWidth = dist / 100;
                    ctxbg.beginPath();
                    ctxbg.moveTo(p1.x, p1.y);
                    ctxbg.lineTo(p2.x, p2.y);
                    ctxbg.stroke();
                }
            }
        }

        ctxbg.fillStyle = 'rgba(50, 100, 150, 0.5)';
        particles.forEach(p => {
            p.update();
            p.draw();
        });

    }
    function update() {
        draw();
        setTimeout(update, 1);
    }
    update()
}


//cards rotate to mouse on hover
var cards = document.getElementsByClassName('card')
for (let i = 0; i < cards.length; i++) {
    var card = cards[i];
    cardeventl(card)
}

//add the event listener because it doesnt work inside the for loop
function cardeventl(card) {
    card.addEventListener('mouseover', (e) => {
        var rect = card.getBoundingClientRect();
        //calculate middle point of card
        var midde = { x: (rect.x + (rect.width / 2)), y: (rect.y + (rect.height / 2)) };

        //calculate a rotate angle thats clamped between -45 and 45 degrees
        var rotYaw = -0.5 * Math.min(Math.max(midde.x - e.x, -45), 45);
        var rotPitch = 0.5 * Math.min(Math.max(midde.y - e.y, -45), 45);

        //apply transform to card
        card.style.transform = `perspective(1000px) rotateY(${rotYaw}deg) rotateX(${rotPitch}deg)`;
    })
    //remove transform when stopped hovering
    card.addEventListener('mouseout', () => {
        card.style.transform = 'perspective(1000px)'
    })
}

var doonloaduseronce = true;

function onloadUser() {
    if (doonloaduseronce) {
        doonloaduseronce = false;
        if (searchInput) {
            //add the event listener for searchbar
            searchInput.addEventListener('input', () => {
                search(searchInput.value);
            });
            //set default search to all
            search('')
        }

        if (disorderSearch) {
            //if the search tag in url
            //    console.log(disorderSearch)
            fitlerTag(disorderSearch)
        }

        if (disorderId) {
            fetch("server.php?getDisorder=" + disorderId)
                .then(response => response.json())
                .then(data => {
                    //set the title to the retrieved title
                    document.getElementById("disorderTitle").innerHTML = data.name;
                    document.getElementById("titleforEntry").innerHTML = data.name + ' (OpenPsyche)';
                    //remanants from the old advanced css stuff, but should set the description element to the description
                    if (data.description.includes(divDefSep)) {
                        var disDescriptor = data.description.split(divDefSep)
                        disorderDescription.innerHTML = disDescriptor[1];
                        divDefs = JSON.parse(disDescriptor[0])
                    } else {
                        disorderDescription.innerHTML = data.description;
                    }

                    tagsContainer.innerHTML = '';
                    var tags = JSON.parse(data.tags);
                    tags.forEach(tag => {
                        var span = document.createElement("a");
                        span.className = "tag";
                        span.innerHTML = tag.tag;
                        tagsContainer.appendChild(span);
                        span.addEventListener('click', () => {
                            if (!editMode) {
                                window.location.href = 'search.html?search=' + String(tag.tag);
                            } else {
                                console.log(String(tag.tag))
                            }
                        })
                    });
                    if (user) {
                        if (user.banned == 0) {
                            var edBtn = document.createElement('button');
                            edBtn.innerText = 'Edit';
                            console.log('edit')
                            edBtn.addEventListener('click', (e) => edittoggle(e))
                            document.getElementsByTagName('main')[0].append(edBtn)
                        }
                    }
                })
                .catch(err => {
                    //if no then set to blank
                    disorderDescription.innerHTML = "<p>No disorder ID provided.</p>";
                });
        }
        if (forumresults) {
            //dont ask why theres a timeout it just doesnt load without it
            setTimeout(loadforumposts,200)
        }
        if (forumtitle && forumId) {
            //get forum stuff comments and forum
            fetch('server.php?getForumInfo=' + String(forumId))
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        //get the forum part of the forum get
                        var formuminfo = JSON.parse(data.message).forum;
                        forumtitle.innerText = formuminfo.FTitle;
                        document.getElementById('ForumTitle').innerText = formuminfo.FTitle + ' (OpenPsyche)';
                        document.getElementById('forumdesc').innerText = formuminfo.FDesc;
                        document.getElementById('forumdate').innerText = formuminfo.DateMade;
                        document.getElementById('hiddneID').innerHTML = formuminfo.fP_Id;
                        if (formuminfo.ShowUser > 0) {
                            fetch('server.php?simpleudat=' + formuminfo.U_id)
                                .then(res => res.json())
                                .then(dat => {
                                    if (dat.status == 'success') {
                                        document.getElementById('forumAuthor').innerText = json.parse(dat.message).name;
                                    };
                                })
                        }
                        //get the comments part of the forum get
                        var commentinfo = JSON.parse(data.message).comments;
                        //create a comment element for every comment in the forum post thing
                        commentinfo.forEach((comment) => {
                            var commentDiv = document.createElement('div');
                            commentDiv.innerText = comment.comment;
                            var tstamp = document.createElement('span')
                            tstamp.className = 'tStamp';
                            tstamp.innerText = comment.postedon;
                            commentDiv.prepend(document.createElement('br'))
                            commentDiv.prepend(tstamp)
                            commentDiv.className = 'comment';
                            document.getElementById('comments').append(commentDiv);
                            //get some user data from poster like specifically their name and role, no passwords
                            fetch('server.php?simpleudat=' + comment.posterid)
                                .then(res => res.json())
                                .then(dat => {
                                    var commentUInfo = document.createElement('div')
                                    if (dat.status == 'success') {
                                        var posterinfo = json.parse(dat.message);
                                        commentUInfo.innerHTML = '<div class="posterinfo"><b>' + posterinfo.name + '</b><span>' + roleNames[posterinfo.role] + '</span></div>'
                                        //add the user info stuff at the top of the comment
                                        commentDiv.prepend(commentUInfo)
                                    };
                                })
                        })
                    }
                })
        }

        if (adminpg) {
            adminpgload();
            document.getElementById('adminCMD').addEventListener('change', () => {
                runadmincmd()
            });

            document.getElementById('adminCMDsubmit').addEventListener('click', () => {
                runadmincmd()
            });

        }
    }
}

function runadmincmd() {
    var cmd = document.getElementById('adminCMD').value.split('/')[1];
    if (cmd) {
        //split up cmd into parts
        var cmdargs = json.stringify(cmd.split(' '));
        fetch('server.php?runcmd=' + cmdargs)
            .then(res => res.json())
            .then(data => {
                //show cmd run result
                document.getElementById('prevcmds').innerHTML += `> [${data.status}]: ${data.message}`
            })
            .catch(err => {
                //if error show the error in the cmd thing
                document.getElementById('prevcmds').innerHTML += '> ' + err;
            })
    } else {
        //if doent contain a / then display help
        document.getElementById('prevcmds').innerHTML += "> Not a valid command try using '/help' for commands";
    }
    //clear cmd input
    document.getElementById('adminCMD').value = ''
    //add line break after
    document.getElementById('prevcmds').innerHTML += '</br>'
}