# Quy ước Sequelize model

Mọi model hiện tại và tạo mới phải tuân theo cùng một cấu trúc:

- Kế thừa `Model` và import `DataTypes`, `Model` trực tiếp từ `sequelize`.
- Khai báo thuộc tính trong `static init(sequelize, opts = {})` và gọi `super.init(...)`.
- Khai báo quan hệ trong `static associate(models)`; không đặt association trong file tổng.
- Mỗi thư mục nghiệp vụ có `index.js` và một hàm `init<Domain>Model(sequelize)` trả về object model.
- `app/db/models/index.js` chỉ tổng hợp các nhóm model và gọi `associate(models)`.
- Trường nhạy cảm phải được loại khỏi `toJSON()` của model tương ứng.

Mẫu tối thiểu:

```js
const { DataTypes, Model } = require('sequelize')

class Example extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      },
      {
        tableName: 'examples',
        modelName: 'Example',
        sequelize,
        ...opts,
      },
    )
  }

  static associate(models) {
    // Khai báo belongsTo, hasOne, hasMany hoặc belongsToMany tại đây.
  }
}

module.exports = Example
```
