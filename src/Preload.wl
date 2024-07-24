BeginPackage["Notebook`Editor`ExcalidrawTools`", {
    "JerryI`Notebook`Kernel`", 
    "JerryI`Notebook`Transactions`",
    "JerryI`Misc`Events`",
    "JerryI`Misc`Events`Promise`",
    "Notebook`Editor`Kernel`FrontSubmitService`"
}];

Begin["`Private`"]


Notebook`Kernel`ExcalidrawEvaluator = Function[t, With[{window = WindowObj[<|"Socket" -> t["EvaluationContext", "KernelWebSocket"]|>]},
    Then[FrontFetchAsync[Internal`EXJSEvaluator[ t["Data"] ], "Window"->window], Function[result,
        EventFire[Internal`Kernel`Stdout[ t["Hash"] ], "Result", <|"Data" -> result, "Meta" -> Sequence["Display"->"svg"] |> ];
        EventFire[Internal`Kernel`Stdout[ t["Hash"] ], "Finished", True];
    ], Function[failure, 
        EventFire[Internal`Kernel`Stdout[ t["Hash"] ], "Result", <|"Data" -> failure, "Meta" -> Sequence["Display"->"svg"] |> ];
        EventFire[Internal`Kernel`Stdout[ t["Hash"] ], "Finished", True];   
    ] ];
    
    
] ];


End[]

EndPackage[]



