//<script src=""/></script>
var socket = io();

var userName = '';
var roomName = '';
var ff = '';
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

$(document).ready(function(){
		userName = getParameterByName("name");
    var url=window.location.pathname.split('/')[2];
    roomName = decodeURI(url);

		$('#name').val(userName);
		$('#roomname').text('BTS Chat Room - ('+roomName+')');
		socket.emit('start', roomName, userName);

});

socket.on('fast message', function(name, text) {
    console.log('이전내용 뿌리러 왔다!');

		//채팅창에 이전 내용 뿌리기
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

//참여자에 닉네임 뿌리기
socket.on('receive userName', function(name, count, host){
  var tagP = document.createElement('p');
  var id = name;
  if($('#name').val() == host){
    tagP.className = 'myHost';
    id = id+'(방장)(me)';
  }else{
    if(name == $('#name').val()){
        tagP.className = 'myId';
        id = id+'(me)';
    }else{
        tagP.className = name;
    }
  }
  $('h4').html(`참여자 (${count})`);
  tagP.appendChild(document.createTextNode(id));
  document.getElementById('chatInfo').appendChild(tagP);
});
//참여자 퇴장시 화면에 닉네임 내리기
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
    document.getElementById('chatLog').appendChild(tagP);
    var objDiv = document.getElementById("chatLog");
    objDiv.scrollTop = objDiv.scrollHeight;

		//정상적으로 뿌려졌으면 저장하라고 보내기
		socket.emit('chat save', name, text);
});


function chat_submit() {
    socket.emit('send message', $('#name').val(), $('#message').val());
    $('#message').val("");
    $("#message").focus();
}
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
