import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrCreatePlayerId } from './utils/id';
import { theme } from './utils/theme';

import IdentityScreen from './screens/IdentityScreen';
import MenuScreen from './screens/MenuScreen';
import HostLobbyScreen from './screens/HostLobbyScreen';
import JoinLobbyScreen from './screens/JoinLobbyScreen';
import GameScreen from './screens/GameScreen';

const IDENTITY_KEY = 'MIDNIGHT_IDENTITY_V1';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [playerId, setPlayerId] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [screen, setScreen] = useState('identity'); // identity | menu | host | join | game
  const [gameSession, setGameSession] = useState(null); // { roomCode, isHost }

  useEffect(() => {
    (async () => {
      const id = await getOrCreatePlayerId();
      setPlayerId(id);
      try {
        const raw = await AsyncStorage.getItem(IDENTITY_KEY);
        if (raw) {
          setIdentity(JSON.parse(raw));
          setScreen('menu');
        }
      } catch (e) {}
      setBooting(false);
    })();
  }, []);

  const saveIdentity = async (newIdentity) => {
    setIdentity(newIdentity);
    setScreen('menu');
    try {
      await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(newIdentity));
    } catch (e) {}
  };

  if (booting) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {screen === 'identity' && (
        <IdentityScreen initial={identity} onDone={saveIdentity} />
      )}

      {screen === 'menu' && identity && (
        <MenuScreen
          identity={identity}
          onCreateRoom={() => setScreen('host')}
          onJoinRoom={() => setScreen('join')}
          onEditIdentity={() => setScreen('identity')}
        />
      )}

      {screen === 'host' && identity && (
        <HostLobbyScreen
          identity={identity}
          playerId={playerId}
          onGameStart={(session) => {
            setGameSession(session);
            setScreen('game');
          }}
          onCancel={() => setScreen('menu')}
        />
      )}

      {screen === 'join' && identity && (
        <JoinLobbyScreen
          identity={identity}
          playerId={playerId}
          onGameStart={(session) => {
            setGameSession(session);
            setScreen('game');
          }}
          onCancel={() => setScreen('menu')}
        />
      )}

      {screen === 'game' && gameSession && (
        <GameScreen
          identity={identity}
          playerId={playerId}
          roomCode={gameSession.roomCode}
          isHost={gameSession.isHost}
          onExit={() => {
            setGameSession(null);
            setScreen('menu');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
