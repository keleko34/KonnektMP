define(['./testbuttons'],function(testbuttons){
  function test(mp,mixed,mocha,chai)
  {
    var expect = chai.expect,
        tests = {};

    var standardComponent = '<div data-type="{{coolio}}"><div>{{someinnertext | toUpperCase, (toLowerCase)}}</div><innercomponent coolio="{{coolio}}" onclick="{{clickevent}}"></innercomponent></div>',
        innerComponent = '<div onclick="{{onclick}}">{{coolio}}</div>',
        inputComponent = '<div><input type="text" value="{{val | toUpperCase, (toLowerCase)}}" /></div>',
        eventComponent = '<div onclick="{{clickme}}" onmouseover="{{mouseover}}" onmouseout="{{mouseout}}">A Button</div>',
        storageComponent = '<div><input type="text" value="{{val | [~my.val],[+my.val],[-my.val]}}" /></div>',
        loopComponent = '<div><div onclick="{{togglesort}}">ToggleSort</div><div>{{for items loop loopcomponentitem}}</div></div>',
        loopComponentItem = '<div data-id="{{id}}">{{name}}</div>';

    var standardVM = {
          coolio:500,
          someinnerText:"SomeInnerText",
          filters:{
            toUpperCase:function(v){return v.toUpperCase();},
            toLowerCase:function(v){return v.toLowerCase();}
          },
          clickevent:function(){console.log("yay");}
        },
        innerComponentVM = {
          onclick:function(){},
          coolio:"default"
        },
        inputComponentVM = {
          val:"",
          filters:{
            toUpperCase:function(v){return v.toUpperCase();},
            toLowerCase:function(v){return v.toLowerCase();}
          }
        },
        eventComponentVM = {
          clickme:function(){console.log("clicked");},
          mouseover:function(){console.log("moused over");},
          mouseout:function(){console.log("moused out");}
        },
        storageComponentVM = {
          val:""
        },
        loopComponentVM = {
          dir:'desc',
          togglesort:function(){
            var dir = loopComponentVM.dir;
            loopComponentVM.items.sort(function(a,b){
              return (a.name < b.name ? (dir === 'desc' ? 1 : -1) : (dir === 'desc' ? -1 : 1));
            });
          },
          items:[
            {name:"george",id:200},
            {name:"coolio",id:3500},
            {name:"something",id:5000}
          ]
        },
        loopComponentItemVM = {
          name:"",
          id:0
        };

    /* Add test buttons */
    testbuttons().onclick = function(test){
      mocha.suite.suites = [];
      if(tests[test]) tests[test]();
    };



  }
  return test;
});
