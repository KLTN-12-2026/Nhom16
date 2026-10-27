const yup = require('yup')

const { validationError } = require('../../util')

const schema = yup.object({
  decision: yup.string().oneOf(['APPROVE', 'REJECT']).required(),
  reason: yup.string().trim().max(1000).when('decision', {
    is: 'REJECT',
    then: (value) => value.required('Vui lòng nhập lý do từ chối.'),
    otherwise: (value) => value.default(''),
  }),
}).noUnknown(true)

const validateEmployerReview = async (payload) => {
  try {
    return await schema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Thông tin xét duyệt chưa hợp lệ.')
  }
}

module.exports = { validateEmployerReview }
