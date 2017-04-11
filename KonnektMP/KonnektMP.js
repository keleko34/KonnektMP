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
        _domevents = Object.keys(HTMLElement.prototype).filter(function(v){return v.indexOf('on') === 0});

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

    /* Prototyped Methods */

    /* need better methods to approach adding and swapping filters for bindings */

    /* Main Mapping Methods */
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
          binder.prototype.listener = attrs[i].name;
          binder.prototype.attr = 'value';
          binder.prototype.local = (isUnknown ? node : attrs[i]);
          binder.prototype.node = (isUnknown ? node.parentElement : node);
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
              bind.bindMapId = (bind.bindMaps.length-1);
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
      map:setDescriptor(map)
    });

    /* Bind object and methods */

    function CreateBind()
    {
      function bind(text,key)
      {
        this.text = text;
        this.key = key;
        this.filters = sortFilters(splitFilters(text));
        this.component = (this.type === 'for' ? splitFor(text)[1] : undefined);
        this.id = 0;
      }

      function connect(obj,onCreate)
      {
        var self = this;

        this._data = obj;
        Object.defineProperty(this,'value',setPointer(obj,this.key,true,true));
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

          obj.getLayer(this.key)
          .addDataUpdateListener((this.key.split('.').pop()),this.dataListener);
          if(this.isEvent) this.node.removeAttribute(this.attr);
          if(this.bindText.length === 1)
          {
            this.domListener = function(e)
            {
              self.setData(e.value);
            }
            
            this.node.addAttrUpdateListener((this.type === 'text' ? 'html' : this.listener),this.domListener);
          }
          this.setDom((this.key === 'innerHTML' ? obj.getLayer(this.key) : obj.getLayer(this.key)[(this.key.split('.').pop())]));
        }
        else
        {
          this.dataListener = function(e){
            if(e.type === 'postset')
            {
              self.setLoop(e.key,'create',function(node){
                if(onCreate) onCreate.call(this,node,function(){
                  self.setLoop('*','organize');
                });
              });
            }
            else if(e.type !== 'postpush')
            {
              self.setLoop('*','organize');
            }
          }

          obj.getLayer(this.key)
          .addDataMethodUpdateListener(this.dataListener);
          
          this.node[this.listener] = '';
        }
        return this;
      }
      
      function runThroughFilters(val,filters,filterFuncs)
      {
        return filters.reduce(function(val,filter){
          return (filterFuncs[filter] ? filterFuncs[filter](val) : val);
        },val);
      }
      
      function concatBinds(binds)
      {
        return binds.reduce(function(str,v){
          if(typeof v === 'object' && !!v._data)
          {
            str += runThroughFilters(v.value,v.filters.filters,v._data.filters)
          }
          else
          {
            str += v;
          }
          return str;
        },"")
      }
      
      function setModel(filters,value)
      {
        if(filters.length !== 0 && window.model)
        {
          for(var x=0,len=filters.length;x<len;x++)
          {
            window.model.set(filters[x],value);
          }
        }
      }
      
      function setLocal(filters,value)
      {
        if(filters.length !== 0)
        {
          for(var x=0,len=filters.length;x<len;x++)
          {
            localStorage.setItem(filters[x],value);
          }
        }
      }
      
      function setSession(filters,value)
      {
        if(filters.length !== 0)
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
          this.node.stopChange()[this.listener] = value;
        }
        else if(this.isInput && this.attr === 'value')
        {
          this.node.stopChange()[this.listener] = concatBinds(this.bindText);
        }
        else if(this.type === 'text' && this.key === 'innerHTML')
        {
          for(var x=0,len=value.length;x<len;x++)
          {
            this.node.appendChild(value[x]);
          }
        }
        else
        {
          if(this.local.stopChange) this.local.stopChange();
          this.local[this.attr] = concatBinds(this.bindText);
        }
        return this;
      }
      
      function loop(cb)
      {
        var dataSet = this._data.getLayer(this.key);
        for(var x=0,len=dataSet.length;x<len;x++)
        {
          this.setLoop(x,'create',cb);
          
        }
        return this;
      }
      
      function setLoop(index,event,cb)
      {
        switch(event)
        {
          case 'create':
            this.addPointer(index,cb);
          break;
          case 'delete':
            this.removePointer(index,cb);
          break;
          case 'set':
            this.reapplyPointer(index,cb);
          break;
          case 'organize':
            for(var x=0,len=this.value.length;x<len;x++)
            {
              this.reapplyPointer(x,cb);
            }
          break;
        }
        return this;
      }

      function reapplyPointer(index,cb)
      {
        var childData = this.node.children[index].kb_viewmodel;
        for(var x=0,keys=Object.keys(this.value[index],'all'),len=keys.length;x<len;x++)
        {
          childData.addPointer(this.value[index],keys[x]);
        }
        if(!!cb) cb(this.node);
      }

      function addPointer(index,cb)
      {
        var newNode =  document.createElement(this.component),
            data = this._data.getLayer(this.key);
        for(var x=0,keys=Object.keys(data[index],'all'),len=keys.length;x<len;x++)
        {
          if(!newNode.k_post)
          {
            newNode.k_post = {};
            newNode.k_post.pointers = {};
          }
          newNode.k_post.pointers[keys[x]] = data[index];
        }
        if(index >= this.node.children.length)
        {
          this.node.appendChild(newNode);
        }
        else
        {
          this.node.insertBefore(newNode,this.node.children[index]);
        }
        if(!!cb) cb(newNode);
      }

      function removePointer(index,cb)
      {
        this.unsync();
        this.node.removeChild(this.node.children[index]);
        if(!!cb) cb(this.node);
        this.node = null;
        delete this.node;
      }

      function unsync()
      {
        Object.defineProperty(this,'value',setDescriptor(undefined,true,true,false));
        delete this.value;
        this.__proto__.bindText = null;
        
        if(this.domListener)
        {
          this.node.removeAttrUpdateListener((this.type === 'text' ? 'html' : this.listener),this.domListener);
          this.domListener = null;
          delete this.domListener;
        }
        
        this._data.getLayer(this.key)
        .removeDataMethodUpdateListener(this.dataListener);

        this._data = null;
        delete this._data;
        
        this.__proto__.bindMaps.splice(this.bindMapId,1);
        for(var x = this.bindMapId,len=this.bindMaps.length;x < len;x++)
        {
          this.__proto__.bindMaps[x].bindMapId = x;
        }
        
        this.__proto__.bindMaps = null;
        delete this.__proto__.bindMaps;
        
        this.node = null;
        delete this.node;
        
        this.target = null;
        delete this.target;
        
        this.binds = null;
        delete this.binds;
        return this;
      }

      Object.defineProperties(bind.prototype,{
        addPointer:setDescriptor(addPointer),
        removePointer:setDescriptor(removePointer),
        reapplyPointer:setDescriptor(reapplyPointer),
        connect:setDescriptor(connect),
        setData:setDescriptor(setData),
        setDom:setDescriptor(setDom),
        setLoop:setDescriptor(setLoop),
        bindMaps:setDescriptor([]),
        unsync:setDescriptor(unsync),
        loop:setDescriptor(loop)
      })

      return bind;
    }

    return KonnektMP;
  }
  return CreateKonnektMP;
})
