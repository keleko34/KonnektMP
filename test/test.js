define(['./testbuttons'],function(testbuttons){
  function test(mp,mixed,mocha,chai)
  {
    var expect = chai.expect,
        tests = {};

    /* Add test buttons */
    testbuttons().onclick = function(test){
      mocha.suite.suites = [];
      if(tests[test]) tests[test]();
    };



  }
  return test;
});
