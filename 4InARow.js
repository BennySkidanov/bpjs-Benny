// Some sort of import 

/* Game Rules : 
 * 2 players - Red and Yellow, each has 21 round pieces in the color of the player. 
 * Lets assume, Yellow ( Computer ) and Red ( player ). 
 * A 6 x 7 board grid, which includes 42 positions for the round pieces mentioned earlier.
 * In an alternating order, each players chooses a column and releases a piece down the column. the piece lands and stays ( from that moment and on thorught the gam ) in the "lowest" 
 * possible position in the chosen column.
 * The goal of the game is to place 4 pieces in a row, column or diagonal. 
 * Strategies : 
 * 1. Of course, do not let the oponnet win. 
   2. Play the centher column as much as possible.
   3. Create bottom 3 Trap.
 
 
 Wikipedia : The pieces fall straight down, occupying the lowest available space within the column. 
 The objective of the game is to be the first to form a horizontal, vertical, or diagonal line of four of one's own discs. 
 Connect Four is a solved game. The first player can always win by playing the right moves.
 */ 
 
bp.log.info("Connect Four - Let's Go!!");
 
StaticEvents = {
	'RedWin':bp.Event("RedWin"),
	'YellowWin':bp.Event("YellowWin"),
	'Draw':bp.Event("Draw")
}; 

// Game ends when : 1. Either of the players has won ( Red or Yellow ) 2. It's a draw
bp.registerBThread("EndOfGame", function() {
	bp.sync({ waitFor:[ StaticEvents.RedWin, StaticEvents.YellowWin, StaticEvents.Draw ] });
	bp.sync({ block:[ redMovesES, yellowMovesES ] });
});


var moves = bp.EventSet("Move events", function(e) {
	return e.name.startsWith("Red") || e.name.startsWith("Yellow");
});

bp.registerBThread("DetectDraw", function() {
	for (var i=0; i< 42; i++) { bp.sync({ waitFor:[ moves ] }); }
	bp.sync({ request:[ StaticEvents.Draw ] }, 90);
});
 

function putInColRed(col) {
	return bp.Event( "RedCol" + "(" + col + ")");
}
function putInColYellow(col) {
	return bp.Event( "YellowCol" + "(" + col + ")");
}

function putCoinRed(row, col) {
	return bp.Event("RedCoin" + "(" + row + "," + col + ")");
}

function putCoinYellow(row, col) {
	return bp.Event("YellowCoin" + "(" + row + "," + col + ")");
}

const redES = bp.EventSet( "Red moves", function(evt){
    return evt.name.startsWith("RedCol");
});

const yellowES = bp.EventSet( "Yellow moves", function(evt){
    return evt.name.startsWith("YellowCol");
});

const redESCoin = bp.EventSet( "Red moves", function(evt){
    return evt.name.startsWith("RedCoin");
});

const yellowESCoin = bp.EventSet( "Yellow moves", function(evt){
    return evt.name.startsWith("YellowCoin");
});

const redMovesES = bp.EventSet( "Red moves", function(evt){
    return evt.name.startsWith("RedCoin") || evt.name.startsWith("RedCol")  ;
});
const yellowMovesES = bp.EventSet( "Red moves", function(evt){
    return evt.name.startsWith("YellowCoin") || evt.name.startsWith("YellowCol")  ;
});

// Represents alternating turns as mentioned in the game rules 
bp.registerBThread("EnforceTurns", function() {
	while (true) {
		bp.sync({ waitFor:yellowES, block: redMovesES});
		bp.sync({ waitFor:yellowESCoin, block: [redMovesES, yellowES]});
		bp.sync({ waitFor:redES, block: yellowMovesES});	
		bp.sync({ waitFor:redESCoin, block: [yellowMovesES, redES]});	
	}
});

// when the CPU or the player wants to make a move, we need to ensure the coin placement is the deepest possible in the column 
// Doesn't work 
function colSpectator ( column ) {
		bp.registerBThread("placemmt in column " + column , function() { 
			for( var i = 5; i >= 0 ; i-- ) {
				var e = bp.sync( { waitFor : [ putInColRed(column) , putInColYellow(column) ] } );
				// bp.log.info(e.name); // Debug
				if ( e.name.startsWith("RedCol") ) {
					bp.sync( { request : [ putCoinRed(i, column) ] , block: yellowMovesES } , 60 );
				}
				else {
					bp.sync( { request : [ putCoinYellow(i, column) ] , block : redMovesES} , 60 );
				}
			}
			while (true) {
				bp.sync( { block : [ putInColRed(column) , putInColYellow(column) ] } );
			}
		});			
}

