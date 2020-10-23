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

bp.registerBThread("DetectDraw", function() {
	for (var i=0; i< 42; i++) { bp.sync({ waitFor:[ moves ] }); }
	bp.sync({ request:[ StaticEvents.Draw ] }, 90);
});


var moves = bp.EventSet("Move events", function(e) {
	return e.name.startsWith("Red") || e.name.startsWith("Yellow");
});


 
// put in column event 
function putInCol(col, color) {
	return bp.Event( "Put " + color +" (" + col + ")", {color:color, col:col});
}

// put coin in specific cell event 
function putCoin(row, col, color) {
	return bp.Event("Coin " + color + "(" + row + "," + col + ")", {color:color, row:row, col:col});
}

const redColES = bp.EventSet( "Red Col moves", function(evt){
    return evt.name.startsWith("Put Red");
});

const yellowColES = bp.EventSet( "Yellow Col moves", function(evt){
    return evt.name.startsWith("Put Yellow");
});

const redCoinEs = bp.EventSet( "Red Coin moves", function(evt){
    return evt.name.startsWith("Coin Red");
});

const yellowCoinEs = bp.EventSet( "Yellow moves", function(evt){
    return evt.name.startsWith("Coin Yellow");
});

const redMovesES = bp.EventSet( "Red moves", function(evt){
    return evt.data.color.equals("Red");
});

const yellowMovesES = bp.EventSet( "Yellow moves", function(evt){
    return evt.data.color.equals("Yellow");
});

const AnyPut = bp.EventSet("Any Put", function(evt) {
	return evt.name.startsWith("Put");
});

/*function generatePutEventSet(col) {
	return bp.EventSet("Any Put in Col " + col, function(evt) {
		evt.name.startsWith("Put") && evt.data.col == col;
	});
}*/ 

const col0ES =  bp.EventSet("Any Put 0", function(evt) {
	return evt.name.startsWith("Put") && evt.data.col == 0.0;
});
const col1ES =  bp.EventSet("Any Put 1", function(evt) {
	return evt.name.startsWith("Put") && evt.data.col == 1.0;
});
const col2ES =  bp.EventSet("Any Put 2", function(evt) {
	return evt.name.startsWith("Put") && evt.data.col == 2.0;
});
const col3ES =  bp.EventSet("Any Put 3", function(evt) {
	return evt.name.startsWith("Put") && evt.data.col == 3.0;
});
const col4ES =  bp.EventSet("Any Put 4", function(evt) {
	return evt.name.startsWith("Put") && evt.data.col == 4.0;
});
const col5ES =  bp.EventSet("Any Put 5", function(evt) {
	return evt.name.startsWith("Put") && evt.data.col == 5.0;
});
const col6ES =  bp.EventSet("Any Put 6", function(evt) {
	return evt.name.startsWith("Put") && evt.data.col == 6.0;
});


// req1: Represents alternating turns as mentioned in the game rules 
bp.registerBThread("EnforceTurns", function() {
	while (true) {
		bp.sync({ waitFor:yellowColES, block: redMovesES});
		bp.sync({ waitFor:yellowCoinEs, block: [redMovesES, yellowColES]});
		bp.sync({ waitFor:redColES, block: yellowMovesES});	
		bp.sync({ waitFor:redCoinEs, block: [yellowMovesES, redColES]});	
	}
});

//req2: physics - after put in a col, the coin falls to the first available place
bp.registerBThread("put in col" , function() { 
	let columns = [ 5 , 5 , 5 , 5 , 5 , 5 , 5 ];
	while(true) {
		let e = bp.sync({waitFor: AnyPut });
		bp.sync({request: putCoin( columns[e.data.col]-- , e.data.col, e.data.color)});
	}
});

//req3: one cannot put a coin in a full column
function blockPutInFullColumn(col){
	bp.registerBThread("one cannot put a coin in a full column " + col , function() { 
        let es = col == 0 ? col0ES :
        col == 1 ? col1ES : 
        col == 2 ? col2ES : 
        col == 3 ? col3ES : 
        col == 4 ? col4ES : 
        col == 5 ? col5ES :
        col == 6 ? col6ES : null ;

		for(let i = 0; i < 6; i++) {
            bp.sync({ waitFor: es });
        }
        while(true) {
		    bp.sync({ block: es });
        }
    })
}

let j = 0; 
for( j=0; j < 7; j++ ) 
{
	blockPutInFullColumn(j);
}

