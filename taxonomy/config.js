{
  node: {
    caption: ['taxon name'],
    defaultIcon: true,
    onDoubleClick: (n) => window.open(n.url, '_blank'),
    onClick: (n) => {
      blitzboard.showLoader();
      getParentNode();
      getChildNode();

      function getParentNode() {
        let query = `
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX taxid: <http://identifiers.org/taxonomy/>
        PREFIX taxon: <http://ddbj.nig.ac.jp/ontologies/taxonomy/>
        SELECT ?url ?rank ?name
        WHERE {
          taxid:${n.id} rdfs:subClassOf ?url .
          ?url rdfs:label ?name .
          ?url taxon:rank/rdfs:label ?rank .
        }
        `;
        $.get(`https://orth.dbcls.jp/sparql?query=${encodeURIComponent(query)}&format=json`, (result) => {
          for (let b of result.results.bindings) {
            let id = b.url.value.replace(/.*\//g, '');
            let node = {
              id: id,
              labels: ['Taxon'],
              properties: {
                url: [b.url.value],
                'taxon rank': [b.rank.value],
                'taxon name': [b.name.value],
              }
            };
            blitzboard.addNode(node, false);
            if (!blitzboard.hasEdge(n.id, node.id)) {
              blitzboard.addEdge({
                from: n.id,
                to: node.id,
                labels: ['parent taxon'],
              });
            }
          }
          blitzboard.update();
          blitzboard.hideLoader();
        });
      }

      function getChildNode() {
        let query2 = `
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX taxid: <http://identifiers.org/taxonomy/>
        PREFIX taxon: <http://ddbj.nig.ac.jp/ontologies/taxonomy/>
        SELECT ?url ?rank ?name
        WHERE {
          ?url rdfs:subClassOf taxid:${n.id} .
          ?url rdfs:label ?name .
          ?url taxon:rank/rdfs:label ?rank .
        }
        `;
        $.get(`https://orth.dbcls.jp/sparql?query=${encodeURIComponent(query2)}&format=json`, (result) => {
          for (let b of result.results.bindings) {
            let id = b.url.value.replace(/.*\//g, '');
            if (blitzboard.hasNode(id)) {
              continue;
            }
            let node = {
              id: id,
              labels: ['Taxon'],
              properties: {
                url: [b.url.value],
                'taxon rank': [b.rank.value],
                'taxon name': [b.name.value],
              }
            };
            blitzboard.addNode(node, false);
            if (!blitzboard.hasEdge(node.id, n.id)) {
              blitzboard.addEdge({
                from: node.id,
                to: n.id,
                labels: ['parent taxon'],
              });
            }
          }
          blitzboard.update();
          blitzboard.hideLoader();
        });
      }

      function setThumb(node, name) {
        const sparqlGetThum = `
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        SELECT ?thumb
        WHERE {
          ?url wdt:P225 "${name}" .
          OPTIONAL {
            ?url wdt:P18 ?thumb .
          }
        }`;
        $.get(`https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlGetThum)}&format=json`, (result) => {
          for (let b of result.results.bindings) {
            if (b.thumb?.value) {
              node.properties.thumbnail = [b.thumb.value];
            }
          }
          blitzboard.update();
          blitzboard.hideLoader();
        });
      }
    
    }

  },
  edge: {
    caption: [],
  },
  layout: 'hierarchical',
  layoutSettings: {
    enabled:true,
    levelSeparation: 150,
    nodeSpacing: 100,
    treeSpacing: 200,
    blockShifting: true,
    edgeMinimization: true,
    parentCentralization: true,
    direction: 'DU',        // UD, DU, LR, RL
    sortMethod: 'directed',  // hubsize, directed
    shakeTowards: 'leaves'  // roots, leaves
  },
}
