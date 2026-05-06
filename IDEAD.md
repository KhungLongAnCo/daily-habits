---

# 1. Dashboard (Trang tổng quan)

Đây là trang đầu tiên khi user login.

### Hiển thị

- Tháng hiện tại
- Năm
- Tuần hiện tại
- % tiến độ tháng
- biểu đồ tiến độ theo tuần

### Function

- Tự động tính progress
- Hiển thị chart
- Quick stats

### Data cần

```ts
{
  month: 9,
  year: 2025,
  currentWeek: 4,
  progress: 82
}
```

### Logic

```
progress = completedGoals / totalGoals
```

---

# 2. Monthly Goals (Goal Tracking)

### Chức năng

User có thể tạo goal cho tháng.

Ví dụ:

```
- Hoàn thành 4 video youtube
- Học xong khóa TA
- Đọc 1 cuốn sách
- Tiết kiệm 20 triệu
```

### Function

Create Goal

```
POST /goals
```

Edit Goal

```
PATCH /goals/:id
```

Delete Goal

```
DELETE /goals/:id
```

Update status

```
pending
in_progress
completed
```

### Data model

```ts
Goal {
 id
 title
 type: priority | regular
 status
 createdAt
}
```

---

# 3. Habit Tracker (Core feature)

Đây là phần **quan trọng nhất của hệ thống**.

User track habit mỗi ngày.

Ví dụ:

```
Dậy 5h sáng
Đọc sách
Viết 1000 chữ
Workout
Thiền
```

### UI

Bảng:

```
habit | 1 | 2 | 3 | ... | 31
```

tick checkbox mỗi ngày.

---

### Function

Create Habit

```
POST /habits
```

Check Habit

```
POST /habit-check
```

Update Habit

```
PATCH /habits/:id
```

Delete Habit

```
DELETE /habits/:id
```

---

### Data model

Habit

```ts
Habit {
 id
 name
 userId
 createdAt
}
```

Habit Log

```ts
HabitLog {
 id
 habitId
 date
 completed: boolean
}
```

---

### Logic tính %

Ví dụ:

```
completed days / total days
```

---

# 4. Habit Statistics

Biểu đồ bên phải.

### Function

Calculate:

- completion rate
- longest streak
- current streak

### Example

```
Dậy 5h: 97%
Đọc sách: 68%
Workout: 65%
```

---

### Data query

```
SELECT COUNT(completed)
FROM habit_logs
WHERE habitId = X
```

---

# 5. Weekly Progress Chart

Biểu đồ trên cùng.

### Function

Hiển thị:

```
Week 1: 75%
Week 2: 50%
Week 3: 50%
Week 4: 80%
```

### Logic

```
week_progress =
 completed_habits /
 total_habits
```

---

# 6. Reflection / Monthly Review

Phần bên phải.

User viết reflection.

### Examples

```
Điều gì làm tốt?
Bài học rút ra?
Mục tiêu tháng sau?
```

---

### Function

Create reflection

```
POST /reflections
```

Edit reflection

```
PATCH /reflections/:id
```

---

### Data model

```ts
Reflection {
 id
 month
 year
 question
 answer
}
```

---

# 7. Weekly Tasks / Week Goals

Phần dưới (ảnh bị cắt nhưng thấy).

### Function

User set task theo tuần.

Ví dụ:

```
Week 1
- quay 1 video
- đọc sách

Week 2
- học react
```

---

### Data model

```ts
Task {
 id
 title
 week
 status
}
```

---

# 8. Progress Calculation Engine

Website cần service tính toán.

### Monthly Progress

```
completedGoals / totalGoals
```

### Habit Progress

```
checkedDays / totalDays
```

### Weekly Progress

```
weeklyCompleted / weeklyTotal
```

---

# 9. User System

Basic auth.

### Function

Register

Login

Logout

Profile

---

### Data model

```ts
User {
 id
 email
 password
 name
}
```

---

# 10. Nice UX Features (nên có)

### 1. Streak System

Ví dụ

```
🔥 10 day streak
```

### 2. Reminder

Email / notification

```
Bạn chưa check habit hôm nay
```

---

### 3. Dark mode

---

### 4. Export

Export PDF / CSV.

---

# 11. Tech stack phù hợp

Vì bạn là FE dev.

### Frontend

```
Next.js
Tailwind
Shadcn UI
Recharts (chart)
```

---

### Backend

Option 1

```
Next.js API
Prisma
PostgreSQL
```

Option 2

```
Node.js
Express
MongoDB
```

---

### Database schema đơn giản

```
users
goals
habits
habit_logs
tasks
reflections
```

---

# 12. Kiến trúc hệ thống

```
Frontend (Next.js)
       |
       |
API Layer
       |
       |
Database
```

---

# 13. Version nâng cấp (rất hay)

Nếu làm **SaaS startup**:

### AI features

AI review tháng:

```
AI phân tích habit của bạn
```

Ví dụ:

> Bạn workout 65% tháng này. Hãy cố duy trì 4 buổi / tuần.

---

# 14. Market của idea này

Website dạng này giống:

- Habitica
- Loop Habit Tracker
- Notion habit tracker

Nhưng nếu làm tốt UI sẽ rất viral.
