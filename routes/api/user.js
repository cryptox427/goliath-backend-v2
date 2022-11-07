const router = require('express').Router();

const { 
    signUpWithEmail, 
    signInWithEmail,
    forgetsendmail,
    resetPassword
} = require('../../controller/user');

router.post('/signup', signUpWithEmail);

router.post('/signin', signInWithEmail);

router.post('/forgot/confirm', forgetsendmail);
router.post('/reset/password', resetPassword);

module.exports = router;