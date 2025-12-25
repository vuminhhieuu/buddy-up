import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer/ScreenContainer';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Text } from '../../components/ui/Text/Text';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { useTheme } from '../../styles';
import { Calendar, Clock } from 'lucide-react-native';
import { BackButton } from '../../components/navigation/BackButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAppSelector } from '../../store/hooks';
import { fetchSessionDetail, SessionDetail } from '../../services/session/detail';
import { updateSession } from '../../services/session/update';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { logger } from '../../utils/logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AVAILABLE_SUBJECTS } from '../../constants/subjects';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';

export const EditSessionScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(['session', 'common']);

  const sessionId = (route.params as any)?.sessionId;
  const userId = useAppSelector((s) => s.auth.userId);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetail | null>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateObj, setDateObj] = useState<Date | null>(null);
  const [timeObj, setTimeObj] = useState<Date | null>(null);
  const [duration, setDuration] = useState('90');
  const [customDuration, setCustomDuration] = useState('');
  const [statusText, setStatusText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationType, setLocationType] = useState<'online' | 'offline'>('online');
  const [link, setLink] = useState('');

  useEffect(() => {
    loadSession();
  }, [sessionId, loadSession]);

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      showErrorToast(t('detail.toast.sessionNotFound'));
      navigation.goBack();
      return;
    }

    setLoading(true);
    const { data, error } = await fetchSessionDetail(sessionId);
    if (error || !data) {
      showErrorToast(t('detail.toast.loadFailed'));
      logger.error('EditSessionScreen', 'Load error:', error);
      navigation.goBack();
      return;
    }

    setSession(data);

    // Pre-fill form with session data
    setTitle(data.title || '');

    // Handle subject
    if (data.subject) {
      const foundSubject = AVAILABLE_SUBJECTS.find((s) => s.key === data.subject);
      if (foundSubject) {
        setSubject(data.subject);
      } else {
        // Custom subject
        setSubject('other');
        setCustomSubject(data.subject);
      }
    }

    // Parse scheduled_start
    const startDate = new Date(data.scheduled_start);
    setDateObj(startDate);
    const formatted = `${String(startDate.getDate()).padStart(2, '0')}/${String(
      startDate.getMonth() + 1,
    ).padStart(2, '0')}/${startDate.getFullYear()}`;
    setDate(formatted);

    setTimeObj(startDate);
    const hh = String(startDate.getHours()).padStart(2, '0');
    const mm = String(startDate.getMinutes()).padStart(2, '0');
    setTime(`${hh}:${mm}`);

    // Calculate duration
    if (data.scheduled_end) {
      const endDate = new Date(data.scheduled_end);
      const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      const presetDurations = ['30', '60', '90', '120', '150', '180'];
      if (presetDurations.includes(String(durationMinutes))) {
        setDuration(String(durationMinutes));
      } else {
        setDuration('custom');
        setCustomDuration(String(durationMinutes));
      }
    }

    setStatusText(data.description || '');

    if (data.location) {
      setLocationType('online');
      setLink(data.location);
    } else {
      setLocationType('offline');
    }

    setLoading(false);
  }, [sessionId, t, navigation]);

  const handleUpdateSession = async () => {
    if (!title.trim()) {
      showErrorToast(t('errors.titleRequired'));
      return;
    }
    if (!date || !time) {
      showErrorToast(t('errors.dateTimeRequired'));
      return;
    }

    let startDate: Date | null = null;
    if (dateObj && timeObj) {
      startDate = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        timeObj.getHours(),
        timeObj.getMinutes(),
      );
    } else {
      const m = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      const tm = time.match(/^(\d{1,2}):(\d{2})$/);
      if (m && tm) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        const year = parseInt(m[3], 10);
        const hh = parseInt(tm[1], 10);
        const mm = parseInt(tm[2], 10);
        startDate = new Date(year, month, day, hh, mm);
      }
    }

    if (!startDate) {
      showErrorToast(t('errors.startDateParseFailed'));
      return;
    }

    if (!userId) {
      showErrorToast(t('errors.loginRequired'));
      return;
    }

    const now = new Date();
    if (startDate.getTime() < now.getTime()) {
      showErrorToast(t('errorPastSession'));
      return;
    }

    const durationMin =
      duration === 'custom'
        ? Number.parseInt(customDuration, 10) || 90
        : Number.parseInt(duration ?? '90', 10) || 90;

    // Validate duration: must be between 15 and 480 minutes
    if (durationMin < 15 || durationMin > 480) {
      showErrorToast(t('durationValidation'));
      return;
    }

    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

    // Use customSubject if subject is 'other' and customSubject has content
    const finalSubject =
      subject === 'other' && customSubject.trim() ? customSubject.trim() : subject || null;

    // If subject is 'other' but customSubject is empty, reject the form
    if (subject === 'other' && !customSubject.trim()) {
      showErrorToast(t('errors.titleRequired'));
      return;
    }

    const payload = {
      title: title.trim(),
      subject: finalSubject,
      scheduled_start: startDate.toISOString(),
      scheduled_end: endDate.toISOString(),
      location: locationType === 'online' ? link || null : null,
      description: statusText?.trim() ? statusText.trim() : null,
    };

    setIsSubmitting(true);
    try {
      logger.debug('EditSessionScreen', 'updateSession payload:', payload);
      const { data, error } = await updateSession(sessionId, payload);
      if (error || !data) {
        const msg = (error && (error.message || JSON.stringify(error))) || t('edit.updateFailed');
        showErrorToast(msg);
        logger.error('EditSessionScreen', 'updateSession error:', error);
        return;
      }

      showSuccessToast(t('edit.updateSuccess'));
      navigation.goBack();
    } catch (err: any) {
      logger.error('EditSessionScreen', 'updateSession unexpected error', err);
      showErrorToast((err && (err.message || JSON.stringify(err))) || t('edit.updateUnexpected'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChangeDate = (event: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      setDateObj(selected);
      const formatted = `${String(selected.getDate()).padStart(2, '0')}/${String(
        selected.getMonth() + 1,
      ).padStart(2, '0')}/${selected.getFullYear()}`;
      setDate(formatted);
      if (timeObj) {
        const now = new Date();
        const candidate = new Date(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
          timeObj.getHours(),
          timeObj.getMinutes(),
        );
        if (candidate < now) {
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          setTimeObj(now);
          setTime(`${hh}:${mm}`);
          Alert.alert(t('invalidTimeTitle'), t('invalidTimeReset'));
        }
      }
    }
  };

  const onChangeTime = (event: any, selected?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) {
      const base = dateObj ?? new Date();
      const candidate = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        selected.getHours(),
        selected.getMinutes(),
      );
      const now = new Date();
      if (base.toDateString() === now.toDateString() && candidate < now) {
        const hhNow = String(now.getHours()).padStart(2, '0');
        const mmNow = String(now.getMinutes()).padStart(2, '0');
        setTimeObj(now);
        setTime(`${hhNow}:${mmNow}`);
        Alert.alert(t('invalidTimeTitle'), t('invalidTimeChoose'));
        return;
      }

      setTimeObj(candidate);
      const hh = String(candidate.getHours()).padStart(2, '0');
      const mm = String(candidate.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);
    }
  };

  if (loading || !session) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={{ marginTop: theme.spacing[3] }}>{t('detail.loading')}</Text>
      </View>
    );
  }

  // Only allow creator to edit
  const isCreator = session.creator_id === userId;
  if (!isCreator) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing[6],
        }}
      >
        <Text variant="h6" style={{ textAlign: 'center', marginBottom: theme.spacing[4] }}>
          {t('edit.onlyCreatorCanEdit')}
        </Text>
        <Button label={t('common:back')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScreenContainer style={{ backgroundColor: theme.colors.surface }}>
        <View style={styles.headerRow}>
          <BackButton
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('common.back')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: theme.colors.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: theme.spacing[2],
              alignSelf: 'flex-start',
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 0,
              shadowOpacity: 0,
            }}
          />
          <Text variant="h5" style={{ fontWeight: '700' as const }}>
            {t('edit.title')}
          </Text>
          {/* spacer to keep title centered */}
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            marginTop: theme.spacing[6],
            gap: theme.spacing[4],
            paddingBottom: (insets.bottom ?? 0) + theme.spacing[8] + 100,
          }}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={200}
          showsVerticalScrollIndicator={false}
        >
          <Input
            label={t('nameLabel')}
            labelBold
            placeholder={t('namePlaceholder')}
            value={title}
            onChangeText={setTitle}
          />

          <View>
            <Text
              variant="h6"
              style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
            >
              {t('subjectLabel')}
            </Text>
            <Pressable
              onPress={() => setShowSubjectModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[3],
                gap: theme.spacing[2],
              }}
            >
              <Text
                style={{
                  flex: 1,
                  color: subject ? theme.colors.text.primary : theme.colors.text.tertiary,
                }}
              >
                {(() => {
                  if (!subject) return t('subjectPlaceholder');
                  if (subject === 'other' && customSubject) return customSubject;
                  const subj = AVAILABLE_SUBJECTS.find((s) => s.key === subject);
                  if (subj) {
                    const ns = (subj as any).namespace || 'common';
                    return t(subj.label, { ns });
                  }
                  return subject;
                })()}
              </Text>
              <Text style={{ color: theme.colors.text.tertiary }}>▼</Text>
            </Pressable>
          </View>

          <Modal
            transparent
            visible={showSubjectModal}
            onRequestClose={() => setShowSubjectModal(false)}
            animationType="slide"
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'flex-end',
                }}
                onPress={() => setShowSubjectModal(false)}
              >
                <Pressable
                  style={{
                    backgroundColor: theme.colors.background,
                    borderTopLeftRadius: theme.radius.lg,
                    borderTopRightRadius: theme.radius.lg,
                    maxHeight: '80%',
                    paddingTop: theme.spacing[4],
                    paddingBottom: theme.spacing[8],
                  }}
                  onPress={(e) => e.stopPropagation()}
                >
                  <Text
                    variant="h6"
                    style={{
                      fontWeight: '700',
                      paddingHorizontal: theme.spacing[4],
                      marginBottom: theme.spacing[3],
                    }}
                  >
                    {t('subjectLabel')}
                  </Text>
                  <ScrollView
                    contentContainerStyle={{
                      paddingBottom: theme.spacing[4],
                    }}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {AVAILABLE_SUBJECTS.map((subj, index) => (
                      <View key={subj.key}>
                        <Pressable
                          onPress={() => {
                            setSubject(subj.key);
                            if (subj.key !== 'other') {
                              setShowSubjectModal(false);
                              setCustomSubject('');
                            }
                          }}
                          style={({ pressed }) => ({
                            paddingHorizontal: theme.spacing[4],
                            paddingVertical: theme.spacing[3],
                            backgroundColor: pressed ? theme.colors.neutral[50] : 'transparent',
                            flexDirection: 'row',
                            alignItems: 'center',
                          })}
                        >
                          {subject === subj.key && (
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: theme.colors.primary[500],
                                marginRight: theme.spacing[3],
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                                ✓
                              </Text>
                            </View>
                          )}
                          {subject !== subj.key && (
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: theme.colors.border,
                                marginRight: theme.spacing[3],
                              }}
                            />
                          )}
                          <Text
                            style={{
                              fontSize: 15,
                              color: theme.colors.text.primary,
                              fontWeight: subject === subj.key ? '600' : '400',
                            }}
                          >
                            {(() => {
                              const ns = (subj as any).namespace || 'common';
                              return t(subj.label, { ns });
                            })()}
                          </Text>
                        </Pressable>
                        {index < AVAILABLE_SUBJECTS.length - 1 && (
                          <View
                            style={{
                              height: 1,
                              backgroundColor: theme.colors.neutral[100],
                              marginLeft: theme.spacing[4] + 20 + theme.spacing[3],
                            }}
                          />
                        )}
                      </View>
                    ))}
                    {subject === 'other' && (
                      <View
                        style={{ marginTop: theme.spacing[4], paddingHorizontal: theme.spacing[4] }}
                      >
                        <Input
                          placeholder={t('customSubjectPlaceholder')}
                          value={customSubject}
                          onChangeText={setCustomSubject}
                          autoFocus
                        />
                        <Button
                          label={t('selectLabel')}
                          disabled={!customSubject.trim()}
                          onPress={() => {
                            if (customSubject.trim()) {
                              setShowSubjectModal(false);
                            }
                          }}
                          style={{ marginTop: theme.spacing[3] }}
                        />
                      </View>
                    )}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </KeyboardAvoidingView>
          </Modal>

          <View>
            <Text
              variant="h6"
              style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
            >
              {t('timeDateTitle')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDatePicker(true);
                }}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.background,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    paddingHorizontal: theme.spacing[4],
                    paddingVertical: theme.spacing[3],
                    gap: theme.spacing[2],
                  }}
                >
                  <Calendar size={20} color={theme.colors.primary[500]} />
                  <Text
                    style={{
                      flex: 1,
                      color: date ? theme.colors.text.primary : theme.colors.text.tertiary,
                    }}
                  >
                    {date || t('datePlaceholder')}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setShowTimePicker(true);
                }}
                style={{ width: 130 }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.background,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    paddingHorizontal: theme.spacing[3],
                    paddingVertical: theme.spacing[3],
                    gap: theme.spacing[2],
                  }}
                >
                  <Clock size={20} color={theme.colors.primary[500]} />
                  <Text
                    style={{
                      color: time ? theme.colors.text.primary : theme.colors.text.tertiary,
                    }}
                  >
                    {time || t('timePlaceholder')}
                  </Text>
                </View>
              </Pressable>
            </View>
            {showDatePicker ? (
              <DateTimePicker
                value={dateObj || new Date()}
                mode="date"
                display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                minimumDate={new Date()}
                onChange={onChangeDate}
              />
            ) : null}
            {showTimePicker ? (
              <DateTimePicker
                value={timeObj || new Date()}
                mode="time"
                display={Platform.OS === 'android' ? 'spinner' : 'spinner'}
                is24Hour
                onChange={onChangeTime}
              />
            ) : null}
          </View>

          <View>
            <Text
              variant="h6"
              style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
            >
              {t('durationTitle')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {['30', '60', '90', '120', '150', '180'].map((min) => (
                <Pressable
                  key={min}
                  onPress={() => {
                    setDuration(min);
                    setCustomDuration('');
                  }}
                  style={{
                    paddingHorizontal: theme.spacing[4],
                    paddingVertical: theme.spacing[3],
                    borderRadius: theme.radius.md,
                    borderWidth: 1.5,
                    borderColor: duration === min ? theme.colors.primary[500] : theme.colors.border,
                    backgroundColor:
                      duration === min ? theme.colors.primary[50] : theme.colors.background,
                    minWidth: 70,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    color={duration === min ? 'primary' : undefined}
                    style={{
                      fontWeight: duration === min ? ('600' as const) : ('400' as const),
                    }}
                  >
                    {min} {t('durationUnit')}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setDuration('custom')}
                style={{
                  paddingHorizontal: theme.spacing[4],
                  paddingVertical: theme.spacing[3],
                  borderRadius: theme.radius.md,
                  borderWidth: 1.5,
                  borderColor:
                    duration === 'custom' ? theme.colors.primary[500] : theme.colors.border,
                  backgroundColor:
                    duration === 'custom' ? theme.colors.primary[50] : theme.colors.background,
                  minWidth: 70,
                  alignItems: 'center',
                }}
              >
                <Text
                  color={duration === 'custom' ? 'primary' : undefined}
                  style={{
                    fontWeight: duration === 'custom' ? ('600' as const) : ('400' as const),
                  }}
                >
                  {t('durationCustom')}
                </Text>
              </Pressable>
            </View>
            {duration === 'custom' && (
              <View
                style={{
                  marginTop: theme.spacing[3],
                }}
              >
                <Text variant="body" color="tertiary" style={{ marginBottom: theme.spacing[2] }}>
                  {t('customDurationDescription')}
                </Text>
                <View style={{ width: 120 }}>
                  <Input
                    placeholder={t('durationPlaceholder')}
                    keyboardType="numeric"
                    value={customDuration}
                    onChangeText={setCustomDuration}
                    right={
                      <Text color="tertiary" style={{ fontWeight: '500' as const }}>
                        {t('durationUnit')}
                      </Text>
                    }
                  />
                </View>
              </View>
            )}
          </View>

          <Input
            label={t('statusLabel')}
            labelBold
            placeholder={t('statusPlaceholder')}
            value={statusText}
            onChangeText={setStatusText}
            multiline
            style={{ height: 120, textAlignVertical: 'top' }}
          />

          <View>
            <Text
              variant="h6"
              style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
            >
              {t('locationTitle')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setLocationType('online')}>
                <View
                  style={[
                    styles.locationPill,
                    { borderColor: theme.colors.border },
                    locationType === 'online' && {
                      borderColor: theme.colors.primary[500],
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <Text color={locationType === 'online' ? 'primary' : 'tertiary'}>
                    {t('online')}
                  </Text>
                </View>
              </Pressable>
              <Pressable onPress={() => setLocationType('offline')}>
                <View
                  style={[
                    styles.locationPill,
                    { borderColor: theme.colors.border },
                    locationType === 'offline' && {
                      borderColor: theme.colors.primary[500],
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <Text color={locationType === 'offline' ? 'primary' : 'tertiary'}>
                    {t('offline')}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {locationType === 'online' ? (
            <Input
              label={t('linkLabel')}
              labelBold
              placeholder={t('linkPlaceholder')}
              value={link}
              onChangeText={setLink}
            />
          ) : null}

          <View style={{ marginTop: theme.spacing[8] }}>
            <Button
              label={t('edit.updateButton')}
              onPress={handleUpdateSession}
              variant="primary"
              size="lg"
              style={{ width: '100%' }}
              disabled={isSubmitting}
            />
          </View>
        </KeyboardAwareScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});

export default EditSessionScreen;
