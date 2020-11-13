class Chess{
  constructor(size=8, pieces=null, p1_turn=true){
    if(pieces == null){
      pieces = Chess.start_board_pieces();
    }
    //GAME STATUS
    this.ONGOING = 0;
    this.DRAW = -1;
    this.P1_WIN = 1;
    this.P2_WIN = 2;


    this.size = size;
    this.board = this.create_empty_board(this.size);
    this.current_pieces = new Set();
    this.p1_turn = p1_turn;
    this.promoted_piece = "queen"; //by default, we promote queen
    this.prev_moves = [];

    pieces.forEach((piece) => {
      this.add_piece(piece);
    });

    //game status
    this.game_status = this.ONGOING;
    this.is_check = false;

    this.sync_avail_moves();
    this.sync_game_status();

  }

  static start_board_pieces(){
    return [new Piece("rock", 0, 0, false), new Piece("knight", 0, 1, false), new Piece("bishop", 0, 2, false), new Piece("queen", 0, 3, false)
           ,new Piece("king", 0, 4, false), new Piece("bishop", 0, 5, false), new Piece("knight", 0, 6, false), new Piece("rock", 0, 7, false)
           ,new Piece("pawn", 1, 0, false), new Piece("pawn", 1, 1, false), new Piece("pawn", 1, 2, false), new Piece("pawn", 1, 3, false)
           ,new Piece("pawn", 1, 4, false), new Piece("pawn", 1, 5, false), new Piece("pawn", 1, 6, false), new Piece("pawn", 1, 7, false)
           ,new Piece("rock", 7, 7, true), new Piece("knight", 7, 6, true), new Piece("bishop", 7, 5, true), new Piece("queen", 7, 3, true)
           ,new Piece("king", 7, 4, true), new Piece("bishop", 7, 2, true), new Piece("knight", 7, 1, true), new Piece("rock", 7, 0, true)
           ,new Piece("pawn", 6, 0, true), new Piece("pawn", 6, 1, true), new Piece("pawn", 6, 2, true), new Piece("pawn", 6, 3, true)
           ,new Piece("pawn", 6, 4, true), new Piece("pawn", 6, 5, true), new Piece("pawn", 6, 6, true), new Piece("pawn", 6, 7, true)
         ];
  }
  sync_game_status(){
    var valid_move_cnt = 0;
    this.current_pieces.forEach((piece)=>{
      if(piece.is_player1 != this.p1_turn)
        return;
      valid_move_cnt += piece.available_moves.length;
    });

    if(ChessRules.is_check(this.board, this.p1_turn)){
      //it is a checkmate, no legal move to avoid the check
      if(valid_move_cnt == 0){
        this.game_status = (this.p1_turn == true)? this.P2_WIN: this.P1_WIN;
        this.is_check = false;
      }
      else{
        this.is_check = true;
      }
    }
    else{
      if(valid_move_cnt == 0){
        this.game_status = this.DRAW;
      }
      else{
        this.game_status = this.ONGOING;
      }
      this.is_check = false;

    }
  }
  is_game_end(){
    if(this.game_status == this.DRAW)
      return [true, "Draw Game!"];
    if(this.game_status == this.P1_WIN)
      return [true, "P1 Win!"];
    if(this.game_status == this.P2_WIN)
      return [true, "P2 Win!"];
    return [false, "Ongoing game!"];
  }
  sync_avail_moves(){
    //copy is needed because we might mutate the current_pieces
    var cur_pieces = new Set(this.current_pieces);
    cur_pieces.forEach((piece)=>{
      this.populate_valid_moves(piece.pos.row, piece.pos.col);
    })
  }
  create_empty_board(size){
    var board = new Array(size);
    for(var i = 0; i < size; i ++){
      board[i] = new Array(size);
    }
    return board;
  }
  add_piece(piece){
    if(piece == null || !ChessRules.is_valid_piece(piece)){
      return [false, "Invalid type of chess piece!"];
    }
    var pos = piece.pos;
    if(!ChessRules.is_valid_pos(pos.row, pos.col, this.board)){
      return [false, "Chess piece is out of range!"];
    }
    if(this.board[pos.row][pos.col] != null){
      return [false,  "This position has been occupied"];
    }

    this.board[pos.row][pos.col] = piece;
    this.current_pieces.add(piece);
    return [true, "Success!"];
  }
  remove_piece(piece){
    if(piece == null)
      return;
    var pos = piece.pos;
    if(!ChessRules.is_valid_pos(pos.row, pos.col, this.board)){
      return [false, "Chess piece is out of range!"];
    }

    this.board[pos.row][pos.col] = null;
    this.current_pieces.delete(piece);
    return [true, "Success!"];
  }
  move(row, col, next_row, next_col){
    var check_status_result = this.is_game_end();
    if(check_status_result[0]){
      return [false, check_status_result[1]];
    }
    if(!ChessRules.is_valid_pos(row, col, this.board) || this.board[row][col] == null)
      return [false, "Invalid or empty position"];
    var piece = this.board[row][col];
    if(this.p1_turn != piece.is_player1)
      return [false, "Invalid move! This is not your chess piece"];

    if(!this.is_valid_chess_move(next_row, next_col, piece))
      return [false, "Invalid move"];


    this.make_move(next_row, next_col, piece);

    //special move for king: casliting
    if(piece.type == 'king' && Math.abs(next_col - col) == 2){//move 2 col => calisting, assuming the move is valid
      console.log("Castling");
      var to_the_left = (next_col < col)? true : false;
      var rock_row = row;
      var rock_col = (to_the_left == true)? 0 : this.size - 1;
      var rock_piece = this.board[rock_row][rock_col];
      var rock_next_col = (to_the_left == true)? next_col + 1: next_col - 1
      if(rock_piece.type == "rock" && rock_piece.move_cnt == 0){
        this.make_move(rock_row, rock_next_col, rock_piece, false);
      }
      else{
        console.log("Error on castling", rock_piece);
      }
    }

    this.check_pawn_promotion(next_row, next_col);
    this.sync_avail_moves();
    this.sync_game_status();


    return [true, "Success move!"];
  }
  check_pawn_promotion(row, col){
    if(row >= this.size || col >= this.size || this.board[row][col] == null || this.board[row][col].type != 'pawn')
      return;
    var piece = this.board[row][col];
    var direction = (piece.is_player1 == true)? -1: 1;

    if(row + direction == this.size || row + direction < 0){ //PAWN PROMOTION
      piece.type = this.promoted_piece;
    }
  }
  is_valid_chess_move(next_row, next_col, piece){

    var next_pos = new Pos(next_row, next_col);

    for(var i = 0; i < piece.available_moves.length; i++){
      var pos = piece.available_moves[i];
      if(Pos.compare(next_pos, pos)){
        return true;
      }
    }
    return false;
  }
  make_move(next_row, next_col, piece, switch_turn=true){
    //ASSUME: The move is valid
    var removed_piece = this.board[next_row][next_col];
    var row = piece.pos.row;
    var col = piece.pos.col;
    //special capture move for pawn
    if(piece.type == 'pawn' && next_col != col){// move diagonally to capture piece
      //if En passant, replace the remove_piece with the enemy pawn at the same rank
      //This assumes that it is valid move
      if(removed_piece == null){
        console.log("En passant")
        removed_piece = this.board[row][next_col];
      }
    }
    this.remove_piece(removed_piece);
    this.remove_piece(piece);

    piece.pos.row = next_row;
    piece.pos.col = next_col;
    piece.move_cnt += 1;
    this.add_piece(piece);

    if(switch_turn)
      this.p1_turn = !this.p1_turn;

    this.prev_moves.push({
      from: new Pos(row, col),
      to: new Pos(next_row, next_col),
      removed_piece: removed_piece
    })

  }
  reverse_last_move(){
    if(this.prev_moves.length == 0)
      return false;
    var prev_move = this.prev_moves.pop();
    var next_pos = prev_move.from;
    var cur_pos = prev_move.to;
    var removed_piece = prev_move.removed_piece;

    (prev_move, this.board)
    var piece = this.board[cur_pos.row][cur_pos.col];

    this.remove_piece(piece);
    piece.pos.row = next_pos.row;
    piece.pos.col = next_pos.col;
    piece.move_cnt -= 1;
    this.add_piece(piece);
    this.add_piece(removed_piece);

    this.p1_turn = !this.p1_turn;

    return true;
  }

  populate_valid_moves(row, col){
    if(!ChessRules.is_valid_pos(row, col, this.board) || this.board[row][col] == null){
      return false;
    }
    var piece = this.board[row][col];
    var moves = ChessRules.available_moves(piece, this.board, this.prev_moves);

    //check if make a move lead to a check for the opponent, but only check for the player who has the turn
    piece.available_moves = [];
    for(var i = 0; i < moves.length; i++){
      var move = moves[i];
      this.make_move(move.row, move.col, piece);
      if(!ChessRules.is_check(this.board, piece.is_player1)){
        piece.available_moves.push(move);
      }
      this.reverse_last_move();
    }
    return true;
  }
  // toString(){
  //   var board_string = [];
  //   for(var r = 0; r < this.board.length; r++){
  //     var row_string = [];
  //     for(var c = 0; c < this.board.length; c++){
  //       var cell_string = "     ";
  //       if(this.board[r][c] != null)
  //         cell_string = this.board[r][c].toString();
  //       row_string.push(cell_string);
  //     }
  //     board_string.push(row_string.join("|"));
  //   }
  //   return board_string.join("\n");
  // }
  //
  clone(){
    var pieces = [];
    this.current_pieces.forEach((piece)=>{
      pieces.push(piece.clone());
    });
    return new Chess(this.size, pieces, new Set(this.removed_pieces_p1), new Set(this.removed_pieces_p2), this.p1_turn );
  }

}

