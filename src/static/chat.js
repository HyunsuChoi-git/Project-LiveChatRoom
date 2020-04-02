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
		roomName = getParameterByName("room");
		$('#name').val(userName);
		$('#roomname').text('BTS Chat Room - ('+roomName+')');
		socket.emit('start', roomName, userName);


//////////////////////////////////
		$.ajax({
				url: '/getparam',
				type: 'get'
		}).done((data) => {
				console.log(data);
				roomName = data;
        console.log(roomName);
		});

});

socket.on(`fast message`+2, function(name, text) {
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

//서버로부터 메세지를 받음
socket.on('receive message대전', function(name, text) {
    console.log('대화 뿌리러 왔다!');
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


function Enter_Check(){
    if(event.keyCode == 13){
      chat_submit();
      document.getElementById('message').value = "";
    }
}
