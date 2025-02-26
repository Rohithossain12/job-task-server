const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // "https://job-task-client-xi.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uv360.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("TaskFlow");
    const userCollection = db.collection("users");
    const taskCollection = db.collection("tasks");

    //  Save User Data in DB
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.status(201).send(existingUser);
      }
      const result = await userCollection.insertOne(user);
      res.status(201).send(result);
    });

    // Save Task
    app.post("/tasks", async (req, res) => {
      const task = { ...req.body, order: Date.now() };
      const result = await taskCollection.insertOne(task);
      res.status(201).send(result);
    });

    //  Save Task in DB
    app.post("/tasks", async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.status(201).send(result);
    });

    // Get Tasks
    app.get("/tasks", async (req, res) => {
      const { email } = req.query;
      const tasks = await taskCollection
        .find({ email })
        .sort({ order: 1 })
        .toArray();
      res.json(tasks);
    });

    //  Update Task Status
    app.patch("/tasks/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status: status } };

      const result = await taskCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Delete Task API
    app.delete("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const filter = { _id: new ObjectId(id) };

        const deletedTask = await taskCollection.deleteOne(filter);
        if (deletedTask.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Task not found" });
        }

        res.json({ success: true, message: "Task deleted successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // update task
    app.put("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { name, description } = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { name, description } };

        const result = await taskCollection.updateOne(filter, updateDoc);
        if (result.matchedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Task not found" });
        }

        res.json({ success: true, message: "Task updated successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Update Task Order
    app.patch("/reorder", async (req, res) => {
      const { tasks } = req.body;

      const bulkOps = tasks.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { order } },
        },
      }));

      const result = await taskCollection.bulkWrite(bulkOps);
      res.send(result);
    });

    // Connect to MongoDB
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // Uncomment if you want to close the connection after execution
    // await client.close();
  }
}
run().catch(console.dir);

// Basic Server Test Route
app.get("/", (req, res) => {
  res.send("Hello from TaskFlow Server!");
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
});
