"use strict"

// media stream cross browser hack
var MediaStream = window.MediaStream;
if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
    MediaStream = webkitMediaStream;
}

if (typeof MediaStream !== 'undefined' && !('stop' in MediaStream.prototype)) {
    MediaStream.prototype.stop = function () {
        this.getAudioTracks().forEach(function (track) {
            track.stop();
        });

        this.getVideoTracks().forEach(function (track) {
            track.stop();
        });
    };
}


// quill extensions
// emoji's
var Block = Quill.import('blots/block');
var Embed = Quill.import("blots/embed");
var Inline = Quill.import('blots/inline');
var BlockEmbed = Quill.import('blots/block/embed');

function AudioBlot(node, value) {
    var obj = new BlockEmbed(node, value);
    Object.setPrototypeOf(obj, AudioBlot.prototype); // or B.prototype, but if you derive from B you'll have to do this dance again
    return obj;
};
AudioBlot.create = function (options) {
    var node = BlockEmbed.create.call(this)
    // Set non-format related attributes with static values
    node.setAttribute('src', options.src);
    node.setAttribute('controls', 'true');
    return node;
}
AudioBlot.value = function (node) {
    return { src: node.getAttribute('src') };
}
Object.setPrototypeOf(AudioBlot.prototype, BlockEmbed.prototype);
Object.setPrototypeOf(AudioBlot, BlockEmbed);
AudioBlot.blotName = 'audio';
AudioBlot.tagName = 'audio';
AudioBlot.className = 'audio-recording';

Quill.register(AudioBlot);

// end quill extensions

ons.bootstrap();

