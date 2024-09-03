import React from "react";
import LottieView from "lottie-react-native";
import { View, StyleSheet, Text } from "react-native";
import Modal from "react-native-modal";
import AnimatedText from "../effects/AnimatedText";
import { Color } from "../GlobalStyles";

function Processing({ isVisible = false, text }) {
  return (
    <View style={styles.container}>
      <Modal style={styles.modalS} animationIn={"fadeIn"} visible={isVisible}>
        <View style={styles.lottieContainer}>
          <LottieView
            autoPlay
            loop
            source={require("../data/loading.json")}
            style={styles.lottie}
          />
        </View>
        <View style={styles.textA}>
          <AnimatedText text={text} />
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {},
  lottie: {
    width: 200,
    height: 200,
    left: "20%",
  },
  lottieContainer: {
    justifyContent: "center",
    height: "45%",
    width: "85%",
    backgroundColor: "white",
    left: "10%",
    top: "3%",
  },
  textA: {
    position: "absolute",
    left: "20%",
    top: "35%",
  },
});
export default Processing;
