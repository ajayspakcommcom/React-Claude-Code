import JSXDemo from "./beginner/react-basics/01_JSX";
import FunctionalComponentsDemo from "./beginner/react-basics/02_FunctionalComponents";
import PropsVsStateDemo from "./beginner/react-basics/03_PropsVsState";
import EventsAndConditionalDemo from "./beginner/react-basics/04_EventsAndConditionalRendering";
import ListsAndKeysDemo from "./beginner/react-basics/05_ListsAndKeys";
import BasicFormsDemo from "./beginner/react-basics/06_BasicForms";

import UseStateDemo from "./beginner/hooks/01_useState";
import UseEffectDemo from "./beginner/hooks/02_useEffect";
import UseRefDemo from "./beginner/hooks/03_useRef";
import UseMemoDemo from "./beginner/hooks/04_useMemo";
import UseCallbackDemo from "./beginner/hooks/05_useCallback";
import UseContextDemo from "./beginner/hooks/06_useContext";
import UseReducerDemo from "./beginner/hooks/07_useReducer";
import UseLayoutEffectDemo from "./beginner/hooks/08_useLayoutEffect";
import UseImperativeHandleDemo from "./beginner/hooks/09_useImperativeHandle";
import UseIdDemo from "./beginner/hooks/10_useId";
import UseTransitionDemo from "./beginner/hooks/11_useTransition";
import UseDeferredValueDemo from "./beginner/hooks/12_useDeferredValue";
import UseDebugValueDemo from "./beginner/hooks/13_useDebugValue";
import UseSyncExternalStoreDemo from "./beginner/hooks/14_useSyncExternalStore";
import UseInsertionEffectDemo from "./beginner/hooks/15_useInsertionEffect";

import UseFetchDemo from "./beginner/hooks/custom/01_useFetch";
import UseLocalStorageDemo from "./beginner/hooks/custom/02_useLocalStorage";
import UseDebounceDemo from "./beginner/hooks/custom/03_useDebounce";
import UseWindowSizeDemo from "./beginner/hooks/custom/04_useWindowSize";
import UsePreviousDemo from "./beginner/hooks/custom/05_usePrevious";
import UseClickOutsideDemo from "./beginner/hooks/custom/06_useClickOutside";
import UseToggleDemo from "./beginner/hooks/custom/07_useToggle";
import UseFormDemo from "./beginner/hooks/custom/08_useForm";

import ContextReducerDemo from "./intermediate/state-management/01_ContextReducer";
import ReduxToolkitDemo from "./intermediate/state-management/02_ReduxToolkit";
import RTKQueryDemo from "./intermediate/state-management/03_RTKQuery";
import TanStackQueryDemo from "./intermediate/state-management/04_TanStackQuery";

import ReactHookFormDemo from "./intermediate/forms-validation/01_ReactHookForm";
import ZodValidationDemo from "./intermediate/forms-validation/02_ZodValidation";
import AdvancedPatternsDemo from "./intermediate/forms-validation/03_AdvancedPatterns";
import RHFAdvancedDemo from "./intermediate/forms-validation/04_RHFAdvanced";
import ZodAdvancedDemo from "./intermediate/forms-validation/05_ZodAdvanced";

import MemoOptimizationDemo from "./intermediate/performance/01_MemoOptimization";
import CodeSplittingDemo from "./intermediate/performance/02_CodeSplitting";

import CSSModulesDemo from "./intermediate/styling/01_CSSModules";
import StyledComponentsDemo from "./intermediate/styling/02_StyledComponents";
import TailwindCSSDemo from "./intermediate/styling/03_TailwindCSS";

import FetchAPIDemo from "./intermediate/api-integration/01_FetchAPI";
import AxiosDemo from "./intermediate/api-integration/02_Axios";
import ErrorHandlingDemo from "./intermediate/api-integration/03_ErrorHandling";

import ControlledVsUncontrolledDemo from "./intermediate/advanced-react/01_ControlledVsUncontrolled";
import LiftingStateUpDemo from "./intermediate/advanced-react/02_LiftingStateUp";
import CompositionPatternsDemo from "./intermediate/advanced-react/03_CompositionPatterns";
import RefsAdvancedDemo from "./intermediate/advanced-react/04_Refs";
import ContextAPIDemo from "./intermediate/advanced-react/05_ContextAPI";

import RenderProfilingDemo from "./senior/performance/01_RenderProfiling";
import VirtualizationDemo from "./senior/performance/02_Virtualization";
import { WebVitals } from "./senior/performance/03_WebVitals";
import { BundleAnalysis } from "./senior/performance/04_BundleAnalysis";

