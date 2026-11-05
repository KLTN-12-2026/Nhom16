'use strict'

const jobs = [
  ['senior-react', '2512', 'Senior ReactJS Engineer', 'Nexora Technology', 'NX', 'green', 32000000, 48000000, 'Hồ Chí Minh', 'HYBRID', 'OVER_5', 'FULL_TIME', 'STAFF', ['ReactJS', 'TypeScript', 'Next.js', 'Testing'], 'Dẫn dắt phát triển frontend cho nền tảng SaaS, chuẩn hóa kiến trúc component và nâng cao hiệu năng trải nghiệm người dùng.'],
  ['devops-cloud', '2512', 'DevOps / Cloud Engineer', 'Orbit Cloud', 'OC', 'blue', 25000000, 40000000, 'Hà Nội', 'HYBRID', '2_5', 'FULL_TIME', 'STAFF', ['AWS', 'Docker', 'Kubernetes', 'CI/CD'], 'Xây dựng hạ tầng cloud, tự động hóa quy trình triển khai và giám sát độ ổn định của các dịch vụ sản phẩm.'],
  ['qa-automation', '2512', 'QA Automation Engineer', 'Quality First Labs', 'QF', 'violet', 18000000, 30000000, 'Đà Nẵng', 'REMOTE', '1_2', 'FULL_TIME', 'STAFF', ['Playwright', 'API Testing', 'JavaScript'], 'Thiết kế kịch bản kiểm thử tự động cho web và API, phối hợp cùng đội phát triển để đảm bảo chất lượng phát hành.'],
  ['data-engineer', '2512', 'Data Engineer', 'Insight Data Việt Nam', 'ID', 'cyan', 28000000, 45000000, 'Hồ Chí Minh', 'HYBRID', '2_5', 'FULL_TIME', 'STAFF', ['Python', 'SQL', 'Airflow', 'BigQuery'], 'Xây dựng pipeline dữ liệu, mô hình hóa kho dữ liệu và cung cấp dữ liệu tin cậy cho các nhóm phân tích và AI.'],
  ['tax-accountant', '2411', 'Kế toán Thuế', 'Minh Tâm Advisory', 'MT', 'orange', 14000000, 22000000, 'Hà Nội', 'OFFICE', '2_5', 'FULL_TIME', 'STAFF', ['Thuế', 'MISA', 'Excel'], 'Thực hiện kê khai thuế, kiểm tra hóa đơn chứng từ và tư vấn tuân thủ quy định thuế cho doanh nghiệp.'],
  ['payroll-accountant', '2411', 'Kế toán Tiền lương', 'PeopleCare Group', 'PG', 'green', 12000000, 18000000, 'Bình Dương', 'OFFICE', '1_2', 'FULL_TIME', 'STAFF', ['Payroll', 'Excel', 'BHXH'], 'Tính lương, theo dõi bảo hiểm và đối soát các khoản thu nhập, khấu trừ cho nhân sự toàn công ty.'],
  ['finance-controller', '2411', 'Chuyên viên Kiểm soát Tài chính', 'EastBridge Manufacturing', 'EB', 'navy', 22000000, 34000000, 'Đồng Nai', 'OFFICE', '2_5', 'FULL_TIME', 'STAFF', ['Budget', 'Forecast', 'Power BI'], 'Theo dõi ngân sách, phân tích chênh lệch chi phí và xây dựng báo cáo quản trị phục vụ ban điều hành.'],
  ['seo-specialist', '2431', 'SEO Specialist', 'GrowthHub Agency', 'GH', 'green', 14000000, 24000000, 'Đà Nẵng', 'HYBRID', '1_2', 'FULL_TIME', 'STAFF', ['SEO', 'Google Search Console', 'Content'], 'Nghiên cứu từ khóa, tối ưu website và xây dựng kế hoạch nội dung nhằm tăng trưởng lưu lượng tìm kiếm tự nhiên.'],
  ['brand-executive', '2431', 'Brand Marketing Executive', 'Mộc Nhiên Consumer', 'MN', 'pink', 15000000, 23000000, 'Hồ Chí Minh', 'OFFICE', '1_2', 'FULL_TIME', 'STAFF', ['Branding', 'Campaign', 'Research'], 'Triển khai chiến dịch thương hiệu, quản lý tài sản nhận diện và phối hợp đối tác truyền thông theo kế hoạch.'],
  ['performance-lead', '2431', 'Performance Marketing Lead', 'ScaleUp Commerce', 'SC', 'red', 26000000, 38000000, 'Hà Nội', 'HYBRID', '2_5', 'FULL_TIME', 'MANAGER', ['Google Ads', 'Meta Ads', 'GA4', 'Leadership'], 'Lập chiến lược quảng cáo hiệu suất, quản lý ngân sách và dẫn dắt nhóm tối ưu tăng trưởng doanh thu đa kênh.'],
  ['product-owner', '2421', 'Product Owner', 'VietFin Platform', 'VF', 'blue', 28000000, 42000000, 'Hồ Chí Minh', 'HYBRID', '2_5', 'FULL_TIME', 'MANAGER', ['Product', 'Agile', 'Roadmap', 'Analytics'], 'Xây dựng product roadmap, ưu tiên backlog và phối hợp các bên liên quan để phát triển sản phẩm tài chính số.'],
  ['process-improvement', '2421', 'Chuyên viên Cải tiến Quy trình', 'LeanWorks Việt Nam', 'LW', 'orange', 17000000, 27000000, 'Bắc Ninh', 'OFFICE', '2_5', 'FULL_TIME', 'STAFF', ['Lean', 'BPMN', 'Data Analysis'], 'Khảo sát quy trình vận hành, phân tích lãng phí và triển khai sáng kiến cải tiến năng suất trong doanh nghiệp.'],
  ['customer-success', '4222', 'Customer Success Executive', 'SaaS Connect', 'SA', 'violet', 14000000, 22000000, 'Hà Nội', 'REMOTE', '1_2', 'FULL_TIME', 'STAFF', ['Customer Success', 'SaaS', 'English'], 'Đồng hành cùng khách hàng trong quá trình sử dụng sản phẩm, thúc đẩy tỷ lệ kích hoạt, duy trì và gia hạn dịch vụ.'],
  ['bilingual-support', '4222', 'Nhân viên CSKH Song ngữ Anh - Việt', 'Global Assist', 'GA', 'cyan', 12000000, 18000000, 'Đà Nẵng', 'OFFICE', 'NONE', 'FULL_TIME', 'STAFF', ['English', 'Communication', 'CRM'], 'Tiếp nhận yêu cầu khách hàng trong và ngoài nước, tư vấn dịch vụ và xử lý vấn đề qua điện thoại, email, live chat.'],
]

