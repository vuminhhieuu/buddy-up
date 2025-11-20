import React from 'react';
import { View, ViewProps, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../styles';

export type ScreenContainerProps = ViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
  refreshControl?: React.ReactElement | undefined;
};

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  scroll,
  contentContainerStyle,
  refreshControl,
  ...rest
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: insets.top ? 0 : 12,
            ...(contentContainerStyle as object),
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          {...rest}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: insets.top ? 0 : 12,
          }}
          {...rest}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};
