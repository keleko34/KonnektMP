define(['./../Binding/Binding'],function(CreateBinding){
  function CreateMap()
  {
    var _element,
        _maps,
        _text = '',
        _attr,
        _type = '',
        _cssRule,
        _typeEnum = ['text','attribute','component_attr','event','style_selector','style_rule','placeholder','node','attrName'],
        _children = [],
        
        /* REGEX */
        
        _reTextBinds = /({{.*?}})/g;
    
    function Map()
    {
      switch(_type)
      {
        case 'text':
          CreateBinding()
          .addProto('text',_text)
          .addProto('bindText',_text.split(_reTextBinds).filter(Boolean))
          .addProto('local',_element)
          .addProto('node',_element.parentElement)
          .addProto('attr','textContent')
          .addProto('localAttr','textContent')
          .addProto('maps',_maps)
          .addProto('listener','html')
          .addProto('type',_type)
          .call(this);
        break;
        case 'attribute':
          CreateBinding()
          .addProto('text',_text)
          .addProto('bindText',_text.split(_reTextBinds).filter(Boolean))
          .addProto('local',_attr)
          .addProto('node',_element)
          .addProto('isInput',(_element.tagName === 'INPUT'))
          .addProto('attr',_attr.name)
          .addProto('localAttr','value')
          .addProto('maps',_maps)
          .addProto('listener',_attr.name)
          .addProto('type',_type)
          .call(this);
        break;
        case 'component_attr':
          CreateBinding()
          .addProto('text',_text)
          .addProto('bindText',_text.split(_reTextBinds).filter(Boolean))
          .addProto('attr',_attr.name)
          .addProto('type',_type)
          .call(this);
        break;
        case 'event':
          CreateBinding()
          .addProto('text',_text)
          .addProto('bindText',_text.split(_reTextBinds).filter(Boolean))
          .addProto('node',_element)
          .addProto('isInput',(_element.tagName === 'INPUT'))
          .addProto('attr',_attr.name)
          .addProto('localAttr','value')
          .addProto('maps',_maps)
          .addProto('listener',_attr.name)
          .addProto('type',_type)
          .call(this);
        break;
        case 'style_selector':
          CreateBinding()
          .addProto('text',_text)
          .addProto('bindText',_text.split(_reTextBinds).filter(Boolean))
          .addProto('local',_cssRule)
          .addProto('node',_element)
          .addProto('attr','selectorText')
          .addProto('localAttr','selectorText')
          .addProto('maps',_maps)
          .addProto('listener','html')
          .addProto('type',_type)
          .call(this);
        break;
        case 'style_rule':
          CreateBinding()
          .addProto('text',_text)
          .addProto('bindText',_text.split(_reTextBinds).filter(Boolean))
          .addProto('local',_cssRule.style)
          .addProto('node',_element)
          .addProto('attr','cssText')
          .addProto('localAttr','cssText')
          .addProto('maps',_maps)
          .addProto('listener','html')
          .addProto('type',_type)
          .call(this);
        break;
        case 'node':
          var bindText = _text.split(_reTextBinds).filter(Boolean);
          CreateBinding()
          .addProto('text',_text)
          .addProto('bindText',bindText)
          .addProto('base',bindText[1])
          .addProto('subNodes',_children)
          .addProto('maps',_maps)
          .addProto('type',_type)
          .call(this);
        break;
      }
    }
    
    /* SECTION Public Methods */
    Map.element = function(el)
    {
      if(el === undefined) return _element;
      _element = el;
      return Map;
    }
    
    Map.maps =  function(maps)
    {
      if(maps === undefined) return _maps;
      _maps = maps;
      return Map;
    }
    
    Map.text = function(text)
    {
      if(text === undefined) return _text;
      _text = text;
      return Map;
    }
    
    Map.attr = function(attr)
    {
      if(attr = undefined) return _attr;
      _attr = attr;
      return Map;
    }
    
    Map.type = function(type)
    {
      if(type === undefined) return _type;
      _type = type;
      return Map;
    }
    
    Map.children = function(children)
    {
      if(children === undefined) return _children;
      _children = children;
      return Map;
    }
    
    Map.cssRule = function(cssRule)
    {
      if(cssRule === undefined) return _cssRule;
      _cssRule = cssRule;
      return Map;
    }
    /* END SECTION Public Methods */
    
    return Map;
  }
  return CreateMap;
});