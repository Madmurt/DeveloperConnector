const express = require('express');
const router  = express.Router();
const { check, validation, validationResult} = require('express-validator');

//@route  Post api/users
//@desc   Register user
//@access Public
router.post('/', [
    check('name', 'Please provide a valid name').not().isEmpty(),
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'Please enter a password of 6 or more charachters').isLength({
        min: 6
    })

], (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    console.log(req.body);
    res.send('User route')
});

module.exports = router;