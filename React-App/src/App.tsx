import JSXDemo from "./react-basics/01_JSX";
import FunctionalComponentsDemo from "./react-basics/02_FunctionalComponents";
import PropsVsStateDemo from "./react-basics/03_PropsVsState";
import EventsAndConditionalDemo from "./react-basics/04_EventsAndConditionalRendering";
import ListsAndKeysDemo from "./react-basics/05_ListsAndKeys";
import BasicFormsDemo from "./react-basics/06_BasicForms";

const App = () => {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>React Basics — Exploration</h1>
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
    </div>
  );
};

export default App;
