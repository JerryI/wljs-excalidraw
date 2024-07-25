
const exLoader = async (self) => {
  self["Excalidraw"] = (await import('@excalidraw/excalidraw'));
}

const reactLoader = async (self) => {
  self.React = (await import('react'));
  self.ReactDOM = (await import('react-dom'));
}

new interpretate.shared(
  "Excalidraw",
  exLoader
);  

new interpretate.shared(
  "React",
  reactLoader
); 
 
