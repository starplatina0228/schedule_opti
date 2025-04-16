const axios = require('axios');
const fs = require('fs');

// 여러 조합 가져오기
async function getAllTimetables() {
  // 가져올 조합들
  const payloads = [
    { yy: 2025, semCd: 1, qrySxn: 1, lesnPlcCd: 1 }, // 죽전 전공
    { yy: 2025, semCd: 1, qrySxn: 2, lesnPlcCd: 1 }, // 죽전 교양
    { yy: 2025, semCd: 1, qrySxn: 1, lesnPlcCd: 2 }, // 천안 전공
    { yy: 2025, semCd: 1, qrySxn: 2, lesnPlcCd: 2 }, // 천안 교양
  ];

  for (const payload of payloads) {
    try {
      const response = await axios.post(
        'https://webinfo.dankook.ac.kr/tiac/univ/lssn/lpci/views/lssnPopup/tmtbl.do',
        `yy=${payload.yy}&semCd=${payload.semCd}&qrySxn=${payload.qrySxn}&lesnPlcCd=${payload.lesnPlcCd}&curiCparCd=&mjSubjKnm=&mjDowCd=&grade=&pfltNm=`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      const lectures = response.data.lctTmtblDscMjList;
      const fileName = `data-${payload.yy}-${payload.semCd}-${payload.qrySxn}-${payload.lesnPlcCd}.json`;
      fs.writeFileSync(fileName, JSON.stringify(lectures, null, 2));
      console.log(`${fileName} 저장 완료!`);
    } catch (error) {
      console.log('에러:', error.message);
    }
  }
}

getAllTimetables();