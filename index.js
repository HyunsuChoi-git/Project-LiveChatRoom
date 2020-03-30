 var express = require('express'); // 설치한 express module을 불러와서 변수(express)에 담습니다.
 var app = express(); //express를 실행하여 app object를 초기화 합니다.
// var app=require('express')();
// express 모듈을 express 변수에 담고, express()로 app object를 초기화 하는 것은
//Express framework에서 항상 가장 처음하는 것

// app.get('/', (req, res)=> { // '/' 위치에 'get'요청을 받는 경우,
//   res.send('Hello World!'); // "Hello World!"를 보냅니다.
// });

var http = require('http');
var server = http.Server(app);

var socket = require('socket.io');
var io = socket(server);
var socketList = [];


//chat1
app.use('/chat', function(req, res){
  res.sendFile(__dirname + '/views/chat.html');
});

io.on('connection', function(socket) {
    socketList.push(socket);
    console.log('User Join');

    socket.on('SEND', function(msg) {
        console.log(msg);
        socketList.forEach(function(item, i) {
            console.log(item.id);
            if (item != socket){
                item.emit('SEND', msg);
            }
        });
    });
    socket.on('disconnect', function(){
      socketList.splice(socketList.indexOf(socket), 1);
    });
});


//chat2
app.get('/chat2', (req, res) => {
  res.sendFile(__dirname + '/views/chat2.html');
});
app.get('/chat2.css', (res, req) => {
  res.sendFile(__dirname + '/views/chat2.css');
});

var tempNick = ['조이서','장근원','박새로이','장근수','오수아','마현이'];

io.on('connection', (socket) => {
    //사용자 소켓 아이디 출력
    console.log('User Connected : ', socket.id);

    //io.to("123").emit()
    //닉네임 던져주기to()
    var name = tempNick[Math.floor(Math.random()*6)];
    console.log("DDDD");
    var chatList = getChat2Text(name);
    console.log("h2", chatList);

    //사용자에게 닉네임 알리기
    io.to(socket.id).emit('change name', name);
    for(var i = chatList.legnth; i >= 0; i--){
      chatLine = chatList[i];
      io.to(socket.id).emit('receive message', chatLine[1]+ ': '+ chatLine[2]);
    }

    socket.on('disconnecting', () => {
      console.log('User Disconnecting', socket.id);
    });
    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });
    //연결 끊어지면 콘솔출력

    //사용자 닉네임 변경 신호받기
    socket.on('rename', (name, text) => {
      console.log(socket.id + '('+ name +') => ' + text);
      //바뀐 닉네임 보내기
      io.to(socket.id).emit('change name', text);
      io.emit('receive message', name + '님이 ' +text+ '(으)로 닉네임을 변경하였습니다.');
    });
    //메세지 전송버튼 눌렀을 때
    socket.on('send message', (name,text) => {
      message = name + ': ' + text;
      console.log(socket.id + '('+name+'): '+text);
      //접속자에게 메세지 전달 (서버에게)
      io.emit('receive message', message);
      insertChat(name, text); //디비저장하기

    });

});



//-------DB 연동------//
var oracledb = require('oracledb');
var dbConfig = require('./dbConfig.js');
var config = {
  user : dbConfig.user,
  password : dbConfig.password,
  connectString : dbConfig.connectString
}
oracledb.autoCommit = true;
//select//

function getChat2Text(name){
    var chatList = [];
    //내부적으로 Async/Await, Promises, Callback 지원
    oracledb.getConnection(config,
    function(err, connection){

      if(err) {
        console.error(err.message);
        return;
      }
      console.log('==> chatlist search query');

      var query = "select num, id, content from chat2 where id='"+name+"' order by num";

      //쿼리 날리기
      connection.execute(query, function(err, result){
        if(err){
          console.error(err.message);
          doRelease(connection);
          return;
        }
        if (result.rows != null){
          console.log('chat size: ' + result.rows.length);
        }
        console.log(result.rows);
        chatList = result.rows;
        doRelease(connection); //연결해제 및 결과출력\
      });

    });

    return chatList;
}

//db연결해제
function doRelease(connection){
  connection.release(function(err){
    if (err){
      console.error(err.message);
    }
  });
}


//Insert// 메세지 전송되면 디비에 저장하기
//router.post('/dbTestInsert', function(req, res){
function insertChat(name, chat){
    oracledb.getConnection({
      user : dbConfig.user,
      password : dbConfig.password,
      connectString : dbConfig.connectString
    },

    function(err, connection){
      if(err){
        console.error(err.message);
        return;
      }
      //prepareStatement 구조

      connection.execute("insert into chat2 values('"+name+"','"+chat+"',chat2_seq.nextval)", function(err,result){
        if(err){
          console.error(err.message);
          doRelease(connection);
          return;
        }
        console.log('Row Insert: '+result.rowAffected);
        doRelease(connection, result.rowAffected); //Connection해제
      });

    });

    //db연결 해제
    function doRelease(connection, result){
      connection.release(function(err){
        if(err){
          console.log(err.message);
        }
        //db종료시 응답 데이터 반환
        //res.send(__dirname + '/views/dbTestInsert.html/');

      });
    }
}









//---ejs set하기---//
//app.set('view engine','ejs'); //2
//ejs를 사용하기 위해서 express의 view engine에 ejs를 set하는 코드

//------ static 폴더 생성하기 ------//
//app.use(express.static(__dirname + '/public')); // 1
//'현재_위치/public' route를 static폴더로 지정하라는 명령어.



app.get('/hello', function(req,res){ //3
  res.render('hello', {name:req.query.nameQuery});
})
//query를 통해서 이름을 받는 코드입니다. 모든 query들은 req.query에 저장

app.get('/hello/:nameParam', function(req,res){
  res.render('hello', {name:req.params.nameParam});
})
//route parameter를 통해 이름을 받는 코드입니다.
//콜론(:)으로 시작되는 route은 해당 부분에 입력되는 route의 텍스트가 req.params에 저장

//ejs파일을 사용하기 위해서는 res.render 함수를 사용해야 하며,
//첫번째 parameter로 ejs의 이름을, 두번째 parameter로 ejs에서 사용될 object를 전달합니다.
//res.render 함수는 ejs를 /views 폴더에서 찾으므로 views폴더의 이름은 변경되면 안됩니다.





var port = 5000; // 사용할 포트 번호를 port 변수에 넣습니다.
// app.listen(port, function(){ // port변수를 이용하여 3000번 포트에 node.js 서버를 연결합니다.
//   console.log('server on! http://localhost:'+port); //서버가 실행되면 콘솔창에 표시될 메세지입니다.
// });


server.listen(port, function(){
  console.log('Server On !');
});
