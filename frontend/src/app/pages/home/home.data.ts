export interface FeaturedJob {
  id: number
  role: string
  company: string
  salary: string
  location: string
  workMode: string
  postedAt: string
  tags: string[]
  match: number
  logo: string
  logoClass: string
}

export const featuredJobs: FeaturedJob[] = [
  { id: 1, role: 'Frontend Developer', company: 'NovaTech Studio', salary: '18 - 28 triệu', location: 'Đà Nẵng', workMode: 'Tại văn phòng', postedAt: '2 giờ trước', tags: ['ReactJS', 'TypeScript', 'UI/UX'], match: 92, logo: 'NT', logoClass: 'job-logo--blue' },
  { id: 2, role: 'Backend NodeJS Developer', company: 'Aster Labs', salary: '20 - 32 triệu', location: 'Hồ Chí Minh', workMode: 'Linh hoạt', postedAt: '5 giờ trước', tags: ['NodeJS', 'MySQL', 'REST API'], match: 88, logo: 'AL', logoClass: 'job-logo--green' },
  { id: 3, role: 'Business Analyst', company: 'Mira Digital', salary: '15 - 24 triệu', location: 'Hà Nội', workMode: 'Hybrid', postedAt: '1 ngày trước', tags: ['Agile', 'SRS', 'Data'], match: 84, logo: 'MD', logoClass: 'job-logo--orange' },
]

export const jobCategories = [
  { code: '2512', name: 'Công nghệ thông tin', jobs: '4 việc làm', icon: 'bi-code-slash', tone: 'blue' },
  { code: '2411', name: 'Kế toán', jobs: '3 việc làm', icon: 'bi-calculator', tone: 'green' },
  { code: '2431', name: 'Marketing', jobs: '3 việc làm', icon: 'bi-megaphone', tone: 'purple' },
  { code: '2421', name: 'Phân tích kinh doanh', jobs: '3 việc làm', icon: 'bi-graph-up-arrow', tone: 'orange' },
  { code: '4222', name: 'Chăm sóc khách hàng', jobs: '3 việc làm', icon: 'bi-headset', tone: 'cyan' },
]

export const trustStats = [
  { value: '12K+', label: 'CV đã được phân tích' },
  { value: '3.8K', label: 'Cơ hội việc làm' },
  { value: '820+', label: 'Doanh nghiệp tham gia' },
  { value: '< 60s', label: 'Nhận kết quả AI' },
]
