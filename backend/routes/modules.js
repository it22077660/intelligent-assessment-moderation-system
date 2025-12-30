/**
 * Module Routes
 * Handles CRUD operations for modules
 */

const express = require('express');
const Module = require('../models/Module');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get all modules
 * GET /api/modules
 */
router.get('/', async (req, res) => {
  try {
    const modules = await Module.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: modules.length,
      modules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch modules: ' + error.message
    });
  }
});

/**
 * Get single module by ID
 * GET /api/modules/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.json({
      success: true,
      module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch module: ' + error.message
    });
  }
});

/**
 * Create new module
 * POST /api/modules
 */
router.post('/', async (req, res) => {
  try {
    const { moduleCode, moduleName, topics, learningOutcomes } = req.body;

    // Validate required fields
    if (!moduleCode || !moduleName) {
      return res.status(400).json({
        success: false,
        message: 'Module code and name are required'
      });
    }

    // Check if module code already exists
    const existingModule = await Module.findOne({ moduleCode: moduleCode.toUpperCase() });
    if (existingModule) {
      return res.status(400).json({
        success: false,
        message: 'Module with this code already exists'
      });
    }

    // Create new module
    const module = new Module({
      moduleCode: moduleCode.toUpperCase(),
      moduleName,
      topics: topics || [],
      learningOutcomes: learningOutcomes || [],
      createdBy: req.user._id
    });

    await module.save();

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create module: ' + error.message
    });
  }
});

/**
 * Update module
 * PUT /api/modules/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { moduleCode, moduleName, topics, learningOutcomes } = req.body;

    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Update fields
    if (moduleCode) module.moduleCode = moduleCode.toUpperCase();
    if (moduleName) module.moduleName = moduleName;
    if (topics) module.topics = topics;
    if (learningOutcomes) module.learningOutcomes = learningOutcomes;

    await module.save();

    res.json({
      success: true,
      message: 'Module updated successfully',
      module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update module: ' + error.message
    });
  }
});

/**
 * Delete module
 * DELETE /api/modules/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    await Module.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete module: ' + error.message
    });
  }
});

module.exports = router;

