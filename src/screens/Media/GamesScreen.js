import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const COLORS = {
  background: '#0F0F23',
  card: '#1A1A2E',
  border: '#2D3047',
  text: '#E8EAED',
  muted: '#94A3B8',
  primary: '#6366F1',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
};

const GAMES = [
  {
    id: 'g1',
    title: '2048 Puzzle',
    icon: 'grid',
    description: 'Join the tiles and reach 2048 in this simple number puzzle.',
    color: '#6366F1',
    category: 'Puzzle',
  },
  {
    id: 'g2',
    title: 'Memory Match',
    icon: 'apps',
    description: 'Flip the cards and train your memory skills.',
    color: '#8B5CF6',
    category: 'Memory',
  },
  {
    id: 'g3',
    title: 'Word Builder',
    icon: 'text',
    description: 'Create words from letters to keep your mind sharp.',
    color: '#10B981',
    category: 'Word',
  },
  {
    id: 'g4',
    title: 'Sudoku',
    icon: 'grid-outline',
    description: 'Classic number placement puzzle for logical thinking.',
    color: '#F59E0B',
    category: 'Logic',
  },
  {
    id: 'g5',
    title: 'Chess',
    icon: 'extension-puzzle',
    description: 'Strategic board game to enhance critical thinking.',
    color: '#EF4444',
    category: 'Strategy',
  },
  {
    id: 'g6',
    title: 'Solitaire',
    icon: 'layers',
    description: 'Classic card game for relaxation and focus.',
    color: '#EC4899',
    category: 'Card',
  },
];

