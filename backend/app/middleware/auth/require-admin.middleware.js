const { ROLES } = require('../../constants')
const { ApiError } = require('../../util')
const { authenticateJwt } = require('./passport.middleware')

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== ROLES.ADMIN) {
    return next(new ApiError(403, 'Chỉ quản trị viên được phép thực hiện thao tác này.', 'FORBIDDEN'))
  }
  return next()
}

module.exports = { authenticateAdmin: [authenticateJwt, requireAdmin], requireAdmin }
