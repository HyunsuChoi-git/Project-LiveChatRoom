var views = require('./views');
var db   = require('./db');
var userDb   = require('./userDb');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var server = require('http').createServer(app);
server.listen(3000, function(){
    console.log('서버 start~~~!!');
});

app.use(bodyParser.urlencoded({ extended : false }));
app.get('/chat/:id', views.renderIndex);
app.get('/chat', views.chatList);
app.get('/', views.login);
app.post('/', views.loginCheck);
app.get('/signup', views.signup);
app.get('/main', views.renderMain);
app.use('/static',express.static(__dirname+'/openedRoom'))
app.use(express.static(__dirname+'/static'));

app.get('/test', views.test);
app.get('/testCss', views.test2);


var io = require('socket.io').listen(server);

//key: 소켓넘버, value:닉네임
let roomName = '';
var fs=require('fs')
let data={};
var usersSocketId = {'입장시 부여받은 소켓아이디':'userName'};

//서버 실행시 기존에 있는 방이름의 네임스페이스 생성
rooms=fs.readdirSync(__dirname+'/openedRoom');
rooms_set={rooms:rooms};
rooms_set["rooms"].forEach((roomName) => {
    var roomName = roomName.split('.json')[0];
    var room_nsp=io.of('/'+roomName);
    console.log(room_nsp.name,"네임스페이스 완성")
    var room_socket =
    //유저가 채팅방 입장시 채팅진행 커넥션
    room_nsp.on("connect",(roomsocket)=>{
        skill(room_nsp,roomsocket,roomName);

        roomsocket.on('disconnect', ()=>{
          console.log(room_nsp.name,"에 "+roomsocket.id+' : '+usersSocketId[roomsocket.id]+' >> 퇴장');
          //변수에서 소켓아이디와 닉네임 제거
          delete usersSocketId[roomsocket.id];
          console.log(usersSocketId);
        });

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
          console.log(room_nsp2.name,"에 호스트 입장.")
          skill(room_nsp2,roomsocket,room_set.roomName)
        });

    });
});

function skill(room_nsp,roomsocket,roomName){
    roomsocket.on("setName",(userName)=>{  //유저가 채팅방에 입장 시 첫 세팅
        data = db.dataLoad(roomName);
        if(userName==""){
          getDb(roomName,room_set.userName,roomsocket,room_nsp);
        }else{
          getDb(roomName,userName,roomsocket,room_nsp);
        }
    });
    //채팅 주고 받기
    roomsocket.on('send message', (name, text) => {
        room_nsp.emit('receive message', name, text);
        db.dataPush(roomName, data, name, text); //대화내용 저장
    });
    //유저 퇴장 시
    roomsocket.on('exit room', (userName) => {
        room_nsp.emit('receive message', '',userName+'님이 퇴장했습니다.');
        db.dataPush(roomName, data, '',userName+'님이 퇴장했습니다.'); //알림내용 저장
        db.userCountDown(roomName, data); //data에서 인원수 내리기
        room_nsp.emit('remove user', userName, data.userCount); //(ALL)참여자 화면에 유저닉네임 제거
        db.userExit(roomName, data, userName);   //data에서 유저정보 삭제
    });
    //유저 강퇴 시
    roomsocket.on('ban execution', (userName) => {
        var banUser = '';
        for(var i in usersSocketId){
            if(usersSocketId[i] == userName) {
                room_nsp.to(i).emit('forced exit');
            };
        }
        room_nsp.emit('receive message', '',userName+'님이 강퇴되었습니다.'); //(All)강퇴메시지 닉네임띄우기
        db.dataPush(roomName, data, '',userName+'님이 강퇴되었습니다.'); //(All)알림내용 저장
        db.userCountDown(roomName, data); //data에서 인원수 내리기
        room_nsp.emit('remove user', userName, data.userCount); //(All)참여자 화면에 유저 닉네임 내리기
        db.userExit(roomName, data, userName); //data에서 유저정보 삭제
    });

    roomsocket.on('host out', () => {
        room_nsp.emit('end chatRoom');
        db.dataDelete(data, roomName);
    });

}


function getDb(roomName,userName,socket,io){
    data = db.dataLoad(roomName);
    var isUser = db.isUser(data, userName);
    if(!isUser) { //첫입장 유저 >> (전체)입장메세지 띄우기,입장메세지json에저장,다른유저들 창에 닉네임띄우기
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
    //유저닉네임과 소켓아이디 짝맞춰 변수에 저장
    var socketId = socket.id;
    usersSocketId[socketId] = userName;
    console.log(roomName,"에 "+socket.id+' : '+userName+" >> 입장");
    console.log(usersSocketId);

    data.userEntrance.forEach(element =>{
      io.to(socket.id).emit('receive userName', element.name, data.userCount, data.host);
    })
    // 호스트이름과 유저닉네임이 같으면 강퇴기능 넣을 수 있게 보내기
    if(data.host == userName){
        io.to(socket.id).emit('banFunc grant', userName);
    }
}
