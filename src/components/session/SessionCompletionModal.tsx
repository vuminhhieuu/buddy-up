import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { useTheme } from '../../styles';
import { Text } from '../ui/Text/Text';
import { Button } from '../ui/Button/Button';
import { X, CheckCircle, Clock, Users, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export type SessionCompletionModalProps = {
  visible: boolean;
  onClose: () => void;
  onMarkComplete: (rating?: number) => void;
  sessionTitle: string;
  duration: string;
  participantCount: number;
};

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  visible,
  onClose,
  onMarkComplete,
  sessionTitle,
  duration,
  participantCount,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('session');
  const [rating, setRating] = useState(0);

  // Reset rating when modal visibility changes
  useEffect(() => {
    if (!visible) {
      setRating(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#666" strokeWidth={2} />
          </Pressable>

          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.successCircle, { backgroundColor: '#4CAF50' }]}>
              <CheckCircle size={60} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </View>

          {/* Title */}
          <Text variant="h4" style={styles.title}>
            {t('completion.title')} 🎉
          </Text>
          <Text variant="body" style={styles.subtitle}>
            {sessionTitle}
          </Text>

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Clock size={24} color={theme.colors.primary[500]} strokeWidth={2} />
              <Text variant="h5" style={styles.statValue}>
                {duration}
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                {t('completion.duration')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Users size={24} color={theme.colors.primary[500]} strokeWidth={2} />
              <Text variant="h5" style={styles.statValue}>
                {participantCount} {t('completion.people')}
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                {t('completion.participants')}
              </Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text variant="h6" style={styles.ratingTitle}>
              {t('completion.ratingQuestion')}
            </Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <Pressable
                  key={starIndex}
                  onPress={() => setRating(starIndex)}
                  style={styles.starButton}
                >
                  <Star
                    size={36}
                    color={rating >= starIndex ? '#FFA500' : '#D1D5DB'}
                    fill={rating >= starIndex ? '#FFA500' : '#FFFFFF'}
                    strokeWidth={2}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text variant="bodySmall" style={styles.descriptionText}>
              {t('completion.trackingMessage')}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              label={`✓ ${t('completion.markCompleted')}`}
              onPress={() => {
                onMarkComplete(rating > 0 ? rating : undefined);
                onClose();
              }}
              variant="primary"
              size="lg"
              style={styles.primaryButton}
            />
            <Button
              label={`⚠ ${t('completion.notCompleted')}`}
              onPress={onClose}
              variant="secondary"
              size="lg"
              style={styles.secondaryButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 24,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  ratingTitle: {
    fontWeight: '700',
    marginBottom: 12,
    fontSize: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  descriptionSection: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  descriptionText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#22C55E',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
});
