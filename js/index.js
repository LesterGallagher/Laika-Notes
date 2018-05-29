"use strict"
ons.bootstrap();
ons.ready(function () {

    document.getElementsByClassName('loader')[0].setAttribute('class', '');
    window.appData = {
        notes: window.localStorage.notes && JSON.parse(window.localStorage.notes) || [{
            name: 'example',
            content: '<b>Hello</b> world',
            timestamp: 1527107197712,
        }],
        persist: function() {
            if (!this.notes) throw Error();
            window.localStorage.notes = JSON.stringify(this.notes);
        }
    }

    // note
    // {
    //     name: string,
    //     content: string,
    //     timestamp: number,
    // }

    var gi = document.getElementById.bind(document);
    var notesContainer = gi('notes-container');
    var createNoteBtn = gi('create-note');
    var notesAmount = gi('notes-amount');
    var notesEditBtn = gi('notes-edit');
    var mainPage = gi('main-page');
    var popoverBtn = gi('app-popover-btn');
    var onsenTheme = gi('onsen-theme');
    renderNotes(notesContainer);
    document.addEventListener('show', initNotePage);
    createNoteBtn.addEventListener('click', createNote);
    notesEditBtn.addEventListener('click', notesEdit);
    AppNavigator.on('prepop', saveEdits);
    window.addEventListener('pause', saveEdits);

    Hammer(popoverBtn).on('tap', function (e) {
        ons.createPopover('popovers/context-menu-popover.html').then(function (popover) {
            popover.show('#app-popover-btn');
            window.OnsenThemeSwitch.setChecked(window.theme === 'dark');
        });
    });

    document.addEventListener('change', function (e) {
        if (e.target.parentElement.parentElement.id === 'onsen-theme-switch') {
            var checked = e.target.checked;
            window.theme = checked ? 'dark' : 'light';
            if (window.localStorage) localStorage.theme = window.theme;
            var url = checked
                ? 'lib/OnsenUI/css/onsen-css-components-dark-theme.css'
                : 'lib/OnsenUI/css/onsen-css-components.css'
            onsenTheme.setAttribute('href', url);
        }
    });

    if (cordova.platformId === 'browser') {
        console.log('running on browser');
        var browserScript = document.body.appendChild(document.createElement('script'));
        browserScript.src = 'js/browser.js';
    } else {
        console.log('running in app');
        var appScript = document.body.appendChild(document.createElement('script'));
        browserScript.src = 'js/app-platform.js';
    }

    function renderNotes(container) {
        var notes = window.appData.notes;
        while (container.firstChild) container.removeChild(container.firstChild);
        for (var i = 0; i < notes.length; i++) {
            var note = notes[i];
            appendNote(container, note, i);
        }
        notesAmount.innerText = window.appData.notes.length;
        ons.compile(container);
    }

    function appendNote(container, note, index) {
        var el = document.createElement('ons-list-item');
        el.setAttribute('tabindex', -1);
        el.setAttribute('modifier', 'chevron')
        el.setAttribute('class', 'note');
        el.setAttribute('href', '#');
        var editSection = document.createElement('div');
        editSection.setAttribute('class', 'edit-section left');
        editSection.innerHTML = '<ons-icon icon="fa-minus-circle"></ons-icon>'
        el.appendChild(editSection);
        var wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'note-content center')
        var name = document.createElement('strong');
        name.innerText = note.name;
        name.setAttribute('class', 'note-name');
        var time = document.createElement('small');
        time.innerText = new Date(note.timestamp).toLocaleDateString();
        time.setAttribute('class', 'note-time');
        wrapper.appendChild(name);
        wrapper.appendChild(document.createElement('br'));
        wrapper.appendChild(time);
        el.appendChild(wrapper);
        container.appendChild(el);
        Hammer(el).on("tap", function (event) {
            if (event.gesture.target.className.indexOf('edit-section') !== -1
                || event.gesture.target.className.indexOf('ons-icon') !== -1) return;
            cu(gi('main-page')).remove('edit');
            var items = container.getElementsByClassName('note');
            for (var i = 0; i < items.length; i++) {
                cu(items[i]).remove('edit');
            }
            openNote(note);
        });
        notesAmount.innerText = window.appData.notes.length;
        Hammer(el).on("hold", function (event) {
            var items = container.getElementsByClassName('note');
            cu(gi('main-page')).remove('edit');
            for (var i = 0; i < items.length; i++) {
                cu(items[i]).remove('edit');
            }
            cu(el).add('edit');
        });
        el.addEventListener('blur', function (e) {
            var items = container.getElementsByClassName('note');
            for (var i = 0; i < items.length; i++) {
                cu(items[i]).remove('edit');
            }
        });
        Hammer(editSection).on('tap', function (e) {
            var notes = window.appData.notes;
            notes.splice(notes.indexOf(note), 1);
            window.appData.persist();
            cu(el).add('deleted');
            setTimeout(function () {
                container.removeChild(el);
            }, 100);
            notesAmount.innerText = window.appData.notes.length;
        });
    }

    var onInputSaveInterval = 20;
    var onInputCounter = 0;
    function onInput() {
        onInputCounter++;
        onInputCounter %= onInputSaveInterval;
        if (onInputCounter === 0) {
            saveEdits();
        }
    }

    function openNote(note) {
        var options = {
            animation: 'slide', // What animation to use
            onTransitionEnd: initNotePage, // Called when finishing transition animation
            note: note,
        };
        var p = AppNavigator.pushPage("views/note.html", options);
    }

    function initNotePage() {
        var currPage = AppNavigator.getCurrentPage();
        var note = currPage.options.note;
        var el = currPage.element[0];
        var noteName = el.getElementsByClassName('note-name')[0];
        var noteContent = el.getElementsByClassName('note-content')[0];
        var noteNameEdit = el.getElementsByClassName('note-title-edit')[0];

        noteName.innerText = noteNameEdit.value = note.name;
        noteContent.innerHTML = note.content;

        var quill = new Quill('.editor', {
            modules: {
                toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline'],
                ]
            },
            placeholder: 'Compose an epic...',
            theme: 'snow'  // or 'bubble'
        }).on('text-change', function (delta, oldDelta, source) {
            if (source == 'user') {
                onInput();
            }
        });

        var inner = el.getElementsByClassName('ql-editor')[0];
        inner.addEventListener('click', function() { inner.focus(); })

        noteNameEdit.addEventListener('input', function (e) {
            onInput();
            noteName.innerText = e.target.value;
        });
    }

    function createNote() {
        ons.notification.prompt({
            message: "Name:",
            callback: function (name) {
                name = name.trim();
                if (name === '') return;
                var note = createNoteData(name);
                appendNote(notesContainer, note);
                ons.compile(notesContainer);
            }
        });
    }

    function createNoteData(name) {
        var note = {
            name: name,
            content: '',
            timestamp: new Date().getTime(),
        };
        window.appData.notes.push(note);
        window.appData.persist();
        return note;
    }

    function notesEdit() {
        cu(mainPage).toggle('edit');
    }

    function saveEdits() {
        var currPage = AppNavigator.getCurrentPage();
        var el = currPage.element[0];
        var noteName = el.getElementsByClassName('note-name')[0];
        var noteContent = el.getElementsByClassName('note-content')[0];
        var noteTitle = el.getElementsByClassName('note-title-edit')[0]
        var note = currPage.options.note;
        note.content = noteContent.firstChild.innerHTML;
        note.name = noteTitle.value;
        var notesContainer = document.getElementById('notes-container');
        if (notesContainer) {
            var index = window.appData.notes.indexOf(note);
            var noteItem = notesContainer.getElementsByClassName('note')[index];
            var noteName = noteItem.getElementsByClassName('note-name')[0];
            noteName.innerText = note.name;
        }
        window.appData.persist();
    }

    function cu(element) {//classutil
        return new (function () {
            var arr = element.getAttribute('class').split(/\s+/g) || [];
            var items = {};
            for (var a = 0; a < arr.length; a++) {
                items[arr[a]] = true;
            }

            this.add = function () {
                for (var i = 0; i < arguments.length; i++) {
                    items[arguments[i]] = true;
                }
                write();
            }

            this.toggle = function () {
                for (var i = 0; i < arguments.length; i++) {
                    items[arguments[i]] = !items[arguments[i]];
                }
                write();
            }

            this.remove = function () {
                for (var i = 0; i < arguments.length; i++) {
                    items[arguments[i]] = false;
                }
                write();
            }

            var write = function () {
                var arr = [];
                for (var key in items) {
                    if (items.hasOwnProperty(key) && items[key]) {
                        arr.push(key);
                    }
                }
                element.setAttribute('class', arr.join(' '));
            }
        })();
    };
});




