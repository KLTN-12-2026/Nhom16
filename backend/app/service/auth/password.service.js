const bcrypt = require('bcryptjs')

const createPasswordService = ({ rounds = 12 } = {}) => ({
  hash(password) {
    return bcrypt.hash(password, rounds)
  },
  compare(password, hash) {
    return bcrypt.compare(password, hash)
  },
})

module.exports = { createPasswordService }
