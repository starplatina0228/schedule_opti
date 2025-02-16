<template>
  <div class="app">
    <h1 class="title">시간표 최적화</h1>

    <div class="credit-info" :class="{ 'credit-warning': totalCredits > 18 }">
      현재 선택된 학점: {{ totalCredits }}/18
    </div>

    <!-- 초기 화면: 과목 선택 버튼 -->
    <div v-if="!showCourses" class="center-content">
      <button @click="toggleCourses" class="main-button">수업 선택하기</button>
    </div>

    <!-- 과목 목록 -->
    <div v-if="showCourses" class="course-section">
      <div class="section-header">
        <h2>수강 가능한 과목</h2>
        <button @click="toggleCourses" class="close-button">접기</button>
      </div>

      <div class="course-table">
        <table>
          <thead>
            <tr>
              <th>학년</th>
              <th>이수구분</th>
              <th>교과목번호</th>
              <th>교과목명</th>
              <th>분반</th>
              <th>원어</th>
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
            >
              <td>{{ course.year }}</td>
              <td>{{ course.courseType }}</td>
              <td>{{ course.courseNumber }}</td>
              <td>{{ course.courseName }}</td>
              <td>{{ course.division }}</td>
              <td>{{ course.language }}</td>
              <td>{{ course.credits }}</td>
              <td>{{ course.professor }}</td>
              <td>{{ course.schedule }}</td>
              <td>{{ course.teachingMethod }}</td>
              <td>{{ course.department }}</td>
              <td>
                <input
                  type="checkbox"
                  v-model="course.selected"
                  @change="updateSelection(course)"
                  :disabled="
                    !course.selected && totalCredits + course.credits > 18
                  "
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
      <div
        v-for="course in selectedCourses"
        :key="course.id"
        class="selected-course"
      >
        <div class="course-info">
          <span class="course-name">{{ course.courseName }}</span>
          <span class="course-detail">
            ({{ course.courseType }} | {{ course.credits }}학점 |
            {{ course.professor }} | {{ course.schedule }})
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
export default {
  name: "App",
  data() {
    return {
      showCourses: false,
      courses: [
        {
          id: 1,
          year: 1,
          courseType: "공학기초",
          courseNumber: "557580",
          courseName: "4차산업혁명과인공지능",
          division: "02",
          language: "한국어",
          credits: 3,
          professor: "장영철",
          schedule: "화2~7(공학406-01)",
          teachingMethod: "대면",
          classType: "",
          department: "과학기술대학 경영공학과",
          selected: false,
          weight: 3,
        },
        {
          id: 2,
          year: 2,
          courseType: "전공기초",
          courseNumber: "311200",
          courseName: "공업수학1",
          division: "03",
          language: "한국어",
          credits: 3,
          professor: "정현수",
          schedule: "목9~14(공학513)",
          teachingMethod: "대면",
          classType: "",
          department: "과학기술대학 경영공학과",
          selected: false,
          weight: 3,
        },
        {
          id: 3,
          year: 2,
          courseType: "전공필수",
          courseNumber: "301110",
          courseName: "OR",
          division: "01",
          language: "한국어",
          credits: 3,
          professor: "조성원",
          schedule: "화9~11(공학308)\n수9~11(공학308)",
          teachingMethod: "대면",
          classType: "",
          department: "과학기술대학 경영공학과",
          selected: false,
          weight: 3,
        },
        {
          id: 4,
          year: 4,
          courseType: "전공필수",
          courseNumber: "534520",
          courseName: "경영공학종합설계",
          division: "02",
          language: "한국어",
          credits: 2,
          professor: "조성원",
          schedule: "목12~15(공학308)",
          teachingMethod: "대면",
          classType: "",
          department: "과학기술대학 경영공학과",
          selected: false,
          weight: 3,
        },
        {
          id: 5,
          year: 3,
          courseType: "전공선택",
          courseNumber: "405580",
          courseName: "제조공학",
          division: "01",
          language: "한국어",
          credits: 3,
          professor: "임아론",
          schedule: "목10~15(공학310-01)",
          teachingMethod: "대면",
          classType: "",
          department: "과학기술대학 경영공학과",
          selected: false,
          weight: 3,
        },
        {
          id: 6,
          year: 4,
          courseType: "전공선택",
          courseNumber: "561320",
          courseName: "컴퓨터비전",
          division: "01",
          language: "한국어",
          credits: 2,
          professor: "임아론",
          schedule: "수9~12(공학406-01)",
          teachingMethod: "대면",
          classType: "",
          department: "과학기술대학 경영공학과",
          selected: false,
          weight: 3,
        },
        {
          id: 7,
          year: 4,
          courseType: "전공선택",
          courseNumber: "421810",
          courseName: "투자론",
          division: "05",
          language: "한국어",
          credits: 3,
          professor: "한종수",
          schedule: "화9~11(공학305)\n수2~4(공학305)",
          teachingMethod: "대면",
          classType: "",
          department: "과학기술대학 경영공학과",
          selected: false,
          weight: 3,
        },
        {
          id: 8,
          year: 4,
          courseType: "전공선택",
          courseNumber: "534230",
          courseName: "회계공학",
          division: "01",
          language: "한국어",
          credits: 3,
          professor: "",
          schedule: "목2~7(공학308)",
          teachingMethod: "대면",
          classType: "",
          department: "과학기술대학 경영공학과",
          selected: false,
          weight: 3,
        },
      ],
    };
  },
  computed: {
    selectedCourses() {
      return this.courses.filter((course) => course.selected);
    },
    totalCredits() {
      return this.selectedCourses.reduce(
        (sum, course) => sum + course.credits,
        0
      );
    },
  },
  methods: {
    toggleCourses() {
      this.showCourses = !this.showCourses;
    },
    updateSelection(course) {
      if (course.selected && this.totalCredits > 18) {
        course.selected = false;
        alert("최대 18학점을 초과할 수 없습니다.");
        return;
      }
    },
    optimizeSchedule() {
      const selectedData = this.selectedCourses.map((course) => ({
        id: course.id,
        courseNumber: course.courseNumber,
        courseName: course.courseName,
        schedule: course.schedule,
        credits: course.credits,
        weight: course.weight,
      }));

      console.log("최적화할 과목들:", selectedData);
    },
  },
};
</script>

<style>
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

.center-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.main-button {
  padding: 20px 40px;
  font-size: 24px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.main-button:hover {
  background-color: #3aa876;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-button {
  padding: 8px 16px;
  background-color: #666;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.course-section {
  margin-top: 20px;
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

select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
