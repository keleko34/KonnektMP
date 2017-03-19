/* Build */
/* End Build */

define(['KB'],function(kb){
  function CreateKonnektMP()
  {
    var _templates = {},
        _reNodes = /(<\/.*?>)/g,
        _kb = kb().call(),
        _domevents = Object.keys(HTMLElement.prototype)
        .filter(function(v){return v.indexOf('on') === 0}),
        _start = "{{",
        _end = "}}",
        _pipe = "|",
        _events = {
          unknown:[]
        }
    
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
      this.wrapper = document.createElement('div');

      /* set wrapper html and define class */
      this.wrapper.className = "Wrapper Wrapper__"+this.name;
      this.wrapper.innerHTML = this.template;

      /* append wrapper to fragment for prep to append to dom */
      this.fragment.appendChild(this.wrapper);

      /* map nodes with their bindings */
      this.maps = this.map(this.wrapper);

      this.wrapper.kb_maps = this.maps;
    }
    
    /* Prototypes */

    /* returns a bind map object in relation to the passed nodes */
    KonnektMP.prototype.map = function(node)
    {
      var binds = {};

      /* This method is a recursive childnode search, searches for text nodes and attributes for getting binds */
      function loopMap(childNodes)
      {
        for(var x=0,len=childNodes.length;x<len;x++)
        {
          /* make sure we dont look at other components, but only this one */
          if(childNodes[x].kb_maps === undefined)
          {
            /* add mapper refrence so from any node we can always go back to root */
            childNodes[x].kb_mapper = node;

            /* check if node is a text node */
            if(childNodes[x].nodeType === 3)
            {
              bindTexts(childNodes[x],binds);
            }

            /* if it isnt then only check attributes for binds */
            else
            {
              bindAttrs(childNodes[x],binds);
            }

            /* if this childnode has other children nodes then we run recursive */
            if(childNodes[x].childNodes && childNodes[x].childNodes.length !== 0) loopMap(childNodes[x].childNodes);
          }
        }
      }
      loopMap(node.childNodes);
      return binds;
    }

    /* allows appending a new filter to a bind with a requested key */
    KonnektMP.prototype.addFilter = function(name,filterName)
    {
      if(this.maps[name] !== undefined)
      {
        this.maps[name].forEach(function(map){
          map.filters.push(filterName);
          map.refresh();
        });
      }
      return this;
    }

    /* removes a filter name from a desired bind with requested key */
    KonnektMP.prototype.removeFilter = function(name,filterName)
    {
      if(this.maps[name] !== undefined)
      {
        this.maps[name].forEach(function(map){
          map.filters.splice(this.maps[name].filters.indexOf(filterName),1);
          map.refresh();
        });
      }
      return this;
    }

    /* allows for swapping one filter out for another on a bind */
    KonnektMP.prototype.swapFilter = function(name,oldFilter,newFilter)
    {
      if(this.maps[name] !== undefined)
      {
        this.maps[name].forEach(function(map){
          map.filters.splice(this.maps[name].filters.indexOf(oldFilter),1,newFilter);
          map.refresh();
        })
      }
      return this;
    }

    /* Closure based helper methods */

    /* checks for bind matches in a text node and parses inserts them into the binds object for returning */
    function bindTexts(node,binds)
    {
      /* the actual text */
      var text = node.textContent,

          /* if the parent element is a component then we need to treat it as a single instance map */
          isUnknown = (node.parentElement instanceof HTMLUnknownElement);

      /* matches an array of _start and end looking for binds in the text */
      if(text.match(new RegExp('(\\'+_start.split('').join('\\')+')(.*?)(\\'+_end.split('').join('\\')+')','g')))
      {
        /*specifies bind type: component|for|text */
        var type = (isUnknown ? 'component' : ((text.indexOf('for') !== -1 && text.indexOf('loop') !== undefined) ? 'for' : 'text')),

            /* The bind constructor: @Params (type)component|for|text, (text)fullString, (listener) property, (property) property, (target) local node, (Element) real Node/Element */
            binder = getBindObject(binds,type,text,splitText(text),(isUnknown ? '' : 'textContent'),'textContent',node,node.parentElement);

        /* lop each bind string eg: ["Hello","{{name}}",", ","{{greeting}}"] */
        for(var x=0,len=binder.prototype.bindText.length;x<len;x++)
        {
          /* if this is a bind */
          if(binder.prototype.bindText[x].indexOf(_start) === 0)
          {
            /* create new bind object and attach to the binds list for returning */
            var bind = new binder(binder.prototype.bindText[x]);
            binder.prototype.bindText[x] = bind;
            if(binds[bind.key] === undefined) binds[bind.key] = [];
            bind.id = binds[bind.key].length;
            binds[bind.key].push(bind);
          }
        }
      }
    }
    
    function bindAttrs(node,binds)
    {
      /* all attributes of the node */
      var attrs = node.attributes,

          /* if the parent element is a component then we need to treat it as a single instance map */
          isUnknown = (node instanceof HTMLUnknownElement);

      for(var i=0,lenn=attrs.length;i<lenn;i++)
      {
        /* matches an array of _start and end looking for binds in the attribute value */
        if(attrs[i].value.match(new RegExp('(\\'+_start.split('').join('\\')+')(.*?)(\\'+_end.split('').join('\\')+')','g')))
        {
          /*specifies bind type: component|attribute */
          var type = (isUnknown ? 'component' : 'attribute'),

              /* The bind constructor: @Params (type)component|for|text, (text)fullString, (listener) property, (property) property, (target) local node, (Element) real Node/Element */
              binder = getBindObject(binds,type,attrs[i].value,splitText(attrs[i].value),(isUnknown ? '' : attrs[i].name),'value',attrs[i],node);

          /* lop each bind string eg: ["Hello","{{name}}",", ","{{greeting}}"] */
          for(var x=0,len=binder.prototype.bindText.length;x<len;x++)
          {
            /* if this is a bind */
            if(binder.prototype.bindText[x].indexOf(_start) === 0)
            {
              /* create new bind object and attach to the binds list for returning */
              var bind = new binder(binder.prototype.bindText[x]);
              binder.prototype.bindText[x] = bind;
              if(binds[bind.key] === undefined) binds[bind.key] = [];
              binds[bind.key].push(bind);
            }
          }
        }
      }
    }
    
    /* Mapping Objects */

    /* returns a new instancer of a bindObject, that way we can keep prototypes among multiple binds */
    function getBindObject(binds,type,text,bindtext,listener,prop,target,element)
    {
      var isEvent = ((type === 'attribute' && _domevents.indexOf(target.name) !== -1) || (type === 'component' && target.name && _domevents.indexOf(target.name) !== -1));
      if(isEvent) element.stopChange().removeAttribute(target.name);
      
      function bind(b)
      {
        var _forData = splitFor(b),
            self = this;
        this.key = (type !== 'for' ? splitKey(b) : _forData[0]);
        this.filterNames = splitFilters(b);
        this.component = (type !== 'for' ? _forData[1] : undefined);
        this.id = 0;
        this.isEvent = isEvent;

        /* updates prototype bind text to have the local object inside the array in replacement of string text */
        this.__proto__.bindText = this.__proto__.bindText.map(function(v){
          return (v === b ? this : v);
        });

        /* This handles value setting of the property, by setting this the dom is automatically updated */
        Object.defineProperties(this,{
          value:setBindDescriptor(this.valget,this.valset,true),
          _value:setDescriptor("",true)
        });

        /* used to update a data set if it was connected */
        this.__proto__.updateData = function(e)
        {
          if(self.isConnected && self._data)
          {
            if(typeof e !== 'object' || !e.value) e = {value:e};
            if(typeof self._data.stopChange === 'function')
            {
              self._data.stopChange()
              .set(self.key,e.value);
            }
            else
            {
              /* **FUTURE** allow standard object setting */
            }
          }
        }

        /* used to update the dom if the data set has events that can be connected */
        this.__proto__.updateDom = function(e)
        {
          if(!self.isSynced()) return;
          self.element.stopChange();
          if(typeof e !== 'object' || !e.value) e = {value:e};
          self.value = e.value;
        }
      }

      /* define prototypes */
      Object.defineProperties(bind.prototype,{
        valget:setDescriptor(bindGet),
        valset:setDescriptor(bindSet),
        refresh:setDescriptor(refresh),
        connect:setDescriptor(connect),
        deleteMap:setDescriptor(deleteMap),
        unsync:setDescriptor(unsync),
        isSynced:setDescriptor(isSynced),
        type:setDescriptor(type),
        text:setDescriptor(text,true),
        bindText:setDescriptor(bindtext,true),
        bindNames:setDescriptor(splitBindNames(bindtext),true),
        bindListener:setDescriptor((isEvent ? listener.toLowerCase() : listener)),
        bindProperty:setDescriptor((isEvent ? target.name.toLowerCase() : prop)),
        bindTarget:setDescriptor(target,true),
        element:setDescriptor(element,true),
        _data:setDescriptor({},true),
        filters:setDescriptor({},true),
        maps:setDescriptor(binds,true)
      });

      return bind
    }
    
    /* Bind Prototypes */
    
    /* used for value to get current value */
    function bindGet()
    {
      return this._value;
    }
    
    /* used for value to set and refresh current value */
    function bindSet(v)
    {
      this._value = (this.isSynced() ? v : this._value);
      this.refresh();
    }
    
    /* checks if the bind element has been removed from the dom */
    function isSynced()
    {
      /* parentElement will 'null' if this element is no longer on the dom */
      if(!this.element.parentElement) return this.unsync();
      return !!this.element.parentElement;
    }
    
    function filterValue(target,bindText)
    {
      function filter(target,bindText)
      {
        return bindText.reduce(function(c,v){
                /* while reducing bindTexts if index is standard string then attach, else we need to run value through filters prior to attaching */
                return c+(typeof v === 'string' ? v : (v.filterNames.length === 0 ? v._value : v.filterNames.reduce(function(v,f){
                  if(target.filters !== undefined)
                  {
                    if(target.filters[f] !== undefined)
                    {
                      return target.filters[f](v);
                    }
                    else
                    {
                      console.warn("there is no filter by the name %o in the data model filters %o",f,Object.keys(target.filters));
                      return v;
                    }
                  }
                  console.error('Somehow filters object was not added to the mapping via .connect() method, please see dev')
                  return v;
                },v._value)));
              },"");
      }
      
      if(bindText.length === 1)
      {
        if(typeof bindText[0]._value === 'string')
        {
          return filter(target,bindText);
        }
        else
        {
          return bindText[0]._value;
        }
      }
      else
      {
        return filter(target,bindText);
      }
    }
    
    
    /* refreshes the tied dom value */
    function refresh()
    {
      var self = this;
      
      if(this.type !== 'for')
      {
        /* check if this is an event */
        if(!this.isEvent)
        {
          if(this.type === 'component')
          {
            /* if this is a component binding we need to add the value to post data for being propagated to the component view model */
            if(!this.element.k_post) this.element.k_post = {};
            this.element.k_post[(this.bindProperty === 'textContent' ? 'innerHTML' : this.bindTarget.name)] = filterValue(this,this.bindText);
          }
          else
          {
            /* target is either 'attributeNode' or a textNode, bindProperty should either be 'textContent' or 'value' */
            this.bindTarget[this.bindProperty] = filterValue(this,this.bindText);
          }
        }
        else
        {
          /* we assign directly as a property */
          this.element[this.bindProperty] = this.bindText[0]._value;
        }
      }
      return this;
    }
    
    /* connects a data set up to the current map */
    function connect(vm)
    {
      /* sets local data passed data and sets local filters to data filters */
      this._data = vm;
      this.filters = (vm.filters !== undefined ? vm.filters : this.filters);

      for(var x=0,len=this.bindNames.length;x<len;x++)
      {
        /* as we loop throught the bind names we check if 'konnektdt' lib is being used, if so we add the appropriate listeners for the data */
        if(this._data.addDataUpdateListener)
        {
          /* if data set does not exist we create it */
          if(!this._data.exists(this.bindNames[x])) this._data.add(this.bindNames[x],(this._value));
          
          /* update value with data set value, runs refresh command */
          this.value = this._data.get(this.bindNames[x]);
          if(this.type !== 'component')
          {
            this.isConnected = true;
            this._data.addDataUpdateListener(this.bindNames[x],this.updateDom);
            if(this.type === 'for')
            {
              console.log('run for type event listeners');
            }
          }
        }
        else
        {
          /* **FUTURE** allow standard object setting */
        }
      }
      if(this.bindText.length === 1 && (this.type === 'text' || this.type === 'attribute' || this.isEvent)) this.element.addAttrUpdateListener((this.type === 'text' ? 'html' : this.bindListener),this.updateData);
      return this;
    }
    
    function deleteMap()
    {
      this.maps[this.key].splice(this.id,1);
      return this;
    }
    
    /* acts like a deconstructor if the element happens to be unsynced */
    function unsync()
    {
      /* we need to remove all data listeners if they exist so they are not ran on update */
      for(var x=0,len=this.bindNames.length;x<len;x++)
      {
        if(this._data.removeDataUpdateListener) this._data.removeDataUpdateListener(this.bindNames[x],this.updateDom);
      }
      /* also remove element listeners */
      this.element.removeAttrUpdateListener((this.type === 'text' ? 'html' : this.bindListener),this.updateData);
      /* clear all tied shared objects so GC can pick up this object for destroying */
      this._data = null;
      this.filters = null;
      this.bindNames = null;
      this.maps = null;
      this.__proto__._data = null;
      this.__proto__.element = null;
      this.__proto__.filters = null;
      this.__proto__.bindTarget = null;
      this.__proto__.bindText = null;
      this.__proto__.bindNames = null;
      this.__proto__.element = null;
      this.__proto__.maps = null;
      return false;
    }
    
    /* Text Splitters */
    
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
    
    /* returns a descriptor object */
    function setDescriptor(value,writable,redefinable)
    {
      return {
          value:value,
          writable:!!writable,
          enumerable:false,
          configurable:!!redefinable
      }
    }
    
    function setBindDescriptor(get,set,enumerable,redefinable)
    {
      return {
        get:get,
        set:set,
        enumerable:!!enumerable,
        configurable:!!redefinable
      }
    }
    
    /* standard event object, allows stopPropagation, preventDefault, event type, and passed data */
    function eventObject(type,data)
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
    
    /* runs the appropriate bus event */
    function onEvent(key,eventObject)
    {
      var _listeners = _events[key];
      for(var x=0,len=_listeners.length;x<len;x++)
      {
        _listeners[x](eventObject);

        /* if stopPropogation() method was called this stops all future listeners */
        if(!eventObject._stopPropogation) break;
      }
      return eventObject._preventDefault;
    }
    
    /* Library based methods for use globally among all components */

    /* Globalized Event Listeners */

    /* adds an event listener with the appropriate key */
    function addEventListener(key,func)
    {
      if(_events[key] !== undefined)
      {
        _events[key].push(func);
      }
      else
      {
        console.error("Class: KonnektMP Method: 'addEventListener', No event exists with the name %o",key);
      }
      return this;
    }
    
    /* removes event listener, dependent on key and function being the same */
    function removeEventListener(key,func)
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
      return this;
    }
    
    /* filters out names of unregistered elements from a template string */
    function getUnknown(template)
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
      if(matched.length !== 0) onEvent('unknown',new Event('unknown',matched));
      return matched;
    }

    /* checks if a component name has been defined */
    function isRegistered(name)
    {
      return (_templates[name] !== undefined);
    }
    
    /* registers template to a given name and fires unregistered components event if any are found */
    function register(name,template)
    {
      if(_templates[name] === undefined)
      {
        _templates[name] = template;

        /* unregistered components can be loaded via globalized listener on registration */
        getUnknown(template);
      }
      else
      {
        console.error("Class: KonnektMP Method: 'register', A template by the name %o already exists",name);
      }
      return this;
    }

    /* searched start characters for looking for binds */
    function startChars(v)
    {
      if(v === undefined) return _start;
      _start = (typeof v === 'string' ? v : _start);
      return this;
    }

    /* searched end characters for looking for binds */
    function endChars(v)
    {
      if(v === undefined) return _end;
      _end = (typeof v === 'string' ? v : _end);
      return this;
    }

    /* searched pipe characters for looking for bind settings inside the bind */
    function pipeChars(v)
    {
      if(v === undefined) return _pipe;
      _pipe = (typeof v === 'string' ? v : _pipe);
      return this;
    }

    /* Assign as non changeable properties to main method for exporting */
    Object.defineProperties(KonnektMP,{
      startChars:setDescriptor(startChars),
      endChars:setDescriptor(endChars),
      pipeChars:setDescriptor(pipeChars),
      getUnknown:setDescriptor(getUnknown),
      isRegistered:setDescriptor(isRegistered),
      register:setDescriptor(register),
      addEventListener:setDescriptor(addEventListener),
      removeEventListener:setDescriptor(removeEventListener)
    });
    
    /* Stop All HTML and setAttribute updates */


    return KonnektMP;
  }
  return CreateKonnektMP;
});
