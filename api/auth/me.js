const { withAuth } = require('../_lib/helpers');

module.exports = withAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  res.json(req.user);
});
