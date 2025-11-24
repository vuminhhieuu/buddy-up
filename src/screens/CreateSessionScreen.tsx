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
} from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer/ScreenContainer';
import { Input } from '../components/ui/Input/Input';
import { Button } from '../components/ui/Button/Button';
import { Text } from '../components/ui/Text/Text';
import { useTheme } from '../styles';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAppSelector } from '../store/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/ui/Avatar/Avatar';

export const CreateSessionScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateObj, setDateObj] = useState<Date | null>(null);
  const [timeObj, setTimeObj] = useState<Date | null>(null);
  const [duration, setDuration] = useState('90');
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState<'online' | 'offline'>('online');
  const [link, setLink] = useState('');
  const [selectedBuddyIds, setSelectedBuddyIds] = useState<string[]>([]);

  const buddies = useAppSelector((s) => s.buddy.results ?? []);

  const handleCreate = () => {
    navigation.goBack();
  };

  const onChangeDate = (event: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      setDateObj(selected);
      const formatted = `${String(selected.getDate()).padStart(2, '0')}/${String(
        selected.getMonth() + 1,
      ).padStart(2, '0')}/${selected.getFullYear()}`;
      setDate(formatted);
    }
  };

  const onChangeTime = (event: any, selected?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) {
      setTimeObj(selected);
      const hh = String(selected.getHours()).padStart(2, '0');
      const mm = String(selected.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);
    }
  };

  const toggleBuddy = (id: string) => {
    setSelectedBuddyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScreenContainer style={{ backgroundColor: theme.colors.surface }}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              style={({ pressed }) => [
                {
                  width: 35,
                  height: 35,
                  borderRadius: theme.radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.background,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  marginBottom: theme.spacing[2],
                  alignSelf: 'flex-start',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ArrowLeft size={18} color={theme.colors.text.primary} />
            </Pressable>
            <Text variant="h5" style={{ fontWeight: '700' as const }}>
              {t('createSession.title')}
            </Text>
            {/* spacer to keep title centered */}
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAwareScrollView
            contentContainerStyle={{ marginTop: theme.spacing[6], gap: theme.spacing[4] }}
            keyboardShouldPersistTaps="handled"
          >
            <Input
              label={t('createSession.nameLabel')}
              placeholder={t('createSession.namePlaceholder')}
              value={title}
              onChangeText={setTitle}
            />

            <Input
              label={t('createSession.subjectLabel')}
              placeholder={t('createSession.subjectPlaceholder')}
              value={subject}
              onChangeText={setSubject}
            />

            <View>
              <Text
                variant="h6"
                style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
              >
                {t('createSession.timeDateTitle')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Pressable onPress={() => setShowDatePicker(true)}>
                    <Input
                      placeholder={t('createSession.datePlaceholder')}
                      value={date}
                      onChangeText={setDate}
                      editable={false}
                    />
                  </Pressable>
                </View>
                <View style={{ width: 110 }}>
                  <Pressable onPress={() => setShowTimePicker(true)}>
                    <Input
                      placeholder={t('createSession.timePlaceholder')}
                      value={time}
                      onChangeText={setTime}
                      editable={false}
                    />
                  </Pressable>
                </View>
              </View>
              {showDatePicker ? (
                <DateTimePicker
                  value={dateObj || new Date()}
                  mode="date"
                  display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
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
                {t('createSession.durationTitle')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder={t('createSession.durationPlaceholder')}
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
                <Text>{t('createSession.durationUnit')}</Text>
              </View>
            </View>

            <Input
              label={t('createSession.descriptionLabel')}
              placeholder={t('createSession.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ height: 120, textAlignVertical: 'top' }}
            />

            <View>
              <Text
                variant="h6"
                style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
              >
                {t('createSession.locationTitle')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable onPress={() => setLocationType('online')}>
                  <View
                    style={[
                      styles.locationPill,
                      locationType === 'online' && {
                        borderColor: theme.colors.primary[500],
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <Text color={locationType === 'online' ? 'primary' : 'tertiary'}>
                      {t('createSession.online')}
                    </Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => setLocationType('offline')}>
                  <View
                    style={[
                      styles.locationPill,
                      locationType === 'offline' && {
                        borderColor: theme.colors.primary[500],
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <Text color={locationType === 'offline' ? 'primary' : 'tertiary'}>
                      {t('createSession.offline')}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {locationType === 'online' ? (
              <Input
                label={t('createSession.linkLabel')}
                placeholder={t('createSession.linkPlaceholder')}
                value={link}
                onChangeText={setLink}
              />
            ) : null}

            <View>
              <Text
                variant="h6"
                style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
              >
                {t('createSession.buddiesTitle')}
              </Text>
              {buddies.length === 0 ? (
                <Text variant="caption" color="tertiary">
                  {t('createSession.noBuddies')}
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ paddingVertical: theme.spacing[2] }}
                >
                  {buddies.map((b) => {
                    const selected = selectedBuddyIds.includes(b.user_id);
                    return (
                      <TouchableOpacity
                        key={b.user_id}
                        onPress={() => toggleBuddy(b.user_id)}
                        style={{ marginRight: theme.spacing[4], alignItems: 'center' }}
                      >
                        <Avatar
                          uri={b.avatar_url || undefined}
                          name={b.display_name}
                          size="lg"
                          style={
                            selected
                              ? { borderWidth: 2, borderColor: theme.colors.primary[500] }
                              : undefined
                          }
                        />
                        <Text
                          variant="caption"
                          style={{
                            marginTop: theme.spacing[2],
                            maxWidth: 80,
                            textAlign: 'center',
                          }}
                        >
                          {b.display_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </KeyboardAwareScrollView>
          {/* Footer fixed at bottom (outside the scrollable content) so it always sits at screen bottom */}
          <View
            style={{
              paddingTop: theme.spacing[2],
              paddingBottom: (insets.bottom ?? 0) + theme.spacing[2],
              width: '100%',
              backgroundColor: theme.colors.surface,
            }}
          >
            <Button
              label={t('createSession.createButton')}
              onPress={handleCreate}
              variant="primary"
              size="lg"
            />
          </View>
        </ScreenContainer>
      </TouchableWithoutFeedback>
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
    borderColor: '#E6E6E6',
  },
});

export default CreateSessionScreen;
