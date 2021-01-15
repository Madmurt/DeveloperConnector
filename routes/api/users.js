const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { check, validation, validationResult } = require('express-validator');
const User = require('../../models/User');

//@route  Post api/users
//@desc   Register user
//@access Public
router.post(
	'/',
	[
		check('name', 'Please provide a valid name').not().isEmpty(),
		check('email', 'Please provide a valid email').isEmail(),
		check(
			'password',
			'Please enter a password of 6 or more charachters'
		).isLength({
			min: 6,
		}),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, email, password } = req.body;
		try {
			let user = await User.findOne({ email });

			if (user) {
				return res.status(400).json({
					errors: [{ msg: 'User already exists' }],
				});
			}

			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm',
			});

			user = new User({
				name,
				email,
				avatar,
				password,
			});

			const salt = await bcrypt.genSalt(10);

			user.password = await bcrypt.hash(password, salt);

			await user.save();

			res.send('User registered');
		} catch (error) {
			console.error(error.message);
			Response.status(500).send('Server error');
		}
	}
);

module.exports = router;
