// TOPIC: Functional Components
// A functional component is a plain JavaScript function that returns JSX.
// It is the modern, recommended way to build React components.

// Simple component — no props
const Greeting = () => {
  return <h2>Hello from a Functional Component!</h2>;
};

// Component can also return null (renders nothing)
const Hidden = () => {
  return null;
};

// Components can be composed inside other components
const FunctionalComponentsDemo = () => {
  return (
    <div>
      <h2>Functional Components Demo</h2>
      <Greeting />
      <Hidden />
      <p>The Hidden component above renders nothing.</p>
    </div>
  );
};

export default FunctionalComponentsDemo;
