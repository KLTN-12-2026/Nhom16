// Từ điển khái niệm dùng để so khớp CV với JD mà không cần gọi AI.
// Mọi alias viết thường, không dấu (so khớp qua normalizedKey, theo ranh giới từ).
// Tránh alias quá ngắn/đa nghĩa (vd "c", "r", "go", "net") vì dễ khớp nhầm.

// Khái niệm cụ thể: tên công nghệ / kỹ năng → các cách viết khác nhau.
const technicalAliases = {
  // Ngôn ngữ lập trình
  javascript: ['javascript', 'js', 'ecmascript', 'es6'],
  typescript: ['typescript', 'ts'],
  python: ['python', 'python3'],
  java: ['java', 'core java', 'java core'],
  csharp: ['c#', 'csharp', 'c sharp'],
  cpp: ['c++', 'cpp'],
  php: ['php'],
  golang: ['golang'],
  rust: ['rust'],
  kotlin: ['kotlin'],
  swift: ['swift'],
  ruby: ['ruby'],
  dart: ['dart'],
  scala: ['scala'],
  sql: ['sql', 't sql', 'tsql', 'pl sql', 'plsql'],
  shell: ['bash', 'shell script', 'shell scripting'],

  // Frontend
  react: ['react', 'reactjs', 'react.js'],
  vue: ['vue', 'vuejs', 'vue.js', 'vue 3'],
  angular: ['angular', 'angularjs'],
  nextjs: ['next js', 'nextjs', 'next.js'],
  nuxt: ['nuxt', 'nuxtjs'],
  svelte: ['svelte', 'sveltekit'],
  html: ['html', 'html5'],
  css: ['css', 'css3', 'scss', 'sass', 'less'],
  tailwind: ['tailwind', 'tailwindcss', 'tailwind css'],
  bootstrap: ['bootstrap'],
  redux: ['redux', 'redux toolkit', 'redux saga'],
  jquery: ['jquery'],
  vite: ['vite'],
  webpack: ['webpack'],

  // Backend
  'node js': ['node js', 'nodejs', 'node.js', 'node'],
  express: ['express', 'expressjs', 'express.js'],
  nestjs: ['nestjs', 'nest js', 'nest.js'],
  spring: ['spring', 'spring boot', 'springboot', 'spring mvc'],
  django: ['django'],
  flask: ['flask'],
  fastapi: ['fastapi', 'fast api'],
  laravel: ['laravel'],
  rails: ['rails', 'ruby on rails'],
  dotnet: ['dotnet', 'asp net', 'net core', 'net framework', 'aspnet'],
  'rest api': ['rest api', 'restful api', 'restful web service', 'restful web services', 'rest', 'restful'],
  graphql: ['graphql'],
  grpc: ['grpc'],
  websocket: ['websocket', 'web socket', 'socket io', 'socket.io'],
  microservices: ['microservice', 'microservices', 'micro service', 'vi dich vu'],
  jwt: ['jwt', 'json web token'],
  oauth: ['oauth', 'oauth2', 'oauth 2', 'openid', 'sso'],

  // Cơ sở dữ liệu / ORM / hàng đợi
  mysql: ['mysql', 'my sql'],
  postgresql: ['postgresql', 'postgres', 'psql'],
  sqlserver: ['sql server', 'sqlserver', 'mssql', 'ms sql', 'microsoft sql server'],
  oracle: ['oracle', 'oracle db', 'oracle database'],
  mongodb: ['mongodb', 'mongo', 'mongo db'],
  redis: ['redis'],
  sqlite: ['sqlite'],
  mariadb: ['mariadb', 'maria db'],
  cassandra: ['cassandra'],
  dynamodb: ['dynamodb', 'dynamo db'],
  firebase: ['firebase', 'firestore'],
  elasticsearch: ['elasticsearch', 'elastic search', 'opensearch'],
  sequelize: ['sequelize'],
  prisma: ['prisma'],
  typeorm: ['typeorm', 'type orm'],
  hibernate: ['hibernate', 'jpa'],
  mongoose: ['mongoose'],
  bullmq: ['bullmq', 'bull mq'],
  rabbitmq: ['rabbitmq', 'rabbit mq'],
  kafka: ['kafka', 'apache kafka'],

  // Cloud / DevOps
  aws: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  azure: ['azure', 'microsoft azure'],
  gcp: ['gcp', 'google cloud', 'google cloud platform'],
  docker: ['docker', 'docker compose', 'dockerfile'],
  kubernetes: ['kubernetes', 'k8s'],
  git: ['git', 'github', 'gitlab', 'bitbucket'],
  'ci cd': ['ci cd', 'cicd', 'ci/cd', 'github actions', 'jenkins', 'gitlab ci'],
  nginx: ['nginx'],
  linux: ['linux', 'ubuntu', 'centos', 'debian'],
  terraform: ['terraform'],
  ansible: ['ansible'],

  // Kiểm thử
  jest: ['jest'],
  mocha: ['mocha', 'chai'],
  cypress: ['cypress'],
  selenium: ['selenium'],
  junit: ['junit'],
  postman: ['postman', 'swagger', 'openapi'],
  'unit test': ['unit test', 'unit testing', 'unittest', 'kiem thu don vi'],

  // Dữ liệu / AI
  pandas: ['pandas'],
  numpy: ['numpy'],
  tensorflow: ['tensorflow', 'keras'],
  pytorch: ['pytorch'],
  scikit: ['scikit learn', 'scikit', 'sklearn'],
  'machine learning': ['machine learning', 'hoc may', 'ml'],
  'deep learning': ['deep learning', 'hoc sau'],
  nlp: ['nlp', 'natural language processing', 'xu ly ngon ngu tu nhien'],
  llm: ['llm', 'large language model', 'gpt', 'chatgpt', 'ollama', 'langchain'],
  'power bi': ['power bi', 'powerbi'],
  tableau: ['tableau'],
  excel: ['excel', 'microsoft excel', 'google sheets'],
  spark: ['spark', 'pyspark', 'apache spark'],
  hadoop: ['hadoop'],
  airflow: ['airflow', 'apache airflow'],
  etl: ['etl', 'elt', 'data pipeline'],

  // Di động
  android: ['android'],
  ios: ['ios'],
  'react native': ['react native', 'reactnative'],
  flutter: ['flutter'],

  // Công cụ / phương pháp
  jira: ['jira', 'confluence'],
  figma: ['figma'],
  agile: ['agile', 'scrum', 'kanban'],
  oop: ['oop', 'lap trinh huong doi tuong', 'object oriented', 'object oriented programming'],
  'design pattern': ['design pattern', 'design patterns', 'mau thiet ke'],
  'data structure': ['cau truc du lieu', 'data structure', 'data structures', 'giai thuat', 'algorithm', 'algorithms'],
  uml: ['uml', 'sequence diagram', 'class diagram'],

  // Ngoại ngữ & kỹ năng mềm
  english: ['tieng anh', 'english', 'toeic', 'ielts', 'toefl'],
  teamwork: ['lam viec nhom', 'teamwork', 'team work', 'lam viec doi nhom'],
  communication: ['giao tiep', 'communication', 'ky nang giao tiep'],
  'problem solving': ['giai quyet van de', 'problem solving', 'tu duy logic', 'tu duy phan tich'],
  'time management': ['quan ly thoi gian', 'time management'],
}