import Counter from "./beginner/practice/01_Counter";
import TodoApp from "./beginner/practice/02_TodoApp";
import CRUDApp from "./beginner/practice/03_CRUDApp";

const App = () => {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "800px", margin: "0 auto" }}>

      <h1>React Basics</h1>
      <hr />
      <section><JSXDemo /></section>
      <hr />
      <section><FunctionalComponentsDemo /></section>
      <hr />
      <section><PropsVsStateDemo /></section>
      <hr />
      <section><EventsAndConditionalDemo /></section>
      <hr />
      <section><ListsAndKeysDemo /></section>
      <hr />
      <section><BasicFormsDemo /></section>

      <h1>Hooks</h1>
      <hr />
      <section><UseStateDemo /></section>
      <hr />
      <section><UseEffectDemo /></section>
      <hr />
      <section><UseRefDemo /></section>
      <hr />
      <section><UseMemoDemo /></section>
      <hr />
      <section><UseCallbackDemo /></section>
      <hr />
      <section><UseContextDemo /></section>
      <hr />
      <section><UseReducerDemo /></section>
      <hr />
      <section><UseLayoutEffectDemo /></section>
      <hr />
      <section><UseImperativeHandleDemo /></section>
      <hr />
      <section><UseIdDemo /></section>
      <hr />
      <section><UseTransitionDemo /></section>
      <hr />
      <section><UseDeferredValueDemo /></section>
      <hr />
      <section><UseDebugValueDemo /></section>
      <hr />
      <section><UseSyncExternalStoreDemo /></section>
      <hr />
      <section><UseInsertionEffectDemo /></section>

      <h1>Custom Hooks</h1>
      <hr />
      <section><UseFetchDemo /></section>
      <hr />
      <section><UseLocalStorageDemo /></section>
      <hr />
      <section><UseDebounceDemo /></section>
      <hr />
      <section><UseWindowSizeDemo /></section>
      <hr />
      <section><UsePreviousDemo /></section>
      <hr />
      <section><UseClickOutsideDemo /></section>
      <hr />
      <section><UseToggleDemo /></section>
      <hr />
      <section><UseFormDemo /></section>

      <h1>Practice</h1>
      <hr />
      <section><Counter /></section>
      <hr />
      <section><TodoApp /></section>
      <hr />
      <section><CRUDApp /></section>

      <h1>Intermediate — State Management</h1>
      <hr />
      <section><ContextReducerDemo /></section>
      <hr />
      <section><ReduxToolkitDemo /></section>
      <hr />
      <section><RTKQueryDemo /></section>
      <hr />
      <section><TanStackQueryDemo /></section>

      <h1>Intermediate — Forms &amp; Validation</h1>
      <hr />
      <section><ReactHookFormDemo /></section>
      <hr />
      <section><ZodValidationDemo /></section>
      <hr />
      <section><AdvancedPatternsDemo /></section>
      <hr />
      <section><RHFAdvancedDemo /></section>
      <hr />
      <section><ZodAdvancedDemo /></section>

      <h1>Intermediate — Performance</h1>
      <hr />
      <section><MemoOptimizationDemo /></section>
      <hr />
      <section><CodeSplittingDemo /></section>

      <h1>Intermediate — Styling</h1>
      <hr />
      <section><CSSModulesDemo /></section>
      <hr />
      <section><StyledComponentsDemo /></section>
      <hr />
      <section><TailwindCSSDemo /></section>

      <h1>Intermediate — API Integration</h1>
      <hr />
      <section><FetchAPIDemo /></section>
      <hr />
      <section><AxiosDemo /></section>
      <hr />
      <section><ErrorHandlingDemo /></section>

      <h1>Intermediate — Advanced React</h1>
      <hr />
      <section><ControlledVsUncontrolledDemo /></section>
      <hr />
      <section><LiftingStateUpDemo /></section>
      <hr />
      <section><CompositionPatternsDemo /></section>
      <hr />
      <section><RefsAdvancedDemo /></section>
      <hr />
      <section><ContextAPIDemo /></section>

      <h1>Senior — Performance</h1>
      <hr />
      <section><RenderProfilingDemo /></section>
      <hr />
      <section><VirtualizationDemo /></section>
      <hr />
      <section><WebVitals /></section>
      <hr />
      <section><BundleAnalysis /></section>

    </div>
  );
};

export default App;
