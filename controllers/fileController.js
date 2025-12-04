const TaskFile = require('../models/fileModel');
const path = require('path');
const fs = require('fs');

// Upload a file
exports.uploadFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { task_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!task_id) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const fileData = {
      task_id: parseInt(task_id),
      user_id: userId,
      file_name: req.file.originalname,
      file_path: `/uploads/${req.file.filename}`,
      file_size: req.file.size
    };

    const file = await TaskFile.create(fileData);
    
    // Return file with user info
    res.status(201).json({
      file_id: file.file_id,
      task_id: file.task_id,
      user_id: file.user_id,
      file_name: file.file_name,
      file_path: file.file_path,
      file_size: file.file_size,
      uploaded_at: new Date().toISOString(),
      first_name: req.user.first_name,
      last_name: req.user.last_name
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

// Get files for a task
exports.getFilesByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const files = await TaskFile.findAllByTask(taskId);
    res.json(files);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ message: 'Failed to get files' });
  }
};

// Delete a file
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Get the file first
    const file = await TaskFile.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user owns the file
    if (file.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Delete the physical file
    const filePath = path.join(__dirname, '..', 'public', file.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await TaskFile.delete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
};

// Download a file
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await TaskFile.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = path.join(__dirname, '..', 'public', file.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(filePath, file.file_name);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
};
