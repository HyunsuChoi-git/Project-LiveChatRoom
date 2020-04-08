const fs = require('fs')

function dataSave(data, roomName) {

    data = JSON.stringify(data);
    fs.writeFileSync(__dirname + `/roomNames/${roomName}.json`, data, 'utf-8', function (err) {
        if (err) throw err;
    });
}

module.exports = {
  //전체 채팅방 리스트 뽑아오기
  roomList: () => {
      //전체 방 이름 가져오기 roomname.json
      var roomfiles = fs.readdirSync(__dirname + `/roomNames/`);
      var roomList = [];
      //하나하나 꺼내서 방이름,인원수,참여자수 저장하기
      for (var roomfile of roomfiles){
          var data = fs.readFileSync(__dirname+`/roomNames/${roomfile}`, 'utf-8');
          data = JSON.parse(data);
          roomList.push([data.roomName,data.userCount,data.roomCount]);
      }
      return roomList;
  },
  //같은 이름의 채팅방이 존재하는 지 확인
  isRoom: (roomName) => {
    try{  //파일이 존재한다면
      //파일의 정보를 불려오는 stst함수
      fs.statSync(__dirname + `/roomNames/${roomName}.json`);
      return true;
    }catch(err){
      if (err.code === 'ENOENT') { //파일이 존재하지 않는다면
        return false;
      }
    }
  },
  //채팅방 개설하기
  dataInit: (room_set) => { //채팅방 개설 & json파일 생성
      data = {  //data : 기본정보 (방장, 인원수, 글들이 저장될 리스트타입)
          roomName: room_set.roomName,//방이름
          host: room_set.userName,//방장이름
          roomCount: room_set.roomCount,//방인원수설정
          userCount: 0,//현재참여인원수
          userEntrance: [],//참여자정보
          userContent: []//대화기록
      };
      dataSave(data, data.roomName);
  },
  //한 채팅방 정보 가져오기
  dataLoad: (roomName) => { //채팅방 가져오기
      var data = fs.readFileSync(__dirname+`/roomNames/${roomName}.json`, 'utf-8');
      return JSON.parse(data); //json타입을 js객체로 파싱하여 리턴
  },
  //유저네임이 해당 채팅방에 존재하는 지 확인
  isUser: (data, userName) => {
      var isUser = false;
      data.userEntrance.forEach(element => {
          if(element.name == userName) isUser = true;
      });
      return isUser;
  },
  //채팅방에 새로운 유저 들어오면 카운트 +1
  //채팅방에 새로운 유저 들어오면 닉네임과 입장시간 저장
  userEntrance: (roomName, data, userName) => {
      data.userCount++;
      data.userEntrance.push({
          name: userName,
          date: new Date()
      });
      dataSave(data, roomName);
  },
  // 유저 입장시간 빼오기(이전채팅 로드용)
  userEntDate: (data, userName) => {
      for(var i of data.userEntrance){
          if(i['name'] == userName)
          return i['date'];
        }
  },
  //채팅입력시 파일에 저장하기
  dataPush: (roomName, data, userName, text) => {
      data.userContent.push({
          name: userName,
          text: text,
          date: new Date(),
      });
      dataSave(data, roomName);
  },
  //채팅방에 유저 퇴장 시 카운트 -1
  userCountDown: (roomName, data) => {
      data.userCount--;
      dataSave(data, roomName);
  },
  //채팅방에 유저 퇴장 시 파일에서 유저정보(닉넴,입장시간) 삭제
  userExit: (roomName, data, userName) => {
      const idx = data.userEntrance.findIndex((element) => {
        return element.name === userName});
        console.log('idx: '+idx);
      if (idx > -1) data.userEntrance.splice(idx, 1);

      dataSave(data, roomName);
  }

}
