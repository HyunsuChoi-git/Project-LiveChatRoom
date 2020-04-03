var views = require('./views');
var db   = require('./db');
var express = require('express');
var app = express();
var fs=require('fs');

var server = require('http').createServer(app);
server.listen(3000, function(){
    console.log('서버 start~~~!!');
});

app.get('/chat/:id',    views.renderIndex);
app.get('/chat', views.chatList);
app.get('/', views.renderMain);
app.use('/static',express.static(__dirname+'/roomNames'))
app.use(express.static(__dirname+'/static'));

var io = require('socket.io').listen(server);

//key: 소켓넘버, value:닉네임
let roomName = '';
let data={};
//1. 기존에 있는 방이름의 네임스페이스들 로드
rooms=fs.readdirSync(__dirname+'/roomNames');
rooms_set={rooms:rooms};
rooms_set["rooms"].forEach((element) => {
    roomName = element.split('.json')[0];
    var room_nsp = io.of('/'+roomName);
    console.log(room_nsp.name,"네임스페이스 완성")

    //2. main.html에서 입장을 누르면 해당 방제의 네임스페이스로 connected
    room_nsp.on("connect",(roomsocket)=>{
          console.log(room_nsp.name,"에입장.");
          //3. 입장하면 setName이벤트 호출되어 실행됨.
          roomsocket.on("setName",(userName)=>{
              data = db.dataLoad(roomName);
              getDb(roomName,userName,roomsocket,room_nsp);
          })
          //4. 사용자가 메세지 전송시 전달 및 저장
          roomsocket.on('send message', (name, text) => {
                room_nsp.emit('receive message', name, text);
                db.dataPush(roomName, data, name, text);
          });
          //5. 퇴장버튼 누르면 채팅창 완전히 나가기
          roomsocket.on('exit room', (userName) => {
              //8-1. (ALL)퇴장알림 띄우기
              room_nsp.emit('receive message', '',userName+'님이 퇴장했습니다.');
              //8-3. 알림내용 저장
              db.dataPush(roomName, data, '',userName+'님이 퇴장했습니다.');
              //8-4. data에서 인원수 내리기
              db.userCountDown(roomName, data);
              //8-2. (ALL)참여자 화면에 유저닉네임 제거
              room_nsp.emit('remove user', userName, data.userCount);
              //8-5. data에서 유저정보 삭제
              db.userExit(roomName, data, userName);

          })
    });
});

//사용자 연결 시
io.on('connection', socket =>{
      rooms=fs.readdirSync(__dirname+'/roomNames');
      rooms_set={rooms:rooms};
      io.emit('roomlist',rooms_set);
      //유저네임,룸네임,인원수
      socket.on('startroom',(room_set)=>{

          room_nsp2=io.of('/'+room_set.roomName);
          console.log(room_nsp2.name,"네임스페이스 완성!")
          //방이 있는지 확인하는 메서드;
          var isRoom=db.isRoom(room_set.roomname);
          //방이 없으면 방 생성
          if(!isRoom){
            db.dataInit(room_set);
          }
          room_nsp2.on("connect",(roomsocket)=>{
                var data = db.dataLoad(room_set.roomName);
                console.log(room_nsp2.name,"에입장.")
                roomsocket.on("setName",(userName)=>{
                  data = db.dataLoad(roomName);
                  if(userName==""){
                    getDb(room_set.roomName,room_set.userName,roomsocket,room_nsp2);
                  }else{
                    getDb(room_set.roomName,userName,roomsocket,room_nsp2);
                  }
                })

                //7. 사용자가 메세지 전송시
                roomsocket.on('send message', (name, text) => {
                  //(ALL)
                  room_nsp2.emit('receive message', name, text);
                  //대화내용 저장
                  db.dataPush(room_set.roomName, data, name, text);
                });
                //8. 퇴장버튼 누르면 채팅창 완전히 나가기
                roomsocket.on('exit room', (userName) => {
                    //8-1. (ALL)퇴장알림 띄우기
                    room_nsp2.emit('receive message', '',userName+'님이 퇴장했습니다.');
                    //8-3. 알림내용 저장
                    db.dataPush(room_set.roomName, data, '',userName+'님이 퇴장했습니다.');
                    //8-4. data에서 인원수 내리기
                    db.userCountDown(room_set.roomName, data);
                    //8-2. (ALL)참여자 화면에 유저닉네임 제거
                    room_nsp2.emit('remove user', userName, data.userCount);
                    //8-5. data에서 유저정보 삭제
                    db.userExit(room_set.roomName, data, userName);

                })

          });

      });

});

function getDb(roomName,userName,socket,io){
    data = db.dataLoad(roomName);
        //4. 유저가 존재유무 확인
    var isUser = db.isUser(data, userName);
    //5. 유저가 존재하지 않으면 (== 유저 첫입장)
    if(!isUser) {
      //5-1.유저 카운트 업
      //5-2.닉네임과 입장시간 저장
        db.userEntrance(roomName, data, userName);
      //5-3. (ALL)채팅창에 유저 입장 알림
        io.emit('receive message', '',userName+'님이 입장했습니다.');
      //554. 알림내용 텍스트 저장
        db.dataPush(roomName, data, '',userName+'님이 입장했습니다.');
      //5-5. (ALL-solo)유저들 화면에 첫참여자 닉네임 추가하기
        socket.broadcast.emit('receive userName', userName, data.userCount, data.host);
    }else {
    //6.(solo)유저가 존재하면 채팅창에 이전 대화기록 뿌려주기
        //6-1. 유저 첫입장 시간 빼오기
        var entDate = new Date(db.userEntDate(data, userName));
        //6-2.채팅방 총 대화내역 가져와서 유저 첫입장 시간보다 이후부터 뿌려주기
        for(var i of data.userContent){
            var textTime = new Date(i['date']);
            if(textTime.getTime() >= entDate.getTime()) {
                io.to(socket.id).emit('fast message', i['name'] , i['text']);
            }
        }
    }
    //7. (solo)참여자들 아이디 띄우기
    data.userEntrance.forEach(element =>{
        io.to(socket.id).emit('receive userName', element.name, data.userCount, data.host);
    })
}
