const fs = require('fs')

function dataSave(roomName, data) {
    data = JSON.stringify(data);
    fs.writeFileSync(__dirname + `/data_base/${roomName}.json`, data, 'utf-8', function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

module.exports = {
  //전체 채팅방 리스트 뽑아오기
  roomList: () => {
      return fs.readdirSync(__dirname + `/data_base/`);
  },
  //같은 이름의 채팅방이 존재하는 지 확인
  isRoom: (roomName) => {
    try{  //파일이 존재한다면
      //파일의 정보를 불려오는 stst함수
      fs.statSync(__dirname + `/data_base/${roomName}.json`);
      return false;
    }catch(err){
      if (err.code === 'ENOENT') { //파일이 존재하지 않는다면
        return true;
      }
    }
  },
  //채팅방 개설하기
  dataInit: (roomName, userName) => { //채팅방 개설 & json파일 생성
      data = {  //data : 기본정보 (방장, 인원수, 글들이 저장될 리스트타입)
          host: userName,
          userCount: 0,
          userEntrance: [],
          userContent: []
      };
      dataSave(roomName, data);
  },
  //한 채팅방 정보 가져오기
  dataLoad: (roomName) => { //채팅방 가져오기
      var data = fs.readFileSync(__dirname+`/data_base/${roomName}.json`, 'utf-8');
      return JSON.parse(data); //json타입을 js객체로 파싱하여 리턴
  },
  //유저네임이 해당 채팅방에 존재하는 지 확인
  isUser: (data, name) => {
      var isUser = true;
      data.userEntrance.forEach(element => {
          if(element.name == name) isUser = false;
      });
      return isUser;
  },
  //채팅방에 새로운 유저 들어오면 카운트 +1
  userCountUp: (room, data) => {
      data.userCount++;
      dataSave(room, data);
  },
  //채팅방에 새로운 유저 들어오면 닉네임과 입장시간 저장
  userEntrance: (room, data, name) => {
      data.userEntrance.push({
          name: name,
          date: new Date()
      });
      dataSave(room,data);
  },
  // 유저 입장시간 빼오기(이전채팅 로드용)
  userEntDate: (data, name) => {
      // data.userEntrance.forEach(element => {
      //     if(element.name == name) return element.date;
      // });
      for(var i=0; i < data.userEntrance.length; i++){
          if(data.userEntrance[i]['name'] == name) return data.userEntrance[i]['date'];
      }
  },
  //채팅입력시 파일에 저장하기
  dataPush: (room, data, name, text) => {
      data.userContent.push({
          name: name,
          text: text,
          date: new Date(),
      });
      dataSave(room, data);
  },
  //채팅방에 유저 퇴장 시 카운트 -1
  userCountDown: (room, data) => {
      data.userCount--;
      dataSave(room, data);
  },
  //채팅방에 유저 퇴장 시 파일에서 유저정보(닉넴,입장시간) 삭제
  userExit: (room, data, name) => {
      const idx = data.userEntrance.findIndex((element) => {
        return element.name === name});
        console.log('idx: '+idx);
      if (idx > -1) data.userEntrance.splice(idx, 1);

      dataSave(room,data);
  }

}