let j = 0; 
for( j=0; j < 7; j++ ) 
{
	colSpectator(j);
}
 
function addLinePermutationBthreads(l, p) {

	// Represents when Red wins
	bp.registerBThread("DetectRedWin(<" + l[p[0]].x + "," + l[p[0]].y + ">," + "<" + l[p[1]].x + "," + l[p[1]].y + ">," + "<" + l[p[2]].x + "," + l[p[2]].y + ">," + "<" + l[p[3]].x + "," + l[p[3]].y + ">)", function() {
		while (true) {
			bp.sync({ waitFor:[ putCoinRed (l[p[0]].x, l[p[0]].y) ] });

			bp.sync({ waitFor:[ putCoinRed(l[p[1]].x, l[p[1]].y) ] });

			bp.sync({ waitFor:[ putCoinRed(l[p[2]].x, l[p[2]].y) ] });
			
			bp.sync({ waitFor:[ putCoinRed(l[p[3]].x, l[p[3]].y) ] });

			bp.sync({ request:[ StaticEvents.RedWin ],  block:[ redES, yellowES, redESCoin, yellowESCoin ] }, 100);

		}
	});

	// Represents when O wins
	bp.registerBThread("DetectYellowWin(<" + l[p[0]].x + "," + l[p[0]].y + ">," + "<" + l[p[1]].x + "," + l[p[1]].y + ">," + "<" + l[p[2]].x + "," + l[p[2]].y + ">," + "<" + l[p[3]].x + "," + l[p[3]].y + ">)", function() {
		while (true) {
			bp.sync({ waitFor:[ putCoinYellow (l[p[0]].x, l[p[0]].y) ] });

			bp.sync({ waitFor:[ putCoinYellow(l[p[1]].x, l[p[1]].y) ] });

			bp.sync({ waitFor:[ putCoinYellow (l[p[2]].x, l[p[2]].y) ] });
			
			bp.sync({ waitFor:[ putCoinYellow (l[p[3]].x, l[p[3]].y) ] });

			bp.sync({ request:[ StaticEvents.YellowWin ] ,  block:[ redES, yellowES, redESCoin, yellowESCoin ] }, 100);

		}
	});

	
	// Red player can win in the next move 
	bp.registerBThread("MoveToWinRed(<" + l[p[0]].x + "," + l[p[0]].y + ">," + "<" + l[p[1]].x + "," + l[p[1]].y + ">," + "<" + l[p[2]].x + "," + l[p[2]].y + ">," + "<" + l[p[3]].x + "," + l[p[3]].y + ">)", function() {
			
			bp.sync({ waitFor:[ putCoinRed (l[p[0]].x, l[p[0]].y) ] });

			bp.sync({ waitFor:[ putCoinRed(l[p[1]].x, l[p[1]].y) ] });

			bp.sync({ waitFor:[ putCoinRed (l[p[2]].x, l[p[2]].y) ] });
			
			bp.log.info("Red - One move to Win!");

			// bp.sync({ request:[ putCoinRed(l[p[3]].x, l[p[3]].y) ] }, 80);
			bp.sync({ request: putInColRed(l[p[3]].y)}, 85);
	});

	// Red player can prevent yellow player from winning in the next move 
	bp.registerBThread("PreventYellowFromWinning(<"  + l[p[0]].x + "," + l[p[0]].y + ">," + "<" + l[p[1]].x + "," + l[p[1]].y + ">," + "<" + l[p[2]].x + "," + l[p[2]].y + ">," + "<" + l[p[3]].x + "," + l[p[3]].y + ">)", function() {
			bp.sync({ waitFor:[ putCoinYellow(l[p[0]].x, l[p[0]].y) ] });

			bp.sync({ waitFor:[ putCoinYellow(l[p[1]].x, l[p[1]].y) ] });
			
			bp.sync({ waitFor:[ putCoinYellow(l[p[2]].x, l[p[2]].y) ] });
			
			bp.log.info("Red - Prevent opponent win!!" + " (" + l[p[3]].x + "," + l[p[3]].y + ")" );

			//bp.sync({ request:[ putCoinRed(l[p[3]].x, l[p[3]].y) ] }, 70);
		
			bp.sync({ request:putInColRed(l[p[3]].y)}, 80);
	});
	
}


var lines = [];

