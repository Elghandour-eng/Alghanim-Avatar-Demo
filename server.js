import app from "./src/app.js";
const PORT = process.env.PORT || 3000;
import connectDB from "./src/db/connection.js";
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
