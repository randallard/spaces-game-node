const { simulateRound } = require('./dist/simulation.js');

const playerBoard = {
  boardSize: 2,
  grid: [
    ['piece', 'empty'],
    ['empty', 'piece']
  ],
  sequence: [
    { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
    { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
    { position: { row: -1, col: 0 }, type: 'final', order: 3 }
  ]
};

const opponentBoard = {
  boardSize: 2,
  grid: [
    ['piece', 'empty'],
    ['empty', 'empty']
  ],
  sequence: [
    { position: { row: 0, col: 0 }, type: 'piece', order: 1 }
  ]
};

const result = simulateRound(1, playerBoard, opponentBoard, { silent: false });
console.log('\n=== Result ===');
console.log('Winner:', result.winner);
console.log('Player points:', result.playerPoints);
console.log('Opponent points:', result.opponentPoints);
console.log('Player moves:', result.simulationDetails.playerMoves);
console.log('Opponent moves:', result.simulationDetails.opponentMoves);
