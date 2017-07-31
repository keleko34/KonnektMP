define(['./Sub/Map/Map'],function(CreateMap){
  function CreateKonnektMP()
  {
    /* The start and end characters to search for when looking for binds */
    var _start = "{{",
        _end = "}}",
        
    /* The seperation character when looking for bind params and options */    
        _pipe = "|",
        
    /* The text for the component */
        _template = "",
        
    /* A list of all dom events that can be attached to an element such as `onclick` */
        _events = [],
    
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
      
      return KonnektMP;
    }
    
    function replaceNonCompats(template)
    {
      var splitNodes = template.split(_reSplitNodes),
          nodeMem = {};
      
      for(var x=0,len=splitNodes.length,key,attr,node;x<len;x++)
      {
        key = splitNodes[x].replace(_reGetNodeName,'$3');
        attr = splitNodes[x].match(_reAttrNameBind);
        node = splitNodes[x].match(_reNodeStart);
        if(attr || node)
        {
          splitNodes[x] = "<!--"+splitNodes[x]+"-->";
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
          if(nodeMem[key] === 0) splitNodes[x] = '<!--'+splitNodes[x]+'-->';
        }
      }
      return splitNodes.join('');
    }
    
    function loopMap(childNodes,binds)
    {
      
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
    
    /* The engine should allow for listening data */
    KonnektMP.engine = function(engine)
    {
      if(typeof engine === 'undefined') return _engine;
      _engine = (typeof engine === 'function' ? engine : _engine);
      return KonnektMP;
    }
    /* END SECTION Public Methods */
    
    
    /* takes a template and parses the nodes for unknown components */
    KonnektMP.getSubComponents = function(template)
    {
      return template.match(_reNodes)
      .filter(function(v,i,arr){
        return ((v.indexOf(_start) !== 0) && (document.createElement(v) instanceof HTMLUnknownElement) && (arr.indexOf(v,(i+1)) === -1) && _templates.indexOf(v) === -1);
      });
    }
  }
  return CreateKonnektMP;
})