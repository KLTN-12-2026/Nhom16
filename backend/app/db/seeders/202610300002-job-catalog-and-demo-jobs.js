'use strict'

const CATEGORY_REFERENCE = 'Quyết định 34/2020/QĐ-TTg - Danh mục nghề nghiệp Việt Nam'

const categories = [
  { code: '2512', name: 'Nhà phát triển phần mềm', short_name: 'Công nghệ thông tin', legal_reference: CATEGORY_REFERENCE },
  { code: '2411', name: 'Kế toán', short_name: 'Kế toán', legal_reference: CATEGORY_REFERENCE },
  { code: '2431', name: 'Chuyên gia quảng cáo và tiếp thị', short_name: 'Marketing', legal_reference: CATEGORY_REFERENCE },
  { code: '2421', name: 'Chuyên gia phân tích tổ chức và quản lý', short_name: 'Phân tích kinh doanh', legal_reference: CATEGORY_REFERENCE },
  { code: '4222', name: 'Nhân viên trung tâm thông tin liên lạc', short_name: 'Chăm sóc khách hàng', legal_reference: CATEGORY_REFERENCE },
]

const jobs = [
  ['frontend-react', '2512', 'Frontend Developer ReactJS', 'NovaTech Studio', 'NT', 'blue', 18000000, 28000000, 'Đà Nẵng', 'OFFICE', '1_2', 'FULL_TIME', 'STAFF', ['ReactJS', 'TypeScript', 'UI/UX'], 'Phát triển giao diện nền tảng tuyển dụng thông minh, phối hợp cùng UX và backend để tạo trải nghiệm nhanh, dễ dùng.'],
  ['backend-node', '2512', 'Backend NodeJS Developer', 'Aster Labs', 'AL', 'green', 22000000, 35000000, 'Hồ Chí Minh', 'HYBRID', '2_5', 'FULL_TIME', 'STAFF', ['NodeJS', 'MySQL', 'Redis', 'BullMQ'], 'Xây dựng REST API, hàng đợi xử lý dữ liệu và tối ưu hiệu năng cho các dịch vụ tuyển dụng có tích hợp AI.'],
  ['fullstack-intern', '2512', 'Thực tập sinh Full-stack Developer', 'Mira Digital', 'MD', 'violet', 5000000, 8000000, 'Hà Nội', 'HYBRID', 'NONE', 'INTERNSHIP', 'INTERN', ['ReactJS', 'Express', 'Git'], 'Tham gia phát triển tính năng web dưới sự hướng dẫn của mentor, được đào tạo quy trình Agile và kiểm thử phần mềm.'],
  ['mobile-flutter', '2512', 'Lập trình viên Mobile Flutter', 'Blue Ocean Tech', 'BO', 'cyan', 16000000, 26000000, 'Đà Nẵng', 'REMOTE', '1_2', 'FULL_TIME', 'STAFF', ['Flutter', 'Dart', 'REST API'], 'Phát triển ứng dụng di động đa nền tảng, tích hợp API và đảm bảo chất lượng phát hành trên iOS và Android.'],
  ['general-accountant', '2411', 'Kế toán tổng hợp', 'An Phú Commerce', 'AP', 'orange', 12000000, 18000000, 'Hồ Chí Minh', 'OFFICE', '2_5', 'FULL_TIME', 'STAFF', ['MISA', 'Excel', 'Thuế'], 'Theo dõi sổ sách, đối chiếu công nợ, lập báo cáo tài chính và hỗ trợ quyết toán thuế định kỳ.'],
  ['accounting-intern', '2411', 'Thực tập sinh Kế toán', 'Hải Minh Logistics', 'HM', 'navy', 4000000, 6000000, 'Hải Phòng', 'OFFICE', 'NONE', 'INTERNSHIP', 'INTERN', ['Excel', 'Chứng từ', 'Hóa đơn'], 'Hỗ trợ kiểm tra chứng từ, nhập liệu hóa đơn và sắp xếp hồ sơ kế toán theo hướng dẫn của kế toán trưởng.'],
  ['chief-accountant', '2411', 'Kế toán trưởng', 'Green Foods Việt Nam', 'GF', 'green', 30000000, 45000000, 'Bình Dương', 'OFFICE', 'OVER_5', 'FULL_TIME', 'MANAGER', ['Tài chính', 'Thuế', 'Quản trị'], 'Quản lý bộ phận kế toán, kiểm soát ngân sách và chịu trách nhiệm về tính chính xác của báo cáo tài chính.'],
  ['digital-marketing', '2431', 'Chuyên viên Digital Marketing', 'Lumen Retail', 'LR', 'pink', 13000000, 22000000, 'Hà Nội', 'HYBRID', '1_2', 'FULL_TIME', 'STAFF', ['Google Ads', 'Meta Ads', 'Analytics'], 'Lập kế hoạch và tối ưu các chiến dịch quảng cáo số theo mục tiêu tăng trưởng khách hàng và doanh thu.'],
  ['content-marketing', '2431', 'Content Marketing Executive', 'VietHome', 'VH', 'orange', 10000000, 16000000, 'Đà Nẵng', 'OFFICE', 'NONE', 'FULL_TIME', 'STAFF', ['Content', 'SEO', 'Social Media'], 'Xây dựng nội dung đa kênh, nghiên cứu từ khóa và phối hợp thiết kế triển khai chiến dịch truyền thông.'],
  ['marketing-manager', '2431', 'Marketing Manager', 'Sunrise Education', 'SE', 'red', 28000000, 42000000, 'Hồ Chí Minh', 'HYBRID', 'OVER_5', 'FULL_TIME', 'MANAGER', ['Brand', 'Strategy', 'Leadership'], 'Xây dựng chiến lược thương hiệu, quản lý ngân sách và dẫn dắt đội ngũ marketing thực hiện mục tiêu kinh doanh.'],
  ['business-analyst', '2421', 'Business Analyst', 'FinCore Solutions', 'FC', 'blue', 16000000, 26000000, 'Hà Nội', 'HYBRID', '2_5', 'FULL_TIME', 'STAFF', ['BPMN', 'SRS', 'Agile'], 'Khảo sát nghiệp vụ, mô hình hóa quy trình và chuyển đổi yêu cầu kinh doanh thành tài liệu cho đội phát triển.'],
  ['operations-analyst', '2421', 'Chuyên viên phân tích vận hành', 'GoFast Delivery', 'GD', 'green', 14000000, 23000000, 'Hồ Chí Minh', 'OFFICE', '1_2', 'FULL_TIME', 'STAFF', ['Excel', 'SQL', 'Dashboard'], 'Phân tích dữ liệu vận hành, tìm điểm nghẽn và đề xuất giải pháp nâng cao năng suất giao nhận.'],
  ['project-coordinator', '2421', 'Điều phối dự án chuyển đổi số', 'DigiWorks', 'DW', 'violet', 15000000, 24000000, 'Đà Nẵng', 'HYBRID', '2_5', 'CONTRACT', 'STAFF', ['Project', 'Scrum', 'Reporting'], 'Theo dõi tiến độ dự án, điều phối nguồn lực và tổng hợp báo cáo phục vụ các chương trình chuyển đổi số.'],
  ['customer-service', '4222', 'Nhân viên Chăm sóc khách hàng', 'CarePlus Việt Nam', 'CP', 'cyan', 8000000, 12000000, 'Hồ Chí Minh', 'OFFICE', 'NONE', 'FULL_TIME', 'STAFF', ['Giao tiếp', 'CRM', 'Tư vấn'], 'Tiếp nhận và giải đáp yêu cầu khách hàng qua điện thoại, email và nền tảng trò chuyện trực tuyến.'],
  ['customer-service-remote', '4222', 'Chuyên viên Hỗ trợ khách hàng từ xa', 'Cloud Support Asia', 'CS', 'blue', 10000000, 15000000, 'Toàn quốc', 'REMOTE', '1_2', 'FULL_TIME', 'STAFF', ['English', 'Ticket', 'SaaS'], 'Hỗ trợ người dùng sản phẩm SaaS theo ca, xử lý ticket và phối hợp nhóm kỹ thuật giải quyết sự cố.'],
  ['contact-center-lead', '4222', 'Trưởng nhóm Contact Center', 'Tâm Việt Services', 'TV', 'orange', 18000000, 26000000, 'Hà Nội', 'OFFICE', '2_5', 'FULL_TIME', 'MANAGER', ['Leadership', 'KPI', 'QA'], 'Quản lý ca trực, theo dõi KPI chất lượng và huấn luyện đội ngũ tư vấn viên tại trung tâm liên lạc.'],
]

