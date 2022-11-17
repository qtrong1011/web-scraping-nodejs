var express = require('express');
var router = express.Router();
const movingCenterLMS = require('../src/lmsJobs');

router.use(express.json());
/* POST Moving Center API */
router.post('/api/MovingCenterLMS', async (req, res) => {
    student_info = req.body; // JavaScript object containing the parse JSON
    moved_student = await movingCenterLMS.MovingCenterLMS(student_info);
    console.log(moved_student);
    res.json(moved_student);
});

module.exports = router;
