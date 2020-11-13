var GameManager = require('./gameManager.js');
var RoomManager = require('./roomManager.js');
var {Chess} = require('./chess.js');
class RequestHandler{
  constructor(){
    this.GAME_MANAGER = new GameManager(this);
    this.ROOM_MANAGER = new RoomManager(this);


  }
  quit_room(user_id){ //public
    return this.ROOM_MANAGER.quit_room(user_id);
  }
  authenticate_user(user_id){ //public
    return this.ROOM_MANAGER.authenticate_user(user_id);
  }
  join_room(user_id, room_id, username){ //public
    return this.ROOM_MANAGER.join_room(user_id, room_id, username);
  }
  get_user_room(user_id){ //public
    return this.ROOM_MANAGER.get_user_room(user_id);
  }
  create_room(user_id, username){ //public
    return this.ROOM_MANAGER.create_room(user_id, username);
  }
  make_move(move_string, user_id){ //public
    var auth_result = this.ROOM_MANAGER.authenticate_user(user_id);
    if(!auth_result.success)
      return auth_result;

    var room = this.ROOM_MANAGER.get_user_room(user_id);

    if(room == null)
      return {
        success: false,
        msg: "You did not enter a room!"
      };

    return this.GAME_MANAGER.make_move(move_string, user_id, room);
  }
  is_player1(user_id){ //public
    var room = this.get_user_room(user_id);
    if(room == null)
      return null;
    return this.GAME_MANAGER.is_player1(user_id, room);
  }
  create_new_user(){
    return this.ROOM_MANAGER.create_new_user();
  }
  new_chess_game(){ //internal
    return new Chess();
  }

}

module.exports = RequestHandler;
