
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


let ExcalidrawLib;
let React;
let ReactDOM;

const codemirror = window.SupportedCells['codemirror'].context; 

function throttle(func, ms) {

  let isThrottled = false,
    savedArgs,
    savedThis;

  function wrapper() {

    if (isThrottled) { // (2)
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    func.apply(this, arguments); // (1)

    isThrottled = true;

    setTimeout(function() {
      isThrottled = false; // (3)
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}

const ExcalidrawWindow = (scene, cchange) => () => {
  const [canvasUrl, setCanvasUrl] = React.useState("");
  const [excalidrawAPI, setExcalidrawAPI] = React.useState(null);

  const UIOptions = {
    canvasActions: {
      loadScene: true,
      saveToActiveFile: true,
      help: false,
      toggleTheme: false,
      changeViewBackgroundColor: false
    },
    saveToActiveFile: true,
    toggleTheme:false
  };

  return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "div",
        {
          style: { height: "60vh", minHeight: "400px" },
        },
        React.createElement(ExcalidrawLib.Excalidraw, {UIOptions:UIOptions, initialData: {elements: scene, appState: {viewBackgroundColor: 'transparent', zenModeEnabled: true}}, onChange: cchange, excalidrawAPI : (api) => setExcalidrawAPI(api)}),
      ),
    );
};

const matcher = new codemirror.MatchDecorator({
  regexp: /!!\[.*\]/g,
  maxLength: Infinity,
  decoration: (match, view, pos) => {
   
    return codemirror.Decoration.replace({
      widget: new ExcalidrawWidget(match[0], view, pos)
    })
  }
});

const excalidrawHolder = codemirror.ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.excalidrawHolder = matcher.createDeco(view);
    }
    update(update) {
      this.excalidrawHolder = matcher.updateDeco(update, this.excalidrawHolder);
    }
  },
  {
    decorations: instance => instance.excalidrawHolder,
    provide: plugin => codemirror.EditorView.atomicRanges.of(view => {
      return view.plugin(plugin)?.excalidrawHolder || codemirror.Decoration.none
    })
  }
);  

window.SupportedLanguages.filter((el) => (el.name == codemirror.markdownLanguage.name)).forEach((c) => {
  c.plugins.push(excalidrawHolder)
});

class ExcalidrawWidget extends codemirror.WidgetType {
  constructor(match, view, pos) {
    //console.log('created');
    super();
    this.match = match;
    this.pos   = pos;
    this.view = view;
  }

  eq(other) {
    return false;
  }

  updateDOM(dom) {
    dom.ExcalidrawWidget = this;
    return true;
  }

  updateContent(data) {
    const self = this;
    
    const newData = data;
    const changes = {from: self.pos + 2, to: self.pos + self.match.length, insert: newData};
    this.view.dispatch({changes: changes});
  }

  toDOM(view) {
    const match = this.match;

    let elt = document.createElement("div");
    elt.ExcalidrawWidget = this;

    const mount = async (element, data) => { 
      if (!ExcalidrawLib) {
        if (!window.interpretate.shared.Excalidraw) {
          element.innerHTML = `<span style="color:red">No shared library ExcalidrawLib found</span>`;
          return;
        }
        await window.interpretate.shared.Excalidraw.load();
        ExcalidrawLib = window.interpretate.shared.Excalidraw.Excalidraw.default;
      }

      if (!React) {
        if (!window.interpretate.shared.React) {
          element.innerHTML = `<span style="color:red">No shared library React found</span>`;
          return;
        }          
        await window.interpretate.shared.React.load();
        React = window.interpretate.shared.React.React.default;
        ReactDOM = window.interpretate.shared.React.ReactDOM.default;
      }
    
      const excalidrawWrapper = element;
      const root = ReactDOM.createRoot(excalidrawWrapper);
      element.reactRoot = root;
      console.log('React Render!');

      const dom = element;

      let previous = '';
      const change = (elements, appState) => {
        if (!dom.ExcalidrawWidget) return;
        const string = JSON.stringify(elements);
        if (string != previous) {
          previous = string;
          console.log('save');
          dom.ExcalidrawWidget.updateContent(string);
        }
      }
    
      const cchange = throttle(change, 700);
      
      let scene;
      
      try {
        scene = JSON.parse(data.slice(2));
      } catch(e) {
        dom.innerHTML = `<span style="color:red; padding: 0.5rem;">Error while parsing expression</span>`;
        return;
      }
    
      console.log('Mount!');
    
      dom.addEventListener('keypress', (ev) => {
    
          if (ev.shiftKey && ev.key == "Enter") {
            console.log(ev);
            //if (debounce) return;
            const origin = view.state.facet(codemirror.originFacet)[0].origin;
            console.log('EVAL');
            origin.eval(view.state.doc.toString());
            debounce = true;
    
          }
      });

      root.render(React.createElement(ExcalidrawWindow(scene, cchange, {})));

    }

    const origin = view.state.facet(codemirror.originFacet)[0].origin;
    
    let mounted = false;
    if (!origin.props["Hidden"]) {
      mount(elt, match);
      mounted = true;
  
    }
  
    origin.addEventListener('property', (ev) => {
      if (ev.key != 'Hidden') return;
      if (ev.value) {
        if (mounted) {
          elt.reactRoot.unmount();
          console.warn('Unmount react');
          mounted = false;
        }
      } else {
        if (!mounted) {
          mount(elt, elt.ExcalidrawWidget.match);
          mounted = true;
        }
      }
    });   

    return elt;
  }
  ignoreEvent(ev) {
    return true;
  }

  destroy(dom) {
    console.log('Excalidraw widget was destroyed');
    if (!dom.reactRoot) return;
    dom.reactRoot.unmount();
    dom.ExcalidrawWidget = undefined;
  }
}  



var generateSVG = async (data) => {
  if (!ExcalidrawLib) {
    await window.interpretate.shared.Excalidraw.load();
    ExcalidrawLib = window.interpretate.shared.Excalidraw.Excalidraw.default;  
    //ExcalidrawLib = (await import('@excalidraw/excalidraw')).default;
  }

  let decoded;
  try {
    decoded = JSON.parse(data);

  } catch (e) {

    return `<span style="color:red">${e}</span>`;
  }

  const svg = await ExcalidrawLib.exportToSvg({
    elements: decoded,
    appState: {exportBackground: false},
    exportWithDarkMode: false
  });

  svg.removeAttribute('width');
  svg.removeAttribute('height');
  const stringed = svg.outerHTML;
  svg.remove();

  return stringed;
}

core['Internal`EXJSEvaluator'] = async (args, env) => {
  let data = await interpretate(args[0], env);

  if (!Array.isArray(data)) {
    data = [data];
  }  

  const result = [];
  for (const a of data) {
    const r = await generateSVG(a);
    result.push(r);
  }
  
  return result;
}
 
