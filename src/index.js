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
            // 1. roomName채팅방이 이미 있는 지 검사
            isRoom = db.isRoom(roomName);
            // 2. 채팅방이 없으면 만들어주기. 있으면 3번으로
            if (isRoom) { //없으면
              io.to(socket.io).emit('isRoom user', isRoom);
              db.dataInit(roomName, userName);
            }
            //3. 채팅방 정보 글로벌변수에 로드해주기
            data = db.dataLoad(roomName);

            //4. 유저가 존재하는 지 안하는 지 확인
            var isUser = db.isUser(data, userName);
            console.log('새로운유저인가? >> '+isUser);

            //5. 유저가 존재하지 않으면 ==> 유저 첫입장 시,
            if(isUser) {
              //5-1.유저 카운트 업
                db.userCountUp(roomName, data);
              //5-2.닉네임과 입장시간 저장
                db.userEntrance(roomName, data, userName);
              //5-3. 채팅창에 유저 입장 알림
                io.emit('receive message', '',userName+'님이 입장했습니다.');
              //5.4. 알림내용 저장
                db.dataPush(roomName, data, '',userName+'님이 입장했습니다.');
            }else {
            //6.유저가 존재하면 채팅창에 이전 대화기록 뿌려주기
                //6-1. 유저 첫입장 시간 빼오기
                var entDate = new Date(db.userEntDate(data, userName));
                console.log("방이름: "+roomName);
                console.log("인원수: "+data.userCount);
                console.log("현재유저입장시간: "+ entDate);
                //6-2.채팅방 총 대화내역 가져와서 유저 첫입장 시간보다 이후면
                // io.to(socket.id)로 보내주기
                for(var i=0; i < data.userContent.length; i++){
                    var textTime = new Date(data.userContent[i]['date']);
                    if(textTime.getTime() >= entDate.getTime()) {
                        io.to(socket.id).emit('fast message', data.userContent[i]['name'] , data.userContent[i]['text']);
                    }
                }
            }
                //유저네임과 소켓 저장해놓기(임시)
                userInfo.set(socket.id,userName);
                console.log("map:", userInfo);
      	});
        //7. 사용자가 메세지 전송시
        socket.on('send message', (name, text) => {
              console.log(name+' : '+text);
              //전체 사용자에게 전달
              io.emit('receive message', name, text);
              //대화내용 저장
        			db.dataPush(roomName, data, name, text);
        });
        //8. 퇴장버튼 누르면 채팅창 완전히 나가기
        socket.on('exit room', (userName) => {
          //8-1. 퇴장알림 띄우기
          io.emit('receive message', '',userName+'님이 퇴장했습니다.');
          //8-2. 알림내용 저장
          db.dataPush(roomName, data, '',userName+'님이 퇴장했습니다.');
          //8-3. data에서 인원수 내리기
          db.userCountDown(roomName, data);
          //8-4. data에서 유저정보 삭제
          db.userExit(roomName, data, userName);
        })

        // socket.on('disconnect', () => {
        //     console.log('유저 퇴장 : ' + socket.id);
        //     io.emit(`receive message${roomName}`, '', userInfo.get(socket.id)+'님이 퇴장하였습니다.');
        //     userInfo.delete(socket.id);
        //     console.log(userInfo);
      	// });


});
