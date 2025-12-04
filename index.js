require('dotenv').config();

const app = require("./app");
const { checkTaskDeadlines, checkUpcomingDeadlines } = require('./utils/taskDeadlineChecker');

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Run task deadline check every hour (3600000 ms) works likes cron-job
  setInterval(async () => {
    try {
      console.log('Checking task deadlines...');
      await checkTaskDeadlines();
      await checkUpcomingDeadlines(1); // Check tasks due tomorrow
    } catch (err) {
      console.error('Error in deadline check:', err);
    }
  }, 3600000); // Every hour
  
  // Also run once on server start
  setTimeout(async () => {
    try {
      console.log('Initial task deadline check...');
      await checkTaskDeadlines();
      await checkUpcomingDeadlines(1);
    } catch (err) {
      console.error('Error in initial deadline check:', err);
    }
  }, 5000); // 5 seconds after server start
});
