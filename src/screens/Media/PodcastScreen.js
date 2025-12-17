import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const Animated = require('react-native').Animated;

const COLORS = {
  background: '#1E1F25',
  card: '#2A2B31',
  border: '#3C3C43',
  text: '#E5E7EB',
  muted: '#9CA3AF',
  primary: '#E63946',
  success: '#10B981',
  warning: '#F59E0B',
};

const BASE_URL = 'https://freedom-tech.onrender.com';

const FAVORITES_KEY = 'podcastFavorites_v1';
const PLAYED_KEY = 'podcastPlayed_v1';

export default function PodcastScreen() {
  const { accessToken, logout } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [played, setPlayed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [podcasts, setPodcasts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const soundRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const loadingTimeoutRef = useRef(null);
  const playbackIntervalRef = useRef(null);

  useEffect(() => {
    loadStorageData();
    setupAudioMode();

    return () => {
      // Cleanup
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      stopCurrentAudio();
    };
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    loadPodcasts();
  }, [accessToken]);

  useEffect(() => {
    if (!isSeeking && durationMillis > 0) {
      Animated.timing(progressAnim, {
        toValue: positionMillis / durationMillis,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [positionMillis, durationMillis, isSeeking]);

  const loadPodcasts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/podcasts`, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!res.ok) {
        let message = 'Failed to load podcasts.';
        if (res.status === 401) {
          Alert.alert('Session expired', 'Please log in again to listen to podcasts.', [
            { text: 'OK', onPress: () => logout() },
          ]);
          return;
        }
        try {
          const err = await res.json();
          if (err?.error) {
            message = err.error;
          }
        } catch {}
        setError(message);
        setPodcasts([]);
        return;
      }

      const data = await res.json();
      console.log('Podcasts data:', data);
      
      // API response structure might vary - adjust accordingly
      const items = Array.isArray(data.podcasts) ? data.podcasts : 
                    Array.isArray(data) ? data : 
                    data.data || [];
      
      // Fix audio URLs and add default duration
      const formattedItems = items.map(podcast => ({
        ...podcast,
        audioUrl: podcast.audioUrl && podcast.audioUrl.startsWith('uploads/') 
          ? `${BASE_URL}/${podcast.audioUrl}`
          : podcast.audioUrl,
        duration: podcast.duration || 300000 // Default 5 minutes if not provided
      }));
      
      setPodcasts(formattedItems);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(formattedItems.map((p) => p.category || 'Uncategorized').filter(Boolean))
      );
      setCategories(['All', ...uniqueCategories]);
    } catch (err) {
      console.log('Error loading podcasts:', err);
      setError('Failed to load podcasts. Please check your connection.');
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageData = async () => {
    try {
      const [favRaw, playedRaw] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(PLAYED_KEY),
      ]);
      setFavorites(favRaw ? JSON.parse(favRaw) : []);
      setPlayed(playedRaw ? JSON.parse(playedRaw) : []);
    } catch (error) {
      console.log('Error loading storage:', error);
    }
  };

  const setupAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.log('Error setting audio mode:', error);
    }
  };

  const toggleFavorite = async (episodeId) => {
    try {
      const exists = favorites.includes(episodeId);
      const next = exists
        ? favorites.filter((id) => id !== episodeId)
        : [...favorites, episodeId];
      setFavorites(next);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Error toggling favorite:', error);
    }
  };

  const markPlayed = async (episodeId) => {
    if (played.includes(episodeId)) return;
    try {
      const next = [...played, episodeId];
      setPlayed(next);
      await AsyncStorage.setItem(PLAYED_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Error marking as played:', error);
    }
  };

  const openEpisode = async (episode) => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    try {
      // Stop any currently playing audio before starting a new one
      await stopCurrentAudio();

      setSelected(episode);
      setIsModalVisible(true);
      setIsLoadingSound(true);
      setIsPlaying(false);
      setPositionMillis(0);
      setDurationMillis(0);
      setCurrentPlayingId(episode._id);

      // Set timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoadingSound(false);
        Alert.alert('Error', 'Could not load audio. Please check your connection.');
        console.log('Loading timeout reached');
      }, 10000); // 10 seconds timeout

      // Normalise audio URL
      let audioUri = episode.audioUrl;
      if (!audioUri) {
        throw new Error('No audio URL provided');
      }
      
      // Fix URL if needed
      if (audioUri.startsWith('/')) {
        audioUri = `${BASE_URL}${audioUri}`;
      } else if (audioUri.startsWith('uploads/')) {
        audioUri = `${BASE_URL}/${audioUri}`;
      }
      
      console.log('Loading audio from:', audioUri);

      // Load new sound with optimized settings
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 500,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        }
      );

      // Clear timeout since loading succeeded
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      soundRef.current = sound;
      
      // Set up playback status update listener
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      
      // Get initial status
      const initialStatus = await sound.getStatusAsync();
      if (initialStatus.isLoaded) {
        setDurationMillis(initialStatus.durationMillis || 0);
      }

      markPlayed(episode._id);
      setIsLoadingSound(false);
      
      // Start playing automatically
      await sound.playAsync();
      setIsPlaying(true);
      
    } catch (error) {
      console.log('Error loading audio:', error);
      // Clear timeout on error too
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsLoadingSound(false);
      Alert.alert('Error', `Could not play audio: ${error.message}`);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.log('Playback error:', status.error);
        Alert.alert('Playback Error', 'An error occurred while playing audio.');
      }
      return;
    }

    setPositionMillis(status.positionMillis || 0);
    setDurationMillis(status.durationMillis || durationMillis);
    setIsPlaying(status.isPlaying || false);
    
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMillis(0);
      progressAnim.setValue(0);
    }
  };

  const closePlayer = async () => {
    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Clear playback interval
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    // Pause and unload sound
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.pauseAsync();
          await soundRef.current.unloadAsync();
        }
        soundRef.current = null;
      } catch (error) {
        console.log('Error closing player:', error);
      }
    }

    // Reset states
    setIsModalVisible(false);
    setSelected(null);
    setPositionMillis(0);
    setDurationMillis(0);
    setIsPlaying(false);
    setCurrentPlayingId(null);
    progressAnim.setValue(0);
  };

  const stopCurrentAudio = async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        }
        soundRef.current = null;
      } catch (error) {
        console.log('Error stopping audio:', error);
      }
    }
    setIsPlaying(false);
    setCurrentPlayingId(null);
    setPositionMillis(0);
    progressAnim.setValue(0);
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.log('Error toggling play/pause:', error);
    }
  };

  const seekTo = async (ratio) => {
    if (!soundRef.current || !durationMillis) return;

    try {
      setIsSeeking(true);
      const targetPosition = Math.floor(durationMillis * ratio);
      await soundRef.current.setPositionAsync(targetPosition);
      setPositionMillis(targetPosition);
      progressAnim.setValue(ratio);
    } catch (error) {
      console.log('Error seeking:', error);
    } finally {
      setIsSeeking(false);
    }
  };

  const skipForward = async () => {
    if (!soundRef.current || !durationMillis) return;
    const newPosition = Math.min(positionMillis + 15000, durationMillis);
    await soundRef.current.setPositionAsync(newPosition);
  };

  const skipBackward = async () => {
    if (!soundRef.current) return;
    const newPosition = Math.max(positionMillis - 10000, 0);
    await soundRef.current.setPositionAsync(newPosition);
  };

  const filteredPodcasts = selectedCategory === 'All'
    ? podcasts
    : podcasts.filter((podcast) => podcast.category === selectedCategory);

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item && styles.categoryTextActive,
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderEpisode = ({ item }) => {
    const isFav = favorites.includes(item._id);
    const isPlayed = played.includes(item._id);
    const isCurrentlyPlaying = currentPlayingId === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isCurrentlyPlaying && styles.playingCard,
        ]}
        onPress={() => openEpisode(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category || 'Uncategorized'}</Text>
          </View>
          <View style={styles.badgesRow}>
            {isPlayed && (
              <View style={styles.playedBadge}>
                <Ionicons name="checkmark-done" size={12} color="#FFFFFF" />
              </View>
            )}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleFavorite(item._id);
              }}
              style={styles.favoriteButton}
            >
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={18}
                color={isFav ? COLORS.primary : COLORS.muted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || 'Untitled'}
        </Text>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={12} color={COLORS.muted} />
            <Text style={styles.durationText}>
              {item.duration 
                ? `${Math.round(item.duration / 60000)} min` 
                : 'Audio'}
            </Text>
          </View>
          <View style={[
            styles.playButton,
            isCurrentlyPlaying && styles.playingButton
          ]}>
            {isCurrentlyPlaying && isPlaying ? (
              <>
                <Ionicons name="pause" size={14} color="#FFFFFF" />
                <Text style={styles.playingText}>PLAYING</Text>
              </>
            ) : (
              <>
                <Ionicons name="play" size={14} color={COLORS.primary} />
                <Text style={styles.playText}>PLAY</Text>
              </>
            )}
          </View>
        </View>

        {/* Currently Playing Indicator */}
        {isCurrentlyPlaying && isPlaying && (
          <View style={styles.playingIndicator}>
            <View style={styles.playingPulse} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const formatTime = (millis) => {
    if (!millis || millis < 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.screenTitle}>Podcasts</Text>
          <Text style={styles.screenSubtitle}>
            Educational, motivational and wellness audio content
          </Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{podcasts.length} episodes</Text>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={renderCategory}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Mini Player - Shows when audio is playing */}
      {currentPlayingId && (
        <TouchableOpacity
          style={styles.miniPlayer}
          onPress={() => {
            const playingPodcast = podcasts.find((p) => p._id === currentPlayingId);
            if (playingPodcast) {
              setSelected(playingPodcast);
              setIsModalVisible(true);
            }
          }}
        >
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniPlayerInfo}>
              <Ionicons name="musical-notes" size={16} color={COLORS.primary} />
              <Text style={styles.miniPlayerTitle} numberOfLines={1}>
                {podcasts.find((p) => p._id === currentPlayingId)?.title || 'Now Playing'}
              </Text>
            </View>
            <View style={styles.miniPlayerControls}>
              <TouchableOpacity onPress={togglePlayPause} style={styles.miniControlButton}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={16}
                  color={COLORS.text}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={stopCurrentAudio} style={styles.miniControlButton}>
                <Ionicons name="close" size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
          <Animated.View
            style={[
              styles.miniPlayerProgress,
              { width: progressWidth }
            ]}
          />
        </TouchableOpacity>
      )}

      {/* Podcasts List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 8, color: COLORS.muted }}>Loading podcasts...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: COLORS.muted, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadPodcasts}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPodcasts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: COLORS.muted, textAlign: 'center' }}>
            No podcasts are available right now.
            {"\n"}
            Please check back later or ask facility staff about audio content.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPodcasts}
          keyExtractor={(item) => item._id}
          renderItem={renderEpisode}
          contentContainerStyle={[
            styles.listContent,
            currentPlayingId && styles.listContentWithMiniPlayer,
          ]}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {/* Player Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePlayer}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.playerCard}>
            {/* Header */}
            <View style={styles.playerHeader}>
              <TouchableOpacity onPress={closePlayer} style={styles.closeButton}>
                <Ionicons name="chevron-down" size={28} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.playerHeaderCenter}>
                <Text style={styles.playerHeaderTitle} numberOfLines={1}>
                  {selected?.title || 'Now Playing'}
                </Text>
                <Text style={styles.playerHeaderSubtitle}>
                  {isPlaying ? 'Playing' : 'Paused'} • {selected?.category || 'Uncategorized'}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => selected && toggleFavorite(selected._id)}
                style={styles.favoriteModalButton}
              >
                <Ionicons 
                  name={favorites.includes(selected?._id) ? "heart" : "heart-outline"} 
                  size={24} 
                  color={favorites.includes(selected?._id) ? COLORS.primary : COLORS.text} 
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.playerContent}>
              {isLoadingSound ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading audio...</Text>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={closePlayer}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.artworkContainer}>
                    <View style={styles.artwork}>
                      <Ionicons name="musical-notes" size={60} color={COLORS.primary} />
                    </View>
                  </View>

                  <View style={styles.trackInfo}>
                    <Text style={styles.playerTitle} numberOfLines={2}>
                      {selected?.title || 'Untitled'}
                    </Text>
                    <Text style={styles.playerDescription} numberOfLines={3}>
                      {selected?.description || 'No description available'}
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.timeLabels}>
                      <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
                      <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.progressBar}
                      onPress={(e) => {
                        const x = e.nativeEvent.locationX;
                        const width = e.nativeEvent.layoutMeasurement.width;
                        const ratio = x / width;
                        seekTo(ratio);
                      }}
                      activeOpacity={1}
                    >
                      <View style={styles.progressBackground}>
                        <Animated.View 
                          style={[
                            styles.progressFill,
                            { width: progressWidth }
                          ]} 
                        />
                      </View>
                      <Animated.View 
                        style={[
                          styles.progressThumb,
                          { left: progressWidth }
                        ]}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Controls */}
                  <View style={styles.controls}>
                    <TouchableOpacity 
                      style={styles.controlButton} 
                      onPress={skipBackward}
                    >
                      <Ionicons name="play-back" size={28} color={COLORS.text} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.modalPlayButton} 
                      onPress={togglePlayPause}
                    >
                      <Ionicons 
                        name={isPlaying ? "pause" : "play"} 
                        size={36} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.controlButton} 
                      onPress={skipForward}
                    >
                      <Ionicons name="play-forward" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Additional Controls */}
                  <View style={styles.additionalControls}>
                    <TouchableOpacity 
                      style={styles.additionalButton}
                      onPress={() => selected && markPlayed(selected._id)}
                    >
                      <Ionicons name="checkmark-done" size={20} color={played.includes(selected?._id) ? COLORS.success : COLORS.text} />
                      <Text style={styles.additionalButtonText}>Mark Played</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.additionalButton}
                      onPress={stopCurrentAudio}
                    >
                      <Ionicons name="stop" size={20} color={COLORS.text} />
                      <Text style={styles.additionalButtonText}>Stop</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  headerText: {
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 18,
  },
  headerStats: {
    alignItems: 'flex-start',
  },
  statsText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(42, 43, 49, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  // Mini Player Styles
  miniPlayer: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  miniPlayerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  miniPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniControlButton: {
    padding: 4,
  },
  miniPlayerProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },
  listContentWithMiniPlayer: {
    paddingBottom: 80,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 180,
    position: 'relative',
    maxWidth: (SCREEN_WIDTH - 52) / 2,
  },
  playingCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '70%',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    padding: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 16,
    marginBottom: 16,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.3)',
  },
  playingButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  playText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  playingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  playingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCard: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  playerHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  playerHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  playerHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  favoriteModalButton: {
    padding: 8,
  },
  playerContent: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  artwork: {
    width: 180,
    height: 180,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  playerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  playerDescription: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  playerCategory: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 40,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
  },
  progressBar: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    top: '50%',
    marginTop: -10,
    marginLeft: -10,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  modalPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  additionalButton: {
    alignItems: 'center',
    padding: 12,
  },
  additionalButtonText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
});