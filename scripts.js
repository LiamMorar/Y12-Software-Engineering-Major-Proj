//i keep speling wrong
const json = JSON;


var divDefs = [];
var divDefSep = 'icantusesymbolssoitsgonnabelongtext';

var roleNames = ['Member', 'Contributer', 'Moderator', 'Admin'];

var searchInput = document.getElementById('searchInput');
var tagContainer = document.getElementById('tagContainer');
var results = document.getElementById('results');
var disorderDescription = document.getElementById("disorderDescription");
var disorderId = new URLSearchParams(window.location.search).get("id");
var disorderSearch = new URLSearchParams(window.location.search).get("search");
var user = false;

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
                return false;
            }
        })
        .catch(err => {
            return false;
        });
}

document.addEventListener('DOMContentLoaded', loginTest);

function search(searchFor) {
    fetch(`server.php?search=${searchFor}`)
        .then(res => res.json())
        .then(data => {
            results.innerHTML = '';
            data.forEach((dat) => {
                var da = JSON.parse(dat);
                addDisToSearch(da.id, da.name, da.tags)
            })
        });
}

if (tagContainer) {
    fetch(`server.php?tags=1`)
        .then(res => res.json())
        .then(tags => {
            tags.unshift('all')
            tagContainer.innerHTML = tags.map(tag =>
                `<span onclick="fitlerTag('${tag}')">${tag}</span>`
            ).join('');
        });
}

function fitlerTag(tag) {
    var t = tag
    if (t == 'all') {
        search('')
        window.location.href = 'search.html'
    } else {
        fetch(`server.php?tag=${t}`)
            .then(res => res.json())
            .then(data => {
                results.innerHTML = '';
                data.forEach((dat) => {
                    var da = JSON.parse(dat)
                    addDisToSearch(da.id, da.name, da.tags)
                })
            });
    }
}

