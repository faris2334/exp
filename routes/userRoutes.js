const express = require('express');
const router = express.Router();
const { getUser, updateName, setPassword } = require('../controllers/usersController');
const { protect } = require('../middleware/authMiddleware'); 

router.use(protect);

router.get('/:id', getUser);          
router.put('/name/:id', updateName);
router.put('/password/:id', setPassword);  // Set password for Google OAuth users

module.exports = router;