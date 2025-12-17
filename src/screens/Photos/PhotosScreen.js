import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_WIDTH < 375;

const COLORS = {
  background: '#1E1F25',
  text: '#E5E7EB',
  tile: '#2A2B31',
  border: '#3C3C43',
  accent: '#E63946',
  muted: '#9CA3AF',
  black: '#000000',
  white: '#FFFFFF',
};

const SPACING = isTablet ? 16 : 12;
const BASE_URL = 'https://freedom-tech.onrender.com';

export default function PhotosScreen() {
  const { accessToken, logout } = useAuth();

  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState({});

  // Responsive grid columns
  const numColumns = useMemo(() => {
    if (SCREEN_WIDTH >= 1200) return 5;
    if (SCREEN_WIDTH >= 1000) return 4;
    if (SCREEN_WIDTH >= 768) return 3;
    if (SCREEN_WIDTH >= 480) return 3;
    return 2;
  }, []);

  const tileSize = useMemo(() => {
    const horizontalPadding = (isTablet ? 24 : 16) * 2;
    const totalSpacing = SPACING * (numColumns - 1);
    const available = SCREEN_WIDTH - horizontalPadding - totalSpacing;
    return Math.floor(available / numColumns);
  }, [SCREEN_WIDTH, numColumns]);

  const openViewer = (index) => {
    setActiveIndex(index);
    setViewerVisible(true);
  };

  const closeViewer = () => setViewerVisible(false);

  // Navigation functions for viewer
  const goToNext = () => {
    if (activeIndex < photos.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const goToPrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  // Load photos for authenticated user from backend
  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/photos`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          let message = 'Failed to load photos.';
          try {
            const err = await res.json();
            if (err?.error) message = err.error;
          } catch {}

          if (res.status === 401) {
            Alert.alert('Session expired', 'Please log in again to view your photos.', [
              { text: 'OK', onPress: () => logout() },
            ]);
            return;
          }

          Alert.alert('Error', message);
          setPhotos([]);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map((photo) => {
            const url = typeof photo.fileUrl === 'string'
              ? (photo.fileUrl.startsWith('http') ? photo.fileUrl : `${BASE_URL}${photo.fileUrl}`)
              : '';
            return {
              id: photo._id,
              source: { uri: url },
              title: photo.title || 'Photo',
              isUserPhoto: true,
            };
          });
          setPhotos(mapped);
        } else {
          setPhotos([]);
        }
      } catch (error) {
        console.error('Error loading photos:', error);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const handleAddPhoto = async () => {
    // Ask permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to add photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });
      formData.append('title', 'My Photo');

      const res = await fetch(`${BASE_URL}/photos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        let message = 'Failed to upload photo.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {}

        if (res.status === 401) {
          Alert.alert('Session expired', 'Please log in again to upload photos.', [
            { text: 'OK', onPress: () => logout() },
          ]);
          return;
        }

        Alert.alert('Error', message);
        return;
      }

      const created = await res.json();
      const url = typeof created.fileUrl === 'string'
        ? (created.fileUrl.startsWith('http') ? created.fileUrl : `${BASE_URL}${created.fileUrl}`)
        : '';

      const mapped = {
        id: created._id,
        source: { uri: url },
        title: created.title || 'Photo',
        isUserPhoto: true,
      };

      setPhotos((prev) => [mapped, ...prev]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add photo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/photos/${photoId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              if (!res.ok) {
                let message = 'Failed to delete photo.';
                try {
                  const err = await res.json();
                  if (err?.error) message = err.error;
                } catch {}

                if (res.status === 401) {
                  Alert.alert('Session expired', 'Please log in again to manage photos.', [
                    { text: 'OK', onPress: () => logout() },
                  ]);
                  return;
                }

                Alert.alert('Error', message);
                return;
              }

              setPhotos((prev) => prev.filter((p) => p.id !== photoId));
              if (viewerVisible) {
                closeViewer();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo.');
            }
          },
        },
      ]
    );
  };

  const handleImageLoadStart = (photoId) => {
    setImageLoading((prev) => ({ ...prev, [photoId]: true }));
  };

  const handleImageLoadEnd = (photoId) => {
    setImageLoading(prev => ({ ...prev, [photoId]: false }));
  };

  const renderPhoto = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => openViewer(index)}
      onLongPress={() => item.isUserPhoto && handleDeletePhoto(item.id)}
      style={{ 
        width: tileSize, 
        marginBottom: SPACING,
      }}
    >
      <View style={[styles.tile, { width: tileSize, height: tileSize }]}>
        {imageLoading[item.id] && (
          <View style={styles.imageLoader}>
            <ActivityIndicator size="small" color={COLORS.accent} />
          </View>
        )}
        <Image
          source={item.source}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={() => handleImageLoadStart(item.id)}
          onLoadEnd={() => handleImageLoadEnd(item.id)}
          onError={() => handleImageLoadEnd(item.id)}
        />
        {item.isUserPhoto && (
          <View style={styles.userPhotoBadge}>
            <Ionicons name="person" size={10} color={COLORS.white} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="images-outline" size={isTablet ? 80 : 60} color={COLORS.muted} />
      <Text style={styles.emptyTitle}>No Photos Yet</Text>
      <Text style={styles.emptyText}>
        Add your first photo by tapping the Add button
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Photos</Text>
            <Text style={styles.subtitle}>
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddPhoto} 
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="add" size={20} color={COLORS.white} />
                <Text style={styles.addButtonText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Grid Gallery */}
        <View style={styles.gridContainer}>
          {loading && photos.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
          ) : photos.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={photos}
              keyExtractor={(item) => item.id}
              renderItem={renderPhoto}
              numColumns={numColumns}
              columnWrapperStyle={{ gap: SPACING }}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={5}
            />
          )}
        </View>

        {/* Fullscreen Viewer */}
        <Modal
          visible={viewerVisible}
          animationType="fade"
          transparent
          onRequestClose={closeViewer}
          statusBarTranslucent
        >
          <View style={styles.viewerBackdrop}>
            {/* Header */}
            <View style={styles.viewerHeader}>
              <TouchableOpacity onPress={closeViewer} style={styles.closeButton}>
                <Ionicons name="close" size={26} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.viewerTitleContainer}>
                <Text style={styles.viewerTitle} numberOfLines={1}>
                  {photos[activeIndex]?.title}
                </Text>
                <Text style={styles.viewerCounter}>
                  {activeIndex + 1} of {photos.length}
                </Text>
              </View>
              {photos[activeIndex]?.isUserPhoto && (
                <TouchableOpacity 
                  onPress={() => handleDeletePhoto(photos[activeIndex]?.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={24} color={COLORS.accent} />
                </TouchableOpacity>
              )}
            </View>

            {/* Image Pager */}
            <View style={styles.pagerContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: activeIndex * SCREEN_WIDTH, y: 0 }}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setActiveIndex(idx);
                }}
                scrollEventThrottle={16}
              >
                {photos.map((photoItem, index) => (
                  <View key={photoItem.id} style={{ width: SCREEN_WIDTH }}>
                    <ScrollView
                      style={styles.zoomScrollView}
                      contentContainerStyle={styles.zoomContainer}
                      maximumZoomScale={3}
                      minimumZoomScale={1}
                      showsVerticalScrollIndicator={false}
                      showsHorizontalScrollIndicator={false}
                      centerContent
                    >
                      <Image
                        source={photoItem.source}
                        style={[
                          styles.viewerImage,
                          { 
                            width: SCREEN_WIDTH - 40,
                            height: (SCREEN_WIDTH - 40) * 0.75,
                            maxWidth: 800,
                            maxHeight: 600,
                          }
                        ]}
                        resizeMode="contain"
                      />
                    </ScrollView>
                  </View>
                ))}
              </ScrollView>

              {/* Navigation Arrows */}
              {activeIndex > 0 && (
                <TouchableOpacity style={[styles.navButton, styles.prevButton]} onPress={goToPrev}>
                  <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                </TouchableOpacity>
              )}
              {activeIndex < photos.length - 1 && (
                <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={goToNext}>
                  <Ionicons name="chevron-forward" size={28} color={COLORS.white} />
                </TouchableOpacity>
              )}
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
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: isSmallDevice ? 40 : isTablet ? 80 : 60,
    paddingBottom: isTablet ? 20 : 16,
    paddingHorizontal: isTablet ? 24 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: COLORS.muted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 12 : 10,
    backgroundColor: COLORS.accent,
    borderRadius: isTablet ? 14 : 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
  },
  gridContainer: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 20 : 16,
    paddingBottom: isTablet ? 32 : 24,
  },
  tile: {
    borderRadius: isTablet ? 16 : 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.tile,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPhotoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: isTablet ? 16 : 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: isTablet ? 22 : 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: isSmallDevice ? 40 : 60,
    paddingHorizontal: isTablet ? 24 : 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  viewerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  viewerTitle: {
    color: COLORS.white,
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  viewerCounter: {
    color: COLORS.muted,
    fontSize: isTablet ? 14 : 12,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pagerContainer: {
    flex: 1,
    position: 'relative',
  },
  zoomScrollView: {
    flex: 1,
  },
  zoomContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  viewerImage: {
    alignSelf: 'center',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
});