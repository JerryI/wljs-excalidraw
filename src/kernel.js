
let ExcalidrawLib;
let React;
let ReactDOM;

/**** FIRST DRAFT           ****/
/**** Proof of concept only ****/

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

const App = (view, match, dom, api) => () => {
  const [canvasUrl, setCanvasUrl] = React.useState("");
  const [excalidrawAPI, setExcalidrawAPI] = React.useState(null);

  api.excalidrawAPI = excalidrawAPI;

  let previous = '';
  const change = (elements, appState) => {



    if (!dom.EWidget) return;
    const string = JSON.stringify(elements);
    if (string != previous) {
      previous = string;
      console.log('save');
      dom.EWidget.updateContent(string);
    }
    
    
  }

  const cchange = throttle(change, 700);


  let scene = JSON.parse(match);

    const UIOptions = {
		canvasActions: {
		  loadScene: true,
      saveToActiveFile: true,
      help: false
		},
    saveToActiveFile: true,
	  };
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "div",
        {
          style: { height: "500px" },
        },
        React.createElement(ExcalidrawLib.Excalidraw, {UIOptions:UIOptions, initialData: {elements: scene, appState: {viewBackgroundColor: 'transparent'}}, onChange: cchange, excalidrawAPI : (api) => setExcalidrawAPI(api)}),
      ),
    );
  };
  
let loaded = false;  


class ExcalidrawCell {
  dispose() {
    
  }
  
  constructor(parent, data) {
    console.log(data);
    parent.element.innerHTML = data;
    parent.element.classList.add('margin-bottom-fix');
    return this;
  }
}

window.SupportedCells['svg'] = {
  view: ExcalidrawCell
};


const {EditorView, EditorState, Decoration, ViewPlugin, WidgetType, StateField, MatchDecorator, legacyLangNameFacet, originFacet} = window.SupportedCells['codemirror'].context;



const matcher = new MatchDecorator({
  regexp: /\[.*\]/g,
  maxLength: Infinity,
  decoration: (match, view, pos) => {
   
    return Decoration.replace({
      widget: new EWidget(match[0], view, pos)
    })
  }
});

const editorHolder = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.editorHolder = matcher.createDeco(view);
    }
    update(update) {
      this.editorHolder = matcher.updateDeco(update, this.editorHolder);
    }
  },
  {
    decorations: instance => instance.editorHolder,
    provide: plugin => EditorView.atomicRanges.of(view => {
      return view.plugin(plugin)?.editorHolder || Decoration.none
    })
  }
);



class EWidget extends WidgetType {
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
    dom.EWidget = this;
    return true;
  }

  updateContent(data) {
    const self = this;
    
    const newData = data.slice(1,-1);
   // console.warn(newData);
    const changes = {from: self.pos + 1, to: self.pos + self.match.length - 1, insert: newData};
    this.view.dispatch({changes: changes});
  }

  toDOM(view) {
    const match = this.match;

    let elt = document.createElement("div");
    elt.EWidget = this;

    const mount = async (element, data) => { 
      if (!loaded) {
        React = (await import('react')).default;
        ReactDOM = (await import('react-dom')).default;
        ExcalidrawLib = (await import('@excalidraw/excalidraw')).default;
        loaded = true;
      }
    
      const excalidrawWrapper = element;
      const root = ReactDOM.createRoot(excalidrawWrapper);
      element.reactRoot = root;
      root.render(React.createElement(App(view, data, element, {})));

    }

    const origin = view.state.facet(originFacet)[0].origin;
    //mount(elt);
    
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
            mount(elt, elt.EWidget.match);
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
    console.log('destroy in general*');
    if (!dom.reactRoot) return;
    dom.reactRoot.unmount();
    dom.EWidget = undefined;
  }
}

const changeSelection = () => {
  return EditorState.transactionFilter.of((tr) => {
    assignInitializator(tr.state);
    return tr
  })
}

const customFunction = (view) => {
  console.warn(view)
}

const initFields = (state) => {
  console.warn(state);
  return state;
}

const field = new StateField();

window.SupportedLanguages.push({
  check: (r) => {return(r[0].match(/\w*\.(excalidraw|ex)$/) != null)},
  plugins: [editorHolder, legacyLangNameFacet.of('excalidraw')],
  name: 'excalidraw',
  legacy: true
});


core['Internal`EXJSEvaluator'] = async (args, env) => {
  const data = await interpretate(args[0], env);

 
  if (!ExcalidrawLib) {
    ExcalidrawLib = (await import('@excalidraw/excalidraw')).default;
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



  return svg.outerHTML;

}



