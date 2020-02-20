let data: DistributionTypes.xyShape = {
  xs: [|1., 10., 10., 200., 250., 292., 330.|],
  ys: [|0.0, 0.0, 0.1, 0.3, 0.5, 0.2, 0.1|],
};

// "mm(floor(uniform(30,35)), normal(50,20), [.25,.5])",
let timeDist =
  GenericDistribution.make(
    ~generationSource=
      GuesstimatorString("mm(floor(normal(30,3)), normal(39,1), [.5,.5])"),
    ~probabilityType=Pdf,
    ~domain=Complete,
    ~unit=TimeDistribution({zero: MomentRe.momentNow(), unit: `days}),
    (),
  )
  |> GenericDistribution.renderIfNeeded(~sampleCount=1000);

let distributions = () =>
  <div>
    <div>
      <h2> {"Basic Mixed Distribution" |> ReasonReact.string} </h2>
      {timeDist
       |> E.O.bind(_, GenericDistribution.normalize)
       |> E.O.React.fmapOrNull(dist => <GenericDistributionChart dist />)}
      <h2> {"Simple Continuous" |> ReasonReact.string} </h2>
    </div>
  </div>;

let entry = EntryTypes.(entry(~title="Pdf", ~render=distributions));