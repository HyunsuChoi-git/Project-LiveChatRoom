var db = require('./db');

var ff = '';

module.exports = {
    renderIndex : (req, res) => {
        res.sendFile(__dirname + '/templates/chat.html');
        ff = req.params.id;
    },
    renderMain : (req, res) => {
        res.sendFile(__dirname + '/templates/main.html');
    },
    login : (req, res) => {
        res.sendFile(__dirname + '/templates/login.html');
    },
    loginCheck : (req, res) => {
        let body = req.body;
        var id = body.id;
        var pw = body.pw;
        console.log(id+" : "+pw);
        res.sendFile(__dirname + '/templates/login.html');
        // if(){
        //
        // }else{
        //     res.sendFile(__dirname + '/templates/login.html');
        // }
    },
    signup : (req, res) => {
          res.sendFile(__dirname + '/templates/signup.html');
    },
    chatList: (req, res) => {
        rooms = db.roomList();
        res.json({
            rooms: rooms,
        });
    },






    test : (req, res) => {
      res.sendFile(__dirname + '/templates/test.html');
    },
    test2 : (req, res) => {
      res.sendFile(__dirname + '/templates/btsChatCss.html');
    },

}
