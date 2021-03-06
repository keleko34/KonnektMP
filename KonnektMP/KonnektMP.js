define(['kb'],function(kb){
  function CreateKonnektMP()
  {
    var _start = "{{",
        _end = "}}",
        _pipe = "|",

        /* where all templates are stored */
        _templates = {},

        /* Regex for nodes in a string, eg: str.match(_reNodes) returns all node names in string */
        _reNodes = /(<\/.*?>)/g,

        /* KB watch engine used for dom listening */
        _kb = kb().call(),

        /* All dom based events such as onclick */
        _domevents = Object.keys(HTMLElement.prototype).filter(function(v){return v.indexOf('on') === 0}),
        
        _events = {
          loopitem:[]
        },
        
        _onEvent = function(e)
        {
          var _listeners = _events[e.event];
          for(var x=0,len=_listeners.length;x<len;x++)
          {
            _listeners[x](e);
          }
        }

    function KonnektMP(node)
    {
      var _fragment = document.createDocumentFragment();

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
    }

    KonnektMP.start = function(v)
    {
      if(v === undefined) return _start;
      _start = (typeof v === 'string' ? v : _start);
      return KonnektMP;
    }

    KonnektMP.end = function(v)
    {
      if(v === undefined) return _end;
      _end = (typeof v === 'string' ? v : _end);
      return KonnektMP;
    }

    KonnektMP.pipe = function(v)
    {
      if(v === undefined) return _pipe;
      _pipe = (typeof v === 'string' ? v : _pipe);
      return KonnektMP;
    }
    
        /* filters out names of unregistered elements from a template string */
    KonnektMP.getUnknown = function(template)
    {
      /* run regex match on all </end tags> */
      var matched = template.match(_reNodes)
      .map(function(k){

        /* remove '</' and '>' chars from string to leave just the name of the node */
        return k.replace(/[<\/>]/g,"");
      });

      matched.filter(function(k,i){
        /* filter out default elements and duplicates as well as components that are already registered */
        return ((document.createElement(k) instanceof HTMLUnknownElement) && (matched.indexOf(k,(i+1)) === -1) && _templates[k] === undefined);
      });

      /* if there are unregistered components run global event for registration */
      //if(matched.length !== 0) onEvent('unknown',new Event('unknown',matched));
      return matched;
    }

    /* checks if a component name has been defined */
    KonnektMP.isRegistered = function(name)
    {
      return (_templates[name] !== undefined);
    }

    /* registers template to a given name and fires unregistered components event if any are found */
    KonnektMP.register = function(name,template)
    {
      if(_templates[name] === undefined)
      {
        _templates[name] = template;

        /* unregistered components can be loaded via globalized listener on registration */
        KonnektMP.getUnknown(template);
      }
      else
      {
        console.error("Class: KonnektMP Method: 'register', A template by the name %o already exists",name);
      }
      return this;
    }
    
    /* Event Handlers */
    
    /* adds an event listener with the appropriate key */
    KonnektMP.addEventListener = function(key,func)
    {
      if(_events[key] !== undefined)
      {
        _events[key].push(func);
      }
      else
      {
        console.error("Class: KonnektMP Method: 'addEventListener', No event exists with the name %o",key);
      }
      return KonnektMP;
    }
    
    /* removes event listener, dependent on key and function being the same */
    KonnektMP.removeEventListener = function(key,func)
    {
      if(_events[key] !== undefined)
      {
        for(var x=0,len=_events[key].length;x<len;x++)
        {
          if(_events[key][x].toString() === func.toString())
          {
            _events[key].splice(x,1);
          }
        }
      }
      else
      {
        console.error("Class: KonnektMP Method: 'removeEventListener', No event exists with the name %o",key);
      }
      return KonnektMP;
    }

    /* Descriptors */

    function setDescriptor(value,writable,redefinable,enumerable)
    {
      return {
          value:value,
          writable:!!writable,
          enumerable:!!enumerable,
          configurable:!!redefinable
      }
    }

    function setPointer(obj,key,redefinable,enumerable)
    {
      var _desc = Object.getOwnPropertyDescriptor(obj,key);
      return {
        get:function(){return obj.get(key);},
        set:function(v)
        {
          (this._stopChange ? obj.stopChange() : obj).set(prop,v);

          this._stopChange = false;
        },
        configurable:!!redefinable,
        enumerable:!!enumerable
      }
    }

    /* REGEX Map Splitters */


    /* Returns a regex that matches against map bindings based on start and end chars */
    function getMatch()
    {
      return new RegExp('(\\'+_start.split('').join('\\')+')(.*?)(\\'+_end.split('').join('\\')+')','g')
    }

    /* Returns a regex that matches against formap bindings based on start and end chars */
    function getForMatch()
    {
      return new RegExp('(\\'+_start.split('').join('\\')+')(.*?)(for)(.*?)(loop)(.*?)(\\'+_end.split('').join('\\')+')','g');
    }
    
    /* returns a regex that looks for all insert maps with the passed name */
    function getInnerMapper(name)
    {
      return new RegExp('('+_start.split('').join('\\')+'>'+name+'(.*?)'+_end.split('').join('\\')+')','g');
    }
    
    /* returns a regex that captures all insert maps in a string */
    function innerMapperKeys()
    {
      return new RegExp('('+_start.split('').join('\\')+'>(.*?)'+_end.split('').join('\\')+')','g');
    }

    /* returns an array of standard text and bindings, binding texts are later converted to bind objects
       EXAMPLE::
        string: "Hello {{name}}, {{greeting}}"
        return: ["Hello ", "{{name}}", ", ", "{{greeting}}"]
    */
    function splitText(s)
    {
      /* splits the string by _start and _end: ["Hello ","{{","name","}}",", ","{{","greeting","}}"] */
      return s.split(new RegExp('('+_start.split('').join('\\')+')(.*?)('+_end.split('').join('\\')+')','g'))
      /* remaps values to have the _start and _end brackets: ["Hello ","{{","{{name}}","}}",", ","{{","{{greeting}}","}}"]*/
      .map(function(v,i,arr){
        return ((arr[(i-1)] === _start) ? (_start+v+_end) : v);
      })
      /* filter out single _start and _end entries: ["Hello ","{{name}}",", ","{{greeting}}"]*/
      .filter(function(v,i,arr){return (v.length !== 0 && v !== _start && v !== _end && v.length !== 0);});
    }

    /* returns an array of standard bind names
       EXAMPLE::
        splitText: ["Hello ", "{{name}}", ", ", "{{greeting}}"]
        return: ["name","greeting"]
    */
    function splitBindNames(splitTexts)
    {
      /* filter out all non bind strings: ["{{name}}","{{greeting}}"]*/
      return splitTexts.filter(function(v){
        return (v.indexOf(_start) !== -1 && v.indexOf(_end) !== -1);
      })
      /* modify string to standard key names: ["name","greeting"]*/
      .map(function(v){
        return splitKey(v);
      });
    }

    /* takes a bind and returns just the name/key
       EXAMPLE::
        string: "{{name | toUpperCase}}"
        return: "name"
    */
    function splitKey(b)
    {
        /* removes _start and _end from the string: "name | toUpperCase" */
        return b.replace(new RegExp('['+_start+_end+']','g'),'')
        /* removes pipe and all that follows: "name "*/
        .replace(new RegExp('\\'+_pipe.split('').join('\\')+'(.*)'),'')
        /* removes any remaining spaces: "name" */
        .replace(/\s/g,'');
    }

    /* takes a bind and returns array of the filter names
       EXAMPLE::
        string: "{{name | toUpperCase, duplicate}}"
        return: ["toUpperCase","duplicate"]
    */
    function splitFilters(b)
    {
        if(b.indexOf(_pipe) !== -1)
        {
          /* remove _end characters from string: "{{name | toUpperCase, duplicate"  */
          return b.replace(new RegExp('['+_end+']','g'),'')
          /* removes everything before the _pipe characters: " toUpperCase, duplicate"*/
          .replace(new RegExp('(.*?)(\\'+_pipe.split('').join('\\')+')'),'')
          /* removes all spaces "toUpperCase,duplicate"*/
          .replace(/\s/g,'')
          /* splits into array nased on ',': ["toUpperCase","duplicate"] */
          .split(',');
        }
        return [];
    }

    /* takes a filters array and parses out specials, eg: (vmFilter),[(~|+|-)storename]
       EXAMPLE::
        string: "["toUpperCase","(duplicate)","[~model.key]"]"
        return: {filters:["toUpperCase"],vmFilters:["duplicate"],model:["model.key"],local:[],session:[]}
    */
    function sortFilters(f)
    {
      return f.reduce(function(obj,filter){
        if(filter.match(/(\()(.*?)(\))/))
        {
          obj.vmFilters[obj.vmFilters.length] = filter.replace(/[\(\)]/g,'');
        }
        else if(filter.match(/(\[)(.*?)(\])/))
        {
          if(filter.indexOf('~') !== -1)
          {
            obj.model[obj.model.length] = filter.replace(/[\[\]\~]/g,'');
          }
          else if(filter.indexOf('+') !== -1)
          {
            obj.local[obj.local.length] = filter.replace(/[\[\]\+]/g,'');
          }
          else
          {
            obj.session[obj.session.length] = filter.replace(/[\[\]\-]/g,'');
          }
        }
        else
        {
          obj.filters[obj.filters.length] = filter;
        }
        return obj;
      },{filters:[],vmFilters:[],model:[],local:[],session:[]});
    }

    /* takes a for bind and returns array of key and component
       EXAMPLE::
        string: "{{for items loop listitem | hasName}}"
        return: ["items","listitem"]
    */
    function splitFor(b)
    {
        if(b.indexOf('for') !== -1)
        {
          /* removes _start and _end characters: "for items loop listitem | hasName" */
          return b.replace(new RegExp('['+_start+_end+']','g'),'')
          /* removes pipe and all text after it: "for items loop listitem "*/
          .replace(new RegExp('\\'+'|'.split('').join('\\')+'(.*)'),'')
          /* removes all empty spaces:  "foritemslooplistitem"*/
          .replace(/\s/g,'')
          /* splits the string removing 'for' and 'loop' leaving only key and component in an array: ["items","listitem"]*/
          .split(/for(.*?)loop/)
          /* in case any trailing empty strings are in array */
          .filter(function(v){return v.length !== 0;});
        }
        return [];
    }
    
    /* Helpers */
    function runThroughBinds(binds)
    {
      if(binds.length !== 0)
      {
        var text = '';
        for(var x=0,len=binds.length;x<len;x++)
        {
          if(typeof binds[x] === 'string')
          {
            text += binds[x];
          }
          else
          {
            if(binds[x]._data === undefined)
            {
              text += binds[x].text;
            }
            else
            {
              text += runThroughFilters(binds[x]._data.get(binds[x].key),binds[x].filters.filters,binds[x]._data.filters);
            }
          }
        }
        return text;
      }
      else
      {
        return runThroughFilters(binds[0]._data.get(binds[0].key),binds[0].filters.filters,binds[0]._data.filters);
      }
    }

    function runThroughFilters(val,filters,filterFuncs)
    {
      for(var x=0,len=filters.length;x<len;x++)
      {
        if(filterFuncs[filters[x]]) val = filterFuncs[filters[x]](val);
      }
      return val;
    }

    function runThroughForFilters(data,filters,filterFuncs,index)
    {
      for(var x=0,len=filters.length;x<len;x++)
      {
        if(filterFuncs[filters[x]]) filterFuncs[filters[x]](data,index);
      }
      return data;
    }
    
    /* Prototyped Methods */

    /* need better methods to approach adding and swapping filters for bindings */

    /* Main Mapping Methods */
    KonnektMP.insert = function(html,vm)
    {
      var mapper = innerMapperKeys(),
          innerMap,
          key,
          filters,
          value;
      while(innerMap = mapper.exec(html))
      {
        key = splitKey(innerMap[1]);
        filters = splitFilters(innerMap[1]);
        value = vm.get(key);
        if(value)
        {
          html = html.replace(getInnerMapper(key),runThroughFilters(value,filters,vm.filters));
        }
      }
      return html;
    }
    
    function map(node)
    {
      function loopMap(childNodes,binds)
      {
        for(var x=0,len=childNodes.length;x<len;x++)
        {
          if(childNodes[x].kb_maps === undefined && childNodes[x].nodeType !== 8)
          {
            /* add mapper refrence so from any node we can always go back to root */
            childNodes[x].kb_mapper = node;
            childNodes[x].kb_maps = binds;

            /* check if node is a text node */
            if(childNodes[x].nodeType === 3)
            {
              getTextBinds(childNodes[x],binds);
            }

            /* if it isnt then only check attributes for binds */
            else
            {
              getAttrBinds(childNodes[x],binds);
            }

            /* if this childnode has other children nodes then we run recursive */
            if(childNodes[x].childNodes && childNodes[x].childNodes.length !== 0)
            {
              binds = loopMap(childNodes[x].childNodes,binds);
            }
          }
        }
        return binds;
      }
      return loopMap(node.childNodes,{});
    }

    function getTextBinds(node,binds)
    {
      /* the actual text */
      var text = node.textContent;

      /* matches an array of _start and end looking for binds in the text */
      if(text.match(getMatch()))
      {
        var bindText = splitText(text),
            binder = CreateBind();

        binder.prototype.type = (text.match(getForMatch()) ? 'for' : 'text');
        binder.prototype.text = text;
        binder.prototype.bindText = bindText;
        binder.prototype.listener = 'textContent';
        binder.prototype.attr = 'textContent';
        binder.prototype.localAttr = 'textContent';
        binder.prototype.local = node;
        binder.prototype.node = node.parentElement;
        binder.prototype.binds = binds;

        for(var x=0,len=bindText.length;x<len;x++)
        {
          /* if this is a bind */
          if(bindText[x].indexOf(_start) === 0)
          {
            var key = (binder.prototype.type === 'for' ? splitFor(bindText[x])[0] : splitKey(bindText[x])),

                bind = new binder(bindText[x],key);

            /* create new bind object and attach to the binds list for returning */
            if(binds[key] === undefined) binds[key] = [];

            bind.bindText[x] = bind;
            bind.bindMaps.push(bind);
            bind.id = binds[key].length;
            binds[key].push(bind);
          }
        }
      }
    }

    function getAttrBinds(node,binds)
    {
      /* all attributes of the node */
      var attrs = Array.prototype.slice.call(node.attributes),

          /* if the parent element is a component then we need to treat it as a single instance map */
          isUnknown = (node instanceof HTMLUnknownElement);

      for(var i=0,lenn=attrs.length;i<lenn;i++)
      {
        if(attrs[i].value.match(getMatch()))
        {
          /*specifies bind type: component|attribute */
          var bindText = splitText(attrs[i].value),
              binder = CreateBind()

          binder.prototype.type = (isUnknown ? 'component' : 'attribute');
          binder.prototype.text = attrs[i].value;
          binder.prototype.bindText = bindText;
          binder.prototype.isEvent = (_domevents.indexOf(attrs[i].name) !== -1);
          binder.prototype.isInput = (node.tagName.toLowerCase() === 'input');
          binder.prototype.isRadio = (binder.prototype.isInput ? (['radio','checkbox'].indexOf(node.type) !== -1) : false);
          binder.prototype.listener = attrs[i].name;
          binder.prototype.attr = attrs[i].name;
          binder.prototype.localAttr = 'value';
          binder.prototype.local = attrs[i];
          binder.prototype.node = node;
          binder.prototype.binds = binds;

          if(binder.prototype.isEvent)
          {
            node.removeAttribute(attrs[i].name);
          }

          for(var x=0,len=bindText.length;x<len;x++)
          {
            /* if this is a bind */
            if(bindText[x].indexOf(_start) === 0)
            {
              var key = splitKey(bindText[x]),

                  bind = new binder(bindText[x],key);

              /* create new bind object and attach to the binds list for returning */
              if(binds[key] === undefined) binds[key] = [];

              bind.bindText[x] = bind;
              bind.bindMaps.push(bind);
              bind.id = binds[key].length;
              binds[key].push(bind);
            }
          }
        }
      }
    }


    Object.defineProperties(KonnektMP.prototype,{
      register:setDescriptor(KonnektMP.register),
      isRegistered:setDescriptor(KonnektMP.isRegistered),
      getUnknown:setDescriptor(KonnektMP.getUnknown),
      map:setDescriptor(map),
      insert:setDescriptor(KonnektMP.insert)
    });

    /* Bind object and methods */

    function CreateBind()
    {
      function bind(text,key)
      {
        this.text = text;
        this.key = key;
        this.keyLength = this.key.split('.').length;
        this.localKey = this.key.split('.').pop();
        this.filters = sortFilters(splitFilters(text));
        this.component = (this.type === 'for' ? splitFor(text)[1] : undefined);
        this.id = 0;
      }
      
      function reconnect()
      {
        if(this.type !== 'for')
        {
          this._data.getLayer(this.key).removeDataUpdateListener(this.localKey,this.dataListener);
          if(this.bindText.length === 1)
          {
            this.node.removeAttrUpdateListener(this.listener,this.domListener);
          }
        }
        else
        {
          data.getLayer(this.key)
          .removeDataMethodUpdateListener(this.extraListener);
        }
        this.connect(this._data);
        return this;
      }
      
      function connect(data)
      {
        var self = this;

        this._data = data;
        if(this.type !== 'for')
        {
          this.dataListener = function(e){
            if(e.event === 'delete')
            {
              self.unsync();
            }
            else
            {
              self.setDom(e.value);
            }
          }

          data.getLayer(this.key)
          .addDataUpdateListener(this.localKey,this.dataListener);
          
          if(this.bindText.length === 1)
          {
            this.domListener = function(e)
            {
              self.setData(e.value);
            }
            
            this.node.addAttrUpdateListener(this.listener,this.domListener);
          }
        }
        else
        {
          this.dataListener = function(e){
            if(e.type === 'postset' && (!e.oldValue || (e.oldValue.length === 0)))
            {
              e.event = 'create';
            }
            self.setLoop(e.key,e.event);
          }

          data.getLayer(this.key)
          .addDataMethodUpdateListener(this.dataListener);
        }
        
        if(this.type !== 'for')
        {
          /* first check storage to data */
          if(!!this.filters.model && this.filters.model.length !== 0)
          {
            this._data.stopChange().set(this.key,getModel(this.filters.model));
          }
          else if(!!this.filters.session && this.filters.session.length !== 0)
          {
            this._data.stopChange().set(this.key,getSession(this.filters.session));
          }
          else if(!!this.filters.local && this.filters.local.length !== 0)
          {
            this._data.stopChange().set(this.key,getLocal(this.filters.local));
          }

          /* then update dom */
          if(this.isEvent)
          {
            this.node.stopChange()[this.attr] = this._data.get(this.key);
          }
          else if(this.key === 'innerHTML')
          {
            /* first clear binding text, then append nodes */
            this.node.stopChange().innerHTML = "";
            inserthtml(this.node,this._data.innerHTML);
          }
          else
          {
            this.local.stopChange()[this.localAttr] = runThroughBinds(this.bindText);
            if(this.isInput && (['value','checked'].indexOf(this.attr) !== -1)) this.node.stopChange()[this.attr] = this._data.get(this.key);
          }
        }
        
        return this;
      }
      
      function inserthtml(node,html)
      {
        for(var x=0,len=html.length;x<len;x++)
        {
          node.stopChange().appendChild(html[x])
        }
      }
      
      function getModel(filters)
      {
        if(!!filters && window.model)
        {
          return window.model.get(filters[0]);
        }
      }
      
      function setModel(value,filters)
      {
        if(!!filters && filters.length !== 0 && window.model)
        {
          for(var x=0,len=filters.length;x<len;x++)
          {
            window.model.set(filters[x],value);
          }
        }
      }
      
      function getLocal(filters)
      {
        if(!!filters && window.localStorage)
        {
          return localStorage.getItem(filters[0]);
        }
      }
      
      function setLocal(filters,value)
      {
        if(!!filters && filters.length !== 0 && window.localStorage)
        {
          for(var x=0,len=filters.length;x<len;x++)
          {
            localStorage.setItem(filters[x],value);
          }
        }
      }
      
      function getSession(filters)
      {
        if(!!filters && window.sessionStorage)
        {
          return sessionStorage.getItem(filters[0]);
        }
      }
      
      function setSession(filters,value)
      {
        if(!!filters && filters.length !== 0 && window.sessionStorage)
        {
          for(var x=0,len=filters.length;x<len;x++)
          {
            sessionStorage.setItem(filters[x],value);
          }
        }
      }
      
      function setData(value)
      {
        /* run through vmFilters + post set storage and model filters */
        value = runThroughFilters(value,this.filters.vmFilters,this._data.filters);
        
        this._data.stopChange().set(this.key,value);
        
        setModel(this.filters.model,value);
        setSession(this.filters.session,value);
        setLocal(this.filters.local,value);
        return this;
      }

      function setDom(value)
      {
        /* run through Standard filters + pre set storage and model filters */
        setModel(this.filters.model,value);
        setSession(this.filters.session,value);
        setLocal(this.filters.local,value);
        
        if(this.isEvent)
        {
          this.node.stopChange()[this.attr] = this._data.get(this.key);
        }
        else if(this.isInput && (['value','checked'].indexOf(this.attr) !== -1))
        {
          this.node.stopChange()[this.attr] = this._data.get(this.key);
        }
        else if(this.key === 'innerHTML')
        {
          /* first clear binding text, then append nodes */
          this.node.stopChange().innerHTML = "";
          inserthtml(this.node,this._data.innerHTML);
        }
        else
        {
          this.local.stopChange()[this.localAttr] = runThroughBinds(this.bindText);
        }
        return this;
      }

      function setLoop(index,event)
      {
        switch(event)
        {
          case 'create':
            this.addPointer(index);
          break;
          case 'delete':
            this.removePointer(index);
          break;
          case 'set':
            this.reapplyPointer(index);
          break;
          default:
            if(event !== 'push')
            {
              for(var x=0,len=this._data.getLayer(this.key).length;x<len;x++)
              {
                this.reapplyPointer(x);
              }
            }
          break;
        }
        return this;
      }
      
      function createloop()
      {
        this.node.stopChange().innerHTML = "";
        var forData = runThroughForFilters(this._data.get(this.key),this.filters.filters,this._data.filters);
        for(var x=0,len=forData.length;x<len;x++)
        {
          this.setLoop(x,'create');
        }
        return this;
      }

      function reapplyPointer(index)
      {
        var childMaps = this.node.children[index].kb_maps,
            childPointers = this.node.children[index].kb_viewmodel.pointers,
            loopid = this.node.children[index].kb_viewmodel.loopid;
        for(var x=0,keys=Object.keys(childPointers),len=keys.length;x<len;x++)
        {
          var _maps = childMaps[keys[x]];
          if(_maps !== undefined)
          {
            for(var i=0,lenn=_maps.length;i<lenn;i++)
            {
              _maps[i].reconnect();
            }
          }
        }
        this.node.children[index].kb_viewmodel.x = index;
        this.node.children[index].kb_viewmodel.loopid = loopid.substring(0,(loopid.lastIndexOf('_')+1))+index;
        return this;
      }

      function addPointer(index)
      {
        var newNode =  document.createElement(this.component),
            data = runThroughForFilters(this._data.getLayer(this.key),this.filters.filters,this._data.filters,index)[index];
        for(var x=0,keys=Object.keys(data,'all'),len=keys.length;x<len;x++)
        {
          if(!newNode.k_post) newNode.k_post = {};
          newNode.k_post[keys[x]] = data;
          newNode.k_post.x = index;
          newNode.k_post.loopid = this.component+"_"+index;
        }
        if(index >= this.node.children.length)
        {
          this.node.stopChange().appendChild(newNode);
        }
        else
        {
          this.node.stopChange().insertBefore(newNode,this.node.children[index]);
        }
        _onEvent({event:'loopitem',node:newNode,parent:this.node});
        return this;
      }

      function removePointer(index)
      {
        var childMaps = this.node.children[index].kb_maps,
            childPointers = this.node.children[index].kb_viewmodel.pointers;
        for(var x=0,keys=Object.keys(childPointers),len=keys.length;x<len;x++)
        {
          var _maps = childMaps[keys[x]];
          if(!!_maps)
          {
            for(var i=0,lenn=_maps.length;i<lenn;i++)
            {
              _maps[i].unsync();
              _maps[i] = null;
              delete _maps[i];
            }
            
          }
        }
        this.node.stopChange().removeChild(this.node.children[index]);
        for(var x=0,len=this.node.children.length;x<len;x++)
        {
          this.node.children[x].kb_viewmodel.x = x;
          var loopid = this.node.children[x].kb_viewmodel.loopid;
          this.node.children[x].kb_viewmodel.loopid = loopid.substring(0,(loopid.lastIndexOf('_')+1))+x;
        }
        return this;
      }

      function unsync()
      {
        this.__proto__.bindText = null;

        this._data = null;
        delete this._data;

        this.bindMaps = null;
        delete this.bindMaps;

        this.binds = null;
        delete this.binds;
        return this;
      }

      Object.defineProperties(bind.prototype,{
        addPointer:setDescriptor(addPointer),
        removePointer:setDescriptor(removePointer),
        reapplyPointer:setDescriptor(reapplyPointer),
        connect:setDescriptor(connect),
        reconnect:setDescriptor(reconnect),
        createloop:setDescriptor(createloop),
        setData:setDescriptor(setData),
        setDom:setDescriptor(setDom),
        setLoop:setDescriptor(setLoop),
        bindMaps:setDescriptor([]),
        unsync:setDescriptor(unsync)
      })

      return bind;
    }

    return KonnektMP;
  }
  return CreateKonnektMP;
})
