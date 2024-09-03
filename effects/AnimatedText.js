import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { Color, FontSize, FontFamily, colr } from "../GlobalStyles";

const AnimatedText = ({ text,newS }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(0, { duration: 1000 }),
        withTiming(20, { duration: 500 })
      ),
      -1,
      false
    );
  }, []);

  return (
    <Animated.Text style={[styles.textd, animatedStyle,newS]}>{text}</Animated.Text>
  );
};

const styles = StyleSheet.create({
  textd: {
    fontSize: 12,
    fontWeight: "bold",
    position: "absolute",
    transform: [{ translateX: -50 }],
    color: Color.colorDarkslateblue_400,
    fontFamily: FontFamily.interExtraBold,
  },
});

export default AnimatedText;
