import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import ContactManager from '../../components/ContactManager';
import SosButtonNative from '../../components/SosButtonNative';
import SosButtonTwilio from '../../components/SosButtonTwilio';

export default function SosScreen() {
  // Estado que guarda los números actuales para pasarlos a los botones
  const [activeContacts, setActiveContacts] = useState<string[]>([]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Centro de Pruebas SOS</Text>

      {/* 1. Gestor de Contactos */}
      <ContactManager onContactsChange={setActiveContacts} />

      <Text style={styles.subHeader}>Probar Botones</Text>
      
      {/* Zona de Botones */}
      <View style={styles.buttonRow}>
        {/* Botón 1: SMS Nativo */}
        <SosButtonNative contacts={activeContacts} />

        {/* Botón 2: Twilio Automático */}
        <SosButtonTwilio contacts={activeContacts} />
      </View>

      <Text style={styles.info}>
        Nativo: Abre app de mensajes.{'\n'}
        Twilio: Envía en segundo plano.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: 'center', backgroundColor: '#fff', paddingTop: 60 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subHeader: { fontSize: 18, marginTop: 20, marginBottom: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  info: { marginTop: 20, textAlign: 'center', color: '#666' }
});