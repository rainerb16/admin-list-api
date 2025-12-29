const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors({ origin: true}));

const getHealthStatus = (req, res) => {
  res.status(200).json({ ok: true });
};

app.get("/health", getHealthStatus);

// Placeholder route to confirm wiring quickly
const getItemList = (req, res) => {
  const itemList = { data: [], meta: { page: 1, limit: 10, total: 0 } };
  res.json(itemList);
};

app.get("/items", getItemList);

const PORT = process.env.PORT || 3000;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
};

if (module === require.main) {
  startServer();
}

module.exports = app;