function addDisToSearch(id, name, tags) {
    var entryEl = document.createElement('div')
    entryEl.innerHTML = `<a href="disorder.html?id=${id}"><b>${name}</b></a><ul></ul>`;
    entryEl.className = 'disorder-entry'
    results.appendChild(entryEl)
    var tagss = JSON.parse(tags);
    tagss.forEach((tag) => {
        //console.log(tag)
        var tagli = document.createElement('li')
        tagli.innerHTML = `<span class="tag" onclick="fitlerTag('${tag.tag}')">${tag.tag}</span>`
        entryEl.getElementsByTagName('ul')[0].append(tagli)
    })
    function addoptions() {
        if (user.permission > 1) {
            var options = document.createElement('div')
            var deletebutton = document.createElement('button')
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

//tbd remove gambleclassroom code
function opengenericmodal(inner) {
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
//please remember to remove this before sending it to calder

function deleteDisorder(id, name) {
    if (user.permission > 1) {
        var confirm = window.confirm('Are you 100 percent sure you want to delete ' + name + ', id of ' + id + ' ?');
        if (confirm) {
            fetch('server.php?deleteDisorder=' + id)
                .then(() => {
                    search('')
                })
        }
    }
}

var tagsContainer = document.getElementById("disorderTags");

document.addEventListener('DOMContentLoaded', () => {
    loginTest();
    setTimeout(() => {
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                search(searchInput.value);
            });
            search('')
        }

        if (disorderSearch) {
            //    console.log(disorderSearch)
            fitlerTag(disorderSearch)
        }
    }, 100);
    if(disorderId) {
        fetch("server.php?getDisorder=" + disorderId)
            .then(response => response.json())
            .then(data => {
                window.dat = data;
                console.log(data)
                document.getElementById("disorderTitle").innerHTML = data.name;
                if (data.description.includes(divDefSep)) {
                    var disDescriptor = data.description.split(divDefSep)
                    disorderDescription.innerHTML = disDescriptor[1];
                    divDefs = JSON.parse(disDescriptor[0])
                } else {
                    disorderDescription.innerHTML = data.description;
                }

                tagsContainer.innerHTML = '';
                var tags = JSON.parse(data.tags);
                console.log(tags)
                tags.forEach(tag => {
                    var span = document.createElement("a");
                    span.className = "tag";
                    span.innerHTML = tag.tag;
                    tagsContainer.appendChild(span);
                    span.addEventListener('click', () => {
                        span.href = 'search.html?search=' + String(tag.tag);
                    })
                });
                if (user.permission > 1) {
                    var edBtn = document.createElement('button');
                    edBtn.innerText = 'Edit';
                    console.log('edit')
                    edBtn.addEventListener('click', () => edittoggle())
                    document.getElementsByTagName('main')[0].append(edBtn)
                }
            })
            .catch(err => {
                console.log(err);
                disorderDescription.innerHTML = "<p>No disorder ID provided.</p>";
            });
    }
})

//reusablehtmlcode
document.addEventListener("DOMContentLoaded", function () {
    fetch("reusable/header.html")
        .then((response) => response.text())
        .then((data) => {
            document.getElementById("header").innerHTML = data;
        });
    fetch("reusable/footer.html")
        .then((response) => response.text())
        .then((data) => {
            //document.getElementById("footer").innerHTML = data;
        });
});

//edit stuff

let activeDiv = null;
let editingDivIndex = null;

var editable = document.getElementById('disorderDescription');
var titleEdit = document.getElementById('disorderTitle');
var tb = document.getElementById('editorToolbar');
var divModal = document.getElementById('divModal');
var divSelector = document.getElementById('divSelector');
var divStyles = document.getElementById('divStyles');
var palette = document.getElementById('divPalette');
var pItems = document.getElementById('pItems');
var divToolbar = document.getElementById('divToolbar');

function getRange() {
    var sel = window.getSelection();
    if (sel.rangeCount > 0) {
        return sel.getRangeAt(0);
    }
    var range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    return range;
}

function makeSel(tagName) {
    var range = getRange();
    if (range.collapsed) return;
    var wrappa = document.createElement(tagName);
    wrappa.appendChild(range.extractContents());
    range.insertNode(wrappa);
    var sel = window.getSelection();
    sel.removeAllRanges();
    var newRang = document.createRange();
    newRang.selectNodeContents(wrappa);
    sel.addRange(newRang);
}

function insertHTML(htmlString) {
    var range = getRange();
    var frag = document.createRange().createContextualFragment(htmlString);
    range.insertNode(frag);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function insertImg(src) {
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    var range = getRange();
    range.insertNode(img);
    range.setStartAfter(img);
    range.setEndAfter(img);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

if (tb) {
    tb.addEventListener('click', e => {
        var cmd = e.target.dataset.cmd;
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

    document.getElementById('imgBtn').addEventListener('click', () => {
        var url = prompt('Image URL:');
        if (url) insertImg(url);
        editable.focus();
    });

    document.getElementById('vidBtn').addEventListener('click', () => {
        var url = prompt('video URL:');
        if (url) {
            var html = `
      <div contenteditable="false">
        <iframe src="${url}"
                width="560" height="315"
                frameborder="0" allowfullscreen>
        </iframe>
      </div><br>`;
            insertHTML(html);
        }
        editable.focus();
    });


    document.getElementById('addDivBtn').addEventListener('click', () => {
        divSelector.value = '';
        divStyles.value = '';
        divModal.style.display = 'flex';
    });

    document.getElementById('cancelDivDef').addEventListener('click', () => {
        divModal.style.display = 'none';
    });

    document.getElementById('saveDivDef').addEventListener('click', () => {
        var sel = divSelector.value.trim();
        var st = divStyles.value.trim();
        if (!sel || !st) return alert('Both selector and styles are required.');

        if (editingDivIndex === null) {
            divDefs.push({ selector: sel, styles: st });
        } else {
            divDefs[editingDivIndex] = { selector: sel, styles: st };
        }

        editingDivIndex = null;
        divModal.style.display = 'none';
        renderPalette();
    });

    function renderPalette() {
        pItems.innerHTML = '';
        divDefs.forEach((d, i) => {
            var item = document.createElement('div');
            item.className = 'palette-item';
            item.draggable = true;
            item.dataset.index = i;

            var label = document.createElement('span');
            label.innerText = d.selector;
            item.appendChild(label);

            var btn = document.createElement('button');
            btn.textContent = 'edit';
            btn.style.marginLeft = '6px';
            btn.addEventListener('click', e => {
                e.stopPropagation();
                divSelector.value = d.selector;
                divStyles.value = d.styles;
                editingDivIndex = i;
                divModal.style.display = 'flex';
            });
            item.appendChild(btn);

            item.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', i);
            });

            pItems.appendChild(item);
        });

        palette.style.display = divDefs.length ? 'block' : 'none';
    }

    cancelDivDef.addEventListener('click', () => {
        editingDivIndex = null;
        divModal.style.display = 'none';
    });


    editable.addEventListener('dragover', e => e.preventDefault());
    editable.addEventListener('drop', e => {
        e.preventDefault();
        var idx = e.dataTransfer.getData('text/plain');
        if (idx !== '') {
            var def = divDefs[idx];
            var newDiv = document.createElement('div');
            newDiv.className = 'inserted-div';
            if (def.selector.startsWith('.'))
                newDiv.classList.add(def.selector.slice(1));
            else if (def.selector.startsWith('#'))
                newDiv.id = def.selector.slice(1);
            newDiv.setAttribute('style', def.styles);
            newDiv.innerHTML = '<p>Editable content…</p>';
            var range = document.caretRangeFromPoint(e.clientX, e.clientY);
            if (range) {
                range.insertNode(newDiv);
            } else {
                editable.appendChild(newDiv);
            }
            return;
        }
        var file = e.dataTransfer.files[0];
        if (file && /^image\//.test(file.type)) {
            var reader = new FileReader();
            reader.onload = () => {
                insertImg(reader.result);
            };
            reader.readAsDataURL(file);
        }
    });


    editable.addEventListener('mouseover', e => {
        if (!editMode) return;
        var div = e.target.closest('.inserted-div');
        if (div && editable.contains(div)) {
            activeDiv = div;
            var r = div.getBoundingClientRect();
            divToolbar.style.top = (window.scrollY + r.top - divToolbar.offsetHeight - 4) + 'px';
            divToolbar.style.left = (window.scrollX + r.left + r.width - divToolbar.offsetWidth) + 'px';
            divToolbar.style.display = 'block';
        }
    });

    editable.addEventListener('mouseout', e => {
        if (!editMode) return;
        if (e.relatedTarget && divToolbar.contains(e.relatedTarget)) return;
        divToolbar.style.display = 'none';
    });


    function remvTag(e) {
        e.currentTarget.remove();
        editdis()
    }

    function editdis() {
        var storedDesc = JSON.stringify(divDefs) + divDefSep + disorderDescription.innerHTML;

        var params = new URLSearchParams();
        params.append('editDisorder', '1');
        params.append('disorderId', disorderId);
        params.append('title', document.getElementById('disorderTitle').innerHTML);
        params.append('desc', storedDesc);

        var tagSpans = document.querySelectorAll('#disorderTags .tag');
        var tags = Array.from(tagSpans)
            .map(s => s.innerText.trim())
            .filter(t => t.length > 0);
        params.append('tags', tags.join(','));

        return fetch('server.php', {
            method: 'POST',
            body: params
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    console.log('edited succssfully');
                } else {
                    console.warn('editing entry failed:', data.message);
                }
                return data;
            })
    }

    var editMode = false;

    function edittoggle() {
        editMode = !editMode

        tb.style.display = editMode ? 'flex' : 'none';

        editable.contentEditable = editMode;
        titleEdit.contentEditable = editMode;

        if (editMode) {

            editable.focus();

            editable.addEventListener('input', editdis)
            titleEdit.addEventListener('input', editdis)

            renderPalette()

            tagsContainer.querySelectorAll('.tag').forEach(span => {
                span.setAttribute('contenteditable', false);
                span.style.cursor = 'pointer';
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
                if (!v) return;
                var tagspan = document.createElement('span');
                tagspan.className = 'tag';
                tagspan.innerText = v;
                tagspan.style.cursor = 'pointer';
                tagspan.addEventListener('click', remvTag);
                tagsContainer.insertBefore(tagspan, input);
                input.value = '';
                editdis()
            });
            tagsContainer.appendChild(input);
            tagsContainer.appendChild(btn);
        } else {
            editable.removeEventListener('input', editdis);
            titleEdit.removeEventListener('input', editdis)

            tagsContainer.querySelectorAll('.tag').forEach(tagspan => {
                tagspan.removeEventListener('click', remvTag);
                tagspan.style.cursor = '';
            });
            var oldInput = document.getElementById('newTagInput');
            var oldBtn = document.getElementById('addTagBtn');
            if (oldInput) oldInput.remove();
            if (oldBtn) oldBtn.remove();
        }

        palette.style.display = editMode && divDefs.length ? 'block' : 'none';
        document.querySelectorAll('.palette-item').forEach(item => {
            item.draggable = editMode;
        });
        document.querySelectorAll('.inserted-div').forEach(inserted => {
            inserted.style.border = editMode ? 'border:1px solid black;' : 'none';
        })
        divToolbar.style.display = editMode ? 'block' : 'none';
    }

    document.getElementById('tbUp').addEventListener('click', () => {
        if (!activeDiv) return;
        var prev = activeDiv.previousElementSibling;
        if (prev) activeDiv.parentNode.insertBefore(activeDiv, prev);
        editdis();
    });

    document.getElementById('tbDown').addEventListener('click', () => {
        if (!activeDiv) return;
        var next = activeDiv.nextElementSibling;
        if (next) activeDiv.parentNode.insertBefore(next, activeDiv);
        editdis();
    });

    document.getElementById('tbDel').addEventListener('click', () => {
        if (!activeDiv) return;
        activeDiv.remove();
        divToolbar.style.display = 'none';
        editdis();
    });
}

//login signup functions
function login(username, password) {
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
                console.log(data);
                window.location.href = 'index.html';
            } else {
                document.getElementsByClassName('error-message')[0].innerHTML = data.message;
            }
        })
        .catch(err => {
            console.error('Login error:', err);
            throw err;
        });
}

