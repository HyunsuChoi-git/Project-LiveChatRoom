var db = require('./db')

var ff = '';

module.exports = {
    renderIndex : (req, res) => {
        res.sendFile(__dirname + '/templates/index.html');
        ff = req.params.id;
    },
    renderMain : (req, res) => {
        res.sendFile(__dirname + '/templates/main.html');
    },
    chatList: (req, res) => {
        rooms = db.roomList();
        res.json({
            rooms: rooms,
        });
    },
    paramName: (req, res) => {
      res.send(ff);
    }
}
