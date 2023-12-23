/**
 * Products Service Entry Point
 * Simple products catalog service
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3004;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/products_db';

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(() => {
  console.log('Products DB connected');
}).catch((err) => {
  console.error('Products DB connection error:', err);
});

// Simple Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  images: [{
    url: String,
    isPrimary: { type: Boolean, default: false }
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  specifications: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  versionKey: false
});

const Product = mongoose.model('Product', productSchema);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'products-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get all products
app.get('/api/v1/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sellerId, search } = req.query;
    
    let query = { isActive: true };
    
    if (category) query.category = new RegExp(category, 'i');
    if (sellerId) query.sellerId = sellerId;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort('-createdAt');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single product
app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create product
app.post('/api/v1/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update product
app.put('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete product
app.delete('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
  console.log(`Products Service running on http://localhost:${PORT}`);
});