function register(username, email, password) {
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
                console.log('Registration successful');
                window.location.href = 'index.html';
            } else {
                document.getElementsByClassName('error-message')[0].innerHTML = data.message;
            }
            return data;
        })
}

function logout() {
    fetch('server.php?logout=1');
}

var doSettOnce = false;

function loadsettings() {
    if (user && !doSettOnce) {
        //console.log('loafsettings')
        settings = JSON.parse(user.settings);
        Object.keys(settings).forEach((setting, sIndex) => {
            console.log(setting)
            console.log(settings[setting])
            document.getElementsByTagName('main')[0].innerHTML += `<br><label for="settingNum${sIndex}">${setting}</label> <input id="settingNum${sIndex}" value="${settings[setting]}" />`
        })
        doSettOnce = true;
    }
}

var forumId = new URLSearchParams(window.location.search).get("forumid");

var forumresults = document.getElementById('forumsresults');
var forumtitle = document.getElementById('forumtitleshow');

document.addEventListener('DOMContentLoaded', () => {
    if (forumresults) {
        fetch('server.php?GetForums=1')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    console.log(data.message)
                    var formumsresults = JSON.parse(data.message);
                    formumsresults.forEach((forum) => {
                        console.log(forum)
                        forumresults.innerHTML += `<a style="border:1px solid black;" href="forumpage.html?forumid=${forum.fP_Id}"><br>${forum.FTitle} <br> ${forum.FDesc}</a>`
                    })
                }
            })
    }
    if (forumtitle && forumId) {
        fetch('server.php?getForumInfo=' + String(forumId))
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    var formuminfo = JSON.parse(data.message).forum;
                    forumtitle.innerText = formuminfo.FTitle;
                    document.getElementById('forumdesc').innerText = formuminfo.FDesc;
                    document.getElementById('forumdate').innerText = formuminfo.DateMade; 
                    document.getElementById('hiddneID').innerHTML = formuminfo.fP_Id;
                    var commentinfo = JSON.parse(data.message).comments;
                    console.log(commentinfo)
                    commentinfo.forEach((comment) => {
                        var commentDiv = document.createElement('div');
                        commentDiv.innerText = comment.comment;
                        commentDiv.className = 'comment';
                        document.getElementById('comments').append(commentDiv);
                        fetch('server.php?simpleudat=' + comment.posterid)
                            .then(res => res.json())
                            .then(dat => {
                                var commentUInfo = document.createElement('div')
                                if (dat.status == 'success') {
                                    var posterinfo = json.parse(dat.message);
                                    commentUInfo.innerHTML = '<div class="posterinfo"><b>' + posterinfo.name + '</b><span>' + posterinfo.role + '</span></div>'
                                    commentDiv.prepend(commentUInfo)
                                };
                            })
                    })
                }
            })
    }
})