for(var i = 0; i < 3; i++ ) { 
	for(var j = 0; j < 4; j++) {
		lines.push( [ { x : i, y : j } , { x : i, y : j+1 } , { x : i, y : j+2 } , { x : i, y : j+3 } ] );
		lines.push( [ { x : i, y : j } , { x : i + 1, y : j } , { x : i + 2, y : j } , { x : i + 3, y : j } ] );
	}
}

for(var i = 0; i < 6; i++ ) { 
	for(var j = 0; j < 4; j++) {
		if( i <= 2 && j <= 3 ) {
			lines.push( [ { x : i, y : j } , { x : i + 1, y : j+1 } , { x : i + 2, y : j+2 } , { x : i + 3, y : j+3 } ] );
		}
		else {
			lines.push( [ { x : i, y : j } , { x : i - 1, y : j+1 } , { x : i - 2, y : j+2 } , { x : i - 3, y : j+3 } ] );
		}
	}
}


var perms = [ [ 0, 1, 2, 3 ], [ 0, 1, 3, 2 ], [ 0, 2, 1, 3 ], [ 0, 2, 3, 1 ], [ 0, 3, 1, 2 ], [ 0, 3, 2, 1 ],
              [ 1, 0, 2, 3 ], [ 1, 0, 3, 2 ], [ 1, 2, 0, 3 ], [ 1, 2, 3, 0 ], [ 1, 3, 0, 2 ], [ 1, 3, 2, 0 ],
			  [ 2, 1, 0, 3 ], [ 2, 1, 3, 0 ], [ 2, 0, 1, 3 ], [ 2, 0, 3, 1 ], [ 2, 3, 1, 0 ], [ 2, 3, 0, 1 ],
			  [ 3, 1, 2, 0 ], [ 3, 1, 0, 2 ], [ 3, 2, 1, 0 ], [ 3, 2, 0, 1 ], [ 3, 0, 1, 2 ], [ 3, 0, 2, 1 ]];

lines.forEach(function(l) {
	perms.forEach(function(p) {
		addLinePermutationBthreads(l, p);
	});
});

bp.registerBThread("CenterColYellow", function() {
	while (true) {
		bp.sync({ request:[ putInColYellow(3) ] }, 40);
	}
});
bp.registerBThread("CenterColRed", function() {
	while (true) {
		bp.sync({ request:[ putInColRed(3) ] }, 40);
	}
});

bp.registerBThread("semiCenterColYellow", function() {
	while (true) {
		bp.sync({ request:[ putInColYellow(1),putInColYellow(2), putInColYellow(4), putInColYellow(5) ] }, 25);
	}
});
bp.registerBThread("semiCenterColRed", function() {
	while (true) {
		bp.sync({ request:[ putInColRed(1),putInColRed(2), putInColRed(4), putInColRed(5) ] }, 25);
	}
});

bp.registerBThread("sideColYellow", function() {
	while (true) {
		bp.sync({ request:[ putInColYellow(0), putInColYellow(6) ] }, 10);
	}
});
bp.registerBThread("sideColRed", function() {
	while (true) {
		bp.sync({ request:[ putInColRed(0), putInColRed(6) ] }, 10);
	}
});

var board = [
  ['*', '*','*', '*','*', '*','*'],
  
  ['*', '*','*', '*','*', '*','*'],
  
  ['*', '*','*', '*','*', '*','*'],
  
  ['*', '*','*', '*','*', '*','*'],
  
  ['*', '*','*', '*','*', '*','*'],
  
  ['*', '*','*', '*','*', '*','*'],
];

bp.registerBThread("boardUpdate", function() {
	for(var i=0; i < 42; i++) {
		var e = bp.sync({ waitFor:[ redESCoin, yellowESCoin ]});
		if(e.name.startsWith("Red")) {
			let row = e.name.charCodeAt(8) - 48;
			let col = e.name.charCodeAt(10) - 48;
			board[row][col] = 'R';
		}
		else {
			let row = e.name.charCodeAt(11) - 48;
			let col = e.name.charCodeAt(13) - 48;
			bp.log.info("row - " + row + ", " + "col - " + col);
			board[row][col] = 'Y';
		}
		// print board
		
		for(var i = 0; i < 6; i++) {
			bp.log.info(board[i][0] + "  " + board[i][1] + "  " + board[i][2] + "  " + board[i][3] + "  " + board[i][4] + "  " + board[i][5] + "  " + board[i][6]);
		}
	}
});
