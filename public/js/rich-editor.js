(function () {
  if (typeof Quill === 'undefined') {
    return;
  }

  var editors = document.querySelectorAll('[data-rich-editor]');
  if (!editors.length) {
    return;
  }

  editors.forEach(function (element) {
    var targetId = element.getAttribute('data-target');
    var target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    var quill = new Quill(element, {
      theme: 'snow',
      placeholder: element.getAttribute('data-placeholder') || '',
      modules: {
        toolbar: [
          [{ header: [2, 3, 4, false] }],
          ['bold', 'italic', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
          ['clean']
        ]
      }
    });

    quill.root.innerHTML = target.value || '';

    var sync = function () {
      target.value = quill.root.innerHTML.trim();
    };

    quill.on('text-change', sync);
    sync();
  });
})();
