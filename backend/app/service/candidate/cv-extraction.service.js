const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')

const mammoth = require('mammoth')
const pdfParse = require('pdf-parse')
const sharp = require('sharp')

const { env } = require('../../config')

const avatarDirectory = path.resolve(env.upload.rootDirectory, 'cv-avatars')
const ignoredHeadings = /^(curriculum vitae|resume|cv|profile|contact|personal information|thông tin cá nhân|hồ sơ|mục tiêu nghề nghiệp)$/i
const cvSectionPattern = /\b(kinh nghiệm|học vấn|kỹ năng|mục tiêu nghề nghiệp|chứng chỉ|dự án|work experience|education|skills|career objective|certifications?|projects?)\b/gi

const normalizeText = (value) => value.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').trim()

const extractBasicInformation = (text) => {
  const normalized = normalizeText(text)
  const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const candidateEmail = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || null
  const rawPhone = normalized.match(/(?:\+?84|0)(?:[ .-]?\d){9,10}/)?.[0] || null
  const candidatePhone = rawPhone?.replace(/[ .-]/g, '') || null
  const sectionMatches = normalized.match(cvSectionPattern) || []
  const isLikelyCv = Boolean(candidateEmail || candidatePhone || new Set(sectionMatches.map((value) => value.toLowerCase())).size >= 2)

  if (!isLikelyCv) {
    return { candidateName: null, candidateEmail: null, candidatePhone: null, headline: null, isLikelyCv: false }
  }

  const nameIndex = lines.findIndex((line) => {
    const words = line.split(/\s+/)
    return line.length <= 80
      && words.length >= 2
      && words.length <= 7
      && !ignoredHeadings.test(line)
      && !line.includes('@')
      && !/\d{4,}/.test(line)
  })
  const candidateName = nameIndex >= 0 ? lines[nameIndex].slice(0, 180) : null
  const headline = lines.slice(Math.max(nameIndex + 1, 0)).find((line) => (
    line.length <= 120
      && line !== candidateEmail
      && !line.includes('@')
      && !/(?:\+?84|0)(?:[ .-]?\d){9,10}/.test(line)
      && !ignoredHeadings.test(line)
  ))?.slice(0, 255) || null

  return { candidateName, candidateEmail, candidatePhone, headline, isLikelyCv: true }
}

const saveBestAvatar = async (images) => {
  const candidates = (await Promise.all(images.map(async ({ buffer, contentType }) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(contentType)) return null
    const metadata = await sharp(buffer).metadata().catch(() => null)
    if (!metadata?.width || !metadata?.height || metadata.width < 100 || metadata.height < 100) return null
    const ratio = Math.max(metadata.width, metadata.height) / Math.min(metadata.width, metadata.height)
    if (ratio > 2.2) return null
    return { buffer, score: metadata.width * metadata.height / ratio }
  }))).filter(Boolean).sort((left, right) => right.score - left.score)

  if (!candidates.length) return null
  await fs.mkdir(avatarDirectory, { recursive: true })
  const filename = `${crypto.randomUUID()}.webp`
  const absolutePath = path.join(avatarDirectory, filename)
  await sharp(candidates[0].buffer).rotate().resize(360, 360, { fit: 'cover', position: 'attention' }).webp({ quality: 84 }).toFile(absolutePath)
  return absolutePath
}

const extractDocx = async (absolutePath) => {
  const images = []
  const imageConverter = mammoth.images.imgElement(async (image) => {
    images.push({ buffer: await image.readAsBuffer(), contentType: image.contentType })
    return { src: '' }
  })
  const [textResult] = await Promise.all([
    mammoth.extractRawText({ path: absolutePath }),
    mammoth.convertToHtml({ path: absolutePath }, { convertImage: imageConverter }),
  ])
  return { text: textResult.value, avatarAbsolutePath: await saveBestAvatar(images) }
}

const extractPdf = async (absolutePath) => {
  const buffer = await fs.readFile(absolutePath)
  const result = await pdfParse(buffer)
  return { text: result.text, avatarAbsolutePath: null }
}

const extractCvData = async (absolutePath, mimeType) => {
  try {
    const extracted = mimeType === 'application/pdf'
      ? await extractPdf(absolutePath)
      : await extractDocx(absolutePath)
    const basicInformation = extractBasicInformation(extracted.text)
    return {
      candidateName: basicInformation.candidateName,
      candidateEmail: basicInformation.candidateEmail,
      candidatePhone: basicInformation.candidatePhone,
      headline: basicInformation.headline,
      avatarAbsolutePath: extracted.avatarAbsolutePath,
      extractionStatus: !basicInformation.isLikelyCv
        ? 'failed'
        : basicInformation.candidateName && (basicInformation.candidateEmail || basicInformation.candidatePhone)
        ? 'completed'
        : 'partial',
    }
  } catch (error) {
    return {
      candidateName: null,
      candidateEmail: null,
      candidatePhone: null,
      headline: null,
      avatarAbsolutePath: null,
      extractionStatus: 'failed',
    }
  }
}

module.exports = { extractBasicInformation, extractCvData }