// Khái niệm chung (nhóm): một yêu cầu như "hệ quản trị CSDL" được thỏa mãn
// nếu CV nhắc tới bất kỳ thành viên nào, hoặc chính cụm từ chung đó.
const conceptGroups = {
  database: {
    terms: ['csdl', 'co so du lieu', 'he quan tri csdl', 'he quan tri co so du lieu', 'he csdl', 'database', 'databases', 'dbms', 'rdbms', 'sql nosql'],
    members: ['mysql', 'postgresql', 'sqlserver', 'oracle', 'mongodb', 'sqlite', 'mariadb', 'cassandra', 'dynamodb', 'firebase', 'redis', 'sql'],
  },
  'relational database': {
    terms: ['co so du lieu quan he', 'csdl quan he', 'relational database', 'sql database', 'rdbms'],
    members: ['mysql', 'postgresql', 'sqlserver', 'oracle', 'sqlite', 'mariadb', 'sql'],
  },
  nosql: {
    terms: ['nosql', 'no sql', 'co so du lieu phi quan he', 'csdl phi quan he'],
    members: ['mongodb', 'redis', 'cassandra', 'dynamodb', 'firebase'],
  },
  'programming language': {
    terms: ['ngon ngu lap trinh', 'programming language', 'programming languages'],
    members: ['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'php', 'golang', 'rust', 'kotlin', 'swift', 'ruby', 'dart', 'scala'],
  },
  'frontend framework': {
    terms: ['frontend framework', 'front end framework', 'framework frontend', 'framework front end', 'thu vien frontend', 'frontend library'],
    members: ['react', 'vue', 'angular', 'nextjs', 'nuxt', 'svelte'],
  },
  'backend framework': {
    terms: ['backend framework', 'back end framework', 'framework backend', 'framework back end', 'web framework'],
    members: ['node js', 'express', 'nestjs', 'spring', 'django', 'flask', 'fastapi', 'laravel', 'rails', 'dotnet'],
  },
  cloud: {
    terms: ['cloud', 'cloud computing', 'dien toan dam may', 'nen tang dam may'],
    members: ['aws', 'azure', 'gcp'],
  },
  container: {
    terms: ['container', 'containerization', 'dong goi ung dung'],
    members: ['docker', 'kubernetes'],
  },
  'version control': {
    terms: ['version control', 'quan ly phien ban', 'quan ly ma nguon', 'source control'],
    members: ['git'],
  },
  orm: {
    terms: ['orm', 'object relational mapping'],
    members: ['sequelize', 'prisma', 'typeorm', 'hibernate', 'mongoose'],
  },
  'message queue': {
    terms: ['message queue', 'message broker', 'hang doi', 'job queue', 'queue'],
    members: ['bullmq', 'rabbitmq', 'kafka'],
  },
  testing: {
    terms: ['testing', 'kiem thu', 'automation test', 'kiem thu tu dong', 'test framework'],
    members: ['jest', 'mocha', 'cypress', 'selenium', 'junit', 'unit test', 'postman'],
  },
  ai: {
    terms: ['ai', 'tri tue nhan tao', 'artificial intelligence'],
    members: ['machine learning', 'deep learning', 'nlp', 'llm', 'tensorflow', 'pytorch', 'scikit'],
  },
  mobile: {
    terms: ['mobile', 'mobile app', 'lap trinh di dong', 'phat trien di dong', 'ung dung di dong'],
    members: ['android', 'ios', 'react native', 'flutter', 'kotlin', 'swift'],
  },
  authentication: {
    terms: ['authentication', 'authorization', 'xac thuc', 'phan quyen'],
    members: ['jwt', 'oauth'],
  },
  'data analysis': {
    terms: ['phan tich du lieu', 'data analysis', 'data analytics', 'bao cao du lieu'],
    members: ['pandas', 'excel', 'power bi', 'tableau', 'sql'],
  },
  'big data': {
    terms: ['big data', 'du lieu lon'],
    members: ['spark', 'hadoop', 'kafka', 'airflow'],
  },
}

module.exports = { technicalAliases, conceptGroups }
