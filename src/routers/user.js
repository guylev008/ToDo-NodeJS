const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/user');

const router = new express.Router();

router.post('/users', async (req, res) => {
	const user = new User(req.body);
	try {
		await user.save();
		sendWelcomeEmail(user.email, user.name);
		const token = await user.generateAuthToken();
		res.status(201).send({ user, token });
	} catch (error) {
		res.status(400).send(error);
	}
});

router.post('/users/login', async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const token = await user.generateAuthToken();
		res.send({ user, token });
	} catch (error) {
		res.status(400).send();
	}
});

router.post('/users/logout', async (req, res) => {
	try {
		req.user.tokens = req.user.token.filter(token => token.token !== req.token);
		await req.user.save();
		res.send();
	} catch (error) {
		res.status(500).send();
	}
});

router.post('/users/logoutAll', async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (error) {
		res.status(500).send();
	}
});

router.get('/users/me', auth, async (req, res) => {
	res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password'];
	const isValidOperation = updates.every(update =>
		allowedUpdates.includes(update)
	);

	if (!isValidOperation)
		return res.status(400).send({ error: 'Invalid update' });

	try {
		const user = req.user;
		updates.forEach(update => (user[update] = req.body[update]));
		await user.save();
		res.send(user);
	} catch (error) {
		res.status(400).send(error);
	}
});

router.delete('/users/me', auth, async (req, res) => {
	try {
		await req.user.remove();
		cancelationEmail(req.user.email, req.user.name);
		res.send(req.user);
	} catch (error) {
		res.status(500).send(error);
	}
});

module.exports = router;
