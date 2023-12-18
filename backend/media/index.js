/**
 * Media Service Entry Point
 * Simple media upload service
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json());

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const profileDir = path.join(uploadDir, 'profile');
const serviceDir = path.join(uploadDir, 'service');
const tempDir = path.join(uploadDir, 'temp');

fs.ensureDirSync(profileDir);
fs.ensureDirSync(serviceDir);
fs.ensureDirSync(tempDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadType = req.params.type || 'temp';
    let destDir = tempDir;
    
    switch (uploadType) {
      case 'profile':
        destDir = profileDir;
        break;
      case 'service':
        destDir = serviceDir;
        break;
      default:
        destDir = tempDir;
    }
    
    cb(null, destDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and PDFs
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|csv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDF, and CSV files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Serve static files
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'media-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// File upload endpoint
app.post('/api/v1/media/upload/:type', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const uploadType = req.params.type;
    let processedFile = req.file;

    // Process images (create thumbnails for profile images)
    if (uploadType === 'profile' && req.file.mimetype.startsWith('image/')) {
      try {
        const thumbnailPath = path.join(
          path.dirname(req.file.path),
          'thumbnail-' + path.basename(req.file.path)
        );

        await sharp(req.file.path)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        processedFile.thumbnail = `/uploads/${uploadType}/thumbnail-${req.file.filename}`;
      } catch (error) {
        console.error('Thumbnail creation failed:', error);
        // Continue without thumbnail if processing fails
      }
    }

    const fileUrl = `/uploads/${uploadType}/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `http://localhost:${PORT}${fileUrl}`,
        path: fileUrl,
        ...(processedFile.thumbnail && {
          thumbnailUrl: `http://localhost:${PORT}${processedFile.thumbnail}`
        })
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Delete file endpoint
app.delete('/api/v1/media/delete', (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    const fullPath = path.join(__dirname, filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      
      // Try to delete thumbnail if it exists
      const thumbnailPath = path.join(
        path.dirname(fullPath),
        'thumbnail-' + path.basename(fullPath)
      );
      
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
      
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Media Service running on http://localhost:${PORT}`);
  console.log(`Upload directories:`);
  console.log(`- Profile: ${profileDir}`);
  console.log(`- Service: ${serviceDir}`);
  console.log(`- Temp: ${tempDir}`);
});