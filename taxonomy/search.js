function init() {
  candidates = ['sapiens'];

  $('#tags').focus();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

$(function () {
  // $('#tags').autocomplete({
  //   source: (request, response) => {
  //     response(
  //       $.grep(candidates, (value) => {
  //         let regexp = new RegExp('\\b' + escapeRegExp(request.term), 'i');
  //         return value.match(regexp);
  //       })
  //     );
  //   },
  //   autoFocus: true,
  //   delay: 100,
  //   minLength: 1,
  //   select: (e, ui) => {
  //     if (ui.item) {
  //       show_contents(ui.item['label']);
  //     }
  //   }
  // });
  
  const list = ['human', 'mouse'];
  $('#tags').autocomplete({
    source: list,
    select: (e, ui) => {
      if (ui.item) {
        // show_contents(ui.item['label']);
        console.log(ui.item.label, e);
        blitzboard.setGraph('hoge', false);
        blitzboard.setConfig(Function('blitzboard', `"use strict";return (${config})`)(blitzboard), true);
        blitzboard.network.stabilize();
      }
    }
  });
});
