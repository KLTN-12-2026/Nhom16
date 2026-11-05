const assert = require('node:assert/strict')
const express = require('express')

const { initAuthEmailController } = require('../../app/controller/auth')

const getRoute = (router, path, method) => router.stack.find(
  (layer) => layer.route?.path === path && layer.route.methods[method],
)

describe('auth controller', () => {
  it('registers the public registration flow in the expected middleware order', () => {
    const router = express.Router()

    initAuthEmailController(router)

    const route = getRoute(router, '/register', 'post')
    assert.ok(route, 'POST /register must be registered')
    assert.equal(route.route.stack.length, 3, 'register must include validation, reCAPTCHA and controller handler')
  })

  it('registers session and account recovery endpoints', () => {
    const router = express.Router()

    initAuthEmailController(router)

    const expectedRoutes = [
      ['/login', 'post'],
      ['/refresh', 'post'],
      ['/logout', 'post'],
      ['/me', 'get'],
      ['/forgot-password', 'post'],
      ['/reset-password', 'post'],
      ['/verify-email', 'post'],
      ['/resend-verification', 'post'],
    ]

    expectedRoutes.forEach(([path, method]) => {
      assert.ok(getRoute(router, path, method), `${method.toUpperCase()} ${path} must be registered`)
    })
  })
})
