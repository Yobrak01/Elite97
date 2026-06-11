const express = require('express');
const router = express.Router();
const { getWeaknessData, logWeakness } = require('../controllers/weaknessController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getWeaknessData)
  .post(protect, logWeakness);

module.exports = router;
