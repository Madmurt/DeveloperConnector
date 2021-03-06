const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validation, validationResult } = require('express-validator');
const User = require('../../models/User');
const router = express.Router();

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

			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(
				payload,
				config.get('jwtsecret'),
				{ expiresIn: '3600000000' },
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (error) {
			console.error(`Post Create users ${error.message}`);
			res.status(500).send('Server error');
		}
	}
);

module.exports = router;
