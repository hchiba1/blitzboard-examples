{
  node: {
    caption: ['name'],
    defaultIcon: true,
    onDoubleClick: (n) => window.open(n.url, '_blank'),
    onClick: (n) => {
      blitzboard.showLoader();

      function createSparq(child, parent) {
        return `
        SELECT ?url ?rank ?name ?name_ja ?thumb ?descr_ja WHERE {
          ${child} wdt:P171 ${parent} .
          ?url wdt:P31 wd:Q16521 ;
               wdt:P105/rdfs:label ?rank ;
               wdt:P225 ?name ;
               rdfs:label ?name_ja .
          OPTIONAL {
            ?url wdt:P18 ?thumb .
          }
          OPTIONAL {
            ?url <http://schema.org/description> ?descr_ja .
            FILTER(lang(?descr_ja) = 'ja')
          }
          FILTER(lang(?rank) = 'en')
          FILTER(lang(?name_ja) = 'ja')
        }
        `;
      }

      const query = createSparq(`wd:${n.id}`, '?url');
      const query2 = createSparq('?url', `wd:${n.id}`);

      const endpoint = 'https://query.wikidata.org/sparql';
      $.get(`${endpoint}?query=${encodeURIComponent(query)}&format=json`, (result) => {
        for (let b of result.results.bindings) {
          let id = b.url.value.replace(/.*\//g, '');
          const node = createNode(b);
          if (!blitzboard.hasEdge(node.id, n.id)) {
            blitzboard.addEdge({
              from: node.id,
              to: n.id,
              labels: ['child taxon'],
            });
          }
        }
        blitzboard.update();
        blitzboard.hideLoader();
      });
      
      $.get(`${endpoint}?query=${encodeURIComponent(query2)}&format=json`, (result) => {
        for (let b of result.results.bindings) {
          let id = b.url.value.replace(/.*\//g, '');
          if (blitzboard.hasNode(id)) {
            continue;
          }
          const node = createNode(b);
          if (!blitzboard.hasEdge(n.id, node.id)) {
            blitzboard.addEdge({
              from: n.id,
              to: node.id,
              labels: ['child taxon'],
            });
          }
        }
        blitzboard.update();
        blitzboard.hideLoader();
      });
    
      function createNode(b) {
        let id = b.url.value.replace(/.*\//g, '');
        let node = {
          id: id,
          labels: ['Taxon'],
          properties: {
            url: [b.url.value],
            'taxon rank': [b.rank.value],
            'taxon name': [b.name.value],
            name: [b.name_ja.value],
          }
        };
        if (b.descr_ja?.value) {
          node.properties.description = [b.descr_ja.value];
        }
        if (b.thumb?.value) {
          node.properties.thumbnail = [b.thumb.value];
        }
        blitzboard.addNode(node, false);
        return node;
      }
    }

  },
  edge: {
    caption: [],
    opacity: 0.6
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
    direction: 'LR',        // UD, DU, LR, RL
    sortMethod: 'directed',  // hubsize, directed
    shakeTowards: 'roots'  // roots, leaves
  },
  extraOptions: {
    interaction: {
      selectConnectedEdges: false,
      hover: true,
      hoverConnectedEdges: false,
      keyboard: true,
      navigationButtons: true
    }
  }
}