// Enhanced HTML game demo
const GAME_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FreedomTek Games</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0F0F23 0%, #1A1A2E 100%);
      color: #E8EAED;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .game-container {
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    
    .game-header {
      margin-bottom: 24px;
    }
    
    .game-title {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .game-subtitle {
      font-size: 14px;
      color: #94A3B8;
      line-height: 1.4;
    }
    
    .game-board {
      background: rgba(42, 43, 49, 0.6);
      border-radius: 20px;
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
    
    .score-board {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      background: rgba(30, 31, 37, 0.8);
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .score-item {
      text-align: center;
    }
    
    .score-label {
      font-size: 12px;
      color: #94A3B8;
      margin-bottom: 4px;
      font-weight: 600;
    }
    
    .score-value {
      font-size: 20px;
      font-weight: 800;
      color: #E8EAED;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: rgba(30, 31, 37, 0.8);
      padding: 8px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .cell {
      background: rgba(42, 43, 49, 0.8);
      border-radius: 8px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 20px;
      color: #E8EAED;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }
    
    .cell:hover {
      transform: scale(1.05);
      border-color: rgba(99, 102, 241, 0.3);
    }
    
    .cell.val-2 { 
      background: linear-gradient(135deg, #4F46E5, #6366F1);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    
    .cell.val-4 { 
      background: linear-gradient(135deg, #7C3AED, #8B5CF6);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }
    
    .cell.val-8 { 
      background: linear-gradient(135deg, #EC4899, #F472B6);
      box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
    }
    
    .cell.val-16 { 
      background: linear-gradient(135deg, #10B981, #34D399);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    .controls {
      margin-top: 20px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    
    .control-btn {
      padding: 12px 20px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      color: #E8EAED;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .control-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      transform: translateY(-1px);
    }
    
    .game-footer {
      margin-top: 20px;
      padding: 16px;
      background: rgba(30, 31, 37, 0.6);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .footer-text {
      font-size: 12px;
      color: #94A3B8;
      line-height: 1.4;
    }
    
    .highlight {
      color: #6366F1;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="game-container">
    <div class="game-header">
      <h1 class="game-title">2048 Puzzle</h1>
      <p class="game-subtitle">Combine tiles with the same numbers to reach 2048. Use arrow keys or swipe to move tiles.</p>
    </div>
    
    <div class="game-board">
      <div class="score-board">
        <div class="score-item">
          <div class="score-label">SCORE</div>
          <div class="score-value">128</div>
        </div>
        <div class="score-item">
          <div class="score-label">BEST</div>
          <div class="score-value">2048</div>
        </div>
        <div class="score-item">
          <div class="score-label">MOVES</div>
          <div class="score-value">42</div>
        </div>
      </div>
      
      <div class="grid">
        <div class="cell val-2">2</div>
        <div class="cell"></div>
        <div class="cell val-4">4</div>
        <div class="cell"></div>
        <div class="cell"></div>
        <div class="cell val-2">2</div>
        <div class="cell val-8">8</div>
        <div class="cell"></div>
        <div class="cell val-16">16</div>
        <div class="cell"></div>
        <div class="cell"></div>
        <div class="cell val-4">4</div>
        <div class="cell"></div>
        <div class="cell val-2">2</div>
        <div class="cell"></div>
        <div class="cell"></div>
      </div>
      
      <div class="controls">
        <button class="control-btn" onclick="alert('New game started!')">New Game</button>
        <button class="control-btn" onclick="alert('Game paused!')">Pause</button>
      </div>
    </div>
    
    <div class="game-footer">
      <p class="footer-text">This is a <span class="highlight">demo version</span> of the game. Full interactive features with score tracking and game logic will be available in the next update.</p>
    </div>
  </div>
  
  <script>
    // Simple demo interactions
    document.addEventListener('DOMContentLoaded', function() {
      const cells = document.querySelectorAll('.cell');
      
      cells.forEach(cell => {
        if (cell.textContent.trim()) {
          cell.addEventListener('click', function() {
            const value = parseInt(this.textContent);
            this.textContent = value * 2;
            this.className = 'cell val-' + (value * 2);
            alert('Tile combined! New value: ' + (value * 2));
          });
        }
      });
    });
  </script>
</body>
</html>
`;

export default function GamesScreen() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [scaleAnim] = useState(new Animated.Value(1));

  const openGame = (game) => {
    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setSelectedGame(game);
    }, 150);
  };

  const closeGame = () => {
    setSelectedGame(null);
  };

  const renderGame = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: item.color }]}
      activeOpacity={0.9}
      onPress={() => openGame(item)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={28} color={item.color} />
        </View>
        <View style={styles.categoryBadge}>
          <Text style={[styles.categoryText, { color: item.color }]}>
            {item.category}
          </Text>
        </View>
      </View>
      
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.rating}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>4.8</Text>
        </View>
        <View style={[styles.playButton, { backgroundColor: item.color }]}>
          <Ionicons name="play" size={16} color="#FFFFFF" />
          <Text style={styles.playText}>PLAY</Text>
        </View>
      </View>
      
      {/* Hover effect layer */}
      <View style={[styles.cardOverlay, { backgroundColor: item.color + '10' }]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.screenTitle}>Mind Games</Text>
          <Text style={styles.screenSubtitle}>
            Safe, educational games to sharpen your mind and pass time productively
          </Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{GAMES.length} Games</Text>
        </View>
      </View>

      {/* Games Grid */}
      <FlatList
        data={GAMES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={renderGame}
        showsVerticalScrollIndicator={false}
      />

      {/* Game Modal */}
      <Modal
        visible={!!selectedGame}
        animationType="slide"
        transparent
        onRequestClose={closeGame}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIcon, { backgroundColor: selectedGame?.color + '20' }]}>
                  <Ionicons name={selectedGame?.icon} size={24} color={selectedGame?.color} />
                </View>
                <View>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedGame?.title}
                  </Text>
                  <Text style={styles.modalSubtitle}>{selectedGame?.category} Game</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeGame} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.webviewContainer}>
              <WebView
                originWhitelist={["*"]}
                source={{ html: GAME_HTML }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="game-controller" size={48} color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading Game...</Text>
                  </View>
                )}
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.footerButton} onPress={closeGame}>
                <Ionicons name="exit-outline" size={18} color={COLORS.text} />
                <Text style={styles.footerButtonText}>Exit Game</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerButton, styles.primaryFooterButton]}>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={[styles.footerButtonText, styles.primaryFooterText]}>Restart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  headerStats: {
    alignItems: 'flex-start',
  },
  statsText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    minHeight: 200,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 20,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    flex: 0.95,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  primaryFooterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  primaryFooterText: {
    color: '#FFFFFF',
  },
});