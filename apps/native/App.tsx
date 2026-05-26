import { demoBook, themes } from '@dushu/shared';
import { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const t = themes.sepia;

export default function App(): ReactElement {
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: t.background }]}>
      <View style={[{ backgroundColor: t.background }]}>
        <Text style={[{ color: t.mutedForeground }]}>hello dushu</Text>
        <Text style={[{ color: t.foreground }]}>{demoBook.title}</Text>
        <Text style={[{ color: t.cardForeground }]}>Epub stays reflowable, PDE stays page-native. Word and sentence highlighting while reading aloud.</Text>
      </View>

      <View style={[{ backgroundColor: t.background }]}>
        <Text style={[{ color: t.foreground }]}>Progress</Text>
        <Text style={[{ color: t.cardForeground }]}>{demoBook.progress ? `${Math.round(demoBook.progress.overallProgression * 100)}%` : 'Not started'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 16 },
});
