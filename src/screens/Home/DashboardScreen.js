import { Ionicons } from '@expo/vector-icons';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  background: '#1E1F25',
  text: '#E5E7EB',
  tileBlue: '#243447',
  tileRed: '#7A1E25',
  tileLabel: '#E6E0D4',
  separator: '#2A2B31',
  accent: '#E63946',
};

const DASH_TILES = [
  { key: 'Courses', icon: 'school', color: 'blue', route: 'Courses' },
  { key: 'Podcast', icon: 'mic', color: 'red', route: 'Podcast' },
  { key: 'Games', icon: 'game-controller', color: 'blue', route: 'Games' },
  { key: 'Calculator', icon: 'calculator', color: 'red', route: 'Emails' },
  { key: 'Library', icon: 'book', color: 'red', route: 'Library' },
  { key: 'Calendar', icon: 'calendar', color: 'blue', route: 'Calendar' },
  { key: 'Requests', icon: 'document', color: 'blue', route: 'Requests' },
  { key: 'Calls', icon: 'call', color: 'red', route: 'Calls' },
  { key: 'Commissary', icon: 'cart', color: 'red', route: 'Commissary' },
  { key: 'Schedule', icon: 'checkbox', color: 'blue', route: 'Schedule' },
  { key: 'Photos', icon: 'images', color: 'red', route: 'Photos' },
  { key: 'Settings', icon: 'settings', color: 'blue', route: 'Settings' },
];

export default function DashboardScreen({ navigation }) {
  const renderTile = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.tile,
        { 
          backgroundColor: item.color === 'red' ? COLORS.tileRed : COLORS.tileBlue,
          shadowColor: item.color === 'red' ? COLORS.tileRed : COLORS.tileBlue,
        }
      ]}
      onPress={() => item.route && navigation.navigate(item.route)}
      activeOpacity={0.8}
    >
      <View style={styles.tileIconContainer}>
        <Ionicons name={item.icon} size={32} color={COLORS.tileLabel} />
      </View>
      <Text style={styles.tileText}>{item.key.toUpperCase()}</Text>
      
      {/* Hover/Active Effect */}
      <View style={[
        styles.tileOverlay,
        { backgroundColor: item.color === 'red' ? 'rgba(122, 30, 37, 0.1)' : 'rgba(36, 52, 71, 0.1)' }
      ]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Text style={styles.brand}>FREEDOMTEK</Text>
            <View style={styles.brandUnderline} />
          </View>
          <Text style={styles.subtitle}>Your Digital Companion</Text>
        </View>

        {/* Dashboard Grid */}
        <FlatList
          data={DASH_TILES}
          keyExtractor={(item) => item.key}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          renderItem={renderTile}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  container: { 
    flex: 1, 
    padding: 24,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: { 
    color: COLORS.tileLabel, 
    fontSize: 32, 
    fontWeight: '900', 
    letterSpacing: 3,
    textShadowColor: 'rgba(230, 224, 212, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandUnderline: {
    width: 120,
    height: 3,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    marginTop: 6,
  },
  subtitle: {
    color: COLORS.tileLabel,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    opacity: 0.8,
  },
  gridContainer: { 
    gap: 16,
    paddingBottom: 20,
  },
  columnWrapper: { 
    gap: 16,
    justifyContent: 'space-between',
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    minHeight: 110,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(42, 43, 49, 0.8)',
    shadowOffset: { 
      width: 0, 
      height: 8 
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  tileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 224, 212, 0.2)',
  },
  tileText: { 
    color: COLORS.tileLabel, 
    fontSize: 12, 
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 14,
  },
  tileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 43, 49, 0.5)',
    marginTop: 'auto',
  },
  footerText: {
    color: COLORS.tileLabel,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    letterSpacing: 0.5,
  },
});