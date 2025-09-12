const app = require("./src/app.js");
const PORT = process.env.PORT || 3000;
const connectDB = require("./src/db/connection");
// Connect to MongoDB
connectDB()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
