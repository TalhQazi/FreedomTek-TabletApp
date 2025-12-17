import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

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
const BASE_URL = 'https://freedom-tech.onrender.com';

const numColumns = 2;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 20 * 2 - 16) / numColumns;

export default function LibraryScreen() {
  const { accessToken, logout } = useAuth();

  const [categories, setCategories] = useState([{ id: 'all', label: 'All Books', icon: 'library' }]);
  const [books, setBooks] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedBook, setSelectedBook] = useState(null);
  const [readerVisible, setReaderVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    loadCategories();
    loadBooks('all', '');
  }, [accessToken]);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/library/categories`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const apiCategories = data.map((cat) => ({
          id: cat._id,
          label: cat.name,
          icon: 'book',
        }));
        setCategories([{ id: 'all', label: 'All Books', icon: 'library' }, ...apiCategories]);
      }
    } catch {
      // ignore category load errors for now
    }
  };

  const mapBookFromApi = (book) => {
    const baseColor = '#6366F1';
    return {
      id: book._id,
      categoryId: book.categoryId?._id || book.categoryId,
      title: book.title,
      author: book.author,
      format: 'Book',
      description: book.description || 'No description available.',
      pages: 0,
      level: book.available ? 'Available' : 'Unavailable',
      url: null,
      coverColor: baseColor,
      rating: 4.5,
      isOnline: false,
    };
  };

  const loadBooks = async (categoryId, query) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (categoryId && categoryId !== 'all') params.append('category', categoryId);
      if (query) params.append('q', query);
      const url = params.toString()
        ? `${BASE_URL}/library/books?${params.toString()}`
        : `${BASE_URL}/library/books`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        let message = 'Failed to load books.';
        try {
          const err = await res.json();
          if (err?.error) {
            message = err.error;
            if (res.status === 401 && err.error === 'Invalid token') {
              Alert.alert('Session expired', 'Please log in again to view the library.', [
                { text: 'OK', onPress: () => logout() },
              ]);
              return;
            }
          }
        } catch {}
        setError(message);
        setBooks([]);
        return;
      }

      const data = await res.json();
      const items = Array.isArray(data.books) ? data.books : [];
      setBooks(items.map(mapBookFromApi));
    } catch {
      setError('Failed to load books.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesCategory = activeCategory === 'all' || book.categoryId === activeCategory;
    const matchesSearch = !searchQuery
      || book.title.toLowerCase().includes(searchQuery.toLowerCase())
      || book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openBook = (book) => {
    setSelectedBook(book);
  };

  const closeBookModal = () => {
    setSelectedBook(null);
  };

  const openReader = async (book) => {
    if (book.isOnline && book.url) {
      try {
        const canOpen = await Linking.canOpenURL(book.url);
        if (canOpen) {
          await Linking.openURL(book.url);
        } else {
          Alert.alert('Error', 'Cannot open this book link');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open book');
      }
    } else {
      setReaderVisible(true);
    }
  };

  const closeReader = () => {
    setReaderVisible(false);
  };

  const getCategoryBooksCount = (categoryId) => {
    if (categoryId === 'all') return books.length;
    return books.filter(book => book.categoryId === categoryId).length;
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.chip, activeCategory === item.id && styles.chipActive]}
      onPress={() => {
        setActiveCategory(item.id);
        loadBooks(item.id, searchQuery);
      }}
    >
      <Ionicons 
        name={item.icon} 
        size={16} 
        color={activeCategory === item.id ? '#FFFFFF' : COLORS.muted} 
        style={styles.chipIcon}
      />
      <Text style={[styles.chipText, activeCategory === item.id && styles.chipTextActive]}>
        {item.label}
      </Text>
      <View style={styles.categoryCount}>
        <Text style={styles.categoryCountText}>
          {getCategoryBooksCount(item.id)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderBook = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookCard} 
      onPress={() => openBook(item)}
      activeOpacity={0.9}
    >
      <View style={[styles.bookCover, { backgroundColor: item.coverColor + '20' }]}>
        <View style={styles.bookCoverContent}>
          <Ionicons name="book" size={28} color={item.coverColor} />
          {item.isOnline && (
            <View style={styles.onlineBadge}>
              <Ionicons name="wifi" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={[styles.bookCoverStrip, { backgroundColor: item.coverColor }]} />
      </View>
      
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
        
        <View style={styles.bookMeta}>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
        </View>
        
        <View style={styles.bookFooter}>
          <Text style={styles.bookFormat}>{item.format}</Text>
          {item.isOnline ? (
            <Ionicons name="cloud-download" size={16} color={COLORS.primary} />
          ) : (
            <Ionicons name="document" size={16} color={COLORS.muted} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const onlineBooksCount = books.filter(book => book.isOnline).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Digital Library</Text>
            <View style={styles.onlineBadgeHeader}>
              <Ionicons name="wifi" size={14} color="#FFFFFF" />
              <Text style={styles.onlineBadgeText}>{onlineBooksCount} Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Access facility-approved books and educational materials
        </Text>
      </View>

      {/* Categories */}
      <View style={styles.categorySection}>
        <FlatList
          data={categories}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
                
      {/* Books Grid */}
      {loading ? (
        <View style={[styles.booksContent, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 8, color: COLORS.muted }}>Loading books...</Text>
        </View>
      ) : error ? (
        <View style={[styles.booksContent, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: COLORS.muted, textAlign: 'center' }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          numColumns={numColumns}
          columnWrapperStyle={styles.bookRow}
          contentContainerStyle={styles.booksContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>No books found</Text>
              <Text style={styles.emptyText}>
                Try selecting a different category or check back later for new additions.
              </Text>
            </View>
          }
        />
      )}

      {/* Book Details Modal */}
      <Modal
        visible={!!selectedBook}
        animationType="slide"
        transparent
        onRequestClose={closeBookModal}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bookModalCard}>
            <View style={styles.bookModalHeader}>
              <TouchableOpacity onPress={closeBookModal} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.bookModalTitle} numberOfLines={1}>
                {selectedBook?.title}
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalCoverSection}>
                <View style={[styles.bookCoverLarge, { backgroundColor: selectedBook?.coverColor + '20' }]}>
                  <Ionicons name="book" size={48} color={selectedBook?.coverColor} />
                  {selectedBook?.isOnline && (
                    <View style={styles.onlineBadgeLarge}>
                      <Ionicons name="wifi" size={16} color="#FFFFFF" />
                      <Text style={styles.onlineBadgeTextLarge}>Online</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.bookInfoModal}>
                  <Text style={styles.bookModalAuthor}>{selectedBook?.author}</Text>
                  <View style={styles.bookStats}>
                    <View style={styles.stat}>
                      <Ionicons name="document" size={16} color={COLORS.muted} />
                      <Text style={styles.statText}>{selectedBook?.format}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Ionicons name="bookmarks" size={16} color={COLORS.muted} />
                      <Text style={styles.statText}>{selectedBook?.pages} pages</Text>
                    </View>
                    <View style={styles.stat}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.statText}>{selectedBook?.rating}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.bookModalDescription}>
                  {selectedBook?.description}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Level</Text>
                <View style={[styles.levelBadgeLarge, { backgroundColor: selectedBook?.coverColor + '20' }]}>
                  <Text style={[styles.levelTextLarge, { color: selectedBook?.coverColor }]}>
                    {selectedBook?.level}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[
                  styles.readButton,
                  selectedBook?.isOnline && styles.readButtonOnline
                ]} 
                onPress={() => openReader(selectedBook)}
              >
                <Ionicons 
                  name={selectedBook?.isOnline ? "cloud-download" : "reader"} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.readButtonText}>
                  {selectedBook?.isOnline ? 'Read Online' : 'Read Offline'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reader Modal for Offline Books */}
      <Modal
        visible={readerVisible}
        animationType="slide"
        transparent
        onRequestClose={closeReader}
        statusBarTranslucent
      >
        <View style={styles.readerBackdrop}>
          <View style={styles.readerCard}>
            <View style={styles.readerHeader}>
              <TouchableOpacity onPress={closeReader} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.readerTitle} numberOfLines={1}>
                {selectedBook?.title}
              </Text>
              <View style={styles.headerSpacer} />
            </View>
            
            <View style={styles.readerBody}>
              <View style={styles.readerIllustration}>
                <Ionicons name="document-text" size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.readerTitleLarge}>Offline Reader</Text>
              <Text style={styles.readerDescription}>
                This book is available for offline reading. In the full version, this would open a PDF viewer or ebook reader with full navigation and bookmarking features.
              </Text>
              
              <View style={styles.readerStats}>
                <View style={styles.readerStat}>
                  <Text style={styles.readerStatNumber}>{selectedBook?.pages}</Text>
                  <Text style={styles.readerStatLabel}>Pages</Text>
                </View>
                <View style={styles.readerStat}>
                  <Text style={styles.readerStatNumber}>{selectedBook?.format}</Text>
                  <Text style={styles.readerStatLabel}>Format</Text>
                </View>
                <View style={styles.readerStat}>
                  <Text style={styles.readerStatNumber}>{selectedBook?.rating}</Text>
                  <Text style={styles.readerStatLabel}>Rating</Text>
                </View>
              </View>
            </View>

            <View style={styles.readerFooter}>
              <TouchableOpacity style={styles.downloadButton}>
                <Ionicons name="download" size={20} color={COLORS.primary} />
                <Text style={styles.downloadButtonText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startReadingButton}>
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.startReadingText}>Start Reading</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

import { ScrollView } from 'react-native';

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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  onlineBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  categorySection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  categoryCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  booksContent: {
    padding: 20,
    paddingBottom: 30,
  },
  bookRow: {
    gap: 16,
    marginBottom: 16,
  },
  bookCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  bookCover: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bookCoverContent: {
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCoverStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  bookInfo: {
    padding: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookFormat: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  bookModalCard: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bookModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  bookModalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 36,
  },
  modalContent: {
    flex: 1,
  },
  modalCoverSection: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bookCoverLarge: {
    width: 100,
    height: 140,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  onlineBadgeLarge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  onlineBadgeTextLarge: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bookInfoModal: {
    alignItems: 'center',
  },
  bookModalAuthor: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 12,
    fontWeight: '600',
  },
  bookStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  bookModalDescription: {
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
  },
  levelBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  levelTextLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  readButtonOnline: {
    backgroundColor: COLORS.accent,
  },
  readButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Reader Modal Styles
  readerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  readerCard: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  readerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  readerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  readerIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  readerTitleLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  readerDescription: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  readerStats: {
    flexDirection: 'row',
    gap: 24,
  },
  readerStat: {
    alignItems: 'center',
  },
  readerStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  readerStatLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  readerFooter: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  downloadButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  startReadingButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  startReadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});