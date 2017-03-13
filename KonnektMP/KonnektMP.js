/* Build */
/* End Build */

define(['KB'],function(kb){
  function CreateKonnektMP()
  {
    var _templates = {},
        _reNodes = /(<\/.*?>)/g,
        _kb = kb().call(),
        _start = "{{",
        _end = "}}",
        _pipe = "|",
        _filters = {},
        _actions = {
          mapper:[],
          unsync:[],
          map:[],
          update:[]
        };
    
    /* Events need to be localized to maps and not global, easier chains */
    
    function KonnektMP(node)
    {
      /* Main constructor takes node and splices into template and returns finished node */
      var _name = node.tagName.toLowerCase(),
          _template = getTemplate(_name),
          _wrapper = document.createElement('div');
      
      /* Wrapper */
      _wrapper.className = _name+"__Wrapper";
      _wrapper.innerHTML = _template;
      
      return {
        node:node,
        wrapper:_wrapper,
        unkowns:getUnkownTemplates(_wrapper.innerHTML),
        maps:mapTemplate(_wrapper),
        unloaded:getUnregisteredTenplates(_wrapper.innerHTML)
      };
    }
    
    /* REGION Events */
    function actionObject(type,data)
    {
      this.preventDefault = function()
      {
        this._preventDefault = true;
      }
      this.stopPropagation = function()
      {
        this._stopPropogation = true;
      }
      this.type = type;
      this.data = data;
    }

    function _onaction(a)
    {
      var _listeners = _actions[a.type];
      for(var x=0,len=_listeners.length;x<len;x++)
      {
        _listeners[x](a);
        if(!a._stopPropogation) break;
      }
      return a._preventDefault;
    }
    
    function addActionListener(key,func)
    {
      if(_actions[key] !== undefined)
      {
        _actions[key].push(func);
      }
      return this;
    }
    
    function removeActionListener(key,func)
    {
      if(_actions[key] !== undefined)
      {
        for(var x=0,len=_actions[key].length;x<len;x++)
        {
          if(_actions[key][x].toString() === func.toString())
          {
            _actions[key].splice(x,1);
          }
        }
      }
      return this;
    }
    
    /* ENDREGION Events */
    
    function setDescriptor(value,writable,redefinable)
    {
      return {
          value:value,
          writable:!!writable,
          enumerable:false,
          configurable:!!redefinable
      }
    }
    
    /* REGION Templating */
    
    function getUnkownTemplates(template)
    {
      var matched = template.match(_reNodes);
      return matched.map(function(k){
        return k.replace(/[<\/>]/g,"");
      })
      .filter(function(k,i){
        return ((document.createElement(k) instanceof HTMLUnknownElement) && (matched.indexOf(k,(i+1)) === -1));
      });
    }
    
    function getUnregisteredTenplates(template)
    {
      return getUnkownTemplates(template)
      .filter(function(k,i){
        return (_templates[k] === undefined);
      });
    }
    
    function isRegistered(name)
    {
      return (_templates[name] !== undefined);
    }
    
    function register(name,template)
    {
      if(_templates[name] === undefined)
      {
        _templates[name] = template;
      }
      else
      {
        console.error('A template with the name',name,' already exists');
      }
      return getUnkownTemplates(template);
    }
    
    function getTemplate(name)
    {
      return _templates[name];
    }
    
    Object.defineProperties(KonnektMP,{
      getUnkownTemplates:setDescriptor(getUnkownTemplates),
      getUnregisteredTenplates:setDescriptor(getUnregisteredTenplates),
      isRegistered:setDescriptor(isRegistered),
      register:setDescriptor(register),
      getTemplate:setDescriptor(getTemplate)
    });
    
    /* ENDREGION Templating */
    
    /* REGION Mapping */
    
    function mapObject(text,texts,bindTexts,type,binds,filters,target,prop,element,parent,listener)
    {
      this.text = text;
      this.texts = texts;
      this.bindTexts = bindTexts;
      this.type = type;
      this.binds = binds;
      this.filters = filters;
      this.target = target;
      this.prop = prop;
      this.element = element;
      this.listener = listener;
      this.parent = parent;
    }

    function bindObject(name,text,value,filters,map)
    {
      this.key = name;
      this.text = text;
      this.value = value;
      this.filters = filters;
    }
    
      /* REGION Splits */
      function splitText(s)
      {
        return s.split(new RegExp('('+_start.split('').join('\\')+')(.*?)('+_end.split('').join('\\')+')','g'))
        .map(function(v,i,arr){
          return ((arr[(i-1)] === _start) ? (_start+v+_end) : v);
        })
        .filter(function(v,i,arr){return (v.length !== 0 && v !== _start && v !== _end && v.length !== 0);});
      }

      function splitBinds(s)
      {
        return s.split(new RegExp('('+_start.split('').join('\\')+')(.*?)('+_end.split('').join('\\')+')','g'))
        .filter(function(v,i,arr){return (v !== _start && v !== _end);});
      }

      function splitMaps(s)
      {
        return s.split(new RegExp('('+_start.split('').join('\\')+')(.*?)('+_end.split('').join('\\')+')','g'))
        .filter(function(v,i,arr){return (arr[(i-1)] === _start);});
      }

      function splitKey(b)
      {
        return b.replace(new RegExp('\\'+_pipe.split('').join('\\')+'(.*)'),'').replace(/\s/g,'');
      }

      function splitFilter(b)
      {
        if(b.indexOf(_pipe) !== -1)
        {
          return b.replace(new RegExp('(.*?)(\\'+_pipe.split('').join('\\')+')'),'').replace(/\s/g,'').split(',');
        }
        return [];
      }

      function splitFor(b)
      {
        if(b.indexOf('for') !== -1)
        {
          var split = (b.replace(/\s/g,'').split(/for(.*?)loop/).filter(function(v){return v.length !== 0;}));
          return {
            key:split[0],
            component:splitKey(split[1]),
            filters:splitFilter(b)
          };
        }
        return null;
      }

      /* ENDREGION Splits */
    
      /* REGION charMaps */
      function startChars(v)
      {
        if(v === undefined){
          return _start;
        }
        _start = (typeof v === 'string' && v !== _end ? v : _start);
        return this;
      }

      function endChars(v)
      {
        if(v === undefined){
          return _end;
        }
        _end = (typeof v === 'string' && v !== _start ? v : _end);
        return this;
      }

      function pipeChars(v)
      {
        if(v === undefined){
          return _pipe;
        }
        _pipe = (typeof v === 'string' && v !== _start && v !== _end ? v : _pipe);
        return this;
      }
      
      /* ENDREGION charMaps */
    
    function connect(obj)
    {
      
    }
    
    function map(el)
    {
      function loopMap(childNodes)
      {
        var binds = [];
        for(var x=0,len=childNodes.length;x<len;x++)
        {
          if(childNodes[x].kb_maps === undefined)
          {
            childNodes[x].kb_mapper = el;
            if(childNodes[x].nodeType === 3)
            {
              binds = binds.concat(bindTexts(childNodes[x]));
            }
            else
            {
              binds = binds.concat(bindAttrs(childNodes[x]));
            }
            if(childNodes[x].childNodes && childNodes[x].childNodes.length !== 0) binds = binds.concat(loopMap(childNodes[x].childNodes));
          }
        }
        return binds;
      }
      return loopMap(el.childNodes);
    }
    
    function checkUnsynced(binds)
    {
      for(var x=0,len=binds.length;x<len;x++)
      {
        if(binds[x].element.parentElement === null)
        {
          var a = new actionObject('unsync',binds[x]);
          _onaction(a);
          binds.splice(x,1);
          len = binds.length;
        }
      }
      return binds;
    }
    
    function bindAttrs(node)
    {
      var attrs = node.attributes,
          isUnkown = (node instanceof HTMLUnknownElement),
          attrBinds = [];

      for(var i=0,lenn=attrs.length;i<lenn;i++)
      {
        if(attrs[i].value.match(new RegExp('(\\'+_start.split('').join('\\')+')(.*?)(\\'+_end.split('').join('\\')+')','g')))
        {
          var maps = splitMaps(attrs[i].value),
              texts = splitText(attrs[i].value),
              bt = splitBinds(attrs[i].value),
              a = new actionObject('mapper',{});
            var mp = new mapObject(attrs[i].value,texts,[],(isUnkown ? 'component' : 'attribute'),{},{},(isUnkown ? undefined : attrs[i]),attrs[i].name,(isUnkown ? node.parentElement : node),(isUnkown ? undefined : node.parentElement),(isUnkown ? undefined : attrs[i].name));
            mp.binds = maps.reduce(function(obj,v,i,arr){
              a.type = 'map';
              a.data = new bindObject(splitKey(v),v,"",splitFilter(v),mp);
              bt[bt.indexOf(v)] = a.data;
              if(_onaction(a) !== true) obj[a.data.key] = a.data;
              return obj;
            },{});
            mp.bindTexts = bt.filter(function(v){return (typeof v === 'object' || v.length !== 0)});
            a.type = 'mapper';
            a.data = mp;
            if(_onaction(a) !== true) attrBinds.push(a.data);
        }
      }

      if(isUnkown) node.kb_maps = attrBinds;
      return attrBinds;
    }
    
    function bindTexts(node)
    {
      if(node.textContent.match(new RegExp('(\\'+_start.split('').join('\\')+')(.*?)(\\'+_end.split('').join('\\')+')','g')))
      {
        var maps = splitMaps(node.textContent),
            texts = splitText(node.textContent),
            bt = splitBinds(node.textContent),
            a = new actionObject('mapper',{});

        if(maps.length === 1 && maps[0].indexOf('for') !== -1)
        {
          /* For Mapping */
          a.data = new mapObject(node.textContent,texts,[],"for",splitFor(maps[0]),{},node,undefined,node,node.parentElement);
          if(_onaction(a) !== true)
          {
            return [a.data];
          }
        }
        else
        {
            /* Text mapping */
            var mp = new mapObject(node.textContent,texts,[],'text',{},{},node,'textContent',node,node.parentElement,'textContent');
            mp.binds = maps.reduce(function(obj,v,i,arr){
              a.type = 'map';
              a.data = new bindObject(splitKey(v),v,"",splitFilter(v),mp);
              bt[bt.indexOf(v)] = a.data;
              if(_onaction(a) !== true) obj[splitKey(v)] = a.data;
              return obj;
            },{});
            mp.bindTexts = bt;
            a.type = 'mapper';
            a.data = mp;
            if(_onaction(a) !== true) return [a.data];
        }
      }
      return [];
    }
    
    function mapTemplate(node)
    {
      function stopHTML(e)
      {
        if(!e.stopChange)
        {
          if(e.attr !== 'replaceWith')
          {
            if(e.child.children.length !== 0)
            {
              e.preventDefault();
            }
            else
            {
              if(e.attr !== 'textContent')
              {
                e.preventDefault();
                if(e.attr === 'innerHTML')
                {
                  e.child.textContent = e.value;
                }
              }
            }
          }
          else if(!(e.child instanceof HTMLUnknownElement))
          {
            e.preventDefault();
          }
        }
        else
        {
          e.child._stopChange = undefined;
          e.stopChange = undefined;
        }
      }
      
      node.addAttrListener('html',stopHTML)
      .addChildAttrListener('html',stopHTML)
      .addChildAttrUpdateListener('html',function(e){
        checkUnsynced(node.kb_maps);
      })
      .addChildAttrListener('events',function(e){
        if(!!e.target.getAttribute(e.attr))
        {
          e.preventDefault();
          e.target.setAttribute(e.attr.replace('on',''));
        }
      });
      
      Object.defineProperty(node,'kb_maps',setDescriptor(map(node)));
      return node.kb_maps;
    }
    
    Object.defineProperties(KonnektMP,{
      startChars:setDescriptor(startChars),
      endChars:setDescriptor(endChars),
      pipeChars:setDescriptor(pipeChars),
      checkUnsynced:setDescriptor(checkUnsynced),
      mapTemplate:setDescriptor(mapTemplate),
      mapNode:setDescriptor(map)
    });
    
    /* ENDREGION Mapping */

    return KonnektMP;
  }
  return CreateKonnektMP;
});
