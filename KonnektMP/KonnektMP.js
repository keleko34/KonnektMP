define(['./Sub/Map/Map'],function(CreateMap){
  function CreateKonnektMP()
  {
    /* The start and end characters to search for when looking for binds */
    var _start = "{{",
        _end = "}}",
        
    /* The seperation character when looking for bind params and options */    
        _pipe = "|",
        
    /* A list of all dom events that can be attached to an element such as `onclick` */
        _events = Object.keys(HTMLElement.prototype).filter(function(v){return v.indexOf('on') === 0}).concat(['ontouchstart','ontouchend','ontouchmove']),
    
    /* This is the property event based engine to listen for changes */
        _engine = function(){},
        
    /* A list of all templates currently stored to allow quicker parsing  */
        _templates = [],
    
    /* REGEX Globals */
        
        /* NODES */
        /* Regex for nodes in a string, eg: str.match(_reNodes) returns all node names in string */
        _reNodes = /(?!<\/)\w+(?=>)/g,
        
        _reGetNodeName = /^(<|<\/)({*)(\w+)(.*?>)/,
        
        /* For splitting all nodes */
        _reSplitNodes = /(?=<.*?>)/g,
        
        /* Detect end tag */
        _reEndTag = /^(<\/)/,
        
        _reOneLineTag = /(\/>)/,
        
        /* FIND BINDS */
        /* used for splitting the text up into binds and text */
        _reBindText = /({{.*?}})/g,
        
        /* grabs binds out of {{}} bind types, used in attributes and text *may be easier to just do a replace*/
        _reBind = /[^{]+(?=}})/g,
        
        /* allows matching and splitting a {{for prop loop component}} bind type, *I think can be done better... */
        _reForBind = /(?:for| )+(?:loop|)+/g,
        
        /* for splitting nodes to show bindable nodes */
        _reNodeBind = /(?=<{{.*?}}.*?>|<\/{{.*?}}>)/g,
        
        _reNodeNameBind = /(<{{.*?}}.*?>|<\/{{.*?}}>)/g,
        
        _reNodeStart = /(<{{.*?}}.*?>)/g,
        
        _reNodeEnd = /(<\/{{.*?}}>)/g,
        
        /* for splitting the attribute name binds */
        _reAttrNameBind = /([^{]+(?=}}\=))/g,
        
        /* BIND FUNCTIONALITY */
        /* grabs the key from the beginning of the bind using .replace to get rid of all other content */
        _reBindKey = /(?!\w+).*/,
        
        /* FILTERS */
        /* for replacing all before filter and also fetching to be sorted */
        _reBindFilters = /(^.*\|)/,
        
        /* splits the filters up */
        _reBindFiltersSplit = /(?:[,])/g,
        
        /* check for vmFilter */
        _reFilterVM = /^(\(.*?\))/,
        
        /* check for model storage filter */
        _reFilterModel = /^(\[\~.*?\])/,
        
        /* check for local storage filter */
        _reFilterLocal = /^(\[\+.*?\])/,
        
        /* check for session storage filter */
        _reFilterSession = /^(\[\-.*?\])/,
        
        /* inline bool filter check */
        _reBoolFilter = /^(\s*)(\w+\s*(===|==|\<|\>|\>=|\<=))/,
        
        /* inline math filter check */
        _reMathFilter = /^(\s*)(\w+\s*(\+=|\-=|\*=|\/=|\+|\-|\*|\/|\%))/,
        
        /* inline turnary bind check */
        _reTurnaryFilter = /^(\s*)(\w+\s*(\?.*?\:))/,
        
        /* determines if bind is a single insert */
        _reInsert = /^(\s*)(>)/,
        
        /* determines if bind is a single value set */
        _reOutsert = /^(\s*)(<)/;
    
    function KonnektMP(node)
    {
      /* Name of the component */
      this.name = node.tagName.toLowerCase();
      
      /* template of the component */
      this.template = _templates[this.name] || '<div class="missing_component">Unknown Component</div>';
      
      /* original node */
      this.node = node;
      
      /* document fragment to prevent reflow for faster browser rendering */
      this.fragment = document.createDocumentFragment();
      
      /* wrapper div for placing components inside */
      this.wrapper = this.fragment.appendChild(document.createElement('div'));
      
      /* set wrapper html and define class */
      this.wrapper.className = "Wrapper Wrapper__"+this.name;
      
      this.wrapper.innerHTML = this.template;
      
      if(node.parentElement.stopChange)
      {
        node.parentElement.stopChange().replaceChild(this.fragment,this.node);
      }
      else
      {
        node.parentElement.replaceChild(this.fragment,this.node);
      }
      
      this.maps = loopMap(this.wrapper.childNodes,this.maps);
    }
    
    function replaceNonCompats(template)
    {
      if(!template.match(_reAttrNameBind) && !template.match(_reNodeStart)) return template;
      
      var splitNodes = template.split(_reSplitNodes),
          nodeMem = {},
          keys = {};
      
      for(var x=0,len=splitNodes.length,key,attr,node;x<len;x++)
      {
        key = splitNodes[x].replace(_reGetNodeName,'$3');
        attr = splitNodes[x].match(_reAttrNameBind);
        node = splitNodes[x].match(_reNodeStart);
        if(attr || node)
        {
          if(!keys[key]) 
          {
            keys[key] = 0;
          }
          else
          {
            keys[key]++;
          }
          splitNodes[x] = '<script class="'+key+'_'+keys[key]+'" type="text/placeholder">'+splitNodes[x]+'</script>';
          if(!splitNodes[x].match(_reOneLineTag))
          {
            nodeMem[key] = 1;
          }
          else
          {
            splitNodes[x] = splitNodes[x].replace(_reOneLineTag,'></'+(node ? '{{' : '')+key+(node ? '}}' : '')+'>');
          }
        }
        else if(nodeMem[key] && !splitNodes[x].match(_reEndTag))
        {
          nodeMem[key] += 1;
        }
        else if(nodeMem[key] && splitNodes[x].match(_reEndTag))
        {
          nodeMem[key] -= 1;
          if(nodeMem[key] === 0) splitNodes[x] = '<script class="'+key+'_'+keys[key]+'" type="text/placeholder">'+splitNodes[x]+'</script>';
        }
      }
      return splitNodes.join('');
    }
    
    function loopMap(childNodes,maps)
    {
      for(var x=0,len=childNodes.length,node;x<len;x++)
      {
        node = childNodes[x];
        /* checks: 
        
        1. script placeholder > node bind, attr name bind, attr value bind *note scripts are switched out after data is tied
        2. attributes
        3. textContent
        
        if any checks pass, then pass to mapping library */
      
        switch(node.nodeType)
        {
          case 3:
            if(node.textContent.match(_reBind))
            {
                CreateMap()
                .element(node)
                .maps(maps)
                .type((node.parentElement.nodeName === 'STYLE' ? 'style' : 'text'))
                .text(node.textContent)
                .call(maps);
            }
          break;
          case 1: 
            if(node.nodeName === 'SCRIPT' && node.type === 'text/placeholder')
            {
              /* gets all sub elemenet children to attach to itself */
              function getNextSibling(nextNode,childNodes)
              {
                if(nextNode.className !== node.className)
                {
                  childNodes.push(nextNode);
                  return getNextSibling(nextNode.nextSibling,childNodes);
                }
                return childNodes;
              }
              
              CreateMap()
              .element(node)
              .children((node.textContent.match(_reNodeStart) && !node.textContent.match(_reNodeEnd) ? getNextSibling(node.nextSibling,[]) : []))
              .maps(maps)
              .type('placeholder')
              .text(node.textContent)
              .call(maps);
            }
            else
            {
              for(var i=0,lenn=node.attributes.length,attr;i<lenn;i++)
              {
                attr = node.attributes[i];
                if(attr.value.match(_reBind))
                {
                  CreateMap()
                  .element(node)
                  .maps(maps)
                  .type((KonnektMP.isComponent(node.nodeName) ? 'component' : (_events.indexOf(attr.name) !== -1 ? 'event' : 'attribute')))
                  .attr(attr)
                  .text(attr.value)
                  .call(maps);
                }
              }
              if(node.childNodes.length !== 0) loopMap(node.childNodes,maps);
            }
          break;
        }
      }
      return maps;
    }
    
    /* SECTION Public Methods */
    KonnektMP.registerTemplate = function(name,template)
    {
      if(arguments.length === 0) return _templates;
      if(typeof _templates[name] === 'undefined')
      {
        _templates[name] = replaceNonCompats(template);
      }
      return KonnektMP;
    }
    
    KonnektMP.isRegistered = function(name)
    {
      return (_templates[name] !== undefined);
    }
    
    KonnektMP.isComponent = function(v)
    {
      return (document.createElement(v) instanceof HTMLUnknownElement);
    }
    
    /* The engine should allow for listening data */
    KonnektMP.engine = function(engine)
    {
      if(typeof engine === 'undefined') return _engine;
      _engine = (typeof engine === 'function' ? engine : _engine);
      return KonnektMP;
    }
    
    /* takes a template and parses the nodes for unknown components */
    KonnektMP.getSubComponents = function(template)
    {
      return template.match(_reNodes)
      .filter(function(v,i,arr){
        return ((v.indexOf(_start) !== 0) && (document.createElement(v) instanceof HTMLUnknownElement) && (arr.indexOf(v,(i+1)) === -1) && _templates.indexOf(v) === -1);
      });
    }
    /* END SECTION Public Methods */
    
  }
  return CreateKonnektMP;
})