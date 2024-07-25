const exLoader = async (self) => {
  self["Excalidraw"] = (await import('./main-3093b223.js').then(function (n) { return n.m; }));
};

const reactLoader = async (self) => {
  self.React = (await import('./index-ee444178.js').then(function (n) { return n.i; }));
  self.ReactDOM = (await import('./index-90f5c2e9.js').then(function (n) { return n.i; }));
};

new interpretate.shared(
  "Excalidraw",
  exLoader
);  

new interpretate.shared(
  "React",
  reactLoader
);
