<template>
  <div class="app">
    <h1 class="title">단국대 경영공학과 시간표 최적화</h1>

    <!-- 고정된 선택 인터페이스 -->
    <div class="selection-bar">
      <!-- 교양/전공 선택 -->
      <div class="selection-item">
        <label>구분:</label>
        <select v-model="selectedType">
          <option value="" disabled>선택하세요</option>
          <option value="LIBERAL_ARTS">교양</option>
          <option value="MAJOR">전공</option>
        </select>
      </div>

      <!-- 검색 버튼 -->
      <button @click="loadCourses" class="search-button" :disabled="!selectedType">
        검색
      </button>
    </div>

    <!-- 학점 정보 -->
    <div class="credit-info" :class="{ 'credit-warning': totalCredits > 18 }" v-if="courses.length > 0">
      현재 선택된 학점: {{ totalCredits }}/18
    </div>

    <!-- 로딩 중 메시지 -->
    <div v-if="isLoading" class="loading-message">
      데이터를 불러오는 중입니다...
    </div>

    <!-- 데이터 없음 메시지 -->
    <div v-if="!isLoading && courses.length === 0 && searched" class="loading-message error-message">
      데이터가 없습니다. 관리자에게 문의하세요. (데이터 파일에 유효한 데이터가 없음)
    </div>

    <!-- 수업 목록 -->
    <div v-if="!isLoading && courses.length > 0" class="course-section">
      <h2>수강 가능한 과목</h2>
      <div class="course-table">
        <table>
          <thead>
            <tr>
              <th>학년</th>
              <th>이수구분</th>
              <th>교과목번호</th>
              <th>교과목명</th>
              <th>분반</th>
              <th>학점</th>
              <th>교강사</th>
              <th>요일/교시/강의실</th>
              <th>수업방법</th>
              <th>수강조직</th>
              <th>선택</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="course in courses"
              :key="course.id"
              :class="{ 'selected-row': course.selected }"
              @click="toggleSelection(course)"
              style="cursor: pointer;"
            >
              <td>{{ course.grade }}</td>
              <td>{{ course.courseType }}</td>
              <td>{{ course.courseId }}</td>
              <td>{{ course.courseName }}</td>
              <td>{{ course.division }}</td>
              <td>{{ course.credits.theory + course.credits.practice }}</td>
              <td>{{ course.professor }}</td>
              <td>{{ formatSchedule(course.schedule) }}</td>
              <td>{{ course.isOnline ? '온라인' : '오프라인' }}</td>
              <td>{{ course.department }}</td>
              <td>
                <input
                  type="checkbox"
                  v-model="course.selected"
                  @click.stop
                  @change="updateSelection(course)"
                  :disabled="!course.selected && totalCredits + (course.credits.theory + course.credits.practice) > 18"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 선택된 과목 목록 -->
    <div v-if="selectedCourses.length > 0" class="selected-courses">
      <h2>선택한 과목</h2>
      <div v-for="course in selectedCourses" :key="course.id" class="selected-course">
        <div class="course-info">
          <span class="course-name">{{ course.courseName }}</span>
          <span class="course-detail">
            ({{ course.courseType }} | {{ course.credits.theory + course.credits.practice }}학점 | {{ course.professor }} | {{ formatSchedule(course.schedule) }})
          </span>
        </div>
        <div class="weight-select">
          <label>선호도:</label>
          <select v-model="course.weight">
            <option value="1">1 (매우 낮음)</option>
            <option value="2">2 (낮음)</option>
            <option value="3">3 (보통)</option>
            <option value="4">4 (높음)</option>
            <option value="5">5 (매우 높음)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 제출하기 버튼 -->
    <button
      v-if="allSelected && selectedCourses.length > 0"
      @click="submitCourses"
      class="submit-button"
    >
      제출하기
    </button>

    <!-- 시간표 최적화 버튼 -->
    <button
      v-if="selectedCourses.length > 0"
      @click="optimizeSchedule"
      :disabled="totalCredits > 18"
      class="optimize-button"
    >
      시간표 최적화하기
    </button>
  </div>
</template>

