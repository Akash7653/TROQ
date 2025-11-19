// frontend/src/Drivers.js
import React, { useEffect, useState } from "react";
import {
  fetchDrivers,
  addDriver,
  updateDriverStatus,
  deleteDriver,
} from "./api";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [newDriver, setNewDriver] = useState({
    name: "",
    phone: "",
    vehicle: "",
    city: "",
  });

  async function loadDrivers() {
    try {
      const res = await fetchDrivers();
      setDrivers(res);
    } catch (err) {
      console.error("Failed to load drivers", err);
      alert("Unauthorized — Please login again.");
    }
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  async function handleAddDriver(e) {
    e.preventDefault();
    await addDriver(newDriver);
    setNewDriver({ name: "", phone: "", vehicle: "", city: "" });
    loadDrivers();
  }

  async function changeStatus(id, status) {
    await updateDriverStatus(id, status);
    loadDrivers();
  }

  async function removeDriver(id) {
    if (!window.confirm("Delete this driver?")) return;
    await deleteDriver(id);
    loadDrivers();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Drivers</h2>

      <form
        onSubmit={handleAddDriver}
        style={{
          marginBottom: 20,
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 8,
        }}
      >
        <h3>Add New Driver</h3>

        <input
          placeholder="Name"
          value={newDriver.name}
          onChange={(e) =>
            setNewDriver({ ...newDriver, name: e.target.value })
          }
          required
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <input
          placeholder="Phone"
          value={newDriver.phone}
          onChange={(e) =>
            setNewDriver({ ...newDriver, phone: e.target.value })
          }
          required
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <input
          placeholder="Vehicle"
          value={newDriver.vehicle}
          onChange={(e) =>
            setNewDriver({ ...newDriver, vehicle: e.target.value })
          }
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <input
          placeholder="City"
          value={newDriver.city}
          onChange={(e) =>
            setNewDriver({ ...newDriver, city: e.target.value })
          }
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <button style={{ width: "100%", padding: 10 }}>Add Driver</button>
      </form>

      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Vehicle</th>
            <th>City</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {drivers.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.name}</td>
              <td>{d.phone}</td>
              <td>{d.vehicle}</td>
              <td>{d.city}</td>
              <td>{d.status}</td>
              <td>
                <button onClick={() => changeStatus(d.id, "Available")}>
                  Available
                </button>
                <button
                  onClick={() => changeStatus(d.id, "Unavailable")}
                  style={{ marginLeft: 5 }}
                >
                  Unavailable
                </button>
                <button
                  style={{ marginLeft: 5, background: "red", color: "white" }}
                  onClick={() => removeDriver(d.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
