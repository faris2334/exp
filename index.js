require('dotenv').config();

const app = require("./app");
const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
