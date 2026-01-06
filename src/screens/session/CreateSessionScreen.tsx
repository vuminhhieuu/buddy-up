import React, { useState } from 'react';
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
  Image as RNImage,
  TextInput,
} from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer/ScreenContainer';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Text } from '../../components/ui/Text/Text';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { useTheme } from '../../styles';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Image,
  FileText,
  StickyNote,
  X,
  Plus,
} from 'lucide-react-native';
import { BackButton } from '../../components/navigation/BackButton';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAppSelector } from '../../store/hooks';
import { createStudySession } from '../../services/session/create';
import { fetchAcceptedBuddies } from '../../services/buddy/connections';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { logger } from '../../utils/logger';
import { formatDateTimeDDMMYYYYHHMM } from '../../utils/date';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AVAILABLE_SUBJECTS } from '../../constants/subjects';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  uploadSessionImage,
  uploadSessionDocument,
  addSessionAttachment,
  createSessionNote,
} from '../../services/session/attachments';

export const CreateSessionScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(['session', 'common']);

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
  const [selectedBuddyIds, setSelectedBuddyIds] = useState<string[]>([]);
  const [showBuddyModal, setShowBuddyModal] = useState(false);

  // Attachment states
  const [images, setImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<{ uri: string; name: string }[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);

  const buddies = useAppSelector((s) => s.buddy.results ?? []);
  const userId = useAppSelector((s) => s.auth.userId);

  const [acceptedBuddies, setAcceptedBuddies] = React.useState<
    import('../../types/buddy').BuddyProfile[]
  >([]);
  const acceptedBuddyIds = React.useMemo(
    () => new Set(acceptedBuddies.map((b) => b.user_id)),
    [acceptedBuddies],
  );

  const getValidSelectedBuddyIds = () => selectedBuddyIds.filter((id) => acceptedBuddyIds.has(id));

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!userId) return;
      const list = await fetchAcceptedBuddies(userId);
      if (mounted) setAcceptedBuddies(list || []);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleCreateShared = async () => {
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
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

    // Use customSubject if subject is 'other', otherwise use subject key
    const finalSubject =
      subject === 'other' && customSubject.trim() ? customSubject.trim() : subject || null;

    const payload = {
      title: title.trim(),
      subject: finalSubject,
      scheduled_start: startDate.toISOString(),
      scheduled_end: endDate.toISOString(),
      creator_id: userId,
      location: locationType === 'online' ? link || null : null,
      description: statusText?.trim() ? statusText.trim() : null,
      status: 'scheduled',
    };

    setIsSubmitting(true);
    try {
      logger.debug(
        'CreateSessionScreen',
        'startDate local',
        startDate.toString(),
        'ISO',
        startDate.toISOString(),
      );
      logger.debug(
        'CreateSessionScreen',
        'endDate local',
        endDate.toString(),
        'ISO',
        endDate.toISOString(),
      );
      logger.debug(
        'CreateSessionScreen',
        'createStudySession payload:',
        payload,
        'participants:',
        selectedBuddyIds,
      );
      const validParticipantIds = getValidSelectedBuddyIds();
      const { data, error } = await createStudySession(
        payload,
        validParticipantIds.length ? validParticipantIds : undefined,
      );
      if (error || !data) {
        const msg = (error && (error.message || JSON.stringify(error))) || t('errors.createFailed');
        showErrorToast(msg);
        logger.error('CreateSessionScreen', 'createStudySession error:', error);
        return;
      }

      // Upload attachments after session is created
      if (images.length > 0 || documents.length > 0 || notes.length > 0) {
        setIsUploadingAttachments(true);
        try {
          // Upload images
          for (const imageUri of images) {
            try {
              const { url, size, name } = await uploadSessionImage(imageUri);
              await addSessionAttachment(data.id, {
                type: 'image',
                name,
                url,
                size,
                created_by: userId,
              });
            } catch (err) {
              logger.error('CreateSessionScreen', 'Failed to upload image', err);
            }
          }

          // Upload documents
          for (const doc of documents) {
            try {
              const { url, size, name } = await uploadSessionDocument(doc.uri, doc.name);
              await addSessionAttachment(data.id, {
                type: 'document',
                name,
                url,
                size,
                created_by: userId,
              });
            } catch (err) {
              logger.error('CreateSessionScreen', 'Failed to upload document', err);
            }
          }

          // Save notes
          for (const note of notes) {
            try {
              await createSessionNote(data.id, note, userId);
            } catch (err) {
              logger.error('CreateSessionScreen', 'Failed to save note', err);
            }
          }
        } finally {
          setIsUploadingAttachments(false);
        }
      }

      showSuccessToast(t('successTitle'));

      const sessionDateTime = formatDateTimeDDMMYYYYHHMM(startDate);

      (navigation as any).navigate('CreateSessionSuccess', {
        sessionId: data.id,
        sessionTitle: payload.title,
        sessionDateTime,
        scheduledStartIso: startDate.toISOString(),
        scheduledEndIso: endDate.toISOString(),
        duration: String(durationMin),
      });
    } catch (err: any) {
      logger.error('CreateSessionScreen', 'createStudySession unexpected error', err);
      showErrorToast((err && (err.message || JSON.stringify(err))) || t('errors.createUnexpected'));
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

  const toggleBuddy = (id: string) => {
    if (!acceptedBuddyIds.has(id)) {
      showErrorToast(t('errors.notBuddies'));
      return;
    }
    setSelectedBuddyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  // Attachment handlers
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImages([...images, ...result.assets.map((a) => a.uri)]);
      }
    } catch (error) {
      logger.error('CreateSessionScreen', 'Failed to pick image', error);
      showErrorToast(t('errors.imagePick'));
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newDocs = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
        }));
        setDocuments([...documents, ...newDocs]);
      }
    } catch (error) {
      logger.error('CreateSessionScreen', 'Failed to pick document', error);
      showErrorToast(t('errors.documentPick'));
    }
  };

  const handleAddNote = () => {
    if (currentNote.trim()) {
      setNotes([...notes, currentNote.trim()]);
      setCurrentNote('');
      setShowNoteModal(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

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
            {t('title')}
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
                          placeholder={t('customSubjectPlaceholder') || 'Nhập môn học tùy chỉnh'}
                          value={customSubject}
                          onChangeText={setCustomSubject}
                          autoFocus
                        />
                        <Button
                          label={t('select', { ns: 'common' }) || 'Chọn'}
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
                  {t('durationCustom') || 'Khác'}
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
          ) : (
            <Input
              label={t('locationTitle')}
              labelBold
              placeholder="Nhập địa điểm học trực tiếp"
              value={link}
              onChangeText={setLink}
            />
          )}

          <View>
            <Text
              variant="h6"
              style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
            >
              {t('buddiesTitle')}
            </Text>
            {acceptedBuddies.length === 0 ? (
              <Text variant="caption" color="tertiary">
                {t('noBuddies')}
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ paddingVertical: theme.spacing[2] }}
                nestedScrollEnabled={true}
              >
                {[...acceptedBuddies]
                  .sort((a, b) => {
                    const aSelected = selectedBuddyIds.includes(a.user_id);
                    const bSelected = selectedBuddyIds.includes(b.user_id);
                    if (aSelected && !bSelected) return -1;
                    if (!aSelected && bSelected) return 1;
                    return 0;
                  })
                  .map((b) => {
                    const selected = selectedBuddyIds.includes(b.user_id);
                    return (
                      <TouchableOpacity
                        key={b.user_id}
                        onPress={() => toggleBuddy(b.user_id)}
                        style={{ marginRight: theme.spacing[4] }}
                      >
                        <View style={{ alignItems: 'center' }}>
                          <View
                            style={{
                              borderRadius: 999,
                              borderWidth: selected ? 3 : 0,
                              borderColor: selected ? theme.colors.primary[500] : 'transparent',
                              padding: 2,
                            }}
                          >
                            <Avatar
                              uri={b.avatar_url || undefined}
                              name={b.display_name}
                              size="lg"
                            />
                          </View>
                          <Text
                            variant="caption"
                            style={{
                              marginTop: theme.spacing[2],
                              maxWidth: 80,
                              textAlign: 'center',
                              color: selected ? theme.colors.primary[600] : undefined,
                              fontWeight: selected ? ('600' as const) : undefined,
                            }}
                          >
                            {b.display_name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                <TouchableOpacity
                  onPress={() => setShowBuddyModal(true)}
                  style={{ marginRight: theme.spacing[4] }}
                >
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: theme.sizes.avatar.lg,
                        height: theme.sizes.avatar.lg,
                        borderRadius: 999,
                        backgroundColor: theme.colors.background,
                        borderWidth: 2,
                        borderColor: theme.colors.border,
                        borderStyle: 'dashed',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{ fontSize: 32, color: theme.colors.text.tertiary, lineHeight: 32 }}
                      >
                        +
                      </Text>
                    </View>
                    <Text
                      variant="caption"
                      color="tertiary"
                      style={{ marginTop: theme.spacing[2], maxWidth: 80, textAlign: 'center' }}
                    >
                      {t('viewAll')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>

          {/* Notes Section - Moved outside attachments */}
          <View>
            <Text
              variant="h6"
              style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
            >
              {t('addNote')}
            </Text>

            <Pressable
              onPress={() => setShowNoteModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[3],
                gap: theme.spacing[3],
                marginBottom: theme.spacing[3],
              }}
            >
              <StickyNote size={20} color={theme.colors.primary[500]} />
              <Text variant="body" color="primary">
                {notes.length > 0 ? `${notes.length} ghi chú` : t('addNote')}
              </Text>
            </Pressable>

            {notes.length > 0 && (
              <View style={{ marginBottom: theme.spacing[3], gap: theme.spacing[2] }}>
                {notes.map((note, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: theme.colors.semantic.warning + '20',
                      borderWidth: 1,
                      borderColor: theme.colors.semantic.warning + '80',
                      borderRadius: theme.radius.md,
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[3],
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Text variant="caption" style={{ flex: 1, paddingRight: theme.spacing[2] }}>
                        {note}
                      </Text>
                      <Pressable onPress={() => removeNote(idx)}>
                        <X size={18} color={theme.colors.semantic.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Attachments Section */}
          <View>
            <Text
              variant="h6"
              style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
            >
              {t('attachmentsTitle')}
            </Text>

            {/* Images */}
            <Pressable
              onPress={handlePickImage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[3],
                gap: theme.spacing[3],
                marginBottom: theme.spacing[3],
              }}
            >
              <Image size={20} color={theme.colors.primary[500]} />
              <Text variant="body" color="primary">
                {t('addImages')} ({images.length})
              </Text>
            </Pressable>

            {images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: theme.spacing[3] }}
              >
                {images.map((uri, idx) => (
                  <View
                    key={idx}
                    style={{
                      marginRight: theme.spacing[2],
                      position: 'relative',
                    }}
                  >
                    <RNImage
                      source={{ uri }}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: theme.radius.md,
                      }}
                    />
                    <Pressable
                      onPress={() => removeImage(idx)}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: theme.colors.semantic.error,
                        borderRadius: 999,
                        padding: 4,
                      }}
                    >
                      <X size={16} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Documents */}
            <Pressable
              onPress={handlePickDocument}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[3],
                gap: theme.spacing[3],
                marginBottom: theme.spacing[3],
              }}
            >
              <FileText size={20} color={theme.colors.primary[500]} />
              <Text variant="body" color="primary">
                {t('addDocuments')} ({documents.length})
              </Text>
            </Pressable>

            {documents.length > 0 && (
              <View style={{ marginBottom: theme.spacing[3], gap: theme.spacing[2] }}>
                {documents.map((doc, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.background,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[2],
                      gap: theme.spacing[2],
                    }}
                  >
                    <FileText size={18} color={theme.colors.text.secondary} />
                    <Text variant="caption" style={{ flex: 1 }} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Pressable onPress={() => removeDocument(idx)}>
                      <X size={18} color={theme.colors.semantic.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Button inside the form at the very end for creating a shared session */}
          <View style={{ marginTop: theme.spacing[8] }}>
            <Button
              label={isUploadingAttachments ? t('uploadingAttachments') : t('createSharedButton')}
              onPress={handleCreateShared}
              variant="primary"
              size="lg"
              style={{ width: '100%' }}
              disabled={isSubmitting || isUploadingAttachments}
            />
          </View>
        </KeyboardAwareScrollView>
        {/* Footer button removed per request */}

        {/* Buddy Selection Modal */}
        <Modal
          visible={showBuddyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBuddyModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowBuddyModal(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: theme.colors.border + '80',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.xl,
                    padding: theme.spacing[6],
                    width: '85%',
                    maxHeight: '70%',
                  }}
                >
                  <Text
                    variant="h5"
                    style={{ marginBottom: theme.spacing[4], fontWeight: '700' as const }}
                  >
                    {t('buddiesTitle')}
                  </Text>

                  <ScrollView style={{ maxHeight: 400 }}>
                    {acceptedBuddies.map((b) => {
                      const selected = selectedBuddyIds.includes(b.user_id);
                      return (
                        <TouchableOpacity
                          key={b.user_id}
                          onPress={() => toggleBuddy(b.user_id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: theme.spacing[3],
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                          }}
                        >
                          <View
                            style={{
                              borderRadius: 999,
                              borderWidth: selected ? 3 : 0,
                              borderColor: selected ? theme.colors.primary[500] : 'transparent',
                              padding: 2,
                              marginRight: theme.spacing[3],
                            }}
                          >
                            <Avatar
                              uri={b.avatar_url || undefined}
                              name={b.display_name}
                              size="md"
                            />
                          </View>
                          <Text
                            variant="body"
                            style={{
                              flex: 1,
                              fontWeight: selected ? ('600' as const) : ('400' as const),
                              color: selected ? theme.colors.primary[600] : undefined,
                            }}
                          >
                            {b.display_name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Button
                    label="OK"
                    onPress={() => setShowBuddyModal(false)}
                    variant="primary"
                    size="md"
                    style={{ marginTop: theme.spacing[4] }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Note Modal */}
        <Modal
          visible={showNoteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNoteModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowNoteModal(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: theme.colors.border + '80',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing[5],
                    width: '85%',
                    maxWidth: 400,
                  }}
                >
                  <Text
                    variant="h5"
                    style={{ marginBottom: theme.spacing[4], fontWeight: '700' as const }}
                  >
                    {t('addNoteTitle')}
                  </Text>

                  <TextInput
                    placeholder={t('notePlaceholder')}
                    value={currentNote}
                    onChangeText={setCurrentNote}
                    multiline
                    numberOfLines={6}
                    style={{
                      backgroundColor: theme.colors.background,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      padding: theme.spacing[3],
                      marginBottom: theme.spacing[4],
                      minHeight: 120,
                      textAlignVertical: 'top',
                      fontSize: 15,
                      fontFamily: theme.typography.families.body,
                      color: theme.colors.text.primary,
                    }}
                    placeholderTextColor={theme.colors.text.tertiary}
                  />

                  <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                    <Button
                      label="Hủy"
                      onPress={() => {
                        setCurrentNote('');
                        setShowNoteModal(false);
                      }}
                      variant="destructive"
                      size="md"
                      style={{ flex: 1 }}
                    />
                    <Button
                      label="Thêm"
                      onPress={handleAddNote}
                      variant="primary"
                      size="md"
                      style={{ flex: 1 }}
                      disabled={!currentNote.trim()}
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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

export default CreateSessionScreen;
