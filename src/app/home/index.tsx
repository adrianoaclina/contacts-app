import { Alert, SectionList, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useEffect, useId, useRef, useState } from "react";
import * as Contacts from "expo-contacts";
import BottomSheet from "@gorhom/bottom-sheet";

import { styles } from "./styles";
import { theme } from "@/theme";

import { Input } from "@/components/input";
import { Contact, ContactProps } from "@/components/contact";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";

type SectionListDataProps = {
  title: string;
  data: ContactProps[];
};
export function Home() {
  const [name, setName] = useState("");
  const [contacts, setContacts] = useState<SectionListDataProps[]>([]);
  const [contact, setContact] = useState<Contacts.Contact>();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleBottomSheetOpen = () => bottomSheetRef.current?.expand();
  const handleBottomSheetClose = () => bottomSheetRef.current?.snapToIndex(0);

  async function handleOpenDetails(id: string) {
    const response = await Contacts.getContactByIdAsync(id);
    setContact(response);
    handleBottomSheetOpen();
  }
  async function fetchContacts() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === Contacts.PermissionStatus.GRANTED) {
        const { data } = await Contacts.getContactsAsync({
          name,
          sort: "firstName",
        });
        const list = data
          .map((contact) => ({
            id: contact.id ?? useId(),
            name: contact.name,
            image: contact.image,
          }))
          .reduce<SectionListDataProps[]>((acc: any, item) => {
            const firstLetter = item.name[0].toUpperCase();
            const existingEntry = acc.find(
              (entry: SectionListDataProps) => entry.title === firstLetter
            );

            if (existingEntry) {
              existingEntry.data.push(item);
            } else {
              acc.push({ title: firstLetter, data: [item] });
            }
            return acc;
          }, []);
        setContacts(list);
        setContact(data[0])
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Contatos", "Não foi possível carregar os contatos.");
    }
  }

  useEffect(() => {
    fetchContacts();
  }, [name]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Input style={styles.input}>
          <Feather name="search" size={16} color={theme.colors.gray_300} />
          <Input.Field
            placeholder="Pesquisar pelo nome"
            onChangeText={setName}
            value={name}
          />
          <TouchableOpacity onPress={() => setName("")}>
            <Feather name="x" size={16} color={theme.colors.gray_300} />
          </TouchableOpacity>
        </Input>
      </View>

      <SectionList
        sections={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Contact contact={item} onPress={() => handleOpenDetails(item.id)} />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.section}>{section.title}</Text>
        )}
        contentContainerStyle={styles.contentList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      {contact && (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={[0.01, 284]}
          handleComponent={() => null}
          backgroundStyle={styles.bottomSheet}
        >
          <Avatar name={contact.name} image={contact.image} variant="large" containerStyle={styles.image}/>
          <View style={styles.bottomSheetContent}>
            <Text style={styles.contactName}>{contact.name}</Text>

            {contact.phoneNumbers && (
              <View style={styles.phoneNumber}>
                <Feather name="phone" size={18} color={theme.colors.gray_400} />
                <Text style={styles.phone}>
                  {contact.phoneNumbers[0].number}
                </Text>
              </View>
            )}
            <Button title="Fechar" onPress={handleBottomSheetClose}/>
          </View>
        </BottomSheet>
      )}
    </View>
  );
}
