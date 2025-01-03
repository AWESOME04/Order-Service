const { ValidateSignature } = require('../../utils');

const auth = async (req, res, next) => {
    try {
        const isAuthorized = await ValidateSignature(req);
        if (isAuthorized) {
            return next();
        }
        return res.status(403).json({ message: 'Not Authorized' });
    } catch (err) {
        return res.status(403).json({ message: 'Authentication failed' });
    }
};

const isBuyer = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'Buyer') {
            return next();
        }
        return res.status(403).json({ message: 'Only buyers can perform this action' });
    } catch (err) {
        return res.status(403).json({ message: 'Authentication failed' });
    }
};

module.exports = { auth, isBuyer };