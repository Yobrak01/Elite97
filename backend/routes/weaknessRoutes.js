const express = require('express');
const router = express.Router();
const { getWeaknessData, logWeakness } = require('../controllers/weaknessController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const logWeaknessSchema = {
  weaknessType: { type: 'string', required: true, enum: ['Procrastination', 'Overconfidence', 'Perfectionism', 'Distraction', 'Impulsive decisions'] },
  intensity: { type: 'number', required: false, min: 1, max: 10 },
  trigger: { type: 'string', required: false, max: 500 }
};

router.route('/')
  .get(protect, getWeaknessData)
  .post(protect, validate(logWeaknessSchema), logWeakness);

module.exports = router;
