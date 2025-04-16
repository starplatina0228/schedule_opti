import axios from 'axios';

export async function fetchTimetableData(campus, type) {
  try {
    const response = await axios.get('http://localhost:3000/api/courses', {
      params: { type },
    });
    const { courses } = response.data;

    if (!courses.length) {
      console.warn('DB에서 가져온 데이터가 없습니다.');
      return { courses: [] };
    }

    console.log('DB에서 가져온 데이터:', courses);
    return { courses };
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    return { courses: [] };
  }
}