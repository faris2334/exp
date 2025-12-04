const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

// Configure multer for memory storage (files stored in database as BLOB)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB limit (MEDIUMBLOB supports up to 16MB)
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar|ppt|pptx|mp3|mp4|wav|webp|svg/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, pdf, doc, xls, ppt, txt, zip, audio, video'));
    }
  }
});

// All routes require authentication
router.use(protect);

// Upload file
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Get files by task
router.get('/task/:taskId', fileController.getFilesByTask);

// Delete file
router.delete('/:fileId', fileController.deleteFile);

// Download file
router.get('/download/:fileId', fileController.downloadFile);

module.exports = router;
