import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;
const IS_LARGE_SCREEN = SCREEN_WIDTH >= 1024;

const COLORS = {
  background: '#0F0F23',
  text: '#E8EAED',
  tile: '#1A1A2E',
  tileSelected: '#6366F1',
  card: '#1A1A2E',
  price: '#6366F1',
  muted: '#94A3B8',
  border: '#2D3047',
  success: '#10B981',
  warning: '#F59E0B',
  accent: '#8B5CF6',
};

const BASE_URL = 'https://freedom-tech.onrender.com';

// Responsive calculations
const getNumColumns = () => {
  if (IS_LARGE_SCREEN) return 4;
  if (IS_TABLET) return 3;
  return 2;
};

const getCardWidth = () => {
  const numColumns = getNumColumns();
  const horizontalPadding = IS_TABLET ? 48 : 20;
  const gap = IS_TABLET ? 16 : 12;
  return (SCREEN_WIDTH - (horizontalPadding * 2) - (gap * (numColumns - 1))) / numColumns;
};

export default function CommissaryScreen() {
  const { accessToken, logout } = useAuth();

  const [categories, setCategories] = useState([{ id: 'all', name: 'All Items' }]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numColumns = getNumColumns();
  const cardWidth = getCardWidth();

  useEffect(() => {
    if (!accessToken) return;
    loadCategories();
    loadItems('all');
    loadCart();
  }, [accessToken]);

  const handleAuthError = (res, defaultMessage) => {
    if (res.status === 401) {
      Alert.alert('Session expired', defaultMessage, [
        { text: 'OK', onPress: () => logout() },
      ]);
      return true;
    }
    return false;
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/commissary/categories`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        if (handleAuthError(res, 'Please log in again to view commissary.')) return;
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const apiCats = data.map((cat) => ({ id: cat._id, name: cat.name }));
        setCategories([{ id: 'all', name: 'All Items' }, ...apiCats]);
      }
    } catch {
      // ignore
    }
  };

  const mapItemFromApi = (item) => {
    return {
      id: item._id,
      categoryId: item.categoryId,
      name: item.name,
      price: item.price,
      size: 'Standard pack',
      available: item.inStock,
      description: item.description || 'No description available.',
      notes: '',
      imageColor: '#6366F1',
    };
  };

  const loadItems = async (categoryId) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (categoryId && categoryId !== 'all') params.append('category', categoryId);
      const url = params.toString()
        ? `${BASE_URL}/commissary/items?${params.toString()}`
        : `${BASE_URL}/commissary/items`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        let message = 'Failed to load items.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {}
        if (handleAuthError(res, 'Please log in again to view commissary.')) return;
        setError(message);
        setItems([]);
        return;
      }
      const data = await res.json();
      const apiItems = Array.isArray(data.items) ? data.items : [];
      setItems(apiItems.map(mapItemFromApi));
    } catch {
      setError('Failed to load items.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      const res = await fetch(`${BASE_URL}/commissary/cart`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        if (handleAuthError(res, 'Please log in again to view your cart.')) return;
        return;
      }
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch {
      // ignore cart errors
    }
  };

  const handleAddToCart = async () => {
    if (!selectedItem || !selectedItem.available) return;
    try {
      const res = await fetch(`${BASE_URL}/commissary/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ itemId: selectedItem.id, quantity: 1 }),
      });
      if (!res.ok) {
        let message = 'Failed to add to cart.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {}
        if (handleAuthError(res, 'Please log in again to manage your cart.')) return;
        Alert.alert('Error', message);
        return;
      }
      await loadCart();
      Alert.alert('Added to Cart', 'This item has been added to your cart.');
    } catch {
      Alert.alert('Error', 'Failed to add to cart.');
    }
  };

  const handleCartPress = async () => {
    if (!cartItems.length) {
      Alert.alert('Cart is empty', 'Add items to your cart before checkout.');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/commissary/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          paymentMethod: 'wallet',
          notes: '',
          deliveryLocation: 'Cell',
        }),
      });
      if (!res.ok) {
        let message = 'Checkout failed.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {}
        if (handleAuthError(res, 'Please log in again to checkout.')) return;
        Alert.alert('Error', message);
        return;
      }
      await res.json();
      setCartItems([]);
      Alert.alert('Order placed', 'Your commissary order has been submitted.');
    } catch {
      Alert.alert('Error', 'Checkout failed.');
    }
  };

  const itemsForCategory = useMemo(
    () => items,
    [items]
  );

  const handleOpenItem = (item) => {
    setSelectedItem(item);
  };

  const handleCloseItem = () => {
    setSelectedItem(null);
  };

  const renderCategoryChip = (category) => {
    const isActive = category.id === activeCategory;
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryChip, isActive && styles.categoryChipActive]}
        onPress={() => {
          setActiveCategory(category.id);
          loadItems(category.id);
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItemCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemCard, { width: cardWidth }]}
      onPress={() => handleOpenItem(item)}
      activeOpacity={0.9}
    >
      <View style={[styles.itemImage, { backgroundColor: item.imageColor + '40' }]}>
        <View style={[styles.itemImageInner, { backgroundColor: item.imageColor }]}>
          <Ionicons name="cube" size={IS_TABLET ? 32 : 24} color="#FFFFFF" />
        </View>
        {!item.available && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemSize}>{item.size}</Text>
        <View style={styles.itemFooter}>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
          </View>
          <View style={[styles.availabilityBadge, item.available ? styles.available : styles.unavailable]}>
            <Ionicons
              name={item.available ? "checkmark-circle" : "time"}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.availabilityText}>
              {item.available ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Commissary</Text>
            <Text style={styles.subtitle}>
              Browse and shop facility-approved items
            </Text>
          </View>
          <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
            <Ionicons name="cart" size={IS_TABLET ? 28 : 24} color={COLORS.text} />
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{cartCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map(renderCategoryChip)}
          </ScrollView>
        </View>

        {/* Items Grid */}
        <View style={styles.itemsContainer}>
          {loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <ActivityIndicator size={IS_TABLET ? 'large' : 'small'} color={COLORS.price} />
              </View>
              <Text style={styles.emptyTitle}>Loading items...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Ionicons name="alert-circle-outline" size={IS_TABLET ? 80 : 64} color={COLORS.muted} />
              </View>
              <Text style={styles.emptyTitle}>Unable to load items</Text>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : itemsForCategory.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Ionicons name="cube-outline" size={IS_TABLET ? 80 : 64} color={COLORS.muted} />
              </View>
              <Text style={styles.emptyTitle}>No items in this category</Text>
              <Text style={styles.emptyText}>
                Try selecting a different category from above
              </Text>
            </View>
          ) : (
            <FlatList
              data={itemsForCategory}
              keyExtractor={(item) => item.id}
              renderItem={renderItemCard}
              numColumns={numColumns}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.itemsContent}
              showsVerticalScrollIndicator={false}
              key={numColumns} // Re-render when columns change
            />
          )}
        </View>

        {/* Item Detail Modal */}
        <Modal
          visible={!!selectedItem}
          animationType="slide"
          transparent
          onRequestClose={handleCloseItem}
          statusBarTranslucent
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, IS_TABLET && styles.modalCardTablet]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {selectedItem?.name}
                  </Text>
                  <Text style={styles.modalCategory}>{selectedItem?.categoryId}</Text>
                </View>
                <TouchableOpacity onPress={handleCloseItem} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalImageSection}>
                  <View style={[styles.modalImage, { backgroundColor: selectedItem?.imageColor + '40' }]}>
                    <View style={[styles.modalImageInner, { backgroundColor: selectedItem?.imageColor }]}>
                      <Ionicons name="cube" size={IS_TABLET ? 48 : 40} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.modalMeta}>
                    <View style={styles.modalPrice}>
                      <Text style={styles.modalPriceText}>${selectedItem?.price.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.modalSize}>{selectedItem?.size}</Text>
                    <View style={[styles.modalAvailability, selectedItem?.available ? styles.modalAvailable : styles.modalUnavailable]}>
                      <Ionicons
                        name={selectedItem?.available ? "checkmark-circle" : "close-circle"}
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.modalAvailabilityText}>
                        {selectedItem?.available ? 'Available' : 'Out of Stock'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionLabel}>Description</Text>
                  <Text style={styles.modalDescription}>{selectedItem?.description}</Text>
                </View>

                {selectedItem?.notes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionLabel}>Important Notes</Text>
                    <View style={styles.notesContainer}>
                      <Ionicons name="information-circle" size={20} color={COLORS.warning} />
                      <Text style={styles.modalNotes}>{selectedItem?.notes}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.addToCartButton,
                    (!selectedItem?.available || IS_TABLET) && styles.addToCartDisabled
                  ]}
                  disabled={!selectedItem?.available}
                  onPress={handleAddToCart}
                >
                  <Ionicons
                    name="cart"
                    size={20}
                    color={selectedItem?.available ? "#FFFFFF" : COLORS.muted}
                  />
                  <Text style={[
                    styles.addToCartText,
                    !selectedItem?.available && styles.addToCartTextDisabled
                  ]}>
                    {selectedItem?.available ? 'Add to Cart' : 'Out of Stock'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: IS_TABLET ? 80 : 60,
    paddingHorizontal: IS_TABLET ? 32 : 20,
    paddingBottom: IS_TABLET ? 20 : 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: IS_TABLET ? 36 : 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: IS_TABLET ? 8 : 4,
  },
  subtitle: {
    fontSize: IS_TABLET ? 16 : 14,
    color: COLORS.muted,
    lineHeight: IS_TABLET ? 24 : 20,
  },
  cartButton: {
    padding: IS_TABLET ? 12 : 8,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  cartCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.price,
    width: IS_TABLET ? 24 : 20,
    height: IS_TABLET ? 24 : 20,
    borderRadius: IS_TABLET ? 12 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: IS_TABLET ? 12 : 10,
    fontWeight: '700',
  },
  categoriesSection: {
    paddingVertical: IS_TABLET ? 16 : 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoriesContent: {
    paddingHorizontal: IS_TABLET ? 24 : 16,
    gap: IS_TABLET ? 12 : 8,
  },
  categoryChip: {
    paddingHorizontal: IS_TABLET ? 20 : 16,
    paddingVertical: IS_TABLET ? 12 : 10,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: COLORS.tile,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: IS_TABLET ? 12 : 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.tileSelected,
    borderColor: COLORS.tileSelected,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: IS_TABLET ? 24 : 16,
    paddingVertical: IS_TABLET ? 20 : 16,
  },
  itemsContent: {
    paddingBottom: IS_TABLET ? 32 : 24,
  },
  columnWrapper: {
    gap: IS_TABLET ? 16 : 12,
    marginBottom: IS_TABLET ? 16 : 12,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: IS_TABLET ? 20 : 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    height: IS_TABLET ? 120 : 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  itemImageInner: {
    width: IS_TABLET ? 60 : 48,
    height: IS_TABLET ? 60 : 48,
    borderRadius: IS_TABLET ? 16 : 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: IS_TABLET ? 14 : 12,
    fontWeight: '600',
  },
  itemContent: {
    padding: IS_TABLET ? 16 : 12,
  },
  itemName: {
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: IS_TABLET ? 6 : 4,
    lineHeight: IS_TABLET ? 20 : 18,
  },
  itemSize: {
    fontSize: IS_TABLET ? 14 : 12,
    color: COLORS.muted,
    marginBottom: IS_TABLET ? 12 : 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTag: {
    backgroundColor: COLORS.price,
    paddingHorizontal: IS_TABLET ? 12 : 10,
    paddingVertical: IS_TABLET ? 6 : 4,
    borderRadius: IS_TABLET ? 12 : 8,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: IS_TABLET ? 14 : 12,
    fontWeight: '700',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IS_TABLET ? 8 : 6,
    paddingVertical: IS_TABLET ? 4 : 3,
    borderRadius: IS_TABLET ? 8 : 6,
  },
  available: {
    backgroundColor: COLORS.success,
  },
  unavailable: {
    backgroundColor: COLORS.warning,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: IS_TABLET ? 12 : 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IS_TABLET ? 80 : 40,
  },
  emptyIllustration: {
    marginBottom: IS_TABLET ? 24 : 16,
  },
  emptyTitle: {
    fontSize: IS_TABLET ? 24 : 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: IS_TABLET ? 12 : 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: IS_TABLET ? 16 : 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: IS_TABLET ? 24 : 20,
    maxWidth: IS_TABLET ? 400 : 280,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    paddingHorizontal: IS_TABLET ? 48 : 20,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: IS_TABLET ? 28 : 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: IS_TABLET ? '85%' : '90%',
  },
  modalCardTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: IS_TABLET ? 28 : 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: IS_TABLET ? 28 : 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: IS_TABLET ? 8 : 4,
    lineHeight: IS_TABLET ? 32 : 28,
  },
  modalCategory: {
    fontSize: IS_TABLET ? 16 : 14,
    color: COLORS.muted,
    fontWeight: '600',
  },
  closeButton: {
    padding: IS_TABLET ? 8 : 4,
    marginLeft: IS_TABLET ? 16 : 12,
  },
  modalContent: {
    flex: 1,
  },
  modalImageSection: {
    padding: IS_TABLET ? 28 : 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: IS_TABLET ? 'row' : 'column',
    alignItems: IS_TABLET ? 'center' : 'flex-start',
    gap: IS_TABLET ? 24 : 16,
  },
  modalImage: {
    width: IS_TABLET ? 120 : 100,
    height: IS_TABLET ? 120 : 100,
    borderRadius: IS_TABLET ? 20 : 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageInner: {
    width: IS_TABLET ? 80 : 60,
    height: IS_TABLET ? 80 : 60,
    borderRadius: IS_TABLET ? 16 : 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMeta: {
    flex: 1,
    gap: IS_TABLET ? 12 : 8,
  },
  modalPrice: {
    backgroundColor: COLORS.price,
    paddingHorizontal: IS_TABLET ? 16 : 12,
    paddingVertical: IS_TABLET ? 8 : 6,
    borderRadius: IS_TABLET ? 12 : 8,
    alignSelf: 'flex-start',
  },
  modalPriceText: {
    color: '#FFFFFF',
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: '700',
  },
  modalSize: {
    fontSize: IS_TABLET ? 16 : 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: IS_TABLET ? 12 : 8,
    paddingVertical: IS_TABLET ? 6 : 4,
    borderRadius: IS_TABLET ? 8 : 6,
    alignSelf: 'flex-start',
  },
  modalAvailable: {
    backgroundColor: COLORS.success,
  },
  modalUnavailable: {
    backgroundColor: COLORS.warning,
  },
  modalAvailabilityText: {
    color: '#FFFFFF',
    fontSize: IS_TABLET ? 14 : 12,
    fontWeight: '600',
  },
  modalSection: {
    padding: IS_TABLET ? 28 : 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: IS_TABLET ? 12 : 8,
  },
  modalDescription: {
    fontSize: IS_TABLET ? 16 : 14,
    color: COLORS.text,
    lineHeight: IS_TABLET ? 24 : 20,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: IS_TABLET ? 12 : 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: IS_TABLET ? 16 : 12,
    borderRadius: IS_TABLET ? 12 : 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  modalNotes: {
    flex: 1,
    fontSize: IS_TABLET ? 14 : 13,
    color: COLORS.text,
    lineHeight: IS_TABLET ? 20 : 18,
  },
  modalFooter: {
    padding: IS_TABLET ? 28 : 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IS_TABLET ? 12 : 8,
    paddingVertical: IS_TABLET ? 20 : 16,
    backgroundColor: COLORS.price,
    borderRadius: IS_TABLET ? 16 : 12,
  },
  addToCartDisabled: {
    backgroundColor: COLORS.border,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '600',
  },
  addToCartTextDisabled: {
    color: COLORS.muted,
  },
});