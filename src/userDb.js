const fs = require('fs')

function insertUser(users, ourUsers) {
    users = JSON.stringify(users);
    fs.writeFileSync(__dirname + `/ourUsers/${ourUsers}.json`, data, 'utf-8', function (err) {
        if (err) throw err;
    });
}

module.exports = {
  //회원정보 json기본 틀
  // userInit: (users) => {
  //   id : [],
  //   nick : [],
  //   users : {["id","nick","pw","date"]}
  // },
  //전체 회원 로딩
  userList: () => {
      var users = fs.readFileSync(__dirname+`/ourUsers/${ourUsers}`, 'utf-8');
      users = JSON.parse(users);

      return users;
  },
  //아이디 중복채크
  isId: (users, id) => {
      var isId = true;
      for (var i in users){
          if(users.id[i] == id) {
              isId = false;
          }
      }
      return isId;
  },
  //닉네임 중복체크
  isNick: (users, nick) => {
    var isNick = true;
    for (var i in users){
        if(users.nick[i] == nick) {
            isNick = false;
        }
    }
    return isNick;
  },
  // insertUser : (users, user) => {
  //     users.id.push : user.id,
  //     users.nick.push : user.nick,
  //     users.users.push : [user.id,user.nick,user.pw,new Date()]
  //
  // },
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
  //채팅방에 유저입장시 카운트 -1
  userCountUp: (roomName, data) => {
      data.userCount++;
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
  },

  dataDelete: (data, roomName) =>{
      dataDelete(data, roomName);
      fs.unlink(__dirname + `/openedRoom/${roomName}.json`, function(err){
          if( err ) throw err;
          console.log('file deleted');
      });
  }

}
