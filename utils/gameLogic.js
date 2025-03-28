// 检查指定方向上的匹配
export const checkMatchesInDirection = (cells, startCell, direction) => {
  const matches = [startCell];
  let currentRow = startCell.row;
  let currentCol = startCell.col;
  
  // 向指定方向检查
  while (true) {
    currentRow += direction[0];
    currentCol += direction[1];
    
    const nextCell = cells.find(c => 
      c.row === currentRow && 
      c.col === currentCol && 
      c.type === startCell.type
    );
    
    if (!nextCell) break;
    matches.push(nextCell);
  }
  
  return matches;
};

// 获取相邻的方块
export const getAdjacentCells = (cells, cell) => {
  const directions = [
    [-1, 0],  // 上
    [1, 0],   // 下
    [0, -1],  // 左
    [0, 1],   // 右
    [-1, -1], // 左上
    [1, 1]    // 右下
  ];
  
  return directions
    .map(([dRow, dCol]) => {
      return cells.find(c => 
        c.row === cell.row + dRow && 
        c.col === cell.col + dCol
      );
    })
    .filter(c => c !== undefined);
};

// 检查是否有可能的匹配
export const hasValidMoves = (cells) => {
  const directions = [
    [0, 1],   // 右
    [1, 0],   // 下
    [1, 1],   // 右下
    [-1, 1]   // 右上
  ];
  
  for (let i = 0; i < cells.length; i++) {
    for (const direction of directions) {
      const matches = checkMatchesInDirection(cells, cells[i], direction);
      if (matches.length >= 3) {
        return true;
      }
    }
  }
  
  return false;
};

// 检查两个方块是否相邻
export const isAdjacent = (cell1, cell2) => {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  return (rowDiff === 1 && colDiff === 0) || 
         (rowDiff === 0 && colDiff === 1) || 
         (rowDiff === 1 && colDiff === 1);
};

// 计算连击得分
export const calculateScore = (matchLength, combo) => {
  const baseScore = matchLength * 10;
  const comboMultiplier = 1 + (combo * 0.1);
  return Math.floor(baseScore * comboMultiplier);
};

// 检查是否形成特殊图案
export const checkSpecialPattern = (matches) => {
  // 十字形
  const isCross = (cells) => {
    const center = cells.find(c => 
      cells.some(other => c.row === other.row + 1 && c.col === other.col) &&
      cells.some(other => c.row === other.row - 1 && c.col === other.col) &&
      cells.some(other => c.row === other.row && c.col === other.col + 1) &&
      cells.some(other => c.row === other.row && c.col === other.col - 1)
    );
    return center !== undefined;
  };

  // L形
  const isL = (cells) => {
    const sorted = cells.sort((a, b) => a.row - b.row || a.col - b.col);
    const vertical = sorted.filter((c, i) => 
      i > 0 && c.row === sorted[i-1].row + 1 && c.col === sorted[i-1].col
    ).length >= 2;
    const horizontal = sorted.filter((c, i) => 
      i > 0 && c.row === sorted[i-1].row && c.col === sorted[i-1].col + 1
    ).length >= 2;
    return vertical && horizontal;
  };

  if (matches.length >= 5) {
    if (isCross(matches)) return 'cross';
    if (isL(matches)) return 'L';
  }
  
  return null;
}; 