//req4: if a player places 4 coins in a line - the player wins
let allFours=[]

/*
for(let i=0; i<4; i++) {
	for(let j=0; j<2; j++){
		var row=[]
		var col=[]
		var diag1=[]
		var diag2=[]
		for(let x=0; x<4; x++){
			row.push({row:i, col:j})
			col.push
		}
		allFours.push(row)
	}
}
*/

for(var i = 0; i < 3; i++ ) { 
	for(var j = 0; j < 4; j++) {
		allFours.push( [ { row : i, col : j } , { row : i, col : j+1 } , { row : i, col : j+2 } , { row : i, col : j+3 } ] );
		allFours.push( [ { row : i, col : j } , { row : i + 1, col : j } , { row : i + 2, col : j } , { row : i + 3, col : j } ] );
	}
}

for(var i = 0; i < 6; i++ ) { 
	for(var j = 0; j < 4; j++) {
		if( i <= 2 && j <= 3 ) {
			allFours.push( [ { row : i, col : j } , { row : i + 1, col : j+1 } , { row : i + 2, col : j+2 } , { row : i + 3, col : j+3 } ] );
		}
		else {
			allFours.push( [ { row : i, col : j } , { row : i - 1, col : j+1 } , { row : i - 2, col : j+2 } , { row : i - 3, col : j+3 } ] );
		}
	}
}


//rules for fours
allFours.forEach(four =>
		bp.registerBThread("Detect yellow win" , function() { 
			let coinOfFour = four.map(cell => putCoin(cell.row,cell.col,"Yellow")); // This is an array of 4 coin placemmt - in order to win one have to fill all 4 
			for(var i = 0; i < 4; i++) {
				bp.sync({waitFor: coinOfFour[i]})
			}
			bp.sync({request:StaticEvents.YellowWin, block: generatePutEventSet(col)})
		})
)


allFours.forEach(four =>
		bp.registerBThread("Detect Red win" , function() { 
			let coinOfFour = four.map(cell => putCoin(cell.row,cell.col,"Red")); // This is an array of 4 coin placemmt - in order to win one have to fill all 4 
			for(var i = 0; i < 4; i++) {
				bp.sync({waitFor: coinOfFour[i]})
			}
			bp.sync({request:StaticEvents.RedWin, block: generatePutEventSet(col)})
		})
)




/*
// when the CPU or the player wants to make a move, we need to ensure the coin placement is the deepest possible in the column  
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
*/
/*
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
*/

/*
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
*/
 

bp.registerBThread("CenterCol", function() {
	while (true) {
		bp.sync({ request:[ putInCol(3, "Yellow"), 
							putInCol(3, "Red") ] });
	}
});

bp.registerBThread("semiCenterCol", function() {
	while (true) {
		bp.sync({ request:[  putInCol(1, "Yellow") , putInCol(2, "Yellow") , putInCol(4, "Yellow") , putInCol(5, "Yellow"), 
							 putInCol(1, "Red") , putInCol(2, "Red") , putInCol(4, "Red") , putInCol(5, "Red") ] });
	}
});

bp.registerBThread("sideCol", function() {
	while (true) {
		bp.sync({ request:[ putInCol(0, "Yellow"),putInCol(6, "Yellow"),
							putInCol(0, "Red"),putInCol(6, "Red")     ] });
	}
});

bp.registerBThread("boardUpdate", function() {
	var board = [
	  ['*', '*','*', '*','*', '*','*'],
	  
	  ['*', '*','*', '*','*', '*','*'],
	  
	  ['*', '*','*', '*','*', '*','*'],
	  
	  ['*', '*','*', '*','*', '*','*'],
	  
	  ['*', '*','*', '*','*', '*','*'],
	  
	  ['*', '*','*', '*','*', '*','*'],
	];
	for(var i=0; i < 42; i++) {
		var e = bp.sync({ waitFor:[ redCoinEs, yellowCoinEs ]});
		if(e.data.color.equals("Red")) 
		{
			let row = e.data.row;
			let col = e.data.col;
			board[row][col] = 'R';
		}
		else 
		{
			let row = e.data.row;
			let col = e.data.col;
			board[row][col] = 'Y'
		}
		
		for(var i = 0; i < 6; i++) {
			bp.log.info(board[i][0] + "  " + board[i][1] + "  " + board[i][2] + "  " + board[i][3] + "  " + board[i][4] + "  " + board[i][5] + "  " + board[i][6]);
			//bp.log.info(board[i]);
		}
	}
});