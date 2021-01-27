const express = require('express');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const { check, validation, validationResult } = require('express-validator');
const router = express.Router();

//@route  Post api/posts
//@desc   Create a post
//@access Private
router.post(
	'/',
	[auth, [check('text', 'Text is required').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select('-password');

			const newPost = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			//Create if doesnt exist
			const post = new Post(newPost);
			await post.save();
			res.json(post);
		} catch (error) {
			console.error(error.message);
			response.status(500).send('Server error');
		}
	}
);

//@route  GET api/posts
//@desc   Get all posts
//@access Private

router.get('/', auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server error');
	}
});

//@route  GET api/posts/:post_id
//@desc   Get current users posts
//@access Private
router.get('/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (!post) {
			return res
				.status(400)
				.json({ msg: 'There is no posts for this user' });
		}

		res.json(post);
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
			return res
				.status(400)
				.json({ msg: 'There is no posts for this user' });
		}
		res.status(500).send('Server Error');
	}
});

//@route  GET api/posts/me
//@desc   Get current users posts
//@access Private
router.get('/me', auth, async (req, res) => {
	try {
		const posts = await Post.find({
			user: req.user.id,
		});

		console.log(req.user.id);
		if (!posts) {
			return res
				.status(400)
				.json({ msg: 'There is no posts for this user' });
		}

		res.json(posts);
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
			return res
				.status(400)
				.json({ msg: 'There is no posts for this user' });
		}
		res.status(500).send('Server Error');
	}
});

//@route  DELETE api/posts/:post_id
//@desc   Delete post by id
//@access Private

router.delete('/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (!post) {
			return res.status(400).json({ msg: 'Post not found' });
		}

		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'User not authorized' });
		}
		await post.remove();
		res.json({
			msg: `Post with id: ${req.params.post_id}, has been removed`,
		});
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(400).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server error');
	}
});

//@route  PUT api/posts/like/:post_id
//@desc   Like a post
//@access Private

router.put('/like/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (
			post.likes.filter((like) => like.user.toString() === req.user.id)
				.length > 0
		) {
			return res
				.status(400)
				.json({ msg: 'User can only like a post once' });
		}
		post.likes.unshift({ user: req.user.id });
		await post.save();
		res.json(post.likes);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server error');
	}
});

//@route  PUT api/posts/unlike/:post_id
//@desc   Unlike a post
//@access Private

router.put('/unlike/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (
			post.likes.filter((like) => like.user.toString() === req.user.id)
				.length === 0
		) {
			return res.status(400).json({
				msg: 'User cannot unlike a post they have not liked.',
			});
		}

		const removeIndex = post.likes
			.map((like) => like.user.toString())
			.indexOf(req.user.id);
		post.likes.splice(removeIndex, 1);
		await post.save();
		res.json(post.likes);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server error');
	}
});

//@route  POST api/posts/comment/:post_id
//@desc   Comment on a post
//@access Private

router.post(
	'/comment/:post_id',
	[auth, [check('text', 'Text is required').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const user = await User.findById(req.user.id).select('-password');
			const post = await Post.findById(req.params.post_id);

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			post.comments.unshift(newComment);
			await post.save();
			res.json(post.comments);
		} catch (error) {
			console.error(error.message);
			res.status(500).send('Server error');
		}
	}
);

//@route  DELETE api/posts/comment/:comment_id/:post_id
//@desc   Delete comments by id
//@access Private

router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		const comment = post.comments.find(
			(comment) => comment.id === req.params.comment_id
		);

		if (!comment) {
			return res.status(404).json({ msg: 'Comment does not exist' });
		}

		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'User not authorized' });
		}

		post.comments = post.comments.filter(
			({ id }) => id !== req.params.comment_id
		);
		await post.save();

		res.json(post.comments);
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(400).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server error');
	}
});

module.exports = router;