ons.ready(function () {
    console.log('ready', window.AppNavigator);

    if (window.theme === 'dark') {
        cu(document.documentElement).add('theme-dark').remove('theme-light');
    } else {
        cu(document.documentElement).add('theme-light').remove('theme-dark');
    }

    window.AppNavigator.resetToPage('views/main.html', {
        animation: 'none', onTransitionEnd: function () {
            document.getElementsByClassName('loader')[0].setAttribute('class', '');
            window.appData = {
                notes: window.localStorage.notes && JSON.parse(window.localStorage.notes) || [{
                    name: 'Welcome to "Laika Notes"',
                    content: '<b>Hello</b> world',
                    timestamp: 1527107197712,
                }],
                persist: function () {
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
            window.addEventListener("beforeunload", saveEdits);

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
                    if (checked) {
                        cu(document.documentElement).add('theme-dark').remove('theme-light');
                    } else {
                        cu(document.documentElement).add('theme-light').remove('theme-dark');
                    }
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
                var audioInput = el.getElementsByClassName('uploadaudio-input')[0];

                noteName.innerText = noteNameEdit.value = note.name;
                noteContent.innerHTML = note.content;

                var insertEmoji = function () {
                    let editorSelection = quill.getSelection();
                    const cursorPosition = editorSelection && editorSelection.index ? editorSelection.index : 0;
                    quill.insertEmbed(cursorPosition, "emoji", 'icon icon-smiley');
                    quill.setSelection(cursorPosition + 1);
                };

                var insertAudio = function () {
                    captureAudio()
                        .then(function (src) {
                            var range = quill.getSelection(true);
                            console.log('adding audio element', src);
                            quill.insertText(range.index, '\n', Quill.sources.USER);
                            quill.insertEmbed(range.index + 1, 'audio', { src: src });
                            quill.setSelection(range.index + 2, Quill.sources.SILENT);
                        });
                }

                function undo() {
                    quill.history.undo();
                }

                function redo() {
                    quill.history.redo();
                }

                function audioFileUpload() {
                    var file = audioInput.files[0];
                    if (file.type.match(/audio.*/)) {
                        var reader = new FileReader();
                        reader.onload = function (d) {
                            var src = d.target.result;
                            var range = quill.getSelection(true);
                            console.log('adding audio element', src);
                            quill.insertText(range.index, '\n', Quill.sources.USER);
                            quill.insertEmbed(range.index + 1, 'audio', { src: src });
                            quill.setSelection(range.index + 2, Quill.sources.SILENT);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        ons.notification.alert({
                            message: 'This is not a valid audio file.',
                        });
                    }
                    audioInput.value = '';
                }

                var quill = new Quill('.editor', {
                    modules: {
                        toolbar: {
                            container: el.getElementsByClassName('ql-toolbar')[0],
                            handlers: {
                                emoji: insertEmoji,
                                audio: insertAudio,
                                undo: undo,
                                redo: redo,
                            }
                        },
                        history: {
                            delay: 2000,
                            maxStack: 500,
                            userOnly: true
                        }
                    },
                    placeholder: 'Compose an epic...',
                    theme: 'snow'  // or 'bubble'
                });
                quill.on('text-change', function (delta, oldDelta, source) {
                    if (source == 'user') {
                        onInput();
                    }
                });
                audioInput.addEventListener('change', audioFileUpload);

                var inner = el.getElementsByClassName('ql-editor')[0];
                inner.addEventListener('click', function () { inner.focus(); })

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


        }
    });
});

// function fireAppSpecificEvent(name) {
//     var event = document.createEvent('Event');
//     event.initEvent(name, true, true);
//     elem.dispatchEvent(event);
// }

function cu(element) {//classutil
    return new (function () {
        var arr = element.getAttribute('class').split(/\s+/g) || [];
        var items = {};
        var _this = this;
        for (var a = 0; a < arr.length; a++) {
            items[arr[a]] = true;
        }

        this.add = function () {
            for (var i = 0; i < arguments.length; i++) {
                items[arguments[i]] = true;
            }
            return write();
        }

        this.toggle = function () {
            for (var i = 0; i < arguments.length; i++) {
                items[arguments[i]] = !items[arguments[i]];
            }
            return write();
        }

        this.remove = function () {
            for (var i = 0; i < arguments.length; i++) {
                items[arguments[i]] = false;
            }
            return write();
        }

        var write = function () {
            var arr = [];
            for (var key in items) {
                if (items.hasOwnProperty(key) && items[key]) {
                    arr.push(key);
                }
            }
            element.setAttribute('class', arr.join(' '));
            return _this;
        }
    })();
};

function extend() {
    for (var i = 1; i < arguments.length; i++)
        for (var key in arguments[i])
            if (arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
    return arguments[0];
}

function captureAudio() {
    return new Promise(function (res, rej) {
        if (cordova.platformId === 'browser') {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                ons.notification.alert({
                    message: 'Unable to capture audio on this brower/device',
                });
                return rej();
            }
            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                .then(function (stream) {
                    var mediaRecorder = new MediaRecorder(stream);

                    var audioChunks = [];

                    mediaRecorder.addEventListener("dataavailable", function (event) {
                        console.log('dataavailable', event);
                        audioChunks.push(event.data);
                    });

                    mediaRecorder.start();

                    mediaRecorder.addEventListener("stop", function (event) {
                        // var audioBlob = new Blob(audioChunks);
                        try {
                            cu(screenFiller).remove('visible');
                            stream.stop();
                            stopRecording.removeEventListener('click', stop);
                            var audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                            var a = new FileReader();
                            a.onload = function (e) {
                                var audioUrl = e.target.result;
                                return res(audioUrl)
                            }
                            a.readAsDataURL(audioBlob);
                        } catch (err) {
                            ons.notification.alert({
                                message: 'Cannot record audio. Browser error.',
                            });
                            return rej();
                        }
                    });

                    var stop = mediaRecorder.stop.bind(mediaRecorder);
                    var screenFiller = document.getElementsByClassName('audio-recording-screen-filler')[0];
                    cu(screenFiller).add('visible');
                    var stopRecording = document.getElementsByClassName('stop-recording')[0];
                    stopRecording.addEventListener('click', stop);
                })
                .catch(function (err) {
                    ons.notification.alert({
                        message: 'Cannot record audio :(. ' + err.message || err,
                    });
                    throw err;
                });
        } else {
            // capture callback
            function captureSuccess(mediaFiles) {
                var path = mediaFiles[mediaFiles.length - 1].fullPath;
                return res(path);
            };

            // capture error callback
            function captureError(error) {
                console.error('Error code: ' + error.code, null, 'Capture Error');
                console.error(error);
                ons.notification.alert({
                    message: 'Unable to capture audio. Most likely your device does not support audio recording. Error code: ' + error.code
                });
                return rej();
            };
            // start audio capture
            navigator.device.capture.captureAudio(captureSuccess, captureError, { limit: 1, duration: 60 });
        }
    });
}
