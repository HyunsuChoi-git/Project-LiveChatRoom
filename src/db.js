const fs = require('fs')

function dataSave(roomName, data) {
    data = JSON.stringify(data);
    fs.writeFileSync(__dirname + `/data_base/${roomName}.json`, data, 'utf-8', function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

module.exports = {
  roomList: () => {
      return fs.readdirSync(__dirname + `/data_base/`);
  },
  isRoom: (roomName) => {
    //파일의 정보를 불려오는 stst함수
    try{  //파일이 존재한다면
      fs.statSync(__dirname + `/data_base/${roomName}.json`);
      return false;
    }catch(err){
      if (err.code === 'ENOENT') { //파일이 존재하지 않는다면
        return true;
      }
    }
  },
  dataInit: (roomName, userName) => { //채팅방 개설 & json파일 생성
      data = {  //data : 기본정보 (방장, 인원수, 글들이 저장될 리스트타입)
          host: userName,
          userCount: 0,
          userContent: []
      };
      dataSave(roomName, data);
  },
  dataLoad: (roomName) => { //채팅방 가져오기
      var data = fs.readFileSync(__dirname+`/data_base/${roomName}.json`, 'utf-8');
      return JSON.parse(data); //json타입을 js객체로 파싱하여 리턴
  },
  dataPush: (roomName, data, name, text) => {
      console.log(data);
      data.userContent.push({
          name: name,
          text: text,
          date: new Date(),
      });
      dataSave(roomName, data);
  }

}
