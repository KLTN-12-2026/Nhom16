const { ApiError } = require('../../util')

const requirePermission = (permission) => (req, res, next) => {
  const permissions = Array.isArray(req.user?.permissions) ? req.user.permissions : []

  if (!permissions.includes(permission)) {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện hành động này.', 'FORBIDDEN'))
  }

  return next()
}

module.exports = { requirePermission }
