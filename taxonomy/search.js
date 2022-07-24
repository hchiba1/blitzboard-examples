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
  
  const list = ['Homo', 'human', 'mouse'];
  $('#tags').autocomplete({
    source: list,
    select: (e, ui) => {
      if (ui.item) {
        const name = ui.item.label;
        sparqlTaxonomy(name, (json) => {
          const url = json.results.bindings[0].url.value;
          const rank = json.results.bindings[0].rank.value;
          const m = url.match(/.*\/(\d+)/);
          if (m) {
            const taxid = m[1];
            let pg = `${taxid} :Taxon "taxon name": "${name}" "name": "${name}"`;
            blitzboard.setGraph(pg, true);
          }
        });
      }
    }
  });
});

function sparqlTaxonomy(name, callback) {
  const sparql = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX taxon: <http://ddbj.nig.ac.jp/ontologies/taxonomy/>
    SELECT ?url ?rank
    WHERE {
      ?url rdfs:label "${name}" .
      ?url taxon:rank/rdfs:label ?rank .
    }`;
  fetch(`https://spang.dbcls.jp/sparql?query=${encodeURIComponent(sparql)}&format=json`).then(res => {
    return res.json();
  }).then(json => {
    callback(json);
  });
}
