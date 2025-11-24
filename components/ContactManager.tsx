import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Modal, TouchableOpacity, Alert, TextInput } from 'react-native';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definimos la estructura de un contacto simple
export interface SavedContact {
  id: string;
  name: string;
  phone: string;
}

interface Props {
  onContactsChange: (contacts: string[]) => void;
}

export default function ContactManager({ onContactsChange }: Props) {
  const [savedContacts, setSavedContacts] = useState<SavedContact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState<Contacts.Contact[]>([]);
  
  // Nuevo estado para la búsqueda
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStoredContacts();
  }, []);

  const loadStoredContacts = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@emergency_contacts');
      if (jsonValue != null) {
        const contacts = JSON.parse(jsonValue);
        setSavedContacts(contacts);
        updateParent(contacts);
      }
    } catch (e) {
      console.error("Error cargando contactos", e);
    }
  };

  const saveContacts = async (newContacts: SavedContact[]) => {
    try {
      await AsyncStorage.setItem('@emergency_contacts', JSON.stringify(newContacts));
      setSavedContacts(newContacts);
      updateParent(newContacts);
    } catch (e) {
      console.error("Error guardando", e);
    }
  };

  const updateParent = (contacts: SavedContact[]) => {
    const numbers = contacts.map(c => c.phone);
    onContactsChange(numbers);
  };

  const openContactPicker = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.PhoneNumbers
        ],
      });

      if (data.length > 0) {
        // Filtramos solo los que tienen número
        const validContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);

        // ORDENAMIENTO: Alfabético por nombre
        validContacts.sort((a, b) => {
          const nameA = (a.name || '').toString();
          const nameB = (b.name || '').toString();
          return nameA.localeCompare(nameB);
        });

        setPhoneContacts(validContacts);
        setSearchQuery(''); // Limpiar búsqueda al abrir
        setModalVisible(true);
      } else {
        Alert.alert("Sin contactos", "No se encontraron contactos en el teléfono.");
      }
    } else {
      Alert.alert("Permiso denegado", "Necesitamos acceso a tus contactos.");
    }
  };

  const selectContact = (contact: Contacts.Contact) => {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) return;
    
    const phoneNumber = contact.phoneNumbers[0]?.number ?? '';
    // Validar si ya existe
    const exists = savedContacts.some(c => c.phone === phoneNumber);
    if(exists) {
      Alert.alert("Ya agregado", "Este contacto ya está en tu lista de emergencia.");
      return;
    }

    const newContact: SavedContact = {
      // Generar un id propio porque el tipo Contact puede no exponer 'id' en las definiciones
      id: Date.now().toString(),
      name: contact.name || 'Desconocido',
      phone: phoneNumber
    };

    const updatedList = [...savedContacts, newContact];
    saveContacts(updatedList);
    setModalVisible(false);
  };

  const removeContact = (id: string) => {
    const updatedList = savedContacts.filter(c => c.id !== id);
    saveContacts(updatedList);
  };

  // Filtrado en tiempo real basado en el searchQuery
  const filteredContacts = phoneContacts.filter(contact => {
    const name = (contact.name || '').toString().toLowerCase();
    const phone = contact.phoneNumbers?.[0]?.number ?? '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || phone.includes(searchQuery);
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contactos de Emergencia</Text>
      
      {savedContacts.map((contact) => (
        <View key={contact.id} style={styles.contactRow}>
          <Text style={styles.contactText}>{contact.name} ({contact.phone})</Text>
          <TouchableOpacity onPress={() => removeContact(contact.id)}>
            <Text style={styles.deleteText}>X</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Button title="Agregar Contacto de Agenda" onPress={openContactPicker} />

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Selecciona un contacto</Text>
          
          {/* Barra de Búsqueda */}
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <FlatList
            data={filteredContacts}
            keyExtractor={(item, index) => `${item.name ?? 'contact'}-${item.phoneNumbers?.[0]?.number ?? index}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => selectContact(item)}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.modalItemName}>{item.name ?? 'Desconocido'}</Text>
                </View>
                <Text style={styles.modalItemPhone}>{item.phoneNumbers?.[0]?.number}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Cancelar" color="red" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, padding: 10, backgroundColor: 'white', borderRadius: 5, alignItems: 'center' },
  contactText: { fontSize: 14, flex: 1 },
  deleteText: { color: 'red', fontWeight: 'bold', paddingHorizontal: 10, fontSize: 18 },
  
  // Estilos del Modal
  modalContainer: { flex: 1, padding: 20, marginTop: 40, backgroundColor: 'white' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9'
  },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemName: { fontWeight: 'bold', fontSize: 16 },
  modalItemPhone: { color: '#666', marginTop: 2 }
});