const requirements = [
  'Có kiến thức hoặc kinh nghiệm phù hợp với vị trí ứng tuyển.',
  'Giao tiếp rõ ràng, chủ động và có tinh thần trách nhiệm.',
  'Có khả năng làm việc độc lập và phối hợp hiệu quả trong nhóm.',
]

const benefits = [
  'Mức lương cạnh tranh, thưởng theo kết quả công việc.',
  'Đầy đủ bảo hiểm, nghỉ phép và chế độ phúc lợi theo quy định.',
  'Lộ trình phát triển rõ ràng, được đào tạo chuyên môn định kỳ.',
]

module.exports = {
  async up(queryInterface) {
    const sourceKeys = jobs.map((item) => `demo-more-${item[0]}`)
    const [categories] = await queryInterface.sequelize.query(
      "SELECT id, code FROM job_categories WHERE code IN ('2512', '2411', '2431', '2421', '4222')",
    )
    const categoryIds = new Map(categories.map((category) => [category.code, category.id]))
    const now = new Date()
    const deadline = new Date(now)
    deadline.setMonth(deadline.getMonth() + 3)

    await queryInterface.bulkDelete('jobs', { source_key: sourceKeys })
    await queryInterface.bulkInsert('jobs', jobs.map((item, index) => ({
      source_key: `demo-more-${item[0]}`,
      category_id: categoryIds.get(item[1]),
      title: item[2],
      company: item[3],
      company_logo: item[4],
      logo_color: item[5],
      salary_min: item[6],
      salary_max: item[7],
      location: item[8],
      work_mode: item[9],
      experience_level: item[10],
      employment_type: item[11],
      position_level: item[12],
      skills: JSON.stringify(item[13]),
      description: item[14],
      requirements: JSON.stringify(requirements),
      benefits: JSON.stringify(benefits),
      deadline,
      published_at: new Date(now.getTime() - (index + 1) * 75 * 60 * 1000),
      status: 'ACTIVE',
      is_public: true,
      is_hidden: false,
      created_at: now,
      updated_at: now,
    })))
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('jobs', { source_key: jobs.map((item) => `demo-more-${item[0]}`) })
  },
}
