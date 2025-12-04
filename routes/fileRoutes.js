const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.test(ext.substring(1))) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, pdf, doc, xls, txt, zip'));
    }
  }
});


// Upload file
router.post('/upload',protect, upload.single('file'), fileController.uploadFile);

// Get files by task
router.get('/task/:taskId', protect, fileController.getFilesByTask);

// Delete file
router.delete('/:fileId', protect, fileController.deleteFile);

// Download file
router.get('/download/:fileId', fileController.downloadFile);

module.exports = router;
