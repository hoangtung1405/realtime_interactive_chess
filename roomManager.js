
class RoomManager{
  constructor(request_handler, size=30000){
    this.USER_TO_ROOM = {};
    this.ROOMS_STATE = {};
    this.REQUEST_HANDLER = request_handler;
    this.max_size = size;
    //for random generator
    this.CHAR = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  }
  authenticate_user(user_id){ //public
    if(!this.is_user_exist(user_id))
      return {
        success: false,
        msg: "Failed to authenticate the user"
      };
    return {
      success: true,
      msg: "Success!"
    };
  }
  join_room(user_id, room_id, username = null){ //public
    var auth_result = this.authenticate_user(user_id);
    if(!auth_result.success)
      return auth_result;

    if(this.USER_TO_ROOM[user_id] != null && this.USER_TO_ROOM[user_id] != room_id){
      return{
        success: false,
        msg: "You have already join a different room"
      }
    }
    if(!this.valid_room_to_join(user_id, room_id))
      return {
        success:false,
        msg: "The room is full or does not exist! Please try a different room ID"
      };

    var room = this.get_room(room_id);

    if(room.p1 != user_id && room.p2 != user_id){
      if(room.p1 == null){
        room.p1 = user_id;
        if(username != null)
          room.p1_username = username;
      }
      else{
        room.p2 = user_id;
        if(username != null)
          room.p2_username = username;
      }
    }
    this.USER_TO_ROOM[user_id] = room_id;
    var msg = "You have joined the room successfully!";
    if(this.is_full(room_id)){
      room.pause = false;
      msg = "Ready to start the game!";
    }
    return {
      success: true,
      msg: msg
    };
  }
  create_room(user_id, username=null){ //public
    var auth_result = this.authenticate_user(user_id);
    if(!auth_result.success)
      return auth_result;

    if(this.ROOMS_STATE.length == this.max_size)
      return {
        success: false,
        msg: "We have filled all rooms! Please try again later!"
      };

    if(this.USER_TO_ROOM[user_id] != null){
      return{
        success: false,
        msg: "You have already join a room"
      }
    }
    var new_id = this.get_new_room_id();

    var new_game = this.REQUEST_HANDLER.new_chess_game();
      this.ROOMS_STATE[new_id] = {
        room_number: new_id,
        p1: user_id,
        p1_username: username,
        p2: null,
        p2_username: null,
        chess: new_game,
        pause: true
      }

      this.USER_TO_ROOM[user_id] = new_id;

      return {
        success: true,
        msg: "Success!"
      };
  }
  create_new_user(){ //public
    var user_id = this.get_new_user_id();
    this.USER_TO_ROOM[user_id] = null;
    return user_id;
  }
  quit_room(user_id){
    var auth_result = this.authenticate_user(user_id);
    if(!auth_result.success)
      return auth_result;
    if(user_id in this.USER_TO_ROOM){
      var room = this.get_user_room(user_id);
      //remove user from room state
      if(room == null)
        return {
          success: false,
          msg: "You did not enter a room!"
        }

      if(room.p1 == user_id){
        room.p1 = null;
        room.p1_username = null;
      }
      else{
        room.p2 = null;
        room.p2_username = null;
      }

      //delete the mapping
      room.pause = true;
      this.USER_TO_ROOM[user_id] = null;
    }
    return {
      success: true,
      msg: "Success to quit room!"
    }

  }
  is_user_exist(user_id){
    if(user_id == null)
      return false;
    return (user_id in this.USER_TO_ROOM);
  }
  get_user_room(user_id){ //public
    if(!this.is_user_exist(user_id))
      return null;
    var room_id = this.USER_TO_ROOM[user_id];

    return this.get_room(room_id);
  }
  is_room_exist(room_id){
    if(room_id == null)
      return false;
    return (room_id in this.ROOMS_STATE)
  }
  get_room(room_id){
    if(!this.is_room_exist(room_id))
      return null;
    return this.ROOMS_STATE[room_id];
  }

  is_full(room_id){ //private, should only be use by Room Manager
    if(!this.is_room_exist(room_id)) //should not enter here
      return false;

    var room = this.get_room(room_id);
    if(room.p1 != null && room.p2 != null)
      return true;
    return false;
  }
  valid_room_to_join(user_id, room_id){
    if(!this.is_room_exist(room_id))
      return false;

    var room = this.get_room(room_id);
    if(room.p1 == user_id || room.p2 == user_id)
      return true;

    if(this.is_full(room_id))
      return false;
    return true;
  }
  get_new_user_id(){
    var new_id = this.generate_random_id();
    while(this.is_user_exist(new_id)){
      new_id = this.generate_random_id();
    }
    return new_id;
  }
  get_new_room_id(){
    var new_id = this.generate_random_id();
    while(this.is_room_exist(new_id)){
      new_id = this.generate_random_id();
    }
    return new_id;
  }
  generate_random_id(){ //might need a new class in the future
    var length = Math.floor(Math.random()*3) + 5;
    var id = []
    for(var i = 0; i < length; i++){
      id.push(this.CHAR[Math.floor(Math.random()*this.CHAR.length)]);
    }
    return id.join('');
  }
}

module.exports = RoomManager;
