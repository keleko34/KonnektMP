define(['kb'],function(kb){
  function CreateKonnektMP()
  {
    function KonnektMP(node)
    {

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

    function setPointer()

    /* REGEX Map Splitters */

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
        if(filter.match(/(\())(.*?)(\))/))
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

    function map(node)
    {

    }


    Object.defineProperties(KonnektMP.prototype,{
      map:setDescriptor(map)
    });

    return KonnektMP;
  }
  return CreateKonnektMP;
})
