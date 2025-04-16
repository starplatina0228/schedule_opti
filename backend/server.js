const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// PostgreSQL 연결 설정
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'schedule_db',
  password: 'your_password',
  port: 5432,
});

app.use(express.json());

// 교양/전공별 과목 조회 API
app.get('/api/courses', async (req, res) => {
  const { type } = req.query; // 예: LIBERAL_ARTS 또는 MAJOR
  try {
    let query = `
      SELECT c.*, s.day, s.start_time, s.end_time, s.room
      FROM courses c
      LEFT JOIN schedules s ON c.course_id = s.course_id
    `;
    if (type === 'MAJOR') {
      query += ` WHERE c.department = '경영공학과' AND c.course_type = '전공'`;
    } else if (type === 'LIBERAL_ARTS') {
      query += ` WHERE c.course_type = '교양'`;
    }

    const result = await pool.query(query);
    const courses = result.rows.reduce((acc, row) => {
      const course = acc.find(c => c.id === row.id);
      const schedule = row.day ? {
        day: row.day,
        start: row.start_time,
        end: row.end_time,
        room: row.room,
      } : null;

      if (!course) {
        acc.push({
          id: row.id,
          year: row.year,
          semester: row.semester,
          campus: row.campus,
          courseType: row.course_type,
          courseId: row.course_id,
          courseName: row.course_name,
          division: row.division,
          credits: { theory: row.credits_theory, practice: row.credits_practice },
          professor: row.professor,
          isOnline: row.is_online,
          grade: row.grade,
          department: row.department,
          schedule: schedule ? [schedule] : [],
          selected: false,
          weight: 3,
        });
      } else if (schedule) {
        course.schedule.push(schedule);
      }
      return acc;
    }, []);

    res.json({ courses });
  } catch (error) {
    console.error('DB 조회 오류:', error);
    res.status(500).json({ error: '데이터 조회 실패' });
  }
});

// 선택된 과목 전송 API
app.post('/api/submit-courses', async (req, res) => {
  const selectedCourses = req.body; // 프론트에서 보낸 데이터
  console.log('전송된 과목:', selectedCourses);
  // 여기서 DB에 저장하거나 최적화 로직으로 전달 가능
  res.json({ message: '과목이 성공적으로 전송되었습니다!' });
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});