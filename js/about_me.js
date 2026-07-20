
$(document).ready(function () {

  var input = $("#inputcmd");
  var output = $("#output");

  const loadingDivs = document.querySelectorAll('div.loading');

  // Log each <div> to the console
  loadingDivs.forEach(div => {
    let originalText = div.textContent;
    div.textContent = '';
    displayLoadingEffect(div, originalText, false, true, true, ALPHABET_RANGE.slice(0, 36));
  });

  
  $.fn.typewriter = function (options) {
    var settings = $.extend({
      jitterInMs: 10, // Jitter in typing
      delayInMs: 75, // Base delay between characters 
      underscore: '_' // Character to use for blinking underscore
    }, options);
  
    this.each(function () {
      var $ele = $(this), str = $ele.html(), progress = 0, offset = 0;
      $ele.html('');
  
      function typewriting() {
        const BRACKET = '<';
        const SPAN_TAG = '<span';
        const CLOSING_SPAN = '</span>';
  
        if (str.substring(progress, progress + SPAN_TAG.length) === SPAN_TAG) {
          var instantRe = /<span class="instant[^"]*">/;
          var clearRe = /<span class="clear">/;
  
          if (instantRe.test(str.substring(progress, progress + offset))) {
            offset = progress;
            progress += str.substring(progress).indexOf(CLOSING_SPAN) + CLOSING_SPAN.length;
          } 
          else if (clearRe.test(str.substring(progress))) {
            offset = progress;
            progress += str.substring(progress).indexOf(CLOSING_SPAN) + CLOSING_SPAN.length;
          } else {
            //offset = 0;
            while (str.substring(progress, progress + 1) !== '>') {
              progress++;
            }
          }
        }
  
        $ele.html(str.substring(offset, progress++) + (progress & 1 ? settings.underscore : ''));
        if (progress < str.length) {
          setTimeout(typewriting, settings.jitterInMs + Math.random() * settings.delayInMs);
        }
      }
  
      typewriting();
    });
  
    return this;
  };

  $('#terminal').typewriter();  
 
  // console.log(document.getElementById('terminal').offsetWidth);
  // console.log(document.getElementById('terminal').offsetHeight);

  function openKeyboard(){
    input.focus();
  }

  function keypressInput(e) {
    // received enter key, send cmd and clear input
    if (e.keyCode == 13) {
      var command = input.text();
      output.html(processCommand(command));
      input.html("");
      e.preventDefault();
    }
  }

  function processCommand(cmd) {
    cmd = cmd.trim().toLowerCase();
    if (cmd == "--help") {
      return "TODO";
    }
    return "unknown command. type '--help' for list of commands.";
  }
});


setTimeout(function () { 
  location.reload();
}, 40 * 1000);