const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');

// POST /api/repairs
router.post('/', repairController.createRepair);

// GET /api/repairs/pending
router.get('/pending', repairController.getPendingRepairs);

// PATCH /api/repairs/:id/accept
router.patch('/:id/accept', repairController.acceptRepair);

// PATCH /api/repairs/:id/complete
router.patch('/:id/complete', repairController.completeRepair);

// GET /api/repairs/my-jobs?partner_id=xxx
router.get('/my-jobs', repairController.getPartnerJobs);

// GET /api/repairs?client_id=xxx
router.get('/', repairController.getClientRepairs);

// PATCH /api/repairs/:id/status
router.patch('/:id/status', repairController.updateStatus);

// PATCH /api/repairs/:id/estimate
router.patch('/:id/estimate', repairController.provideEstimate);

// PATCH /api/repairs/:id/approve-estimate
router.patch('/:id/approve-estimate', repairController.approveEstimate);

// POST /api/repairs/:id/rate
router.post('/:id/rate', repairController.rateRepair);

module.exports = router;
