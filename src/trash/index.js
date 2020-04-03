var views = require('./views');
var db   = require('./db');
var express = require('express');
var app = express();
const fs = require('fs');

var server = require('http').createServer(app);
server.listen(3000, function(){
    console.log('서버 start~~~!!');
});

app.get('/chat/:id',    views.renderIndex);
app.get('/chat', views.chatList);
app.get('/', views.renderMain);
app.use(express.static(__dirname+'/static'));
app.use('/static', express.static(__dirname+'/roomNames')); //url화 시키기

var io = require('socket.io').listen(server);

//key: 소켓넘버, value:닉네임
let data = {};

//현재 파일의 정보들을 가져오는 역할!!!>_<!
rooms=fs.readdirSync(__dirname+'/roomNames');
rooms_set={rooms:rooms};

//기존에 있는 방이름의 네임스페이스를 만드는 곳
rooms_set["rooms"].forEach((element) => {
    element = element.split('.json')[0];
    var room_nsp = io.of('/'+element);
    console.log(room_nsp.name,"네임스페이스 완성");

    room_nsp.on("connect",(roomsocket)=>{
        console.log(room_nsp.name,'룸에 입장');
        roomsocket.on("setName",(userName)=>{
            getDb(element,userName,roomsocket,room_nsp);
        })
        //네임스페이스 안에 속해있는 사람들끼리 대화!
        roomsocket.on("submit_mes",(mes)=>{
            room_nsp.emit("submit_mes",mes);
        });

    });
});


//사용자 입장 >>>
function getDb(roomName, userName, socket, io) {
    //3. 채팅방 정보 글로벌변수에 로드해주기
    data = db.dataLoad(roomName);

    //4. 유저가 존재유무 확인
    var isUser = db.isUser(data, userName);

    //5. 유저가 존재하지 않으면 (== 유저 첫입장)
    if(!isUser) {
        //5-1.유저 카운트 업
        //5-2.닉네임과 입장시간 저장
        db.userEntrance(roomName, data, userName);
        //5-2. (ALL)채팅창에 유저 입장 알림
        io.emit('receive message', '',userName+'님이 입장했습니다.');
        //5-3. 알림내용 텍스트 저장
        db.dataPush(roomName, data, '',userName+'님이 입장했습니다.');
        //5-4. (ALL-solo)유저들 화면에 첫참여자 닉네임 추가하기
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


/////////////////////////////////////////////////
//사용자 연결 시
io.on('connection', socket =>{
    rooms = fs.readdirSync(__dirname+'/roomNames');
    rooms_set = {rooms:rooms};
    io.emit('roomlist',rooms_set);

    //채팅방 개설했을 때,
    socket.on('startroom',(room_set)=>{ //room_set : 유저네임,룸네임,인원수
        room = io.of('/'+room_set.roomName); //새로운 네임스페이스 만들어주기
        console.log(room.name,"네임스페이스 완성!")
        //방이 있는지 확인하는 메서드;
        var isRoom = db.isRoom(room_set.roomname);
        //방이 없으면 방 생성
        if(!isRoom){
          db.dataInit(room_set);
        }
        //새로 생성된 네임스페이스에 입장
        room.on("connect",(roomsocket)=>{
          console.log(room.name,'룸에 입장');

          roomsocket.on('setName', (userName) => {
              console.log("userName : "+userName);
              roomsocket.on("setName",(userName)=>{
              if(userName==""){
                  getDb(room_set.roomName,room_set.userName,roomsocket,room);
              }else{
                  getDb(room_set.roomName,userName,roomsocket,room);
              }
            })
          });

          roomsocket.on("submit_mes",(mes)=>{
              room.emit("submit_mes",mes);
          })

        });
    });
        //7. 사용자가 메세지 전송시
        socket.on('send message', (name, text) => {
              //(ALL)
              io.emit('receive message', name, text);
              //대화내용 저장
        			db.dataPush(roomName, data, name, text);
        });

        //8. 퇴장버튼 누르면 채팅창 완전히 나가기
        socket.on('exit room', (userName) => {
          //8-1. (ALL)퇴장알림 띄우기
          io.emit('receive message', '',userName+'님이 퇴장했습니다.');
          //8-3. 알림내용 저장
          db.dataPush(roomName, data, '',userName+'님이 퇴장했습니다.');
          //8-4. data에서 인원수 내리기
          db.userCountDown(roomName, data);
          //8-2. (ALL)참여자 화면에 유저닉네임 제거
          io.emit('remove user', userName, data.userCount);
          //8-5. data에서 유저정보 삭제
          db.userExit(roomName, data, userName);

        });

});
