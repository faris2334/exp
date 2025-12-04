# Express.js Backend API

This is the Express.js backend for the MorxCorp project management application. It provides RESTful API endpoints for authentication, teams, projects, tasks, comments, files, and notifications.

## Getting Started

### Prerequisites
- Node.js v18+
- MySQL database (Aiven cloud or local)

### Installation

```bash
cd "FinalProject -3/FinalProject - Copy"
npm install
```

### Environment Variables

Create a `.env` file with the following variables:

```env
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=your_database_port
DB_SSL=true

JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

---

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/google` | Login/Register with Google OAuth |

### Users (`/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get current user profile |
| PUT | `/users/profile` | Update user profile |
| GET | `/users/search?email=` | Search user by email |

### Teams (`/teams`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams` | Get all teams for current user |
| GET | `/teams/:teamUrl` | Get team by URL |
| GET | `/teams/:teamUrl/report` | Get detailed team report with stats |
| POST | `/teams` | Create a new team |
| PUT | `/teams/:teamId` | Update team (admin only) |
| DELETE | `/teams/:teamId` | Delete team (admin only) |
| POST | `/teams/:teamId/members` | Add member by email |
| DELETE | `/teams/:teamId/members/:userId` | Remove member |

### Projects (`/projects`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects?team_id=` | Get all projects for a team |
| GET | `/projects/:projectUrl` | Get project by URL |
| POST | `/projects` | Create a new project |
| PUT | `/projects/:projectId` | Update project |
| DELETE | `/projects/:projectId` | Delete project |

### Tasks (`/tasks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks?project_id=` | Get all tasks for a project |
| POST | `/tasks/task/create` | Create a new task |
| PUT | `/tasks/task/update/:taskId` | Update task status |
| DELETE | `/tasks/:taskId` | Delete task |

### Comments (`/comments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/comments/task/create/:taskId` | Get comments for a task |
| POST | `/comments/comment/create/:taskId` | Add comment to a task |
| DELETE | `/comments/delete/:commentId` | Delete a comment |

### Files (`/files`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/files/task/:taskId` | Get files for a task |
| POST | `/files/upload` | Upload file to a task (multipart/form-data) |
| DELETE | `/files/:fileId` | Delete a file |
| GET | `/files/download/:fileId` | Download a file |

### Notifications (`/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get all notifications for user |
| POST | `/notifications` | Create notification |
| PUT | `/notifications/:id/read` | Mark notification as read |
| DELETE | `/notifications/:id` | Delete notification |

---

## Project Structure

```
FinalProject - Copy/
├── config/
│   └── db.js                 # MySQL database connection
├── controllers/
│   ├── authController.js     # Auth logic (login, register, Google OAuth)
│   ├── belongController.js   # Team membership logic
│   ├── commentController.js  # Task comments logic
│   ├── fileController.js     # File upload/download logic
│   ├── notificationsController.js
│   ├── projectController.js  # Project CRUD logic
│   ├── tasksController.js    # Task CRUD logic
│   ├── teamsController.js    # Team CRUD + reports logic
│   └── usersController.js    # User profile logic
├── middleware/
│   ├── authMiddleware.js     # JWT authentication
│   └── roleMiddleware.js     # Role-based access control
├── models/
│   ├── assignedToModel.js    # Task assignments
│   ├── belongModel.js        # Team membership
│   ├── fileModel.js          # Task files
│   ├── notificationsModel.js
│   ├── participationModel.js # Project participation
│   ├── projectModel.js
│   ├── taskCommentModel.js
│   ├── taskmodels.js
│   ├── teamModel.js
│   └── userModel.js
├── routes/
│   ├── authRoutes.js
│   ├── commentRoutes.js
│   ├── fileRoutes.js
│   ├── notificationRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   ├── teamRoutes.js
│   └── userRoutes.js
├── public/
│   └── uploads/              # Uploaded files storage
├── app.js                    # Express app configuration
├── index.js                  # Server entry point
└── package.json
```

---

## Recent Changes & Fixes

### Authentication
- ✅ Added Google OAuth support via `google-auth-library`
- ✅ Fixed JWT token verification and user lookup
- ✅ Added `req.user.id` alias for `req.user.user_id` in auth middleware

### Teams
- ✅ Added `GET /teams` endpoint to fetch user's teams
- ✅ Added `GET /teams/:teamUrl` endpoint with proper role information
- ✅ Added `addTeamMember` by email (not user_id)
- ✅ Added `getTeamReport` with comprehensive statistics:
  - Total projects, tasks, members
  - Task breakdown: completed, in-progress, todo, overdue
  - Per-project statistics
  - Per-member performance (assigned/completed/rate)
  - Recent activity feed
- ✅ Added `getTeamMembers` function to `belongModel.js`

### Projects
- ✅ Added `GET /projects/:projectUrl` endpoint
- ✅ Fixed `findAllByTeam` to include task counts and creator info
- ✅ Added auto-generated `project_url` on creation
- ✅ Added null checks for `project_name` fallback

### Tasks
- ✅ Added `GET /tasks?project_id=` endpoint
- ✅ Fixed task creation to check team membership (not project participation)
- ✅ Added `comment_count` to task queries using subquery
- ✅ Fixed notification creation parameter order

### Comments
- ✅ Fixed delete route (was missing leading `/`)
- ✅ Fixed `findById` query (wrong table/column names)
- ✅ Comments now return user info (first_name, last_name)

### Files
- ✅ Created complete file upload system:
  - `fileModel.js` - CRUD operations
  - `fileController.js` - Upload, download, delete logic
  - `fileRoutes.js` - Express routes with multer
- ✅ Installed `multer` for multipart file handling
- ✅ Created `task_files` table in database
- ✅ File size limit: 10MB
- ✅ Allowed types: images, pdf, doc, xls, txt, zip

### Models
- ✅ Removed `profile_image` references (column doesn't exist in DB)
- ✅ Added `getTaskAssignees` to `assignedToModel.js`
- ✅ Added `getProjectParticipants` to `participationModel.js`
- ✅ Added `getTeamMembers` to `belongModel.js`

---

## Database Schema

The backend expects these tables:

```sql
-- Users
CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    email VARCHAR(120) UNIQUE,
    password VARCHAR(60),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE team (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(50),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by INT NOT NULL,
    team_url VARCHAR(255)
);

-- Team Membership
CREATE TABLE belong (
    user_id INT NOT NULL,
    team_id INT NOT NULL,
    join_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(30),
    PRIMARY KEY (user_id, team_id)
);

-- Projects
CREATE TABLE project (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(500),
    team_id INT NOT NULL,
    create_by INT NOT NULL,
    project_url VARCHAR(255)
);

-- Tasks
CREATE TABLE task (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    due_date TIMESTAMP NULL,
    priority TINYINT,
    description VARCHAR(500),
    status TINYINT,  -- 0=todo, 1=in-progress, 2=done
    project_id INT NOT NULL,
);

-- Task Assignments
CREATE TABLE assigned_to (
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    PRIMARY KEY(user_id, task_id)
);

-- Task Comments
CREATE TABLE task_comment (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    comment_text VARCHAR(400) NOT NULL,
    task_id INT NOT NULL,
    user_id INT NOT NULL
);

-- Task Files
CREATE TABLE task_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message VARCHAR(400) NOT NULL,
    is_read TINYINT DEFAULT 0,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    task_id INT NOT NULL
);
```

---

## Frontend Integration

The Next.js frontend connects to this backend using:

```typescript
// lib/api-config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

export function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}
```

All protected routes require the `Authorization: Bearer <token>` header.

---

## License

MIT