class Piece{
  constructor(type, row, col, is_player1=true, move_cnt=0, avail_moves= []){
    //Player 1 is in the upper side of the board
    //Player 2 is in the lower side of the board
    this.type = type.toLowerCase();
    this.pos = new Pos(row, col);
    this.is_player1 = is_player1;
    this.move_cnt = move_cnt;
    this.available_moves = avail_moves;
  }
  toString(){
    var player = '1';
    if(!this.is_player1)
      player = '2';
    return this.type.slice(0, 4) + player;
  }
  clone(){
    return new Piece(this.type, this.pos.row, this.pos.col, this.is_player1, this.move_cnt, this.available_moves);
  }


}
class Pos{
  constructor(row, col){
    this.row = row;
    this.col = col;
  }
  static compare(a, b){
    if(a.row == b.row && a.col == b.col)
      return true;
    return false;
  }
}
class ChessRules{
  static is_valid_piece(piece){
    var type = piece.type;
    switch(type){
      case "king":
        return true;
      case "queen":
        return true;
      case "pawn":
        return true;
      case "rock":
        return true;
      case "bishop":
        return true;
      case "knight":
        return true;
      default:
        return false;
    }
  }
  static is_valid_pos(row, col, board){

    if(row < 0 || col < 0 || row >= board.length || col >= board.length)
      return false;
    return true;
  }
  static is_valid_to_move(row, col, piece, board){
    if(!ChessRules.is_valid_pos(row, col, board))
      return false;
    if(row == piece.pos.row && piece.pos.col == col)
      return false;
    if(board[row][col] != null && board[row][col].is_player1 == piece.is_player1)
      return false;
    return true;
  }
  static is_valid_for_castling(piece, board, direction){
    if(piece.type != "king" || piece.move_cnt != 0)
      return false;
    var cur_col = piece.pos.col + direction;
    var row = piece.pos.row;
    var valid = false;
    while(ChessRules.is_valid_pos(row, cur_col, board)){
      if(board[row][cur_col] == null){
        cur_col += direction;
        continue;
      }
      if(board[row][cur_col].type == 'rock' && board[row][cur_col].move_cnt == 0){
        valid = true;
      }
      break;
    }
    return valid;
  }
  static king_moves(piece, board, special){
    var moves = [];
    for(var row_padding = -1; row_padding < 2; row_padding++){
      for(var col_padding = -1; col_padding < 2; col_padding++){
        var next_row = piece.pos.row + row_padding;
        var next_col = piece.pos.col + col_padding;
        if(!ChessRules.is_valid_to_move(next_row, next_col, piece, board))
          continue;
        moves.push(new Pos(next_row, next_col));
      }
    }

    if(special == false)
      return moves;
    //special move for king : Castling
    var left_dir = -1;
    var right_dir = 1;
    //left
    if(ChessRules.is_valid_for_castling(piece, board, left_dir)){
      moves.push(new Pos(piece.pos.row, piece.pos.col + 2*left_dir))
    }
    //right
    if(ChessRules.is_valid_for_castling(piece, board, right_dir)){
      moves.push(new Pos(piece.pos.row,  piece.pos.col + 2*right_dir))
    }

    return moves;
  }
  static knight_moves(piece, board){
    var move_padding = [[2, 1], [2,-1], [-2, -1], [-2, 1], [1, 2], [-1, 2], [-1, -2], [1, -2]];
    var moves = [];
    for(var i = 0; i < move_padding.length; i++){
      var padding = move_padding[i];
      var next_row = piece.pos.row + padding[0];
      var next_col = piece.pos.col + padding[1];
      if(!ChessRules.is_valid_to_move(next_row, next_col, piece, board))
        continue;
      moves.push(new Pos(next_row, next_col));
    }
    return moves;
  }
  static pawn_moves(piece, board, prev_moves=null, special){
    var moves = [];
    var direction = (piece.is_player1 == true)? -1: 1;
    var row = piece.pos.row;
    var col = piece.pos.col;

    //up 1
    var up_1_row = row + 1*direction;
    if(ChessRules.is_valid_pos(up_1_row, col, board) && board[up_1_row][col] == null){
      moves.push(new Pos(up_1_row, col));

      var up_2_row = row + 2*direction;
        //up 2, but only for first move
      if(piece.move_cnt == 0 && ChessRules.is_valid_pos(up_2_row, col, board) && board[up_2_row][col] == null)
        moves.push(new Pos(up_2_row, col));
    }
    //diagonal
    if(ChessRules.is_valid_to_move(up_1_row, col + 1, piece, board) && board[up_1_row][col + 1] != null)
      moves.push(new Pos(up_1_row, col + 1));
    if(ChessRules.is_valid_to_move(up_1_row, col - 1, piece, board) && board[up_1_row][col - 1] != null)
      moves.push(new Pos(up_1_row, col - 1));

    var prev_move = (prev_moves == null || prev_moves.length == 0)? null : prev_moves[prev_moves.length-1];

    //check for En passant
    //If the enemy's pawn just move up 2 row (its first move) and arrive at the same row as our pawn => we can capture that pawn
    if(special == true && prev_move != null){
      var prev_move_piece = board[prev_move.to.row][prev_move.to.col];
      if(prev_move_piece.type == "pawn" && prev_move_piece.is_player1 != piece.is_player1 && prev_move_piece.pos.row == piece.pos.row && Math.abs(prev_move_piece.pos.col - piece.pos.col) == 1 && Math.abs(prev_move.from.row - prev_move.to.row) == 2){
        moves.push(new Pos(up_1_row, prev_move_piece.pos.col));
      }
    }
    return moves;
  }
  static move_to_direction(row_padding, col_padding, piece, board){
    var next_row = piece.pos.row + row_padding;
    var next_col = piece.pos.col  + col_padding;
    var moves = [];
    while(ChessRules.is_valid_pos(next_row, next_col, board)){
      if(board[next_row][next_col] != null){
        if(board[next_row][next_col].is_player1 != piece.is_player1){
          moves.push(new Pos(next_row, next_col));
        }
        break;
      }
      moves.push(new Pos(next_row, next_col));

      next_row = next_row + row_padding;
      next_col = next_col + col_padding;
    }
    return moves;
  }
  static rock_moves(piece, board){
    var moves_up = ChessRules.move_to_direction(-1, 0, piece, board);
    var moves_down = ChessRules.move_to_direction(1, 0, piece, board);
    var moves_left = ChessRules.move_to_direction(0, -1, piece, board);
    var moves_right = ChessRules.move_to_direction(0, 1, piece, board);
    var moves = moves_up.concat(moves_down, moves_left, moves_right);
    return moves;
  }
  static bishop_moves(piece, board){
    var moves_up_left = ChessRules.move_to_direction(-1, -1, piece, board);
    var moves_up_right = ChessRules.move_to_direction(-1, 1, piece, board);
    var moves_down_left = ChessRules.move_to_direction(1, -1, piece, board);
    var moves_down_right = ChessRules.move_to_direction(1, 1, piece, board);
    var moves = moves_up_left.concat(moves_up_right, moves_down_left, moves_down_right);
    return moves;
  }
  static queen_moves(piece, board){
    var moves_up = ChessRules.move_to_direction(-1, 0, piece, board);
    var moves_down = ChessRules.move_to_direction(1, 0, piece, board);
    var moves_left = ChessRules.move_to_direction(0, -1, piece, board);
    var moves_right = ChessRules.move_to_direction(0, 1, piece, board);
    var moves_up_left = ChessRules.move_to_direction(-1, -1, piece, board);
    var moves_up_right = ChessRules.move_to_direction(-1, 1, piece, board);
    var moves_down_left = ChessRules.move_to_direction(1, -1, piece, board);
    var moves_down_right = ChessRules.move_to_direction(1, 1, piece, board);
    var moves = moves_up.concat(moves_down, moves_left, moves_right, moves_up_left, moves_up_right, moves_down_left, moves_down_right);
    return moves;
  }
  static available_moves(piece, board, prev_moves=null, special=true){

    switch(piece.type){
      case "king":
        return ChessRules.king_moves(piece, board, special);
      case "queen":
        return ChessRules.queen_moves(piece, board);
      case "pawn":
        return ChessRules.pawn_moves(piece, board, prev_moves, special);
      case "rock":
        return ChessRules.rock_moves(piece, board);
      case "bishop":
        return ChessRules.bishop_moves(piece, board);
      case "knight":
        return ChessRules.knight_moves(piece, board);
      default:
        throw "Invalid chess piece";
    }
  }

  static is_check(board, checked_player_1){

    for(var r = 0; r < board.length; r++){
      for(var c = 0; c < board.length; c++){
        //only consider piece owns by the other player
        var piece = board[r][c];
        if(piece != null && piece.is_player1 != checked_player_1){
          var moves = ChessRules.available_moves(piece, board, null, false);
          for(var i = 0; i < moves.length; i++){
            var pos = moves[i];
            var next_piece = board[pos.row][pos.col];
            if(next_piece != null && next_piece.type == "king" && next_piece.is_player1 == checked_player_1)
              return true;
          }
        }
      }
    }
    return false;
  }
}
module.exports = {
  Chess,
  Piece,
  Pos,
  ChessRules
};
