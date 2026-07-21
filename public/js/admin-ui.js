(function () {
  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  document.querySelectorAll('[data-copy-url]').forEach(function (button) {
    button.addEventListener('click', function () {
      var url = button.getAttribute('data-copy-url') || '';
      if (!navigator.clipboard || !url) {
        return;
      }

      navigator.clipboard.writeText(url).then(function () {
        var original = button.textContent;
        button.textContent = 'Copied';
        setTimeout(function () {
          button.textContent = original;
        }, 1500);
      }).catch(function () {});
    });
  });

  document.querySelectorAll('[data-image-preview-input]').forEach(function (input) {
    var previewId = input.getAttribute('data-image-preview-input');
    var preview = document.querySelector('[data-image-preview-target=\"' + previewId + '\"]');
    if (!preview) {
      return;
    }

    var render = function () {
      var value = input.value.trim();
      if (!value) {
        preview.innerHTML = '<div class=\"admin-image-preview-empty\">Image preview will appear here.</div>';
        return;
      }

      preview.innerHTML = '<img src=\"' + value.replace(/\"/g, '&quot;') + '\" alt=\"Preview image\" class=\"img-fluid rounded-4 admin-image-preview-media\">';
    };

    input.addEventListener('input', render);
    render();
  });

  document.querySelectorAll('[data-character-count-target]').forEach(function (input) {
    var countId = input.getAttribute('data-character-count-target');
    var counter = document.querySelector('[data-character-count=\"' + countId + '\"]');
    if (!counter) {
      return;
    }

    var update = function () {
      counter.textContent = String((input.value || '').length);
    };

    input.addEventListener('input', update);
    update();
  });

  document.querySelectorAll('[data-slug-source]').forEach(function (source) {
    var slugTargetId = source.getAttribute('data-slug-target');
    var slugTarget = document.getElementById(slugTargetId);
    if (!slugTarget) {
      return;
    }

    source.addEventListener('input', function () {
      if (slugTarget.dataset.slugTouched === 'true') {
        return;
      }
      slugTarget.value = slugify(source.value);
    });
  });

  document.querySelectorAll('[data-slug-field]').forEach(function (input) {
    input.addEventListener('input', function () {
      input.dataset.slugTouched = input.value.trim() ? 'true' : 'false';
      input.value = slugify(input.value);
    });
  });

  document.querySelectorAll('[data-media-preview-trigger]').forEach(function (button) {
    button.addEventListener('click', function () {
      var modal = document.getElementById('mediaPreviewModal');
      if (!modal) {
        return;
      }
      modal.querySelector('[data-media-preview-title]').textContent = button.getAttribute('data-media-title') || 'Media preview';
      modal.querySelector('[data-media-preview-meta]').textContent = button.getAttribute('data-media-meta') || '';
      modal.querySelector('[data-media-preview-image]').src = button.getAttribute('data-media-url') || '';
      modal.querySelector('[data-media-preview-image]').alt = button.getAttribute('data-media-alt') || 'Media preview';
      var bsModal = bootstrap.Modal.getOrCreateInstance(modal);
      bsModal.show();
    });
  });
})();