<script>
import { fetchTimetableData } from './services/timetable';

export default {
  name: 'App',
  data() {
    return {
      selectedType: '',
      courses: [],
      isLoading: false,
      searched: false,
    };
  },
  computed: {
    selectedCourses() {
      return this.courses.filter((course) => course.selected);
    },
    totalCredits() {
      return this.selectedCourses.reduce((sum, course) => sum + (course.credits.theory + course.credits.practice), 0);
    },
    allSelected() {
      return this.courses.length > 0 && this.courses.every((course) => course.selected);
    },
  },
  methods: {
    async loadCourses() {
      if (!this.selectedType) {
        alert('구분을 선택해주세요.');
        return;
      }
      this.isLoading = true;
      this.searched = true;
      try {
        const { courses } = await fetchTimetableData(
          '천안', // 캠퍼스 고정
          this.selectedType
        );
        this.courses = courses;
        console.log('불러온 데이터:', this.courses);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        this.isLoading = false;
      }
    },
    toggleSelection(course) {
      if (!course.selected && this.totalCredits + (course.credits.theory + course.credits.practice) <= 18) {
        course.selected = !course.selected;
      } else if (course.selected) {
        course.selected = !course.selected;
      }
      this.updateSelection(course);
    },
    updateSelection(course) {
      if (course.selected && this.totalCredits > 18) {
        course.selected = false;
        alert('최대 18학점을 초과할 수 없습니다.');
      }
    },
    formatSchedule(schedule) {
      if (!schedule || schedule.length === 0) return '미정';
      return schedule.map(s => `${s.day} ${s.start}-${s.end}교시 (${s.room})`).join(', ');
    },
    optimizeSchedule() {
      const selectedData = this.selectedCourses.map((course) => ({
        id: course.id,
        courseId: course.courseId,
        courseName: course.courseName,
        schedule: course.schedule,
        credits: course.credits.theory + course.credits.practice,
        weight: course.weight,
      }));
      console.log('최적화할 과목들:', selectedData);
    },
    async submitCourses() {
      const submittedData = this.selectedCourses.map((course) => ({
        id: course.id,
        courseId: course.courseId,
        courseName: course.courseName,
        division: course.division,
        credits: course.credits.theory + course.credits.practice,
        professor: course.professor,
        schedule: course.schedule,
        department: course.department,
        weight: course.weight,
      }));
      try {
        const response = await axios.post('http://localhost:3000/api/submit-courses', submittedData);
        console.log('서버 응답:', response.data);
        alert('과목이 성공적으로 제출되었습니다!');
      } catch (error) {
        console.error('제출 실패:', error);
        alert('제출 중 오류가 발생했습니다.');
      }
    },
  },
};
</script>

<style>
.selection-bar {
  display: flex;
  gap: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.selection-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selection-item label {
  font-weight: bold;
}

.selection-item select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  min-width: 200px;
}

.search-button {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-button:hover {
  background-color: #2980b9;
}

.search-button:disabled {
  background-color: #a8a8a8;
  cursor: not-allowed;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.credit-info {
  text-align: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 10px 0;
  font-weight: bold;
}

.credit-warning {
  background-color: #fff3f3;
  color: red;
}

.loading-message {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 16px;
}

.error-message {
  color: #e74c3c;
  font-weight: bold;
}

.course-section {
  margin-top: 20px;
}

.course-table {
  overflow-x: auto;
  margin-top: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.selected-row {
  background-color: #f0f7f4;
}

.selected-courses {
  margin-top: 30px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.selected-course {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.course-info {
  flex: 1;
}

.course-name {
  font-weight: bold;
  margin-right: 10px;
}

.course-detail {
  color: #666;
  font-size: 0.9em;
}

.weight-select {
  display: flex;
  align-items: center;
  gap: 10px;
}

.optimize-button {
  display: block;
  width: 200px;
  margin: 30px auto;
  padding: 15px 30px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.optimize-button:disabled {
  background-color: #a8a8a8;
  cursor: not-allowed;
}

.submit-button {
  display: block;
  width: 200px;
  margin: 20px auto;
  padding: 15px 30px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: #c0392b;
}

select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>