const requirements = ['Kỹ năng chuyên môn phù hợp với vị trí tuyển dụng.', 'Chủ động, giao tiếp tốt và có tinh thần trách nhiệm.', 'Có khả năng phối hợp nhóm và học hỏi công nghệ, quy trình mới.']
const benefits = ['Thu nhập cạnh tranh và đánh giá hiệu suất định kỳ.', 'Được tham gia bảo hiểm và các chế độ theo quy định.', 'Môi trường làm việc chuyên nghiệp, có cơ hội đào tạo và phát triển.']

module.exports = {
  async up(queryInterface) {
    const now = new Date()
    await queryInterface.bulkInsert(
      'job_categories',
      categories.map((item) => ({ ...item, active: true, created_at: now, updated_at: now })),
      { ignoreDuplicates: true },
    )
    const [rows] = await queryInterface.sequelize.query('SELECT id, code FROM job_categories WHERE code IN (\'2512\', \'2411\', \'2431\', \'2421\', \'4222\')')
    const categoryIds = new Map(rows.map((row) => [row.code, row.id]))
    const deadline = new Date(now)
    deadline.setFullYear(deadline.getFullYear() + 1)

    await queryInterface.bulkDelete('jobs', { source_key: jobs.map((item) => `demo-${item[0]}`) })
    await queryInterface.bulkInsert('jobs', jobs.map((item, index) => ({
      source_key: `demo-${item[0]}`,
      category_id: categoryIds.get(item[1]),
      title: item[2], company: item[3], company_logo: item[4], logo_color: item[5],
      salary_min: item[6], salary_max: item[7], location: item[8], work_mode: item[9],
      experience_level: item[10], employment_type: item[11], position_level: item[12],
      skills: JSON.stringify(item[13]), description: item[14],
      requirements: JSON.stringify(requirements), benefits: JSON.stringify(benefits),
      deadline, published_at: new Date(now.getTime() - index * 6 * 60 * 60 * 1000),
      status: 'ACTIVE', is_public: true, is_hidden: false, created_at: now, updated_at: now,
    })))
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('jobs', { source_key: jobs.map((item) => `demo-${item[0]}`) })
    await queryInterface.bulkDelete('job_categories', { code: categories.map((item) => item.code) })
  },
}
