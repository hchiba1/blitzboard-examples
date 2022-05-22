{
  node: {
    caption: ['taxon name'],
    defaultIcon: true,
    onDoubleClick: (n) => window.open(n.url, '_blank'),
    onClick: (n) => {
      blitzboard.showLoader();
      getParentNode(n.id);
      getChildNode(n.id);

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

      function getParentNode(taxid) {
        const query = sparqlTaxonomyTree(`taxid:${taxid}`, '?url');
        $.get(`https://orth.dbcls.jp/sparql?query=${encodeURIComponent(query)}&format=json`, (result) => {
          for (let elem of result.results.bindings) {
            addEdge(taxid, addNode(elem));
          }
          blitzboard.update();
          blitzboard.hideLoader();
        });
      }

      function getChildNode(taxid) {
        const query2 = sparqlTaxonomyTree('?url', `taxid:${taxid}`);
        $.get(`https://orth.dbcls.jp/sparql?query=${encodeURIComponent(query2)}&format=json`, (result) => {
          for (let elem of result.results.bindings) {
            addEdge(addNode(elem), taxid);
          }
          blitzboard.update();
          blitzboard.hideLoader();
        });
      }

      function addNode (elem) {
        let id = elem.url.value.replace(/.*\//g, '');
        if (blitzboard.hasNode(id)) {
          return;
        }
        let node = {
          id: id,
          labels: ['Taxon'],
          properties: {
            url: [elem.url.value],
            'taxon rank': [elem.rank.value],
            'taxon name': [elem.name.value],
          }
        };
        blitzboard.addNode(node, false);
        return id;
      }

      function addEdge (child, parent) {
        if (child && parent && !blitzboard.hasEdge(child, parent)) {
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
          for (let elem of result.results.bindings) {
            if (elem.thumb?.value) {
              node.properties.thumbnail = [elem.thumb.value];
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
