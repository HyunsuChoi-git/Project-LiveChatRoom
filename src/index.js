var views = require('./views');
var db   = require('./db');
var express = require('express');
var app = express();

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
var fs=require('fs')
let data={};

//기존에 있는 방이름의 네임스페이스를 만들어주기 위해
rooms=fs.readdirSync(__dirname+'/roomNames');
rooms_set={rooms:rooms};
rooms_set["rooms"].forEach((roomName) => {
    var roomName = roomName.split('.json')[0];
    var room_nsp=io.of('/'+roomName);
    console.log(room_nsp.name,"네임스페이스 완성")

    //메인에서 입장 누르고 채팅진행 커넥션
    room_nsp.on("connect",(roomsocket)=>{
        console.log(room_nsp.name,"에입장.")
        skill(room_nsp,roomsocket,roomName);
    });
});

//사용자 연결 시
io.on('connection', socket =>{
    console.log('유저 main에 입장');
    io.emit('roomlist', db.roomList());

    //방 개설했을 때. (유저네임,룸네임,인원수)
    socket.on('startroom',(room_set)=>{

        room_nsp2=io.of('/'+room_set.roomName);
        console.log(room_nsp2.name," 방 개설 완료");

        //방이 있는지 확인하는 메서드;
        var isRoom=db.isRoom(room_set.roomName);
        //방이 없으면 방 생성
        if(!isRoom){
          db.dataInit(room_set);
          console.log('방생성');
        }

        //방 개설 후 채팅방 채팅진행 커넥션
        room_nsp2.on("connect",(roomsocket)=>{
          console.log(room_nsp2.name,"에입장.")
          skill(room_nsp2,roomsocket,room_set.roomName)
        });

    });
});

function skill(room_nsp,roomsocket,roomName){
    roomsocket.on("setName",(userName)=>{
        data = db.dataLoad(roomName);
        if(userName==""){
          getDb(roomName,room_set.userName,roomsocket,room_nsp);
        }else{
          getDb(roomName,userName,roomsocket,room_nsp);
        }
    });

    roomsocket.on('send message', (name, text) => {
        //(ALL)
        room_nsp.emit('receive message', name, text);
        //대화내용 저장
        db.dataPush(roomName, data, name, text);
    });
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
    });

}


function getDb(roomName,userName,socket,io){
    data = db.dataLoad(roomName);
    var isUser = db.isUser(data, userName);
    if(!isUser) {
        db.userEntrance(roomName, data, userName);
        io.emit('receive message', '',userName+'님이 입장했습니다.');
        db.dataPush(roomName, data, '',userName+'님이 입장했습니다.');
        socket.broadcast.emit('receive userName', userName, data.userCount, data.host);
    }else {
        var entDate = new Date(db.userEntDate(data, userName));
        for(var i of data.userContent){
            var textTime = new Date(i['date']);
            if(textTime.getTime() >= entDate.getTime()) {
                io.to(socket.id).emit('fast message', i['name'] , i['text']);
            }
        }
    }
    data.userEntrance.forEach(element =>{
      console.log("실행");
      io.to(socket.id).emit('receive userName', element.name, data.userCount, data.host);
    })
}

//7. 사용자가 메세지 전송시
