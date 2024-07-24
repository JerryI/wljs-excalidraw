BeginPackage["Notebook`Editor`EXProcessor`", {
    "JerryI`Notebook`", 
    "JerryI`Notebook`Evaluator`", 
    "JerryI`Notebook`Kernel`", 
    "JerryI`Notebook`Transactions`",
    "JerryI`Misc`Events`"
}]

Begin["`Internal`"]

ExcalidrawQ[t_Transaction] := StringMatchQ[t["Data"], (".ex\n"|".excalidraw\n")~~___]
Excalidraw  = StandardEvaluator["Name" -> "Excalidraw", "InitKernel" -> init, "Pattern" -> (_?ExcalidrawQ), "Priority"->(3)];


rootFolder = $InputFileName // DirectoryName;

StandardEvaluator`ReadyQ[Excalidraw, k_] := Module[{path, imported},
    If[! TrueQ[k["ReadyQ"] ] || ! TrueQ[k["ContainerReadyQ"] ],
            EventFire[k, "Error", "Kernel is not ready"];
            StandardEvaluator`Print[evaluator, "Kernel is not ready"];
            False
        ,
   
                    Print["Init EX Draw Kernel (Local)"];
                    With[{p = Import[FileNameJoin[{rootFolder, "Preload.wl"}], "String"]},
                        Module[{},
                            Kernel`Init[k,   ToExpression[p, InputForm]; , "Once"->True];
                        ];
                    ];


    

            True
    ]  
];  


StandardEvaluator`Evaluate[Excalidraw, k_, t_] := Module[{list},
    t["Evaluator"] = Notebook`Kernel`ExcalidrawEvaluator;
    t["Data"] = StringDrop[t["Data"], StringCases[t["Data"], (".ex\n"|".excalidraw\n")] //First//StringLength] // StringTrim;
    Print["Sending..."];
    Print[t["Data"] ];

    StandardEvaluator`Print[Excalidraw, "Kernel`Submit! Dym"];
    Kernel`Submit[k, t];    
];  

init[k_] := Module[{},
    Print["Kernel init..."];
    
]


End[]

EndPackage[]