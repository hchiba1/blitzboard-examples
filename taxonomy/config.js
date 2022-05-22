{
  node: {
    caption: ['taxon name'],
    defaultIcon: true,
    onDoubleClick: (n) => window.open(n.url, '_blank'),
    onClick: (n) => {
      blitzboard.showLoader();
      getParentNode();
      getChildNode();

      function sparqlTaxonomyTree(child, parent) {
        return `
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX taxid: <http://identifiers.org/taxonomy/>
        PREFIX taxon: <http://ddbj.nig.ac.jp/ontologies/taxonomy/>
        SELECT ?url ?rank ?name
        WHERE {
          ${child} rdfs:subClassOf ${parent} .
          ?url rdfs:label ?name .
          ?url taxon:rank/rdfs:label ?rank .
        }
        `;
      }

      function getParentNode() {
        const query = sparqlTaxonomyTree(`taxid:${n.id}`, '?url');
        $.get(`https://orth.dbcls.jp/sparql?query=${encodeURIComponent(query)}&format=json`, (result) => {
          for (let b of result.results.bindings) {
            const id = addNode(b);
            if (id) {
              addEdge(n.id, id);
            }
          }
          blitzboard.update();
          blitzboard.hideLoader();
        });
      }

      function getChildNode() {
        const query2 = sparqlTaxonomyTree('?url', `taxid:${n.id}`);
        $.get(`https://orth.dbcls.jp/sparql?query=${encodeURIComponent(query2)}&format=json`, (result) => {
          for (let b of result.results.bindings) {
            const id = addNode(b);
            if (id) {
              addEdge(id, n.id);
            }
          }
          blitzboard.update();
          blitzboard.hideLoader();
        });
      }

      function addNode (b) {
        let id = b.url.value.replace(/.*\//g, '');
        if (blitzboard.hasNode(id)) {
          return;
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
        return id;
      }

      function addEdge (child, parent) {
        if (!blitzboard.hasEdge(child, parent)) {
          blitzboard.addEdge({
            from: child,
            to: parent,
            labels: ['parent taxon'],
          });
        }
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
