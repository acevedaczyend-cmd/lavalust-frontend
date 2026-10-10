
import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_name: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/login", {
        username,
        password,
      });

      const newToken = response.data.access_token;
      if (!newToken) {
        throw new Error("The API did not return an access token.");
      }

      localStorage.setItem("access_token", newToken);
      setToken(newToken);
      setPassword("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || error.message || "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const response = await api.get("/products");
      const data = response.data;
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not load products."
      );
    }
  }

  useEffect(() => {
    if (token) loadProducts();
  }, [token]);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function saveProduct(event) {
    event.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    try {
      if (editingId !== null) {
        await api.put(`/products/${editingId}`, payload);
        setMessage("Product updated.");
      } else {
        await api.post("/products", payload);
        setMessage("Product added.");
      }

      setForm({
        product_name: "",
        description: "",
        price: "",
        quantity: "",
      });
      setEditingId(null);
      await loadProducts();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not save the product."
      );
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      product_name: product.product_name || "",
      description: product.description || "",
      price: product.price ?? "",
      quantity: product.quantity ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(id) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      setMessage("Product deleted.");
      await loadProducts();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not delete the product."
      );
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    setToken(null);
    setProducts([]);
    setEditingId(null);
    setMessage("");
  }

  if (!token) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={login}>
          <h1>Product Management</h1>
          <p>Log in to manage your inventory.</p>

          <label>Username</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {message && <p className="message">{message}</p>}

          <button disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <h1>Product Management System</h1>
          <p>Manage your inventory in one place.</p>
        </div>
        <button className="secondary" onClick={logout}>Logout</button>
      </header>

      {message && <p className="message">{message}</p>}

      <section className="panel">
        <h2>{editingId !== null ? "Edit Product" : "Add Product"}</h2>

        <form className="product-form" onSubmit={saveProduct}>
          <label>
            Product Name
            <input
              name="product_name"
              value={form.product_name}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Description
            <input
              name="description"
              value={form.description}
              onChange={updateField}
            />
          </label>

          <label>
            Price
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={form.price}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Quantity
            <input
              type="number"
              name="quantity"
              min="0"
              step="1"
              value={form.quantity}
              onChange={updateField}
              required
            />
          </label>

          <div className="form-actions">
            <button>{editingId !== null ? "Save Changes" : "Add Product"}</button>
            {editingId !== null && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    product_name: "",
                    description: "",
                    price: "",
                    quantity: "",
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Products</h2>
          <button className="secondary" onClick={loadProducts}>Refresh</button>
        </div>

        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.product_name}</td>
                    <td>{product.description}</td>
                    <td>{Number(product.price).toFixed(2)}</td>
                    <td>{product.quantity}</td>
                    <td className="actions">
                      <button onClick={() => startEdit(product)}>Edit</button>
                      <button
                        className="danger"
                        onClick={() => deleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
