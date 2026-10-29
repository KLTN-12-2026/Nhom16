const initialJobs = [
  {
    id: 1,
    title: 'Frontend Developer (ReactJS / TypeScript)',
    company: 'NovaTech Studio',
    companyLogo: 'NT',
    companyLogoClass: 'job-logo--blue',
    salary: '18 - 28 triệu',
    location: 'Đà Nẵng',
    workMode: 'Tại văn phòng',
    postedAt: '2 giờ trước',
    deadline: '30/11/2026',
    status: 'ACTIVE',
    tags: ['ReactJS', 'TypeScript', 'UI/UX', 'TailwindCSS'],
    description: 'Chúng tôi đang tìm kiếm một Frontend Developer tài năng để tham gia phát triển các sản phẩm ứng dụng tuyển dụng thông minh tích hợp AI.',
    requirements: [
      'Tối thiểu 1-2 năm kinh nghiệm làm việc với ReactJS, TypeScript và RESTful API.',
      'Thành thạo quản lý trạng thái bằng Redux Toolkit hoặc Redux-Saga.',
      'Có tư duy tối ưu trải nghiệm người dùng (UX/UI), Responsive Web Design.',
      'Kỹ năng làm việc nhóm, giao tiếp tốt và tinh thần trách nhiệm cao.'
    ],
    benefits: [
      'Mức lương cạnh tranh: 18 - 28 triệu VNĐ/tháng + thưởng hiệu suất dự án.',
      'Được cấp trang thiết bị làm việc hiện đại (MacBook Pro / Màn hình 4K).',
      'Đóng đầy đủ BHXH, BHYT, BHTN và gói bảo hiểm sức khỏe cao cấp.',
      'Môi trường làm việc trẻ trung, năng động, nhiều cơ hội thăng tiến.'
    ]
  },
  {
    id: 2,
    title: 'Backend NodeJS Developer (Express / MySQL)',
    company: 'Aster Labs',
    companyLogo: 'AL',
    companyLogoClass: 'job-logo--green',
    salary: '20 - 32 triệu',
    location: 'Hồ Chí Minh',
    workMode: 'Linh hoạt',
    postedAt: '5 giờ trước',
    deadline: '15/12/2026',
    status: 'ACTIVE',
    tags: ['NodeJS', 'Express', 'MySQL', 'Redis', 'BullMQ'],
    description: 'Aster Labs tuyển dụng Kỹ sư Backend NodeJS chịu trách nhiệm xây dựng hạ tầng API hiệu năng cao và tích hợp các dịch vụ AI xử lý dữ liệu lớn.',
    requirements: [
      'Nắm vững kiến trúc phần mềm Clean Architecture, Microservices và REST API.',
      'Có kinh nghiệm thực chiến với Express.js, Sequelize ORM và CSDL MySQL.',
      'Hiểu biết sâu về Message Queue (Redis / BullMQ) và cơ chế bất đồng bộ.',
      'Ưu tiên ứng viên có kiến thức về bảo mật JWT, OAuth 2.0 và Rate Limiting.'
    ],
    benefits: [
      'Lương thưởng hấp dẫn: 20 - 32 triệu VNĐ/tháng, review lương 2 lần/năm.',
      'Thời gian làm việc linh hoạt (Flexible working hours / Hybrid work).',
      'Tham gia các khóa đào tạo chuyên sâu về AI & Cloud Computing có chứng chỉ quốc tế.'
    ]
  },
  {
    id: 3,
    title: 'Business Analyst (AI & Product)',
    company: 'Mira Digital',
    companyLogo: 'MD',
    companyLogoClass: 'job-logo--orange',
    salary: '15 - 24 triệu',
    location: 'Hà Nội',
    workMode: 'Hybrid',
    postedAt: '1 ngày trước',
    deadline: '20/12/2026',
    status: 'ACTIVE',
    tags: ['Agile', 'SRS', 'Scrum', 'Data Analysis'],
    description: 'Cần tìm Business Analyst phụ trách kết nối giữa khách hàng doanh nghiệp và đội ngũ phát triển sản phẩm công nghệ AI.',
    requirements: [
      'Có từ 1 năm kinh nghiệm làm BA phần mềm, am hiểu quy trình Scrum/Agile.',
      'Khả năng viết tài liệu PRD, SRS, User Stories và Acceptance Criteria mạch lạc.',
      'Kỹ năng phân tích dữ liệu và thiết kế quy trình nghiệp vụ (BPMN).'
    ],
    benefits: [
      'Mức thu nhập: 15 - 24 triệu VNĐ/tháng + tháng lương thứ 13.',
      'Phụ cấp ăn trưa, gửi xe và teambuilding hàng quý tại các resort cao cấp.'
    ]
  }
]

const getPublicJobs = async ({ search = '', location = '' }) => {
  let filtered = initialJobs.filter(j => j.status === 'ACTIVE')
  if (search && search.trim()) {
    const s = search.toLowerCase()
    filtered = filtered.filter(j =>
      j.title.toLowerCase().includes(s) ||
      j.company.toLowerCase().includes(s) ||
      j.tags.some(t => t.toLowerCase().includes(s))
    )
  }
  if (location && location.trim()) {
    filtered = filtered.filter(j => j.location.toLowerCase().includes(location.toLowerCase()))
  }
  return filtered
}

const getPublicJobById = async (id) => {
  const job = initialJobs.find(j => j.id === parseInt(id))
  return job || null
}

module.exports = { getPublicJobs, getPublicJobById }
