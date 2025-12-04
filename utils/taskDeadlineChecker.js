const db = require('../config/db');
const Notification = require('../models/notificationsModel');

/**
 * Check for tasks that have reached their due date and send notifications
 * This function can be called periodically (e.g., via cron job or setInterval)
 */
async function checkTaskDeadlines() {
  try {
    // Find tasks that are due today or overdue and haven't been notified yet
    // Status 0 = not started, Status 1 = in progress, Status 2 = completed
    const [overdueTasks] = await db.query(`
      SELECT t.task_id, t.title, t.due_date, t.status, t.project_id
      FROM task t
      WHERE t.due_date <= CURDATE()
      AND t.status != 2
      AND t.task_id NOT IN (
        SELECT DISTINCT n.task_id FROM notifications n 
        WHERE n.title = 'Task Deadline Reached' 
        AND n.task_id IS NOT NULL
      )
    `);

    for (const task of overdueTasks) {
      // Get all assignees for this task
      const [assignees] = await db.query(`
        SELECT u.user_id, u.first_name, u.last_name
        FROM assigned_to at
        JOIN user u ON at.user_id = u.user_id
        WHERE at.task_id = ?
      `, [task.task_id]);

      // Send notification to each assignee
      for (const assignee of assignees) {
        await Notification.create(
          'Task Deadline Reached',
          `The task "${task.title}" has reached its due date`,
          task.task_id,
          assignee.user_id
        );
      }
    }

    return { checked: overdueTasks.length, notified: overdueTasks.length };
  } catch (err) {
    console.error('Error checking task deadlines:', err);
    throw err;
  }
}

/**
 * Check for tasks due soon (within specified days) and send reminder notifications
 */
async function checkUpcomingDeadlines(daysAhead = 1) {
  try {
    const [upcomingTasks] = await db.query(`
      SELECT t.task_id, t.title, t.due_date, t.status, t.project_id
      FROM task t
      WHERE t.due_date = DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND t.status != 2
      AND t.task_id NOT IN (
        SELECT DISTINCT n.task_id FROM notifications n 
        WHERE n.title = 'Task Due Soon' 
        AND n.task_id IS NOT NULL
        AND DATE(n.create_at) = CURDATE()
      )
    `, [daysAhead]);

    for (const task of upcomingTasks) {
      const [assignees] = await db.query(`
        SELECT u.user_id, u.first_name, u.last_name
        FROM assigned_to at
        JOIN user u ON at.user_id = u.user_id
        WHERE at.task_id = ?
      `, [task.task_id]);

      for (const assignee of assignees) {
        await Notification.create(
          'Task Due Soon',
          `The task "${task.title}" is due in ${daysAhead} day(s)`,
          task.task_id,
          assignee.user_id
        );
      }
    }

    return { checked: upcomingTasks.length, notified: upcomingTasks.length };
  } catch (err) {
    console.error('Error checking upcoming deadlines:', err);
    throw err;
  }
}

module.exports = { checkTaskDeadlines, checkUpcomingDeadlines };
