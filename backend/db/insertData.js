const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'seung',
  host: 'localhost',
  database: 'schedule_db',
  password: 'seung_password',
  port: 5432,
});

async function insertData() {
  try {
    // JSON 파일 경로 설정
    const liberalArtsFilePath = path.join(__dirname, 'public', 'data', 'processed-data-2025-1-2-2.json');
    const majorFilePath = path.join(__dirname, 'public', 'data', 'processed-data-2025-1-1-2.json');

    // JSON 파일 존재 여부 확인
    if (!fs.existsSync(liberalArtsFilePath)) {
      throw new Error(`교양 데이터 파일이 존재하지 않습니다: ${liberalArtsFilePath}`);
    }
    if (!fs.existsSync(majorFilePath)) {
      throw new Error(`전공 데이터 파일이 존재하지 않습니다: ${majorFilePath}`);
    }

    // JSON 파일 읽기
    const liberalArtsData = JSON.parse(fs.readFileSync(liberalArtsFilePath, 'utf8'));
    const majorData = JSON.parse(fs.readFileSync(majorFilePath, 'utf8'));

    console.log(`교양 데이터 개수: ${liberalArtsData.length}`);
    console.log(`전공 데이터 개수: ${majorData.length}`);

    const allData = [...liberalArtsData, ...majorData];
    console.log(`총 데이터 개수: ${allData.length}`);

    // 데이터베이스 연결 테스트
    const client = await pool.connect();
    console.log('데이터베이스에 성공적으로 연결되었습니다.');
    client.release();

    let insertedCourses = 0;
    let insertedSchedules = 0;

    for (const course of allData) {
      if (!course || !course.courseId || !course.courseName) { // subjId, subjKnm 대신 courseId, courseName 사용
        console.warn('유효하지 않은 데이터:', course);
        continue;
      }

      const [parsedCollege, parsedDepartment] = (course.department ? `${course.college} ${course.department}` : '미지정 미지정').split(' ').map(part => part || '미지정');
      const credits = course.credit || { theory: 0, practice: 0 };
      const isOnline = course.isOnline || false;

      const courseQuery = `
        INSERT INTO Courses (year, semester, campus, college, department, course_type, course_id, course_name, division, credits_theory, credits_practice, professor, is_online, grade)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `;
      const courseValues = [
        course.year || '2025',
        course.semester || '1',
        course.campus || '천안',
        parsedCollege,
        parsedDepartment,
        course.type || '미지정',
        course.courseId, // courseId 사용
        course.courseName, // courseName 사용
        course.division || 1,
        credits.theory || 0,
        credits.practice || 0,
        course.professor || '미지정',
        isOnline,
        course.grade || 1,
      ];

      const courseResult = await pool.query(courseQuery, courseValues);
      const courseId = courseResult.rows[0].id;
      insertedCourses++;

      const scheduleParts = course.schedule || [];
      for (const part of scheduleParts) {
        if (part.day && part.start && part.end && part.room) {
          const scheduleQuery = `
            INSERT INTO Schedules (course_id, day, start_time, end_time, room)
            VALUES ($1, $2, $3, $4, $5)
          `;
          const scheduleValues = [
            courseId,
            part.day,
            part.start,
            part.end,
            part.room,
          ];
          await pool.query(scheduleQuery, scheduleValues);
          insertedSchedules++;
        }
      }
    }

    console.log(`삽입된 Courses 레코드 수: ${insertedCourses}`);
    console.log(`삽입된 Schedules 레코드 수: ${insertedSchedules}`);
    console.log('데이터 삽입 완료');
  } catch (error) {
    console.error('데이터 삽입 오류:', error.message);
    if (error.code === 'ENOENT') {
      console.error('JSON 파일 경로를 확인하세요.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('PostgreSQL 서버가 실행 중인지 확인하세요. (brew services start postgresql@14)');
    } else if (error.code === '3D000') {
      console.error('데이터베이스 schedule_db가 존재하지 않습니다. PostgreSQL에서 CREATE DATABASE schedule_db;를 실행하세요.');
    }
  } finally {
    await pool.end();
  }
}

insertData();