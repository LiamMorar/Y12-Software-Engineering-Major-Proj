var divDefs = [];
var divDefSep = 'icantusesymbolssoitsgonnabelongtext';

var searchInput = document.getElementById('searchInput');
var tagContainer = document.getElementById('tagContainer');
var results = document.getElementById('results');
var disorderDescription = document.getElementById("disorderDescription");
var disorderId = new URLSearchParams(window.location.search).get("id");
var user = {};

if (searchInput) {
    searchInput.addEventListener('input', () => {
        fetch(`server.php?search=${searchInput.value}`)
            .then(res => res.json())
            .then(data => {
                results.innerHTML = data.map(dat =>
                    '<div><a href="disorder.html?id=' + dat.id + '">' + dat.name + '</a></div>'
                ).join('');
            });
    });
    fetch(`server.php?search=`)
        .then(res => res.json())
        .then(data => {
            results.innerHTML = data.map(dat =>
                '<div><a href="disorder.html?id=' + dat.id + '">' + dat.name + '</a></div>'
            ).join('');
        });
}

if (tagContainer) {
    fetch(`server.php?tags=1`)
        .then(res => res.json())
        .then(tags => {
            tagContainer.innerHTML = tags.map(tag =>
                `<span onclick="fitlerTag('${tag}')">${tag}</span>`
            ).join('');
        });
}

function fitlerTag(tag) {
    fetch(`server.php?tag=${tag}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('results').innerHTML = data.map(dat =>
                '<div><a href="disorder.html?id=' + dat.id + '">' + dat.name + '</a></div>'
            ).join('');
        });
}

var tagsContainer = document.getElementById("disorderTags");

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementsByClassName('testLogin').length > 0) {
        fetch('server.php?logged_in=1')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    user = JSON.parse(data.message);
                } else if (data.status === 'fail') {
                    //tbd prompt login
                }
            });
    }
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
                    var span = document.createElement("span");
                    span.className = "tag";
                    span.innerHTML = tag.tag;
                    tagsContainer.appendChild(span);
                });
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
                makeSel('ul');
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
                    console.log('Registration successful');
                    //window.location.href = 'index.html';
                } else {
                    console.warn('Registration failed:', data.message);
                }
                return data;
            })
    }

    var editMode = false;

    if (document.getElementById('editBtn')) {
        document.getElementById('editBtn').addEventListener('click', () => {
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
        })
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