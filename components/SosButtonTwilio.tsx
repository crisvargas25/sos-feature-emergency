import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, ViewStyle } from 'react-native';
import * as Location from 'expo-location';
import { Buffer } from 'buffer';

const ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.EXPO_PUBLIC_TWILIO_WHATSAPP_NUMBER;

interface Props {
  contacts: string[];
  style?: ViewStyle;
}

export default function SosButtonTwilio({ contacts, style }: Props) {
  const [loading, setLoading] = useState(false);


  const formatForWhatsapp = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');

    // 2. Lógica específica para México
    if (cleaned.length === 10) {
      return `whatsapp:+521${cleaned}`; // <--- AQUÍ AGREGAMOS EL 1
    } 
    
    else if (cleaned.length === 12 && cleaned.startsWith('52')) {
      const numberWithoutCountry = cleaned.substring(2);
      return `whatsapp:+521${numberWithoutCountry}`;
    }

    else if (cleaned.length === 13 && cleaned.startsWith('521')) {
       return `whatsapp:+${cleaned}`;
    }
    return `whatsapp:+${cleaned}`;
  };

  const handleSOS = async () => {
    console.log("--- INICIANDO SOS VÍA WHATSAPP (CORREGIDO) ---");
    
    if (!contacts || contacts.length === 0) return Alert.alert("Error", "Sin contactos.");

    setLoading(true);
    
    try {
      // 1. Ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error("Permiso de ubicación denegado");
      
      let location = await Location.getCurrentPositionAsync({});
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`;
      const messageBody = `🚨 *AYUDA* 🚨\nUbicación: ${mapLink}`;

      // 2. Iterar contactos
      const promises = contacts.map(async (rawContact) => {
        
        // Formatear el destino
        const toWhatsApp = formatForWhatsapp(rawContact);

        // LOGS CLAROS PARA DEPURAR
        console.log(`\n--- Intento de Envío ---`);
        console.log(`FROM (Exacto): '${TWILIO_WHATSAPP_NUMBER}'`);
        console.log(`TO   (Exacto): '${toWhatsApp}'`);

        const formData = new URLSearchParams();
        // IMPORTANTE: El orden y el valor exacto
        formData.append('To', toWhatsApp);
        formData.append('From', TWILIO_WHATSAPP_NUMBER);
        formData.append('Body', messageBody);

        const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
        
        try {
          const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
          });

          const textResponse = await response.text();
          
          if (!response.ok) {
            console.error(`❌ FALLÓ envío a ${toWhatsApp}`);
            console.error(`Respuesta Twilio: ${textResponse}`);
            return { success: false };
          }

          console.log(`✅ ENVIADO a ${toWhatsApp}`);
          return { success: true };

        } catch (netError) {
          console.error(`Error Red:`, netError);
          return { success: false };
        }
      });

      const results = await Promise.all(promises);
      const successes = results.filter(r => r.success).length;

      if (successes > 0) {
        Alert.alert("Éxito", `Mensajes enviados: ${successes}`);
      } else {
        Alert.alert("Error", "Revisa la consola. Verifica que te hayas unido al Sandbox.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Fallo general");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handleSOS} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>SOS WHATSAPP</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#25D366',
    width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center', elevation: 5, margin: 10
  },
  text: { color: 'white', fontWeight: 'bold' }
});