const express = require('express');
const router = express.Router();
const { getWeaknessData, logWeakness } = require('../controllers/weaknessController');
const protect = require('../middleware/auth');

router.route('/')
  .get(protect, getWeaknessData)
  .post(protect, logWeakness);

module.exports = router;
