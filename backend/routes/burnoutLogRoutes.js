const express = require('express');
const router = express.Router();
const { getLogs, createLog } = require('../controllers/burnoutLogController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const createBurnoutLogSchema = {
  level: { type: 'string', required: true, enum: ['low', 'moderate', 'high', 'critical'] },
  riskScore: { type: 'number', required: false, min: 0, max: 100 },
  notes: { type: 'string', required: false, max: 1000 }
};

router.route('/')
  .get(protect, getLogs)
  .post(protect, validate(createBurnoutLogSchema), createLog);

module.exports = router;
