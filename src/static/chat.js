

function getParameterByName(name) { //url에서 파라미터 빼오는 함수
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//채팅방 url 처음 접속 시
//방제목 저장 및 namespace Io 만들기
var url=window.location.pathname.split('/')[2];
var roomName = decodeURI(url);
var userName = getParameterByName("name");
const socket = io("/"+roomName);

$('#roomname').text('BTS Chat Room - ('+roomName+')');  //채팅방이름 띄우기
$('#name').val(userName);
socket.emit('setName', userName);

//채팅창에 이전 내용 뿌리기
socket.on('fast message', function(name, text) {
    var tagP = document.createElement('p');
    var msg = name + ' : ' + text;
    if(name == $('#name').val()){
        tagP.className = 'myMessage';
        msg = text;
    }else if(name == ''){
        msg = text;
    }
    tagP.appendChild(document.createTextNode(msg));
    document.getElementById('chatLog').appendChild(tagP);
    var objDiv = document.getElementById("chatLog");
    objDiv.scrollTop = objDiv.scrollHeight;

});

//참여자 화면에 채팅방 참여자 인원수와 닉네임 띄우기
socket.on('receive userName', function(name, count, host){
  var tagP = document.createElement('p');
  var id = name;
  if(name == host && host == $('#name').val()){
    tagP.className = host;
    id = id+'(방장)(me)';
  }else if(name == host){
    tagP.className = name;
    id = id+'(방장)';
  }else{
    if(name == $('#name').val()){
        tagP.className = name;
        id = id+'(me)';
    }else{
        tagP.className = name;
    }
  }
  $('h4').html(`참여자 (${count})`);
  tagP.appendChild(document.createTextNode(id));
  $('#chatInfo').append(tagP);

  //////// 자기자신이 방장이면 퇴장버튼 만들어주기
  //// h4 클래스 네임이 host인 것으로 체크
  if($('p').hasClass('.host') === true){
    console.
     $(".name").after("<button>강퇴</button>")
  }
});

//참여자 퇴장시 화면에서 인원수와 닉네임 내리기
socket.on('remove user', function(name, count){
  $('h4').html(`참여자 (${count})`);
  var header = document.querySelector("p."+name);
  header.parentNode.removeChild(header);
});

//서버로부터 메세지를 받음
socket.on('receive message', function(name, text) {
		//채팅창에 내용 뿌리기
    var tagP = document.createElement('p');

    var msg = name + ' : ' + text;
    if(name == $('#name').val()){
        tagP.className = 'myMessage';
        msg = text;
    }else if(name == ''){
        msg = text;
    }
    tagP.appendChild(document.createTextNode(msg));
    $('#chatLog').append(tagP);
    var objDiv = $("#chatLog");
    objDiv.scrollTop = objDiv.scrollHeight;

		//정상적으로 뿌려졌으면 저장이벤트 호출
		socket.emit('chat save', name, text);
});

//채팅입력 메소드
function chat_submit() {
    socket.emit('send message', $('#name').val(), $('#message').val());
    $('#message').val("");
    $("#message").focus();
}
//퇴장 메소드
function chat_exit() {
    socket.emit('exit room', $('#name').val());
    location.href='/';
}

function Enter_Check(){
    if(event.keyCode == 13){
      chat_submit();
      document.getElementById('message').value = "";
    }
}
