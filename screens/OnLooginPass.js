import * as React from "react";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  BackHandler,
} from "react-native";
import { FontFamily, Color, FontSize, Border } from "../GlobalStyles";
import Constants from "expo-constants";
import LottieView from "lottie-react-native";
import { useFocusEffect } from "@react-navigation/native";

const OnLoginPass = ({ navigation, route }) => {
  const { CurrentUser } = route.params;

  const getUserName = CurrentUser;
  // handle scan

  const handleScan = () => {
    navigation.navigate("BackgroundCamera", {
      email: CurrentUser,
      type: "login",
      transactionDetails: [],
    });
  };
  // ... handle back press default action
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit the app?",
          [
            {
              text: "Cancel",
              onPress: () => null,
              style: "cancel",
            },
            {
              text: "YES",
              onPress: async () => {
                try {
                  await AsyncStorage.removeItem("userData");
                  navigation.replace("Start");
                  BackHandler.exitApp();
                } catch (err) {
                  return;
                }
              },
            },
          ],
          { cancelable: false }
        );
        return true; // Prevents default back button behavior
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  return (
    <>
      <StatusBar backgroundColor={Color.colorDarkslateblue_200} />
      <View style={styles.welcomeBack}>
        <View
          style={{
            backgroundColor: "#b6d4dc",
            width: "45%",
            height: "22%",
            borderRadius: 50,
            top: "10%",
            left: "25%",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../assets/UseProfile.svg")}
            style={{
              width: 100,
              height: 100,
              left: "25%",
            }}
          />
        </View>

        <TouchableOpacity
          // contact us
          style={styles.contactUs}
        >
          <Image
            style={styles.vectorIcon}
            contentFit="cover"
            source={require("../assets/vector.png")}
          />
          <Text style={styles.contact}>contact Us</Text>
        </TouchableOpacity>
        <View style={styles.messageBox}>
          <Text style={styles.welcUser}>Welcome back !</Text>
          <Text style={styles.alertMessage}>
            To ensure it's really you, let's verify your identity
          </Text>
          <Text style={[styles.alertMessage, styles.unique]}>
            with a quick facial scan.
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleScan}
          // animation
          style={styles.animBox}
        >
          <LottieView
            source={require("../data/animatedFace.json")}
            autoPlay
            loop
            style={{
              height: 150,
              width: 150,
              backgroundColor: "transparent",
              left:"2%"
            }}
          />
          <Text style={styles.tapScanText}>Tap to scan</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  welcomeBack: {
    paddingTop: Constants.statusBarHeight,
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: Color.lightPrimaryKeyBackground,
    justifyContent: "flex-start",
  },
  profileImage: {
    top: "4%",
    left: "15%",
  },
  vectorIcon: {
    height: 30,
    width: 40,
    left: 10,
    borderBottom: 2,
  },
  contactUs: {
    top: "68%",
    left: "38%",
  },
  contact: {
    color: Color.colorGray_100,
    right:"2%"
  },
  messageBox: {
    top: "8%",
    
  },
  welcUser: {
    color: Color.colorDarkslateblue_600,
    fontFamily: FontFamily.interExtraBold,
    left: "25%",
    fontSize: 19,
    paddingBottom: 10,
  },
  alertMessage: {
    fontFamily: FontFamily.interRegular,
    color: Color.colorDarkslateblue_100,
    fontSize: 14,
    left: "3%",
  },
  unique: {
    left: "30%",
  },
  animBox: {
    top: "11%",
    position: "relative",
    left: "30%",
  },
  tapScanText: {
    left: "10%",
    position: "absolute",
    top: "80%",
    fontFamily: FontFamily.dMSansBold,
    color: Color.colorDarkslateblue_400,
  },
  arrow: {
    top: "8%",
    position: "absolute",
    left: "5%",
  },
});

export default OnLoginPass;
