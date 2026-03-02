import { useGameStore } from '../store/gameStore';
import { BOARD_SIZE, CELL_SIZE, isLakePosition } from '../constants';
import type { Position } from '../types';
import PieceSprite from './PieceSprite';

export default function GameBoard() {
  const board = useGameStore(s => s.board);
  const selectedPiece = useGameStore(s => s.selectedPiece);
  const validMoves = useGameStore(s => s.validMoves);
  const phase = useGameStore(s => s.phase);
  const currentTurn = useGameStore(s => s.currentTurn);
  const executeMove = useGameStore(s => s.executeMove);
  const selectPiece = useGameStore(s => s.selectPiece);
  const clearSelection = useGameStore(s => s.clearSelection);
  const placePieceOnBoard = useGameStore(s => s.placePieceOnBoard);
  const removePieceFromBoard = useGameStore(s => s.removePieceFromBoard);
  const aiThinking = useGameStore(s => s.aiThinking);

  const isValidMove = (pos: Position) =>
    validMoves.some(m => m.row === pos.row && m.col === pos.col);

  const isAttackMove = (pos: Position) => {
    if (!isValidMove(pos)) return false;
    const cell = board[pos.row][pos.col];
    return cell.piece != null && selectedPiece != null && cell.piece.side !== selectedPiece.side;
  };

  const handleCellClick = (row: number, col: number) => {
    const cell = board[row][col];

    if (phase === 'setup') {
      if (cell.piece && cell.piece.side === 'israel') {
        removePieceFromBoard({ row, col });
      }
      return;
    }

    if (phase !== 'playing' || currentTurn !== 'israel' || aiThinking) return;

    const pos = { row, col };

    if (selectedPiece && isValidMove(pos)) {
      executeMove(pos);
      return;
    }

    if (cell.piece && cell.piece.side === 'israel') {
      selectPiece(cell.piece);
    } else {
      clearSelection();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    if (phase !== 'setup') return;
    const pieceId = e.dataTransfer.getData('pieceId');
    if (pieceId) {
      placePieceOnBoard(pieceId, { row, col });
    }
  };

  return (
    <div className="board-wrapper">
      {/* Column labels */}
      <div className="board-col-labels">
        <div className="label-spacer" />
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <div key={i} className="col-label">{String.fromCharCode(65 + i)}</div>
        ))}
      </div>
      <div className="board-with-rows">
        <div className="board-row-labels">
          {Array.from({ length: BOARD_SIZE }, (_, i) => (
            <div key={i} className="row-label">{BOARD_SIZE - i}</div>
          ))}
        </div>
        <div
          className="board-grid"
          style={{
            width: BOARD_SIZE * CELL_SIZE,
            height: BOARD_SIZE * CELL_SIZE,
          }}
        >
          {Array.from({ length: BOARD_SIZE }, (_, row) =>
            Array.from({ length: BOARD_SIZE }, (_, col) => {
              const cell = board[row][col];
              const isLake = isLakePosition(row, col);
              const isSelected = selectedPiece?.position.row === row && selectedPiece?.position.col === col;
              const isMoveTarget = isValidMove({ row, col });
              const isAttack = isAttackMove({ row, col });
              const isPlayerZone = phase === 'setup' && row <= 3;
              const isEnemyZone = row >= 6;

              return (
                <div
                  key={`${row}-${col}`}
                  className={[
                    'board-cell',
                    isLake ? 'lake' : '',
                    isSelected ? 'selected' : '',
                    isMoveTarget ? 'move-target' : '',
                    isAttack ? 'attack-target' : '',
                    isPlayerZone ? 'player-zone' : '',
                    isEnemyZone && phase === 'setup' ? 'enemy-zone' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    left: col * CELL_SIZE,
                    top: row * CELL_SIZE,
                  }}
                  onClick={() => !isLake && handleCellClick(row, col)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, row, col)}
                >
                  {isLake && <div className="lake-water" />}
                  {isMoveTarget && !isAttack && !cell.piece && (
                    <div className="move-indicator" />
                  )}
                  {isAttack && (
                    <div className="attack-indicator" />
                  )}
                  {cell.piece && (
                    <PieceSprite
                      piece={cell.piece}
                      isSelected={isSelected}
                      size={CELL_SIZE - 4}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
