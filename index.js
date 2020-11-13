var express = require('express');
var app = express();
var http = require('http').createServer(app);

var io = require('socket.io')(http);
app.use(express.static('.'));
const session = require('cookie-session')({
    name: 'interactive-chess-game',
    secret: 'dasdas0i-23mkjda0-123'
});

const RequestHandler = require('./requestHandler.js');
const PORT = process.env.PORT || 5000;

var request_handler = new RequestHandler();



app.get('/', function(req, res){
  session(req, res, () => {
    var user_id = req.session.user_id;

    if(!request_handler.authenticate_user(user_id).success)
      req.session.user_id = request_handler.create_new_user();

    if(request_handler.get_user_room(user_id) == null)
      res.sendFile(__dirname + '/home.html');
    else
      res.redirect("game_page");
  })


});


app.get('/signin', function(req, res){

  session(req, res, () => {
    var user_id = req.session.user_id;
    console.log("USER ID: ", user_id);
    if(!request_handler.authenticate_user(user_id).success)
      req.session.user_id = request_handler.create_new_user();

    res.send("SOME RESPONSE FROM SERVER")

  });

});


app.get("/game_page", function(req, res){
  session(req, res, () => {
    var user_id = req.session.user_id;
    if(!request_handler.authenticate_user(user_id).success || request_handler.get_user_room(user_id) == null){
      res.redirect("/");
    }
    else{
      res.sendFile(__dirname + '/game_page.html');
    }

  })

})

function get_response(success, error, data){
  return {
      success: success,
      error: error,
      data: data
    }
}

io.on('connection', function(socket){

  var cookieString = socket.request.headers.cookie;
  var req = {connection: {encrypted: false}, headers: {cookie: cookieString}}
  var res = {getHeader: () =>{}, setHeader: () => {}};
  session(req, res, () => {});


  console.log('a user connected with id: ' + socket.id);

  socket.on('create', function(input){
    var username = (input == null)? null: input.username;
    var user_id = req.session.user_id;
    var create_room_result = request_handler.create_room(user_id, username);
    console.log(user_id + "wants to create new room with username " + username, create_room_result);
    if(!create_room_result.success){
      io.to(socket.id).emit('msg', get_response(false, create_room_result.msg, null));
      return;
    }

    var new_room = request_handler.get_user_room(user_id);

    socket.join(new_room);
    console.log("SUCCESS to create room!", new_room.room_number);
    io.to(socket.id).emit('join', "/game_page");

  })
  socket.on('join_home_page', function(input){
    var username = input.username;
    var room_id = input.room;
    var user_id = req.session.user_id;
    console.log( user_id + ' wants to join: ' + room_id + ' with username ' + username);

    var join_room_result = request_handler.join_room(user_id, room_id, username);
    if(!join_room_result.success){
      io.to(socket.id).emit('msg', get_response(false, join_room_result.msg, null));
      return;
    }


    io.to(socket.id).emit('join', "game_page");

  })
  socket.on('join_game_page', function(){
    var user_id = req.session.user_id;
    console.log(user_id + "wants to join the game page");
    var room = request_handler.get_user_room(user_id);

    if(room == null){
      io.to(socket.id).emit('msg', get_response(false, "Something wrong happened, please refresh the page", null));
      return;
    }

    var join_room_result = request_handler.join_room(user_id, room.room_number);
    if(!join_room_result.success){
      io.to(socket.id).emit('msg', get_response(false, "Something wrong happened, please refresh the page", null));
      return;
    }

    socket.join(room.room_number);

    var is_player1 = request_handler.is_player1(user_id);

    var response_for_sender = get_response(true, null, {room: room, msg: join_room_result.msg, is_p1: is_player1, details: room});
    var response_for_opponent = get_response(true, null, {room: room, msg: join_room_result.msg, is_p1: !is_player1, details: room});
    io.to(socket.id).emit('render', response_for_sender);
    socket.to(room.room_number).emit('render', response_for_opponent);


  })
  socket.on('move', function(move_string){
    var user_id = req.session.user_id;
    var is_player1 = request_handler.is_player1(user_id);
    var move_result = request_handler.make_move(move_string, user_id);
    var room = request_handler.get_user_room(user_id);

    if(!move_result.success){
      io.to(socket.id).emit('render', get_response(true, null, {details: room, is_p1: is_player1, msg: move_result.msg}));
      return;
    }

    //success move

    var response_for_sender = get_response(true, null, {details: room, is_p1: is_player1, msg: move_result.msg});
    var response_for_opponent = get_response(true, null, {details: room, is_p1: !is_player1, msg: "Your opponent just made a move"});

    io.to(socket.id).emit('render', response_for_sender);
    socket.to(room.room_number).emit('render', response_for_opponent);

  });
  socket.on('quit', function(){
    var user_id = req.session.user_id;
    var room = request_handler.get_user_room(user_id);
    var result = request_handler.quit_room(user_id);
    console.log(user_id, " wants to quit room", result);
    if(room != null){
      socket.leave(room.room_number);
      console.log("leave ", room.room_number);
    }
    io.to(socket.id).emit('quit', get_response(result.success, null, {msg: result.msg}));

  });

  socket.on('disconnect', function(){


    console.log('user disconnected');
  })
});
http.listen(PORT, function(){
  console.log(`listening on *:${PORT}`);


});
