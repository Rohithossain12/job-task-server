const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// middleware

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("hello from job task server.....");
});

app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
});
