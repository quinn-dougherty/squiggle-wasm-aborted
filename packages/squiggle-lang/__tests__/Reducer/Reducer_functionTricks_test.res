open Jest
open Reducer_TestHelpers

describe("Arity check", () => {
  testEvalToBe("f(x,y) = x + y; f(1,2)", "Ok(3)")
  testEvalToBe(
    "f(x,y) = x + y; f(1)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)",
  )
  testEvalToBe(
    "f(x,y) = x + y; f(1,2,3)",
    "Error(2 arguments expected. Instead 3 argument(s) were passed.)",
  )
  testEvalToBe(
    "f(x,y)=x+y; f(1,2,3,4)",
    "Error(2 arguments expected. Instead 4 argument(s) were passed.)",
  )
  testEvalToBe(
    "f(x,y)=x+y; f(1)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)",
  )
  testEvalToBe(
    "f(x,y)=x(y); f(f)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)",
  )
  testEvalToBe("f(x)=x; f(f)", "Ok(lambda(x=>internal code))")
  testEvalToBe(
    "f(x,y)=x(y); f(z)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)",
  )
})

describe("symbol not defined", () => {
  testEvalToBe("f(x)=x(y); f(f)", "Error(y is not defined)")
  testEvalToBe("f(x)=x; f(f)", "Ok(lambda(x=>internal code))")
  testEvalToBe("f(x)=x(y); f(z)", "Error(z is not defined)")
  testEvalToBe("f(x)=x(y); f(2)", "Error(2 is not a function)")
  testEvalToBe("f(x)=x(1); f(2)", "Error(2 is not a function)")
})

describe("call and bindings", () => {
  testEvalToBe("f(x)=x+1", "Ok({f: lambda(x=>internal code)})")
  testEvalToBe("f(x)=x+1; f(1)", "Ok(2)")
  testEvalToBe("f=1;y=2", "Ok({f: 1,y: 2})")
  testEvalToBe("f(x)=x+1; y=f(1)", "Ok({f: lambda(x=>internal code),y: 2})")
  testEvalToBe("f(x)=x+1; y=f(1); f(1)", "Ok(2)")
  testEvalToBe("f(x)=x+1; y=f(1); z=f(1)", "Ok({f: lambda(x=>internal code),y: 2,z: 2})")
  testEvalToBe(
    "f(x)=x+1; g(x)=f(x)+1",
    "Ok({f: lambda(x=>internal code),g: lambda(x=>internal code)})",
  )
  testParseToBe(
    "f=99; g(x)=f; g(2)",
    "Ok((:$$block (:$$block (:$let :f 99) (:$let :g (:$$lambda [x] (:$$block :f))) (:g 2))))",
  )
  testEvalToBe("f=99; g(x)=f; g(2)", "Ok(99)")
  testEvalToBe("f(x)=x; g(x)=f(x); g(2)", "Ok(2)")
  testEvalToBe(
    "f(x)=x+1; g(x)=f(x)+1; y=g(2)",
    "Ok({f: lambda(x=>internal code),g: lambda(x=>internal code),y: 4})",
  )
  testEvalToBe("f(x)=x+1; g(x)=f(x)+1; g(2)", "Ok(4)")
})

describe("function trics", () => {
  testParseToBe(
    "f(x)=f(y)=2; f(2)",
    "Ok((:$$block (:$$block (:$let :f (:$$lambda [x] (:$$block (:$let :f (:$$lambda [y] (:$$block 2)))))) (:f 2))))",
  )
  testEvalToBe("f(x)=f(y)=2; f(2)", "Ok({f: lambda(y=>internal code),x: 2})")
  testEvalToBe("y=2;g(x)=y+1;g(2)", "Ok(3)")
  testEvalToBe("y=2;g(x)=inspect(y)+1", "Ok({g: lambda(x=>internal code),y: 2})")
  MySkip.testEvalToBe("f(x) = x(x); f(f)", "????") // TODO: Infinite loop. Any solution? Catching proper exception or timeout?
  MySkip.testEvalToBe("f(x, x)=x+x; f(1,2)", "????") // TODO: Duplicate parameters
  MySkip.testEvalToBe("myadd(x,y)=x+y; z=[add]; z[0](3,2)", "????") //TODO: to fix with new parser
  MySkip.testEvalToBe("myaddd(x,y)=x+y; z={x: add}; z.x(3,2)", "????") //TODO: to fix with new parser
})