const { ApiError } = require('../../util')

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này.', 'FORBIDDEN'))
  }
  return next()
}

module.exports = { requireRole }
