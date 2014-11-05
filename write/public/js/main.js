var app = {};

// environment
(function () {
  var env = app.env = {};
  env.mountPath = window.apperMountPath;
  env.savedVersion = window.savedVersion;
}());

// saving behavior
(function () {
  var humane = window.humane;
  humane.baseCls = 'humane-libnotify';
  humane.error = humane.spawn({ addnCls: 'humane-libnotify-error' });
  
  var isSaving = false;
  function save(e) {
    var editor = app.editor;
    var content = editor.getContent();
    if (content === editor.savedContent) {
      if (e) window.humane.log('Already saved');
      return false;
    }
    if (isSaving) return false;
    $.post('save', {
      content: content,
      savedVersion: app.env.savedVersion
    }, function (version) {
      isSaving = false;
      editor.savedContent = content;
      app.env.savedVersion = version;
      if (e) humane.log('Saved');
    }).fail(function (res) {
      isSaving = false;
      humane.error(res.statusText);
    });
    return false;
  }
  
  setInterval(save, 10000);
  app.save = save;
}());

// setup editor
(function () {
  var el = $('#writebox');
  el.markdown({
    autofocus: true,
    savable: true,
    onSave: app.save,
    hiddenButtons: 'cmdPreview',
    additionalButtons: [
      [{
        name: "groupCustom",
        data: [{
          name: "cmdView",
          toggle: true,
          title: "View",
          icon: "glyphicon glyphicon-eye-open",
          callback: function(e){
            window.open('.');
          }
        }]
      }]
    ]
  });
  var editor = el.data('markdown');
  editor.setFullscreen(true);
  editor.setFullscreen = function () {};
  editor.savedContent = editor.getContent();
  
  el.bind('keydown', 'ctrl+s', app.save);
  el.bind('keydown', 'meta+s', app.save);
  
  function insertAtCaret(areaId, text) {
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ?
        "ff" : (document.selection ? "ie" : false ) );
    if (br == "ie") {
        txtarea.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -txtarea.value.length);
        strPos = range.text.length;
    }
    else if (br == "ff") strPos = txtarea.selectionStart;

    var front = (txtarea.value).substring(0,strPos);  
    var back = (txtarea.value).substring(strPos,txtarea.value.length);
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie") {
        txtarea.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -txtarea.value.length);
        range.moveStart ('character', strPos);
        range.moveEnd ('character', 0);
        range.select();
    }
    else if (br == "ff") {
        txtarea.selectionStart = strPos;
        txtarea.selectionEnd = strPos;
        txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
  }

  
  app.editor = editor;
}());

// dirty editor
(function () {
  $(window).on("beforeunload", function (e) {
    var editor = app.editor;
    if (editor.getContent() === editor.savedContent) {
      app.socket.disconnect();
      return;
    }
    var confirmationMessage = "Unsaved changes!";
    (e || window.event).returnValue = confirmationMessage;
    return confirmationMessage;
  });
}());

// setup page ui
(function () {
  $('body').animate({
    opacity: 1
  });
  
  var locationParts = location.href.split('/'),
    topicName = locationParts[locationParts.length - 2];
  $('title').text($('title').text() + ': ' + topicName);
  
  $(window).resize(resize);
  resize();
  function resize() {
    var maxWidth = 800,
      minPadding = 30,
      padding = Math.max(parseInt(($(window).width() - maxWidth) / 2, 10), minPadding);
    $('#writebox').each(function () {
        this.style.setProperty('padding-left', padding + 'px', 'important');
        this.style.setProperty('padding-right', padding + 'px', 'important');
    });
  }
}());

// set current users
(function () {
  var el = $('<span class="current-users">');
  $('.md-fullscreen-controls').append(el);
  
  var locationParts = window.location.pathname.split('/'),
    mountPath = locationParts.slice(0, -2).join('/'),
    topic = locationParts.slice(-2)[0];
  var socket = window.io(mountPath);
  socket.on('connect', function () {
    socket.emit('topic', topic);
  });
  socket.on('users', function (count) {
    el.text(count > 1 ? (count + ' writers') : '');
  });
  
  app.socket = socket;
}());