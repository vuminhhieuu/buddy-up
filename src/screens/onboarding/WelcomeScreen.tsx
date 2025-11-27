import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../styles';
import { HandshakeLogo } from '../../components/ui';
import { LanguageSelector } from '../../components/onboarding/LanguageSelector';

type OnboardingStackParamList = {
  Welcome: undefined;
  FeatureCarousel: undefined;
};

type WelcomeScreenNavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleStart = () => {
    navigation.navigate('FeatureCarousel');
  };

  // More robust slogan handling with optional split keys
  const sloganParts = useMemo(() => {
    const full = t('onboarding.welcome.slogan');
    const highlight = t('onboarding.welcome.sloganHighlight');
    const before = t('onboarding.welcome.sloganBefore', { defaultValue: '' });
    const after = t('onboarding.welcome.sloganAfter', { defaultValue: '' });

    if (before || after) {
      return { before, highlight, after };
    }
    const idx = full.indexOf(highlight);
    if (idx === -1) {
      return { before: full, highlight: '', after: '' };
    }
    return {
      before: full.slice(0, idx),
      highlight,
      after: full.slice(idx + highlight.length),
    };
  }, [t]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Language Selector */}
      <LanguageSelector />

      {/* Background Decorations - Fixed position */}
      {/* Top right gradient decoration */}
      <View style={[styles.topRightGradient, { backgroundColor: theme.colors.primary[100] }]} />

      {/* Middle wave decoration */}
      <View
        style={[styles.middleWaveDecoration, { backgroundColor: theme.colors.secondary[50] }]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header tag - Centered */}
        <View style={[styles.headerTag, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.greenDot, { backgroundColor: theme.colors.primary[500] }]} />
          <Text
            style={[
              styles.tagline,
              {
                fontFamily: theme.typography.families.body,
                color: theme.colors.text.primary,
              },
            ]}
          >
            {t('onboarding.welcome.tagline')}
          </Text>
        </View>

        {/* Logo and Title */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.titleBlack,
              {
                fontFamily: theme.typography.families.display,
                fontWeight: '700',
                color: theme.colors.text.primary,
              },
            ]}
          >
            BUDDY
          </Text>
        </View>
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.titleGreen,
              {
                fontFamily: theme.typography.families.display,
                fontWeight: '700',
                color: theme.colors.primary[500],
              },
            ]}
          >
            UP
          </Text>
        </View>

        {/* Slogan */}
        <Text
          style={[
            styles.slogan,
            {
              fontFamily: theme.typography.families.body,
              color: theme.colors.text.secondary,
            },
          ]}
        >
          {sloganParts.before}
          <Text
            style={{
              fontFamily: theme.typography.families.body,
              fontWeight: '600',
              color: theme.colors.primary[500],
            }}
          >
            {sloganParts.highlight}
          </Text>{' '}
          {sloganParts.after}
        </Text>

        {/* User Personas */}
        <View style={styles.personaContainer}>
          <View style={[styles.persona, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.personaIcon}>
              {t('onboarding.welcome.persona1.icon', { defaultValue: '👨‍💼' })}
            </Text>
            <Text
              style={[
                styles.personaName,
                {
                  fontFamily: theme.typography.families.display,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                },
              ]}
            >
              {t('onboarding.welcome.persona1.name')}
            </Text>
            <Text
              style={[
                styles.personaGoal,
                {
                  fontFamily: theme.typography.families.body,
                  color: theme.colors.text.secondary,
                },
              ]}
            >
              {t('onboarding.welcome.persona1.goal')}
            </Text>
            <Text
              style={[
                styles.personaSubject,
                {
                  fontFamily: theme.typography.families.body,
                  fontWeight: '500',
                  color: theme.colors.secondary[500],
                },
              ]}
            >
              {t('onboarding.welcome.persona1.subject')}
            </Text>
          </View>

          <View style={styles.handshakeContainer}>
            <HandshakeLogo size="small" />
          </View>

          <View style={[styles.persona, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.personaIcon}>
              {t('onboarding.welcome.persona2.icon', { defaultValue: '👩‍💼' })}
            </Text>
            <Text
              style={[
                styles.personaName,
                {
                  fontFamily: theme.typography.families.display,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                },
              ]}
            >
              {t('onboarding.welcome.persona2.name')}
            </Text>
            <Text
              style={[
                styles.personaGoal,
                {
                  fontFamily: theme.typography.families.body,
                  color: theme.colors.text.secondary,
                },
              ]}
            >
              {t('onboarding.welcome.persona2.goal')}
            </Text>
            <Text
              style={[
                styles.personaSubject,
                {
                  fontFamily: theme.typography.families.body,
                  fontWeight: '500',
                  color: theme.colors.secondary[500],
                },
              ]}
            >
              {t('onboarding.welcome.persona2.subject')}
            </Text>
          </View>
        </View>

        {/* Bottom wave decoration */}
        <View style={styles.bottomSpacing} />

        {/* Features List */}
        <View style={[styles.featuresList, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text
              style={[
                styles.featureText,
                {
                  fontFamily: theme.typography.families.body,
                  color: theme.colors.text.primary,
                },
              ]}
            >
              {t('onboarding.welcome.features.feature1')}
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📚</Text>
            <Text
              style={[
                styles.featureText,
                {
                  fontFamily: theme.typography.families.body,
                  color: theme.colors.text.primary,
                },
              ]}
            >
              {t('onboarding.welcome.features.feature2')}
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔥</Text>
            <Text
              style={[
                styles.featureText,
                {
                  fontFamily: theme.typography.families.body,
                  color: theme.colors.text.primary,
                },
              ]}
            >
              {t('onboarding.welcome.features.feature3')}
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor: theme.colors.primary[500],
              ...theme.shadows.lg,
            },
          ]}
          onPress={handleStart}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.welcome.startButton')}
          accessibilityHint={t('onboarding.welcome.startHint', {
            defaultValue: 'Start onboarding',
          })}
        >
          <Text
            style={[
              styles.startButtonText,
              {
                fontFamily: theme.typography.families.display,
                fontWeight: '600',
                color: theme.colors.text.inverse,
              },
            ]}
          >
            {t('onboarding.welcome.startButton')}
          </Text>
        </TouchableOpacity>

        {/* Footer Stats */}
        <View style={styles.footer}>
          <View style={styles.stat}>
            <Text style={[styles.statIcon, { color: theme.colors.primary[500] }]}>✓</Text>
            <Text
              style={[
                styles.statText,
                {
                  fontFamily: theme.typography.families.body,
                  color: theme.colors.text.secondary,
                },
              ]}
            >
              {t('onboarding.welcome.stats.free')}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statIcon, { color: theme.colors.primary[500] }]}>✓</Text>
            <Text
              style={[
                styles.statText,
                {
                  fontFamily: theme.typography.families.body,
                  color: theme.colors.text.secondary,
                },
              ]}
            >
              {t('onboarding.welcome.stats.safe')}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statIcon, { color: theme.colors.primary[500] }]}>✓</Text>
            <Text
              style={[
                styles.statText,
                {
                  fontFamily: theme.typography.families.body,
                  color: theme.colors.text.secondary,
                },
              ]}
            >
              {t('onboarding.welcome.stats.users')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Top right gradient decoration
  topRightGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.4,
    zIndex: 1,
  },
  // Middle wave decoration (behind personas)
  middleWaveDecoration: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    height: 300,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    opacity: 0.15,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tagline: {
    fontSize: 13,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleBlack: {
    fontSize: 56,
    letterSpacing: 2,
  },
  titleGreen: {
    fontSize: 56,
    letterSpacing: 2,
    marginBottom: 16,
  },
  slogan: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  personaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
    zIndex: 3,
  },
  persona: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    maxWidth: 130,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  personaIcon: {
    fontSize: 52,
    marginBottom: 8,
  },
  personaName: {
    fontSize: 16,
    marginBottom: 4,
  },
  personaGoal: {
    fontSize: 13,
    marginBottom: 4,
  },
  personaSubject: {
    fontSize: 11,
  },
  handshakeContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  bottomSpacing: {
    height: 32,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  startButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontSize: 11,
  },
});
