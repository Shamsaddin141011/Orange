import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    /* Remove browser focus outline on all inputs */
    input, textarea, input:focus, textarea:focus {
      outline: none !important;
      box-shadow: none !important;
    }
    /* Remove active/hover background square on tab bar items */
    [role="tab"],
    [role="tab"] > *,
    [role="tablist"] > *,
    [role="tablist"] > * > * {
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}
