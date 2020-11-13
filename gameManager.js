class GameManager{
  constructor(request_handler){
    this.REQUEST_HANDLER = request_handler;
  }
  parse_move(move_str){
    if(move_str == null || typeof(move_str) != 'string')
      return  null;
    move_str = move_str.split(',');
    var row1 = parseInt(move_str[0]), col1 = parseInt(move_str[1]), row2 = parseInt(move_str[2]), col2 = parseInt(move_str[3]);
    return [row1, col1, row2, col2];
  }
  is_player1(user_id, room){
    return (user_id == room.p1)? true: false;
  }
  valid_to_make_move(user_id, room){

    if(room == null)
      return {
        success: false,
        msg: "Invalid room"
      };
      
    if(room.p1 != user_id && room.p2 != user_id)
      return {
        success: false,
        msg: "Something wrong happened, please refresh the page!"
      };
    var is_p1 = this.is_player1(user_id, room);

    if( is_p1 != room.chess.p1_turn)
      return {
        success: false,
        msg: "This is your opponent turn, please wait!"
      }



    if(room.pause == true)
      return {
        success: false,
        msg: "Please wait for your opponent to join!"
      };

    return{
      success: true,
      msg: "Success!"
    }
  }
  make_move(move_string, user_id, room){ //public

    var valid_check = this.valid_to_make_move(user_id, room);

    if(!valid_check.success)
      return valid_check;
    var move = this.parse_move(move_string);

    if(move == null|| isNaN(move[0]) || isNaN(move[1]) || isNaN(move[2]) || isNaN(move[3])){
      return {
        success: false,
        msg: "Invalid move format!"
      };
    }

    var game = room.chess;

    var result = game.move(move[0], move[1], move[2], move[3]);

    //console.log(result);

    return {
      success: result[0],
      msg: result[1]
    };
  }
}

module.exports = GameManager;
