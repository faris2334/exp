const TaskFile = require('../models/fileModel');

// Upload a file - stores file data directly in database as BLOB
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
      file_data: req.file.buffer, // Binary data from memory storage
      file_size: req.file.size,
      mime_type: req.file.mimetype
    };

    const file = await TaskFile.create(fileData);
    
    // Return file info (without binary data)
    res.status(201).json({
      file_id: file.file_id,
      task_id: file.task_id,
      user_id: file.user_id,
      file_name: file.file_name,
      file_size: file.file_size,
      mime_type: file.mime_type,
      uploaded_at: new Date().toISOString(),
      first_name: req.user.first_name,
      last_name: req.user.last_name
    });
  } catch (error) {
    console.error('Error uploading file:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Failed to upload file', error: error.message });
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

    // Delete from database (no physical file to delete anymore)
    await TaskFile.delete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
};

// Download a file - serves file data from database
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await TaskFile.findByIdWithData(fileId);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (!file.file_data) {
      return res.status(404).json({ message: 'File data not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`);
    res.setHeader('Content-Length', file.file_data.length);
    
    // Send the binary data
    res.send(file.file_data);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
};
