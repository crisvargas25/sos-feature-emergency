import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, ViewStyle } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

interface SosButtonProps {
  contacts: string[]; // Recibe los contactos como propiedad
  style?: ViewStyle;  // Para poder mover el botón desde el padre
}

export default function SosButton({ contacts, style }: SosButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSOS = async () => {
    setLoading(true);
    try {
      // 1. Verificar SMS
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "SMS no disponible en este dispositivo");
        setLoading(false);
        return;
      }

      // 2. Permisos de Ubicación
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permiso denegado", "Se requiere ubicación para enviar ayuda.");
        setLoading(false);
        return;
      }

      // 3. Obtener Coordenadas
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const { latitude, longitude } = location.coords;
      
      // Link universal de Google Maps
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      const message = `¡AYUDA SOS! Estoy en una emergencia. Ubicación: ${mapLink}`;

      // 4. Enviar SMS
      const { result } = await SMS.sendSMSAsync(
        contacts,
        message
      );

      if (result === 'sent') {
        Alert.alert("Alerta iniciada", "Te hemos redirigido a la app de mensajes.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Fallo al intentar enviar la alerta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={handleSOS}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.text}>SOS</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff4444',
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  text: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  }
});