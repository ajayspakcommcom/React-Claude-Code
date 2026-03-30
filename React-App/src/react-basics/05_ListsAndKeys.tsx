// TOPIC: Lists & Keys
//
// Use Array.map() to render a list of elements from an array.
// Each item needs a unique `key` prop so React can efficiently update the DOM.
// Keys must be unique among siblings — use stable IDs, not array indexes when possible.

const fruits = ["Apple", "Banana", "Cherry", "Date", "Elderberry"];

interface Product {
  id: number;
  name: string;
  price: number;
}

const products: Product[] = [
  { id: 1, name: "Laptop", price: 999 },
  { id: 2, name: "Phone", price: 499 },
  { id: 3, name: "Tablet", price: 299 },
];

const ListsAndKeysDemo = () => {
  return (
    <div>
      <h2>Lists & Keys Demo</h2>

      {/* Simple list — using the value as key is OK only when values are unique */}
      <h3>Fruit List (string array)</h3>
      <ul>
        {fruits.map((fruit) => (
          <li key={fruit}>{fruit}</li>
        ))}
      </ul>

      {/* Object list — use a stable unique ID as key */}
      <h3>Product Table (object array with IDs)</h3>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            // key goes on the outermost element returned by map
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>${product.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Why NOT to use index as key (shown for awareness) */}
      <h3>⚠️ Index as key (avoid for dynamic lists)</h3>
      <ul>
        {fruits.map((fruit, index) => (
          <li key={index}>{fruit}</li> // OK only for static, never-reordered lists
        ))}
      </ul>
    </div>
  );
};

export default ListsAndKeysDemo;
