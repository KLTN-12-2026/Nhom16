const readCookie = (request, name) => {
  const entry = (request.headers.cookie || '')
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))

  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

module.exports = { readCookie }
