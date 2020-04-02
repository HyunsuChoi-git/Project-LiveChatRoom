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
app.get('/getparam', views.paramName);

app.use(express.static(__dirname+'/static'));
module.exports = app;

var io = require('socket.io').listen(server);

//key: 소켓넘버, value:닉네임
var userInfo = new Map();
let isRoom = false;
let roomName = '';
let data = {};

//사용자 연결 시
io.on('connection', socket =>{
        //document.cookie = 'crossCookie=bar; SameSite=None; Secure;'

        console.log("클라이언트 접속"+socket.id);

        /*사용자 입장*/
      	socket.on('start', (room, userName) => {
            roomName = room;
            //roomName채팅방이 이미 있는 지 검사
            isRoom = db.isRoom(roomName);
            console.log("있따?"+isRoom);
            if (isRoom) { //없으면
              io.to(socket.io).emit('isRoom user', isRoom);
              db.dataInit(roomName, userName); //방 만들어주기
            }
            //채팅방 로드해주기
            data = db.dataLoad(roomName);
            console.log(roomName);
            //채팅창에 이전 대화기록 뿌려주기
            data.userContent.forEach((element) => {
              console.log("이전내용:"+element.name+": "+element.text);
        			io.to(socket.id).emit(`fast message`+2, element.name , element.text,roomName);
        		});

            //채팅창에 유저 입장 알림
        		io.emit('receive message', '',userName+'님이 입장했습니다.');
        		console.log('유저 입장 : ' + socket.id + '(' + userName + ')');

            //유저네임과 소켓 저장해놓기(임시)
            userInfo.set(socket.id,userName);
            console.log("map:", userInfo);
      	});
        //사용자가 메세지 전송시
        socket.on('send message', (name, text) => {
              console.log(name+' : '+text);
              //전체 사용자에게 전달
              io.emit('receive message'+roomName, name, text);
              //대화내용 저장
              console.log('헬로-');
              console.log(roomName);
        			db.dataPush(roomName, data, name, text);
        });

        socket.on('disconnect', () => {
            console.log('유저 퇴장 : ' + socket.id);
            io.emit(`receive message${roomName}`, '', userInfo.get(socket.id)+'님이 퇴장하였습니다.');
            userInfo.delete(socket.id);
            console.log(userInfo);
      	});


});
