{
  node: {
    caption: ['taxon name'],
    defaultIcon: true,
    onDoubleClick: (n) => window.open(n.url, '_blank'),
    onClick: (n) => {
      blitzboard.showLoader();
      const promiseParent = getParentNode(n.id);
      const promiseChild = getChildNode(n.id);
      Promise.all([promiseParent, promiseChild]).then(() => {
        blitzboard.update();
        blitzboard.hideLoader();
      });

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
        const promise = fetch(`https://orth.dbcls.jp/sparql?query=${encodeURIComponent(query)}&format=json`).then(res => {
          return res.json();
        }).then(result => {
          for (let elem of result.results.bindings) {
            addNode(elem, (id) => {
              addEdge(taxid, id);
            });
          }
        });
        return promise;
      }

      function getChildNode(taxid) {
        const query2 = sparqlTaxonomyTree('?url', `taxid:${taxid}`);
        const promise = fetch(`https://orth.dbcls.jp/sparql?query=${encodeURIComponent(query2)}&format=json`).then(res => {
          return res.json();
        }).then(result => {
          for (let elem of result.results.bindings) {
            addNode(elem, (id) => {
              addEdge(id, taxid);
            });
          }
        });
        return promise;
      }

      function addNode (elem, callback) {
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
        getThumb(elem.name.value, (result) => {
          for (let elem of result.results.bindings) {
            if (elem.thumb?.value) {
              node.properties.thumbnail = [elem.thumb.value];
            }
          }
          blitzboard.addNode(node, false);
          callback(id);
        });;
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

      function getThumb(name, callback) {
        const sparqlGetThum = `
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        SELECT ?thumb
        WHERE {
          ?url wdt:P225 "${name}" .
          OPTIONAL {
            ?url wdt:P18 ?thumb .
          }
        }`;
        fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlGetThum)}&format=json`).then(res => {
          return res.json();
        }).then(result => {
          callback(result);
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
