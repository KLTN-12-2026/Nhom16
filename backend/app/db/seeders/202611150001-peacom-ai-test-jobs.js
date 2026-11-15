'use strict'

const sourceKeys = [
  'peacom-ai-test-frontend',
  'peacom-ai-test-qa',
  'peacom-ai-test-data',
]

const jobs = [
  {
    sourceKey: sourceKeys[0],
    title: 'Frontend Developer ReactJS',
    salaryMin: 14000000,
    salaryMax: 22000000,
    workMode: 'HYBRID',
    experienceLevel: '1_2',
    skills: ['ReactJS', 'TypeScript', 'Redux Saga', 'REST API', 'Git'],
    description: 'Phát triển và duy trì giao diện web tuyển dụng bằng ReactJS và TypeScript. Xây dựng component tái sử dụng, kết nối REST API, quản lý trạng thái với Redux/Redux Saga và phối hợp với Backend, QA để phát hành tính năng ổn định. Tối ưu hiệu năng, khả năng truy cập và trải nghiệm trên desktop lẫn thiết bị di động.',
    requirements: [
      'Có tối thiểu 1 năm kinh nghiệm phát triển Frontend với ReactJS và JavaScript hoặc TypeScript.',
      'Hiểu React hooks, component lifecycle, state management và cách tích hợp REST API.',
      'Biết sử dụng Git, đọc thiết kế UI và xử lý responsive; ưu tiên có kinh nghiệm Redux Saga và kiểm thử giao diện.',
      'Có khả năng phân tích lỗi, giao tiếp rõ ràng và làm việc phối hợp trong nhóm Agile.',
    ],
    benefits: ['Lương tháng 13 và thưởng theo hiệu quả dự án.', 'Làm việc hybrid 2 ngày mỗi tuần và được cấp thiết bị.', 'Được đào tạo React, TypeScript, kiểm thử và lộ trình lên Middle Developer.'],
  },
  {
    sourceKey: sourceKeys[1],
    title: 'QA Automation Engineer',
    salaryMin: 15000000,
    salaryMax: 24000000,
    workMode: 'OFFICE',
    experienceLevel: '1_2',
    skills: ['Playwright', 'API Testing', 'JavaScript', 'Postman', 'SQL'],
    description: 'Thiết kế kế hoạch kiểm thử và phát triển bộ kiểm thử tự động cho hệ thống web tuyển dụng. Xây dựng kịch bản Playwright, kiểm thử REST API bằng Postman, xác minh dữ liệu MySQL và theo dõi lỗi xuyên suốt vòng đời phát triển. Phối hợp với lập trình viên để phân tích nguyên nhân và ngăn lỗi hồi quy.',
    requirements: [
      'Có ít nhất 1 năm kinh nghiệm kiểm thử phần mềm web, hiểu quy trình kiểm thử chức năng và hồi quy.',
      'Có khả năng viết automation test bằng Playwright hoặc công cụ tương đương với JavaScript hoặc TypeScript.',
      'Biết kiểm thử REST API, sử dụng Postman và truy vấn SQL cơ bản để đối chiếu dữ liệu.',
      'Có tư duy chi tiết, biết lập báo cáo lỗi rõ ràng và chủ động trao đổi với đội phát triển.',
    ],
    benefits: ['Thưởng chất lượng theo mỗi đợt phát hành.', 'Ngân sách học chứng chỉ kiểm thử và automation.', 'Môi trường Agile, review kỹ thuật và lộ trình phát triển QA Lead.'],
  },
  {
    sourceKey: sourceKeys[2],
    title: 'Data Analyst Tuyển dụng',
    salaryMin: 16000000,
    salaryMax: 26000000,
    workMode: 'HYBRID',
    experienceLevel: '1_2',
    skills: ['SQL', 'Power BI', 'Excel', 'Data Visualization', 'Python'],
    description: 'Phân tích dữ liệu tuyển dụng, hành vi ứng viên và hiệu quả tin đăng để hỗ trợ quyết định sản phẩm. Xây dựng truy vấn SQL, dashboard Power BI và báo cáo định kỳ; kiểm tra chất lượng dữ liệu, định nghĩa chỉ số chuyển đổi và trình bày insight cho bộ phận vận hành cùng ban lãnh đạo.',
    requirements: [
      'Tốt nghiệp chuyên ngành Hệ thống thông tin, Kinh tế, Thống kê hoặc lĩnh vực liên quan.',
      'Có ít nhất 1 năm kinh nghiệm phân tích dữ liệu và sử dụng SQL trong công việc thực tế.',
      'Thành thạo Excel và một công cụ trực quan hóa như Power BI; ưu tiên biết Python để xử lý dữ liệu.',
      'Có khả năng kiểm tra độ tin cậy dữ liệu, diễn giải kết quả và trình bày insight bằng tiếng Việt rõ ràng.',
    ],
    benefits: ['Thưởng theo hiệu quả phân tích và sáng kiến dữ liệu.', 'Được tiếp cận dữ liệu sản phẩm thực tế và cố vấn chuyên môn.', 'Làm việc hybrid, bảo hiểm đầy đủ và 14 ngày phép mỗi năm.'],
  },
]

module.exports = {
  async up(queryInterface) {
    const [profiles] = await queryInterface.sequelize.query(
      "SELECT id, user_id, company_name FROM employer_profiles WHERE company_name = 'Peacom' ORDER BY id LIMIT 1",
    )
    if (!profiles.length) throw new Error('Không tìm thấy hồ sơ doanh nghiệp Peacom để tạo JD test AI.')

    const [categories] = await queryInterface.sequelize.query(
      "SELECT id FROM job_categories WHERE code = '2512' ORDER BY id LIMIT 1",
    )
    if (!categories.length) throw new Error('Không tìm thấy ngành Công nghệ thông tin (2512).')

    const profile = profiles[0]
    const now = new Date()
    const deadline = new Date(now)
    deadline.setMonth(deadline.getMonth() + 2)

    await queryInterface.bulkDelete('jobs', { source_key: sourceKeys })
    await queryInterface.bulkInsert('jobs', jobs.map((job, index) => ({
      source_key: job.sourceKey,
      category_id: categories[0].id,
      employer_profile_id: profile.id,
      created_by_id: profile.user_id,
      title: job.title,
      company: profile.company_name,
      company_logo: 'PE',
      logo_color: index === 0 ? 'green' : index === 1 ? 'violet' : 'blue',
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      location: 'Đà Nẵng',
      work_mode: job.workMode,
      experience_level: job.experienceLevel,
      employment_type: 'FULL_TIME',
      position_level: 'STAFF',
      description: job.description,
      requirements: JSON.stringify(job.requirements),
      benefits: JSON.stringify(job.benefits),
      skills: JSON.stringify(job.skills),
      deadline,
      published_at: new Date(now.getTime() - index * 3600000),
      status: 'ACTIVE',
      is_public: true,
      is_hidden: false,
      created_at: now,
      updated_at: now,
    })))
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('jobs', { source_key: sourceKeys })
  },
}
