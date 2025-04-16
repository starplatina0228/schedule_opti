const fs = require('fs');

// 파일 목록
const files = [
  'data-2025-1-1-1.json', // 죽전 전공
  'data-2025-1-2-1.json', // 죽전 교양
  'data-2025-1-1-2.json', // 천안 전공
  'data-2025-1-2-2.json'  // 천안 교양
];

// 시간 파싱 함수
function parseTimeLocation(timeStr) {
  if (!timeStr) return [];
  const times = timeStr.split('<p>');
  return times.map(t => {
    const match = t.match(/([월화수목금토일])(\d+)~(\d+)\((.+?)\)/);
    if (match) {
      return {
        day: match[1],
        start: parseInt(match[2]),
        end: parseInt(match[3]),
        room: match[4]
      };
    }
    return null;
  }).filter(t => t);
}

// 학점 파싱 함수
function parseCredit(creditStr) {
  const match = creditStr.match(/(\d+)\((\d+)\)/);
  return match ? { theory: parseInt(match[1]), practice: parseInt(match[2]) } : { theory: 0, practice: 0 };
}

// HTML 태그 제거 함수
function removeHtmlTags(str) {
  return str.replace(/<[^>]*>/g, ' ').trim();
}

// 전처리 함수
function preprocessData(fileName) {
  try {
    const rawData = JSON.parse(fs.readFileSync(fileName, 'utf8'));

    const processedData = rawData.map(lecture => {
      const orgParts = removeHtmlTags(lecture.tkcrsEcaOrgnm).split(' ');

      // 파일 이름에서 캠퍼스 추정
      const inferredCampus = fileName.includes('-1-1') || fileName.includes('-2-1') ? '죽전' : '천안';
      const campus = lecture.lesnPlcCd
        ? (lecture.lesnPlcCd === '1' ? '죽전' : '천안')
        : inferredCampus;

      return {
        courseName: lecture.subjKnm,
        courseId: lecture.subjId,
        division: lecture.dvclsNb,
        schedule: parseTimeLocation(lecture.buldAndRoomCont),
        isOnline: lecture.cybCoronaTyNm === '원격수업',
        college: orgParts[0] || '',
        department: orgParts[1] || '',
        major: orgParts[2] || '',
        type: lecture.curiCparNm,
        grade: lecture.grade,
        year: lecture.yy,
        semester: lecture.semCd,
        professor: lecture.wkLecrEmpnm,
        credit: parseCredit(lecture.crd),
        campus: campus
      };
    });

    // 출력 파일 이름 생성
    const outputFileName = `processed-${fileName}`;
    fs.writeFileSync(outputFileName, JSON.stringify(processedData, null, 2));
    console.log(`${outputFileName} 전처리 완료!`);
  } catch (error) {
    console.error(`${fileName} 처리 중 에러:`, error.message);
  }
}

// 모든 파일에 대해 전처리 실행
files.forEach(file => preprocessData(file));