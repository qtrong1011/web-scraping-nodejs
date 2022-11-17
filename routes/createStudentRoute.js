var express = require('express');
var router = express.Router();
const createStudent = require('../src/lmsJobs');

router.use(express.json());
/* POST Moving Center API */
router.post('/api/CreateStudent', async (req, res) => {
    var student_info = req.body; // JavaScript object containing the parse JSON
    var response = await createStudent.CreateStudent(student_info);
    res.json(response);
});

module.exports = router;
